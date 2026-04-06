/**
 * EmailService.ts
 * 
 * A professional utility for generating standardized Avishkar '26 email HTML.
 * Uses Vite's ?raw import to manage HTML templates separately from logic.
 */

// Import Base Layout
import baseLayout from '../assets/emails/base-layout.html?raw';

// Import Content Templates
import registrationSuccessTemplate from '../assets/emails/registration-success.html?raw';
import paymentFailureTemplate from '../assets/emails/payment-failure.html?raw';
import paymentPendingTemplate from '../assets/emails/payment-pending.html?raw';

export type EmailTemplateType = 'REGISTRATION_SUCCESS' | 'PAYMENT_FAILURE' | 'PAYMENT_PENDING';

interface EmailData {
    [key: string]: string | number;
}

/**
 * Replaces all {{VARIABLE}} markers in a string with data from the provided object.
 */
const compile = (template: string, data: EmailData): string => {
    let result = template;
    Object.entries(data).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(regex, String(value));
    });
    return result;
};

/**
 * Generates the full HTML for an email by injecting content into the base layout.
 */
export const generateEmailHTML = (type: EmailTemplateType, data: EmailData): string => {
    let contentTemplate = '';

    switch (type) {
        case 'REGISTRATION_SUCCESS':
            contentTemplate = registrationSuccessTemplate;
            break;
        case 'PAYMENT_FAILURE':
            contentTemplate = paymentFailureTemplate;
            break;
        case 'PAYMENT_PENDING':
            contentTemplate = paymentPendingTemplate;
            break;
        default:
            throw new Error(`Unknown email template type: ${type}`);
    }

    // 1. Process the content template with dynamic data
    const processedContent = compile(contentTemplate, data);

    // 2. Inject processed content into the base layout
    const finalHTML = baseLayout.replace('{{CONTENT_GOES_HERE}}', processedContent);

    return finalHTML;
};
