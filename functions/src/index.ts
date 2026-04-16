import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { defineSecret } from "firebase-functions/params";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import crypto from "crypto";
import axios from "axios";
import * as fs from "fs";
import * as path from "path";

// Initialize admin SDK
admin.initializeApp();

// Configuration: Stored in Firebase Secrets
const MERCH_KEY = defineSecret("EASEBUZZ_MERCHANT_KEY");
const MERCH_SALT = defineSecret("EASEBUZZ_SALT");
const SUB_ID = defineSecret("EASEBUZZ_SUBMERCHANT_ID");

const RZP_KEY_ID = defineSecret("RAZORPAY_KEY_ID");
const RZP_KEY_SECRET = defineSecret("RAZORPAY_KEY_SECRET");
const RZP_WEBHOOK_SECRET = defineSecret("RAZORPAY_WEBHOOK_SECRET");

export const ACTIVE_GATEWAY = "razorpay" as "easebuzz" | "razorpay"; // Switch between "razorpay" and "easebuzz"

/**
 * Helper to process email template with data
 */
function processTemplate(html: string, data: Record<string, string>): string {
  let processed = html;
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processed = processed.replace(regex, data[key] || '');
  });
  return processed;
}

/**
 * Cloud Function to trigger email on registration.
 * Uses the professional white-themed Avishkar '26 templates.
 */
export const onRegistrationCreated = onDocumentCreated("registrations/{regId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const regData = snapshot.data();
  const regId = event.params.regId;

  console.log(`[Email] Processing registration: ${regId}`);

  try {
    // 1. Read Template
    const templatePath = path.join(__dirname, "templates", "confirmation.html");
    const htmlTemplate = fs.readFileSync(templatePath, "utf8");

    // 2. Build QR Code URL (using a public QR API)
    const avrId = regData.registrationId || regId;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(avrId)}&bgcolor=ffffff&color=0f172a`;

    // 3. Prepare Data for Template (new variable scheme)
    const templateData: Record<string, string> = {
      EVENT_NAME: regData.eventTitle || "Avishkar Competition",
      AVR_ID: avrId,
      LEADER_NAME: regData.leaderName || regData.userName || "Participant",
      REG_DATE: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
      QR_CODE_URL: qrCodeUrl,
      DASHBOARD_URL: "https://avishkar.zcoer.in/user/dashboard",
      AMOUNT: `₹${regData.amountPaid || "0.00"}`,
      SUPPORT_URL: "mailto:support.avishkarr@zealeducation.com",
      RETRY_URL: "https://avishkar.zcoer.in/user/dashboard",
    };

    // 4. Generate Confirmation Email
    const confirmHtml = processTemplate(htmlTemplate, templateData);
    const recipientEmail = regData.leaderEmail || regData.email;

    await admin.firestore().collection("mail").add({
      to: recipientEmail,
      message: {
        subject: `Registration Confirmed — ${templateData.EVENT_NAME} | Avishkar '26`,
        html: confirmHtml,
      },
      metadata: {
        registrationId: regId,
        type: "registration-confirmation",
      },
    });

    // 5. Generate Invoice Email
    try {
      const invoiceTemplatePath = path.join(__dirname, "templates", "invoice.html");
      const invoiceTemplate = fs.readFileSync(invoiceTemplatePath, "utf8");
      const invoiceHtml = processTemplate(invoiceTemplate, templateData);

      await admin.firestore().collection("mail").add({
        to: recipientEmail,
        message: {
          subject: `Invoice — ${templateData.EVENT_NAME} (${templateData.AVR_ID}) | Avishkar '26`,
          html: invoiceHtml,
        },
        metadata: {
          registrationId: regId,
          type: "tax-invoice",
        },
      });
      console.log(`[Email] Invoice queued for ${regId}`);
    } catch (err) {
      console.error("[Email] Invoice generation failed:", err);
    }

    console.log(`[Email] Confirmation queued for ${regId}`);

  } catch (error) {
    console.error("[Email] Critical failure:", error);
  }
});

// Easebuzz API endpoints
const EASEBUZZ_TEST_URL = "https://testpay.easebuzz.in/payment/initiateLink";
const EASEBUZZ_PROD_URL = "https://pay.easebuzz.in/payment/initiateLink";

// Easebuzz Seamless API endpoints (Custom Checkout)
const EASEBUZZ_SEAMLESS_PROD_URL = "https://pay.easebuzz.in/initiate_seamless_payment/";
const EASEBUZZ_SEAMLESS_TEST_URL = "https://testpay.easebuzz.in/initiate_seamless_payment/";

// Easebuzz Transaction Verification API
const EASEBUZZ_TXN_API_URL = "https://pay.easebuzz.in/transaction/v2/retrieve";

/**
 * Cloud Function to initiate a payment.
 * 1. Generates the SHA-512 hash
 * 2. POSTs to Easebuzz Initiate Payment API
 * 3. Returns the access_key to the frontend
 */
