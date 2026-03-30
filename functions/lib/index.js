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
exports.verifyPayment = exports.initiatePayment = void 0;
const functions = __importStar(require("firebase-functions/v2"));
const admin = __importStar(require("firebase-admin"));
const params_1 = require("firebase-functions/params");
const crypto_1 = __importDefault(require("crypto"));
const axios_1 = __importDefault(require("axios"));
admin.initializeApp();
const MERCH_KEY = (0, params_1.defineSecret)("EASEBUZZ_MERCHANT_KEY");
const MERCH_SALT = (0, params_1.defineSecret)("EASEBUZZ_SALT");
const SUB_ID = (0, params_1.defineSecret)("EASEBUZZ_SUBMERCHANT_ID");
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
        const key = MERCH_KEY.value();
        const salt = MERCH_SALT.value();
        const submerchant_id = SUB_ID.value();
        const hashString = `${key}|${txnid}|${amount}|${safeProductinfo}|${firstname}|${email}|${udf1 || ''}||||||||||${salt}`;
        const hash = crypto_1.default.createHash("sha512").update(hashString).digest("hex");
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