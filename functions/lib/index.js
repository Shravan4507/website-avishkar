"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPayment = exports.initiatePayment = exports.onRegistrationCreated = void 0;
const functions = __importStar(require("firebase-functions/v2"));
const admin = __importStar(require("firebase-admin"));
const params_1 = require("firebase-functions/params");
const firestore_1 = require("firebase-functions/v2/firestore");
const crypto_1 = __importDefault(require("crypto"));
const axios_1 = __importDefault(require("axios"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
admin.initializeApp();
const MERCH_KEY = (0, params_1.defineSecret)("EASEBUZZ_MERCHANT_KEY");
const MERCH_SALT = (0, params_1.defineSecret)("EASEBUZZ_SALT");
const SUB_ID = (0, params_1.defineSecret)("EASEBUZZ_SUBMERCHANT_ID");
function processTemplate(html, data) {
    let processed = html;
    Object.keys(data).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        processed = processed.replace(regex, data[key] || '');
    });
    return processed;
}
exports.onRegistrationCreated = (0, firestore_1.onDocumentCreated)("registrations/{regId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot)
        return;
    const regData = snapshot.data();
    const regId = event.params.regId;
    console.log(`[Email] Processing registration: ${regId}`);
    try {
        const templatePath = path.join(__dirname, "templates", "confirmation.html");
        const htmlTemplate = fs.readFileSync(templatePath, "utf8");
        const avrId = regData.registrationId || regId;
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(avrId)}&bgcolor=ffffff&color=0f172a`;
        const templateData = {
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
        }
        catch (err) {
            console.error("[Email] Invoice generation failed:", err);
        }
        console.log(`[Email] Confirmation queued for ${regId}`);
    }
    catch (error) {
        console.error("[Email] Critical failure:", error);
    }
});
const EASEBUZZ_TEST_URL = "https://testpay.easebuzz.in/payment/initiateLink";
const EASEBUZZ_PROD_URL = "https://pay.easebuzz.in/payment/initiateLink";
exports.initiatePayment = functions.https.onRequest({
    secrets: [MERCH_KEY, MERCH_SALT, SUB_ID],
    cors: true
}, async (req, res) => {
    try {
        const { txnid, amount, productinfo, firstname, email, phone, udf1, surl, furl } = req.body;
        if (!txnid || !amount || !firstname || !email || !phone || !surl || !furl) {
            res.status(400).send({ error: "Missing required fields" });
            return;
        }
        const safeProductinfo = (productinfo || "Avishkar26 Registration")
            .replace(/[^a-zA-Z0-9 _-]/g, "")
            .trim()
            .slice(0, 100) || "Avishkar26 Registration";
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
        const hashString = `${key}|${txnid}|${amount}|${safeProductinfo}|${safeFirstname}|${email}|${safeUdf1}||||||||||${salt}`;
        const hash = crypto_1.default.createHash("sha512").update(hashString).digest("hex");
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
        const easebuzzResponse = await axios_1.default.post(EASEBUZZ_PROD_URL, formData.toString(), {
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });
        const ebData = easebuzzResponse.data;
        if (ebData.status === 1 && ebData.data) {
            res.json({
                success: true,
                access_key: ebData.data
            });
        }
        else {
            console.error("Easebuzz API Error:", ebData);
            res.status(400).json({
                success: false,
                error: ebData.error_desc || "Easebuzz rejected the transaction"
            });
        }
    }
    catch (error) {
        console.error("Payment initiation error:", error?.response?.data || error);
        res.status(500).send({ error: "Failed to initiate payment" });
    }
});
exports.verifyPayment = functions.https.onRequest({
    secrets: [MERCH_KEY, MERCH_SALT],
    cors: true
}, async (req, res) => {
    try {
        const data = req.body;
        const salt = MERCH_SALT.value();
        const hashString = `${salt}|${data.status}|||||||||${data.udf1 || ''}|${data.email}|${data.firstname}|${data.productinfo}|${data.amount}|${data.txnid}|${data.key}`;
        const expectedHash = crypto_1.default.createHash("sha512").update(hashString).digest("hex");
        if (data.hash === expectedHash) {
            res.json({ success: true, status: data.status });
        }
        else {
            res.status(400).json({ success: false, error: "Hash mismatch" });
        }
    }
    catch (error) {
        console.error("Verification error:", error);
        res.status(500).send({ error: "Failed to verify transaction" });
    }
});
//# sourceMappingURL=index.js.map