export const initiatePayment = functions.https.onRequest({
  secrets: [MERCH_KEY, MERCH_SALT, SUB_ID],
  cors: true
}, async (req, res): Promise<void> => {
  try {
    const {
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      phone,
      udf1,
      surl,
      furl,
      pendingPayload
    } = req.body;

    if (!txnid || !amount || !firstname || !email || !phone || !surl || !furl) {
      res.status(400).send({ error: "Missing required fields" });
      return;
    }

    // --- PRE-FLIGHT CHECKS & ATOMIC PENDING REGISTRATION CREATION ---
    if (pendingPayload) {
      try {
        await admin.firestore().runTransaction(async (t) => {
          // 1. Hackathon Capacity Limits Check
          if (pendingPayload.type === 'hackathon' && pendingPayload.competitionId) {
            const psId = pendingPayload.competitionId;
            const psRef = admin.firestore().doc(`ps_metadata/${psId}`);
            const psDoc = await t.get(psRef);
            
            const currentCount = psDoc.exists ? psDoc.data()?.count || 0 : 0;
            const maxCount = psId === 'PS-14' ? 8 : 5; // PS-14 allows 8, rest allow 5
            
            if (currentCount >= maxCount) {
              throw new Error(`Problem statement ${psId} has reached its maximum capacity of ${maxCount} teams.`);
            }
          }

          // 2. Duplicate Check (Standard Competitions)
          if (pendingPayload.type === 'competition' && pendingPayload.competitionId && pendingPayload.finalPayload?.userAVR) {
             const standardRegId = `${pendingPayload.competitionId}_${pendingPayload.finalPayload.userAVR}`;
             const regDoc = await t.get(admin.firestore().doc(`registrations/${standardRegId}`));
             if (regDoc.exists) {
               throw new Error(`Already registered for ${pendingPayload.eventName}.`);
             }
          }

          // 3. Write pending_registration idempotently
          const pendingRef = admin.firestore().doc(`pending_registrations/${txnid}`);
          pendingPayload.createdAt = admin.firestore.FieldValue.serverTimestamp();
          t.set(pendingRef, pendingPayload);
        });
      } catch (transactionError: any) {
        console.warn(`Pre-flight check failed for ${txnid}:`, transactionError.message);
        res.status(400).json({ success: false, error: transactionError.message });
        return;
      }
    }
    // ----------------------------------------------------------------

    // Sanitize productinfo: Easebuzz rejects special characters
    const safeProductinfo = (productinfo || "Avishkar26 Registration")
      .replace(/[^a-zA-Z0-9 _-]/g, "")
      .trim()
      .slice(0, 100) || "Avishkar26 Registration";

    // Sanitization: Easebuzz is strict about special characters in UDF fields and names
    const safeUdf1 = (udf1 || "N/A")
      .replace(/[^a-zA-Z0-9 _-]/g, "")
      .trim()
      .slice(0, 100);

    const safeFirstname = (firstname || "Participant")
      .replace(/[^a-zA-Z0-9 _-]/g, "")
      .trim()
      .slice(0, 100);

    const key = MERCH_KEY.value();
    const salt = MERCH_SALT.value();
    const submerchant_id = SUB_ID.value();

    // 1. Generate hash: key|txnid|amount|productinfo|firstname|email|udf1-udf10|salt
    const hashString = `${key}|${txnid}|${amount}|${safeProductinfo}|${safeFirstname}|${email}|${safeUdf1}||||||||||${salt}`;
    const hash = crypto.createHash("sha512").update(hashString).digest("hex");

    // 2. POST to Easebuzz API (form-urlencoded)
    const formData = new URLSearchParams();
    formData.append("key", key);
    formData.append("txnid", txnid);
    formData.append("amount", amount);
    formData.append("productinfo", safeProductinfo);
    formData.append("firstname", safeFirstname);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("surl", surl);
    formData.append("furl", furl);
    formData.append("hash", hash);
    formData.append("udf1", safeUdf1);
    formData.append("sub_merchant_id", submerchant_id);

    const easebuzzResponse = await axios.post(EASEBUZZ_PROD_URL, formData.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });

    const ebData = easebuzzResponse.data;

    // 3. Return access_key to frontend
    if (ebData.status === 1 && ebData.data) {
      res.json({
        success: true,
        access_key: ebData.data // This is the access_key for the checkout overlay
      });
    } else {
      console.error("Easebuzz API Error:", ebData);
      res.status(400).json({
        success: false,
        error: ebData.error_desc || "Easebuzz rejected the transaction"
      });
    }

  } catch (error: any) {
    console.error("Payment initiation error:", error?.response?.data || error);
    res.status(500).send({ error: "Failed to initiate payment" });
  }
});

const getFrontendUrl = () => process.env.FRONTEND_URL || "https://avishkar.zcoer.in";

