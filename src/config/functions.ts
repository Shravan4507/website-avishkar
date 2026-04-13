// Configuration for Cloud Functions URLs
// Using environment variables for flexibility across local, staging, and production

// VITE_CLOUD_FUNCTIONS_BASE_URL handles v1 functions
const CLOUD_FUNCTIONS_BASE_URL = import.meta.env.VITE_CLOUD_FUNCTIONS_BASE_URL || 'https://us-central1-avishkar--26.cloudfunctions.net';

// VITE_INITIATE_PAYMENT_URL handles v2 gen functions like initiatepayment
const INITIATE_PAYMENT_URL = import.meta.env.VITE_INITIATE_PAYMENT_URL || 'https://initiatepayment-rgvkuxdaea-uc.a.run.app';

export const FUNCTIONS_CONFIG = {
    initiatePayment: INITIATE_PAYMENT_URL,
    // Split webhook handlers
    paymentSuccess: `${CLOUD_FUNCTIONS_BASE_URL}/paymentSuccess`,
    paymentFailure: `${CLOUD_FUNCTIONS_BASE_URL}/paymentFailure`,
    paymentWebhook: `${CLOUD_FUNCTIONS_BASE_URL}/paymentWebhook`,
    
    // Pre-flight check
    validateRegistration: `${CLOUD_FUNCTIONS_BASE_URL}/validateRegistration`,
};
