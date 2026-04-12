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
      furl
    } = req.body;

    if (!txnid || !amount || !firstname || !email || !phone || !surl || !furl) {
      res.status(400).send({ error: "Missing required fields" });
      return;
    }

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

/**
 * Cloud Function Webhook to verify user payment after completion.
 * Easebuzz will POST here via S2S Webhook OR Browser Redirect (surl/furl).
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
      res.redirect(302, `${FRONTEND_URL}/user/dashboard?status=failed&reason=hash_mismatch`);
      return;
    }

    if (data.status !== "success") {
       console.log(`Payment failed for ${data.txnid}`);
       await admin.firestore().doc(`pending_registrations/${data.txnid}`).update({
         status: 'failed',
         resolvedAt: admin.firestore.FieldValue.serverTimestamp()
       }).catch(() => {});
       res.redirect(302, `${FRONTEND_URL}/user/dashboard?status=failed&reason=payment_failed`);
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

          t.update(teamCounterRef, { count: nextTeamCount });
          const generatedTeamId = `AVR-PRM-${nextTeamCount.toString().padStart(4, '0')}`;

          t.set(psMetadataRef, { count: currentCount + 1 }, { merge: true });

          const newRegRef = admin.firestore().collection("hackathon_registrations").doc();
          t.set(newRegRef, {
             ...finalPayload,
             teamId: generatedTeamId,
             status: 'confirmed',
             paymentId: data.txnid,
             easepayId: data.easepayid || null,
             bankRefNum: data.bank_ref_num || null,
             paymentMode: data.mode || null,
             createdAt: admin.firestore.FieldValue.serverTimestamp()
          });

       } else if (pendingData.type === 'robokshetra') {
          const teamCounterRef = admin.firestore().doc(`counters/robokshetra_team_counter`);
          const teamCounterDoc = await t.get(teamCounterRef);
          let nextTeamCount = 1;
          if (teamCounterDoc.exists) {
             nextTeamCount = (teamCounterDoc.data()?.count || 0) + 1;
          }

          t.update(teamCounterRef, { count: nextTeamCount });
          const generatedTeamId = `AVR-ROB-${nextTeamCount.toString().padStart(4, '0')}`;

          const newRegRef = admin.firestore().collection("registrations").doc();
          t.set(newRegRef, {
             ...finalPayload,
             teamId: generatedTeamId,
             registrationId: generatedTeamId,
             transactionId: data.txnid,
             easepayId: data.easepayid || null,
             bankRefNum: data.bank_ref_num || null,
             paymentMode: data.mode || null,
             status: 'confirmed',
             paymentStatus: 'success',
             registeredAt: admin.firestore.FieldValue.serverTimestamp()
          });

       } else if (pendingData.type === 'esports') {
          const teamCounterRef = admin.firestore().doc(`counters/esports_team_counter`);
          const teamCounterDoc = await t.get(teamCounterRef);
          let nextTeamCount = 1;
          if (teamCounterDoc.exists) {
             nextTeamCount = (teamCounterDoc.data()?.count || 0) + 1;
          }

          t.update(teamCounterRef, { count: nextTeamCount });
          const prefix = pendingData.competitionId.includes('bgmi') || pendingData.competitionId.includes('freefire') ? 'AVR-BG' : 'AVR-ESP';
          const generatedTeamId = `${prefix}-${nextTeamCount.toString().padStart(4, '0')}`;

          const newRegRef = admin.firestore().collection("registrations").doc();
          t.set(newRegRef, {
             ...finalPayload,
             teamId: generatedTeamId,
             registrationId: generatedTeamId,
             transactionId: data.txnid,
             easepayId: data.easepayid || null,
             bankRefNum: data.bank_ref_num || null,
             paymentMode: data.mode || null,
             status: 'confirmed',
             paymentStatus: 'success',
             registeredAt: admin.firestore.FieldValue.serverTimestamp()
          });

       } else {
          // Standard Competition
          const regId = `${pendingData.competitionId}_${pendingData.userAVR}`;
          const regRef = admin.firestore().doc(`registrations/${regId}`);
          t.set(regRef, {
             ...finalPayload,
             transactionId: data.txnid,
             easepayId: data.easepayid || null,
             bankRefNum: data.bank_ref_num || null,
             paymentMode: data.mode || null,
             status: 'confirmed',
             registeredAt: admin.firestore.FieldValue.serverTimestamp(),
             isAttended: false
          });
       }
    });

    res.redirect(302, `${FRONTEND_URL}/user/dashboard?status=success&txnid=${data.txnid}`);

  } catch (error) {
    console.error("Webhook verification error:", error);
    res.redirect(302, `https://avishkar.zcoer.in/user/dashboard?status=failed&reason=server_error`);
  }
});