/**
 * Cloud Function Webhook for Browser Redirects (Success)
 * Easebuzz will POST back to this URL when a payment succeeds.
 * We proactively attempt to verify the hash and finalize registration immediately,
 * then redirect the user to the frontend dashboard or specific returnUrl.
 */
export const paymentSuccess = functions.https.onRequest({
  secrets: [MERCH_KEY, MERCH_SALT],
  cors: true
}, async (req, res): Promise<void> => {
  const data = req.body;
  const txnid = data?.txnid || req.query?.txnid || '';
  const returnUrl = req.query?.returnUrl ? String(req.query.returnUrl) : `${getFrontendUrl()}/user/dashboard`;

  try {
    // Attempt proactive validation if full POST payload exists
    if (data && data.hash && data.status === "success") {
      const salt = MERCH_SALT.value();
      const hashString = `${salt}|${data.status}||||||||||${data.udf1 || ''}|${data.email}|${data.firstname}|${data.productinfo}|${data.amount}|${data.txnid}|${data.key}`;
      const expectedHash = crypto.createHash("sha512").update(hashString).digest("hex");

      if (data.hash === expectedHash) {
        // Validation passes! Proactively finalize before redirect
        // This ensures zero-latency verification for the user on the frontend.
        await finalizeRegistration(txnid, data.mode || null, data.easepayid || null, data.bank_ref_num || null);
      } else {
        console.warn(`[PaymentSuccess] Proactive validation failed: hash mismatch for ${txnid}`);
      }
    }
  } catch (error) {
    console.error("[PaymentSuccess] Proactive validation error:", error);
  }

  res.redirect(`${returnUrl}?txnid=${txnid}&status=verifying`);
});

/**
 * Cloud Function Webhook for Browser Redirects (Failure)
 * Easebuzz will POST back to this URL when a payment fails.
 * We proactively mark it as failed then redirect.
 */
export const paymentFailure = functions.https.onRequest({
  cors: true
}, async (req, res): Promise<void> => {
  const data = req.body;
  const txnid = data?.txnid || req.query?.txnid || '';
  
  if (txnid) {
     await admin.firestore().doc(`pending_registrations/${txnid}`).update({
       status: 'failed',
       errorMessage: data?.error_Message || data?.error_desc || 'Failed at gateway',
       resolvedAt: admin.firestore.FieldValue.serverTimestamp()
     }).catch(() => {});
  }

  const errorReason = data?.error_Message || data?.error_desc || '';
  let reasonParam = '';
  if (errorReason) reasonParam = `&reason=${encodeURIComponent(errorReason)}`;
  
  const returnUrl = req.query?.returnUrl ? String(req.query.returnUrl) : `${getFrontendUrl()}/user/dashboard`;
  res.redirect(`${returnUrl}?txnid=${txnid}&status=failed${reasonParam}`);
});

/**
 * Cloud Function Webhook to verify user payment after completion.
 * Easebuzz will POST here via S2S Webhook.
 */
