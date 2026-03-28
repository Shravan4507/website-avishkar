import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { defineSecret } from "firebase-functions/params";
import crypto from "crypto";
import corsLib from "cors";

// Initialize admin SDK
admin.initializeApp();

// Configuration: We'll store these in Firebase Secrets
const MERCH_KEY = defineSecret("EASEBUZZ_MERCHANT_KEY");
const MERCH_SALT = defineSecret("EASEBUZZ_SALT");

// CORS Configuration: Allow your website origin
const cors = corsLib({ origin: true });

/**
 * Cloud Function to initiate a payment.
 * This function handles the "Handshake" where it generates a secure Hash.
 */
export const initiatePayment = functions.https.onRequest({ secrets: [MERCH_KEY, MERCH_SALT] }, async (req, res) => {
  return cors(req, res, async () => {
    try {
      // 1. Get transaction details from the frontend
      const { 
        txnid, 
        amount, 
        productinfo, 
        firstname, 
        email, 
        phone, 
        surl, 
        furl 
      } = req.body;

      if (!txnid || !amount || !firstname || !email) {
        return res.status(400).send({ error: "Missing required fields" });
      }

      const key = MERCH_KEY.value();
      const salt = MERCH_SALT.value();

      // 2. Prepare the Hash based on Easebuzz formula:
      // sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5|udf6|udf7|udf8|udf9|udf10|salt)
      // We use empty strings for UDF fields if not needed.
      const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${salt}`;
      const hash = crypto.createHash("sha512").update(hashString).digest("hex");

      // 3. Return the hash and key to the frontend
      res.json({
        success: true,
        hash: hash,
        key: key
      });

    } catch (error) {
      console.error("Payment initiation error:", error);
      res.status(500).send({ error: "Failed to initiate payment" });
    }
  });
});

/**
 * Cloud Function to verify user payment after completion.
 * Easebuzz will call this (or the user will redirect back) with transaction data.
 */
export const verifyPayment = functions.https.onRequest({ secrets: [MERCH_KEY, MERCH_SALT] }, async (req, res) => {
  return cors(req, res, async () => {
    try {
      // Data received back from Easebuzz
      const data = req.body;
      const salt = MERCH_SALT.value();

      // Reverse Hash Formula for verification:
      // sha512(salt|status|udf10|udf9|udf8|udf7|udf6|udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
      const hashString = `${salt}|${data.status}|||||||||||${data.email}|${data.firstname}|${data.productinfo}|${data.amount}|${data.txnid}|${data.key}`;
      const expectedHash = crypto.createHash("sha512").update(hashString).digest("hex");

      if (data.hash === expectedHash) {
        // Payment is authentic!
        // Here you would update your Firestore database (e.g., set status: "paid")
        res.json({ success: true, status: data.status });
      } else {
        res.status(400).json({ success: false, error: "Hash mismatch" });
      }

    } catch (error) {
      console.error("Verification error:", error);
      res.status(500).send({ error: "Failed to verify transaction" });
    }
  });
});
