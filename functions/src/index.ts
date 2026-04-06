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
 * Cloud Function to trigger email on registration
 */
export const onRegistrationCreated = onDocumentCreated("registrations/{regId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const regData = snapshot.data();
  const regId = event.params.regId;

  console.log(`Processing registration for ${regId}`);

  try {
    // 1. Read Template
    const templatePath = path.join(__dirname, "templates", "confirmation.html");
    const htmlTemplate = fs.readFileSync(templatePath, "utf8");

    // 2. Prepare Data for Template
    const templateData = {
      name: regData.leaderName || "Participant",
      competitionName: regData.eventTitle || "Avishkar Competition",
      registrationId: regData.registrationId || regId,
      teamName: regData.teamName || "Solo Entry",
      eventDate: "March 2026",
      paymentId: regData.transactionId || "N/A",
      amount: regData.amountPaid || "0.00"
    };

    // 3. Generate Welcome Email
    const welcomeHtml = processTemplate(htmlTemplate, templateData);

    await admin.firestore().collection("mail").add({
      to: regData.leaderEmail || regData.email,
      message: {
        subject: `Success! Welcome to the Grid, ${templateData.name} 🚀`,
        html: welcomeHtml,
      },
      metadata: {
        registrationId: regId,
        type: "welcome-confirmation"
      }
    });

    // 4. Generate Invoice Email
    try {
      const invoiceTemplatePath = path.join(__dirname, "templates", "invoice.html");
      const invoiceTemplate = fs.readFileSync(invoiceTemplatePath, "utf8");
      const invoiceHtml = processTemplate(invoiceTemplate, templateData);

      await admin.firestore().collection("mail").add({
        to: regData.leaderEmail || regData.email,
        message: {
          subject: `Invoice for ${templateData.competitionName} - ${templateData.registrationId}`,
          html: invoiceHtml,
        },
        metadata: {
          registrationId: regId,
          type: "tax-invoice"
        }
      });
      console.log(`Invoice trigger document created for ${regId}`);
    } catch (err) {
      console.error("Error generating second invoice email:", err);
    }

    console.log(`Email trigger document created for ${regId}`);

  } catch (error) {
    console.error("Error triggering confirmation email:", error);
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

    const key = MERCH_KEY.value();
    const salt = MERCH_SALT.value();
    const submerchant_id = SUB_ID.value();

    // 1. Generate hash: key|txnid|amount|productinfo|firstname|email|udf1-udf10|salt
    const hashString = `${key}|${txnid}|${amount}|${safeProductinfo}|${firstname}|${email}|${udf1 || ''}||||||||||${salt}`;
    const hash = crypto.createHash("sha512").update(hashString).digest("hex");

    // 2. POST to Easebuzz API (form-urlencoded)
    const formData = new URLSearchParams();
    formData.append("key", key);
    formData.append("txnid", txnid);
    formData.append("amount", amount);
    formData.append("productinfo", safeProductinfo);
    formData.append("firstname", firstname);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("surl", surl);
    formData.append("furl", furl);
    formData.append("hash", hash);
    formData.append("udf1", udf1 || '');
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
 * Cloud Function to verify user payment after completion.
 * Easebuzz will redirect the user back with transaction data.
 */
export const verifyPayment = functions.https.onRequest({
  secrets: [MERCH_KEY, MERCH_SALT],
  cors: true
}, async (req, res): Promise<void> => {
  try {
    const data = req.body;
    const salt = MERCH_SALT.value();

    // Reverse Hash Formula for verification:
    // sha512(salt|status|udf10-udf1|email|firstname|productinfo|amount|txnid|key)
    const hashString = `${salt}|${data.status}|||||||||${data.udf1 || ''}|${data.email}|${data.firstname}|${data.productinfo}|${data.amount}|${data.txnid}|${data.key}`;
    const expectedHash = crypto.createHash("sha512").update(hashString).digest("hex");

    if (data.hash === expectedHash) {
      res.json({ success: true, status: data.status });
    } else {
      res.status(400).json({ success: false, error: "Hash mismatch" });
    }

  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).send({ error: "Failed to verify transaction" });
  }
});