export const paymentWebhook = functions.https.onRequest({
  secrets: [MERCH_KEY, MERCH_SALT],
  cors: true
}, async (req, res): Promise<void> => {
  try {
    const data = req.body;
    const salt = MERCH_SALT.value();

    if (!data || !data.txnid) {
       res.status(400).send("No txnid provided");
       return;
    }

    const FRONTEND_URL = "https://avishkar.zcoer.in";

    // Reverse Hash Formula for verification:
    // sha512(salt|status|udf10|udf9|udf8|udf7|udf6|udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
    const hashString = `${salt}|${data.status}||||||||||${data.udf1 || ''}|${data.email}|${data.firstname}|${data.productinfo}|${data.amount}|${data.txnid}|${data.key}`;
    const expectedHash = crypto.createHash("sha512").update(hashString).digest("hex");

    if (data.hash !== expectedHash) {
      console.error(`Hash mismatch for ${data.txnid}`);
      res.status(400).send("Hash mismatch");
      return;
    }

    if (data.status !== "success") {
       console.log(`Payment failed for ${data.txnid}`);
       await admin.firestore().doc(`pending_registrations/${data.txnid}`).update({
         status: 'failed',
         resolvedAt: admin.firestore.FieldValue.serverTimestamp()
       }).catch(() => {});
       res.status(200).send("OK"); // Acknowledge failed payment so webhook doesn't retry
       return;
    }

    const pendingRef = admin.firestore().doc(`pending_registrations/${data.txnid}`);
    
    // Use transaction to guarantee idempotent processing
    await admin.firestore().runTransaction(async (t) => {
       const pendingSnap = await t.get(pendingRef);
       if (!pendingSnap.exists) {
         console.warn(`Pending registration not found for ${data.txnid}`);
         return;
       }

       const pendingData = pendingSnap.data()!;
       if (pendingData.status === 'confirmed') {
         console.log(`Registration already confirmed for ${data.txnid}, skipping.`);
         return;
       }

       // Mark as confirmed
       t.update(pendingRef, {
         status: 'confirmed',
         resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
         easepayId: data.easepayid || null,
         bankRefNum: data.bank_ref_num || null,
         paymentMode: data.mode || null
       });

       const finalPayload = pendingData.finalPayload || {};

       if (pendingData.type === 'hackathon') {
          const psId = pendingData.competitionId; 
          const psMetadataRef = admin.firestore().doc(`ps_metadata/${psId}`);
          const psMetadataDoc = await t.get(psMetadataRef);

          let currentCount = 0;
          if (psMetadataDoc.exists) {
             currentCount = psMetadataDoc.data()?.count || 0;
          }

          const teamCounterRef = admin.firestore().doc(`counters/hackathon_team_counter`);
          const teamCounterDoc = await t.get(teamCounterRef);
          let nextTeamCount = 1;
          if (teamCounterDoc.exists) {
             nextTeamCount = (teamCounterDoc.data()?.count || 0) + 1;
          }

           t.set(teamCounterRef, { count: nextTeamCount }, { merge: true });
          const generatedTeamId = `AVR-PRM-${nextTeamCount.toString().padStart(4, '0')}`;

          t.set(psMetadataRef, { count: currentCount + 1 }, { merge: true });

          const newRegRef = admin.firestore().collection('registrations').doc();
          const newRegId = newRegRef.id;
          t.set(newRegRef, {
             ...finalPayload,
             id: newRegId,
             teamId: generatedTeamId,
             transactionId: data.txnid,
             paymentMode: data.mode || null,
             status: 'confirmed',
             registeredAt: admin.firestore.FieldValue.serverTimestamp(),
             isAttended: false,
             metadata: {
               createdAt: admin.firestore.FieldValue.serverTimestamp()
             }
          });

       } else if (pendingData.type === 'robokshetra') {
          const teamCounterRef = admin.firestore().doc(`counters/robokshetra_team_counter`);
          const teamCounterDoc = await t.get(teamCounterRef);
          let nextTeamCount = 1;
          if (teamCounterDoc.exists) {
             nextTeamCount = (teamCounterDoc.data()?.count || 0) + 1;
          }

          t.set(teamCounterRef, { count: nextTeamCount }, { merge: true });
          const generatedTeamId = `AVR-ROB-${nextTeamCount.toString().padStart(4, '0')}`;

          const newRegRef = admin.firestore().collection('registrations').doc();
          const newRegId = newRegRef.id;
          t.set(newRegRef, {
             ...finalPayload,
             id: newRegId,
             teamId: generatedTeamId,
             transactionId: data.txnid,
             paymentMode: data.mode || null,
             status: 'confirmed',
             registeredAt: admin.firestore.FieldValue.serverTimestamp(),
             isAttended: false,
             metadata: {
               createdAt: admin.firestore.FieldValue.serverTimestamp()
             }
          });

       } else if (pendingData.type === 'esports') {
          const teamCounterRef = admin.firestore().doc(`counters/esports_team_counter`);
          const teamCounterDoc = await t.get(teamCounterRef);
          let nextTeamCount = 1;
          if (teamCounterDoc.exists) {
             nextTeamCount = (teamCounterDoc.data()?.count || 0) + 1;
          }

          t.set(teamCounterRef, { count: nextTeamCount }, { merge: true });
          const prefix = pendingData.competitionId.includes('bgmi') || pendingData.competitionId.includes('freefire') ? 'AVR-BG' : 'AVR-ESP';
          const generatedTeamId = `${prefix}-${nextTeamCount.toString().padStart(4, '0')}`;

          const newRegRef = admin.firestore().collection('registrations').doc();
          const newRegId = newRegRef.id;
          t.set(newRegRef, {
             ...finalPayload,
             id: newRegId,
             teamId: generatedTeamId,
             transactionId: data.txnid,
             paymentMode: data.mode || null,
             status: 'confirmed',
             registeredAt: admin.firestore.FieldValue.serverTimestamp(),
             isAttended: false,
             metadata: {
               createdAt: admin.firestore.FieldValue.serverTimestamp()
             }
          });

       } else {
          // Standard Competition
          const regId = `${pendingData.competitionId}_${pendingData.userAVR}`;
          const regRef = admin.firestore().doc(`registrations/${regId}`);
          t.set(regRef, {
             ...finalPayload,
             id: regId,
             teamId: regId,
             transactionId: data.txnid,
             paymentMode: data.mode || null,
             status: 'confirmed',
             registeredAt: admin.firestore.FieldValue.serverTimestamp(),
             isAttended: false,
             metadata: {
               createdAt: admin.firestore.FieldValue.serverTimestamp()
             }
          });
       }
    });

    res.status(200).send("OK");

   } catch (error) {
    console.error("Webhook verification error:", error);
    // Return 200 to prevent Easebuzz retry storms — errors are logged for manual review.
    // The webhook is idempotent, so retries wouldn't help for non-transient errors.
    res.status(200).send("OK");
  }
});

/**
 * Cloud Function Webhook for Razorpay Payments
 * Razorpay posts here when qr_code.credited or payment.captured happens.
 */
export const razorpayWebhook = functions.https.onRequest({
  secrets: [RZP_KEY_SECRET, RZP_WEBHOOK_SECRET],
  cors: true
}, async (req, res): Promise<void> => {
  try {
    const signature = req.get("x-razorpay-signature");
    const webhookSecret = RZP_WEBHOOK_SECRET.value();
    
    // Verify Razorpay webhook signature
    const expectedSignature = crypto.createHmac("sha256", webhookSecret)
      .update(req.rawBody)
      .digest("hex");
      
    if (signature !== expectedSignature) {
      console.error("Razorpay webhook signature mismatch");
      res.status(400).send("Invalid signature");
      return;
    }

    const payload = req.body;
    const event = payload.event;
    
    if (event === "qr_code.credited" && payload.payload?.qr_code?.entity) {
      const entity = payload.payload.qr_code.entity;
      const txnid = entity.notes?.txnid;
      const paymentAmount = entity.payment_amount;

      if (!txnid) {
        console.error("No txnid found in Razorpay qr_code entity notes");
        res.status(200).send("OK");
        return;
      }
      
      const paymentIds = entity.payments?.map((p: any) => p.id).join(",") || "rzp_qr";
      
      // Finalize the registration
      await finalizeRegistration(txnid, "UPI_QR", paymentIds, null);
    }
    
    if (event === "payment.captured" && payload.payload?.payment?.entity) {
        const entity = payload.payload.payment.entity;
        const txnid = entity.notes?.txnid;
        if (!txnid) {
            res.status(200).send("OK");
            return;
        }
        await finalizeRegistration(txnid, entity.method || "UPI", entity.id, entity.acquirer_data?.rrn || null);
    }

    res.status(200).send("OK");

  } catch (error) {
    console.error("Razorpay webhook error:", error);
    res.status(200).send("OK"); // Acknowledge to prevent retry storms
  }
});

/**
 * Helper: Finalize a pending registration.
 * Shared by both paymentWebhook and checkPaymentStatus to avoid code duplication.
 * Returns the registration ID on success.
 */
async function finalizeRegistration(
  txnid: string,
  paymentMode: string | null,
  easepayId: string | null,
  bankRefNum: string | null
): Promise<string | null> {
  const pendingRef = admin.firestore().doc(`pending_registrations/${txnid}`);

  return admin.firestore().runTransaction(async (t) => {
    const pendingSnap = await t.get(pendingRef);
    if (!pendingSnap.exists) {
      console.warn(`[Finalize] Pending registration not found for ${txnid}`);
      return null;
    }

    const pendingData = pendingSnap.data()!;
    if (pendingData.status === 'confirmed') {
      console.log(`[Finalize] Already confirmed for ${txnid}, skipping.`);
      return pendingData.registrationId || txnid;
    }

    t.update(pendingRef, {
      status: 'confirmed',
      resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
      easepayId: easepayId,
      bankRefNum: bankRefNum,
      paymentMode: paymentMode
    });

    const finalPayload = pendingData.finalPayload || {};
    let registrationId = '';

    if (pendingData.type === 'hackathon') {
      const psId = pendingData.competitionId;
      const psMetadataRef = admin.firestore().doc(`ps_metadata/${psId}`);
      const psMetadataDoc = await t.get(psMetadataRef);
      let currentCount = psMetadataDoc.exists ? psMetadataDoc.data()?.count || 0 : 0;

      const teamCounterRef = admin.firestore().doc(`counters/hackathon_team_counter`);
      const teamCounterDoc = await t.get(teamCounterRef);
      let nextTeamCount = teamCounterDoc.exists ? (teamCounterDoc.data()?.count || 0) + 1 : 1;

      t.set(teamCounterRef, { count: nextTeamCount }, { merge: true });
      const generatedTeamId = `AVR-PRM-${nextTeamCount.toString().padStart(4, '0')}`;
      t.set(psMetadataRef, { count: currentCount + 1 }, { merge: true });

      const newRegRef = admin.firestore().collection('registrations').doc();
      registrationId = newRegRef.id;
      t.set(newRegRef, {
        ...finalPayload,
        id: registrationId,
        teamId: generatedTeamId,
        transactionId: txnid,
        paymentMode: paymentMode,
        status: 'confirmed',
        registeredAt: admin.firestore.FieldValue.serverTimestamp(),
        isAttended: false,
        metadata: { createdAt: admin.firestore.FieldValue.serverTimestamp() }
      });

    } else if (pendingData.type === 'robokshetra') {
      const teamCounterRef = admin.firestore().doc(`counters/robokshetra_team_counter`);
      const teamCounterDoc = await t.get(teamCounterRef);
      let nextTeamCount = teamCounterDoc.exists ? (teamCounterDoc.data()?.count || 0) + 1 : 1;

      t.set(teamCounterRef, { count: nextTeamCount }, { merge: true });
      const generatedTeamId = `AVR-ROB-${nextTeamCount.toString().padStart(4, '0')}`;

      const newRegRef = admin.firestore().collection('registrations').doc();
      registrationId = newRegRef.id;
      t.set(newRegRef, {
        ...finalPayload,
        id: registrationId,
        teamId: generatedTeamId,
        transactionId: txnid,
        paymentMode: paymentMode,
        status: 'confirmed',
        registeredAt: admin.firestore.FieldValue.serverTimestamp(),
        isAttended: false,
        metadata: { createdAt: admin.firestore.FieldValue.serverTimestamp() }
      });

    } else if (pendingData.type === 'esports') {
      const teamCounterRef = admin.firestore().doc(`counters/esports_team_counter`);
      const teamCounterDoc = await t.get(teamCounterRef);
      let nextTeamCount = teamCounterDoc.exists ? (teamCounterDoc.data()?.count || 0) + 1 : 1;

      t.set(teamCounterRef, { count: nextTeamCount }, { merge: true });
      const prefix = pendingData.competitionId.includes('bgmi') || pendingData.competitionId.includes('freefire') ? 'AVR-BG' : 'AVR-ESP';
      const generatedTeamId = `${prefix}-${nextTeamCount.toString().padStart(4, '0')}`;

      const newRegRef = admin.firestore().collection('registrations').doc();
      registrationId = newRegRef.id;
      t.set(newRegRef, {
        ...finalPayload,
        id: registrationId,
        teamId: generatedTeamId,
        transactionId: txnid,
        paymentMode: paymentMode,
        status: 'confirmed',
        registeredAt: admin.firestore.FieldValue.serverTimestamp(),
        isAttended: false,
        metadata: { createdAt: admin.firestore.FieldValue.serverTimestamp() }
      });

    } else {
      registrationId = `${pendingData.competitionId}_${pendingData.userAVR}`;
      const regRef = admin.firestore().doc(`registrations/${registrationId}`);
      t.set(regRef, {
        ...finalPayload,
        id: registrationId,
        teamId: registrationId,
        transactionId: txnid,
        paymentMode: paymentMode,
        status: 'confirmed',
        registeredAt: admin.firestore.FieldValue.serverTimestamp(),
        isAttended: false,
        metadata: { createdAt: admin.firestore.FieldValue.serverTimestamp() }
      });
    }

    // Store the registrationId back on pending for idempotent lookups
    t.update(pendingRef, { registrationId });

    return registrationId;
  });
}

/**
 * Custom Checkout: Create a seamless payment order with UPI QR.
 * 1. Runs pre-flight checks and writes pending_registration
 * 2. Calls Easebuzz Initiate Payment with request_flow=SEAMLESS
 * 3. Calls Easebuzz Seamless Payment API with payment_mode=UPI, upi_qr=true
 * 4. Returns the UPI QR link to the frontend
 */
export const createPaymentOrder = functions.https.onRequest({
  secrets: [MERCH_KEY, MERCH_SALT, SUB_ID, RZP_KEY_ID, RZP_KEY_SECRET],
  cors: true
}, async (req, res): Promise<void> => {
  try {
    const {
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      phone,
      udf1,
      pendingPayload
    } = req.body;

    if (!txnid || !amount || !firstname || !email || !phone) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    // --- PRE-FLIGHT CHECKS & ATOMIC PENDING REGISTRATION CREATION ---
    if (pendingPayload) {
      try {
        await admin.firestore().runTransaction(async (t) => {
          if (pendingPayload.type === 'hackathon' && pendingPayload.competitionId) {
            const psId = pendingPayload.competitionId;
            const psRef = admin.firestore().doc(`ps_metadata/${psId}`);
            const psDoc = await t.get(psRef);
            const currentCount = psDoc.exists ? psDoc.data()?.count || 0 : 0;
            const maxCount = psId === 'PS-14' ? 8 : 5;
            if (currentCount >= maxCount) {
              throw new Error(`Problem statement ${psId} has reached its maximum capacity of ${maxCount} teams.`);
            }
          }

          if (pendingPayload.type === 'competition' && pendingPayload.competitionId && pendingPayload.finalPayload?.userAVR) {
            const standardRegId = `${pendingPayload.competitionId}_${pendingPayload.finalPayload.userAVR}`;
            const regDoc = await t.get(admin.firestore().doc(`registrations/${standardRegId}`));
            if (regDoc.exists) {
              throw new Error(`Already registered for ${pendingPayload.eventName}.`);
            }
          }

          const pendingRef = admin.firestore().doc(`pending_registrations/${txnid}`);
          pendingPayload.createdAt = admin.firestore.FieldValue.serverTimestamp();
          pendingPayload.gateway = ACTIVE_GATEWAY;
          t.set(pendingRef, pendingPayload);
        });
      } catch (transactionError: any) {
        console.warn(`Pre-flight check failed for ${txnid}:`, transactionError.message);
        res.status(400).json({ success: false, error: transactionError.message });
        return;
      }
    }

    const safeProductinfo = (productinfo || "Avishkar26 Registration")
      .replace(/[^a-zA-Z0-9 _-]/g, "").trim().slice(0, 100) || "Avishkar26 Registration";
    const safeUdf1 = (udf1 || "N/A").replace(/[^a-zA-Z0-9 _-]/g, "").trim().slice(0, 100);
    const safeFirstname = (firstname || "Participant").replace(/[^a-zA-Z0-9 _-]/g, "").trim().slice(0, 100);

    if (ACTIVE_GATEWAY === "razorpay") {
      const rzpAuth = Buffer.from(`${RZP_KEY_ID.value()}:${RZP_KEY_SECRET.value()}`).toString('base64');
      const closeBy = Math.floor(Date.now() / 1000) + 600; // QR expires in 10 minutes
      const rzpResponse = await axios.post('https://api.razorpay.com/v1/payments/qr_codes', {
        type: "upi_qr",
        fixed_amount: true,
        payment_amount: Math.round(Number(amount) * 100), // convert INR to paise
        usage: "single_use",
        description: safeProductinfo,
        close_by: closeBy,
        notes: { txnid }
      }, {
        headers: {
          "Authorization": `Basic ${rzpAuth}`,
          "Content-Type": "application/json"
        }
      });

      const qrData = rzpResponse.data;
      console.log(`[Razorpay QR] Response for ${txnid}:`, JSON.stringify({
        id: qrData.id,
        status: qrData.status,
        has_image_url: !!qrData.image_url,
        has_image_content: !!qrData.image_content,
        image_content_preview: qrData.image_content?.substring(0, 80),
        keys: Object.keys(qrData)
      }));

      // image_content = the raw UPI intent string (upi://pay?...) for QRCodeSVG + mobile deep links
      // image_url = a hosted PNG download link (rzp.io/...) — only useful as <img> fallback
      const upiIntentString = qrData.image_content || null;
      const imageUrl = qrData.image_url || null;

      if (!upiIntentString) {
        console.warn(`[Razorpay QR] image_content (UPI intent) missing for ${txnid}. ` +
          `This feature may need to be enabled on the Razorpay dashboard. Falling back to image_url.`);
      }

      res.json({
        success: true,
        txnid,
        // qr_link: the value the frontend feeds into QRCodeSVG and UPI app deep links
        // MUST be a upi:// intent string for scanning/deep-linking to work
        qr_link: upiIntentString || imageUrl,
        qrstring: upiIntentString || imageUrl,
        rzp_qr_image_url: imageUrl, // backup: direct image URL if frontend wants to show <img> fallback
        mode: 'qr'
      });
      return;
    }

    const key = MERCH_KEY.value();
    const salt = MERCH_SALT.value();
    const submerchant_id = SUB_ID.value();

    // Step 1: Initiate Payment with request_flow=SEAMLESS
    const hashString = `${key}|${txnid}|${amount}|${safeProductinfo}|${safeFirstname}|${email}|${safeUdf1}||||||||||${salt}`;
    const hash = crypto.createHash("sha512").update(hashString).digest("hex");

    const initiateForm = new URLSearchParams();
    initiateForm.append("key", key);
    initiateForm.append("txnid", txnid);
    initiateForm.append("amount", amount);
    initiateForm.append("productinfo", safeProductinfo);
    initiateForm.append("firstname", safeFirstname);
    initiateForm.append("email", email);
    initiateForm.append("phone", phone);
    initiateForm.append("surl", getFrontendUrl() + "/user/dashboard?status=success");
    initiateForm.append("furl", getFrontendUrl() + "/user/dashboard?status=failed");
    initiateForm.append("hash", hash);
    initiateForm.append("udf1", safeUdf1);
    initiateForm.append("sub_merchant_id", submerchant_id);
    initiateForm.append("request_flow", "SEAMLESS");

    const initiateResponse = await axios.post(EASEBUZZ_PROD_URL, initiateForm.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });

    const initiateData = initiateResponse.data;
    if (initiateData.status !== 1 || !initiateData.data) {
      console.error("Easebuzz Initiate Error:", initiateData);
      res.status(400).json({ success: false, error: initiateData.error_desc || "Failed to initiate seamless payment" });
      return;
    }

    const accessKey = initiateData.data;

    const { upiId } = req.body;

    // Step 2: Call Seamless Payment API for UPI
    const seamlessForm = new URLSearchParams();
    seamlessForm.append("access_key", accessKey);
    seamlessForm.append("payment_mode", "UPI");
    
    if (upiId) {
      // User entered UPI ID - Use Collect Mode
      seamlessForm.append("request_mode", "collect");
      seamlessForm.append("upi_va", upiId);
    } else {
      // Show QR / mobile intent mode
      seamlessForm.append("request_mode", "SUVA");
      seamlessForm.append("upi_qr", "true");
    }

    const seamlessResponse = await axios.post(EASEBUZZ_SEAMLESS_PROD_URL, seamlessForm.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });

    const seamlessData = seamlessResponse.data;

    if (seamlessData.status === true) {
      // Depending on mode, Easebuzz returns qr_link (for SUVA) or just status (for collect)
      res.json({
        success: true,
        txnid,
        qr_link: seamlessData.qr_link || null,
        qrstring: seamlessData.qr_link || null,
        mode: upiId ? 'collect' : 'qr'
      });
    } else {
      console.error("Easebuzz Seamless Error:", seamlessData);
      res.status(400).json({
        success: false,
        error: seamlessData.msg_desc || seamlessData.error_desc || "Failed to generate UPI connection"
      });
    }

  } catch (error: any) {
    console.error("createPaymentOrder error:", error?.response?.data || error);
    res.status(500).json({ error: "Failed to create payment order" });
  }
});

/**
 * Custom Checkout: Poll payment status.
 * Frontend calls this every 3s to check if UPI payment has been completed.
 * Uses Easebuzz Transaction API v2 to verify, and finalizes registration on success.
 */
export const checkPaymentStatus = functions.https.onRequest({
  secrets: [MERCH_KEY, MERCH_SALT],
  cors: true
}, async (req, res): Promise<void> => {
  try {
    const txnid = req.query.txnid as string || req.body.txnid;

    if (!txnid) {
      res.status(400).json({ error: "txnid is required" });
      return;
    }

    const pendingRef = admin.firestore().doc(`pending_registrations/${txnid}`);
    const pendingDoc = await pendingRef.get();
    const gateway = pendingDoc.exists ? (pendingDoc.data()?.gateway || "easebuzz") : "easebuzz";

    if (gateway === "razorpay") {
      // For Razorpay, we rely purely on the webhook updating the Firestore status
      if (pendingDoc.exists) {
         const currentStatus = pendingDoc.data()?.status || 'pending';
         if (currentStatus === 'confirmed') {
           res.json({ status: 'success', registrationId: pendingDoc.data()?.registrationId || txnid });
         } else if (currentStatus === 'failed') {
           res.json({ status: 'failed' });
         } else {
           res.json({ status: 'pending' });
         }
      } else {
         res.json({ status: 'pending' });
      }
      return;
    }

    const key = MERCH_KEY.value();
    const salt = MERCH_SALT.value();

    // Generate hash for Transaction API: key|txnid|salt
    const txnHashString = `${key}|${txnid}|${salt}`;
    const txnHash = crypto.createHash("sha512").update(txnHashString).digest("hex");

    const txnForm = new URLSearchParams();
    txnForm.append("key", key);
    txnForm.append("txnid", txnid);
    txnForm.append("hash", txnHash);

    const txnResponse = await axios.post(EASEBUZZ_TXN_API_URL, txnForm.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });

    const txnData = txnResponse.data;

    if (!txnData || !txnData.msg) {
      res.json({ status: 'pending' });
      return;
    }

    const paymentInfo = txnData.msg;
    const paymentStatus = paymentInfo.status;

    if (paymentStatus === 'success') {
      // Verify hash: salt|status|udf10..udf1|email|firstname|productinfo|amount|txnid|key
      const reverseHashString = `${salt}|${paymentStatus}||||||||||${paymentInfo.udf1 || ''}|${paymentInfo.email}|${paymentInfo.firstname}|${paymentInfo.productinfo}|${paymentInfo.amount}|${paymentInfo.txnid}|${paymentInfo.key}`;
      const expectedHash = crypto.createHash("sha512").update(reverseHashString).digest("hex");

      if (paymentInfo.hash && paymentInfo.hash !== expectedHash) {
        console.error(`[CheckStatus] Hash mismatch for ${txnid}`);
        res.status(400).json({ status: 'error', error: 'Hash verification failed' });
        return;
      }

      // Finalize the registration
      const registrationId = await finalizeRegistration(
        txnid,
        paymentInfo.mode || null,
        paymentInfo.easepayid || null,
        paymentInfo.bank_ref_num || null
      );

      res.json({
        status: 'success',
        registrationId: registrationId || txnid
      });

    } else if (paymentStatus === 'failure' || paymentStatus === 'dropped') {
      await admin.firestore().doc(`pending_registrations/${txnid}`).update({
        status: 'failed',
        resolvedAt: admin.firestore.FieldValue.serverTimestamp()
      }).catch(() => {});

      res.json({ status: 'failed' });

    } else {
      // Still pending / userCancelled / initiated
      res.json({ status: 'pending' });
    }

  } catch (error: any) {
    console.error("checkPaymentStatus error:", error?.response?.data || error);
    res.json({ status: 'pending' });
  }
});
