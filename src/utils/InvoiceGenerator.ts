import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import invoiceTemplate from '../assets/emails/invoice-template.html?raw';

export interface InvoiceData {
    teamName: string;
    leaderName: string;
    leaderEmail: string;
    avrId: string;
    psId: string;
    psTitle: string;
    paymentId: string;
    date: string;
    amount: string;
    // New professional fields
    billId?: string;
    issueDate?: string;
    userCollege?: string;
    baseAmount?: string;
    supportEmail?: string;
    eventName?: string;
}

/**
 * Helper to replace {{VAR}} in templates
 */
const compileTemplate = (template: string, data: InvoiceData): string => {
    let result = template;
    
    // Explicit mapping for Invoice Template
    const map: Record<string, string> = {
        '{{BILL_ID}}': data.billId || `INV-${data.paymentId?.slice(-6).toUpperCase()}`,
        '{{ISSUE_DATE}}': data.issueDate || data.date,
        '{{USER_NAME}}': data.leaderName,
        '{{USER_EMAIL}}': data.leaderEmail,
        '{{USER_COLLEGE}}': data.userCollege || 'Not Specified',
        '{{EVENT_NAME}}': data.eventName || data.psTitle,
        '{{AVR_ID}}': data.avrId,
        '{{BASE_AMOUNT}}': data.baseAmount || data.amount,
        '{{AMOUNT}}': data.amount,
        '{{SUPPORT_EMAIL}}': data.supportEmail || 'support.avishkarr@zealeducation.com'
    };

    Object.entries(map).forEach(([key, value]) => {
        result = result.replace(new RegExp(key, 'g'), String(value));
    });

    return result;
};

export const generateInvoice = async (data: InvoiceData) => {
    // Create a hidden container for the invoice
    const invoiceElement = document.createElement('div');
    invoiceElement.style.position = 'absolute';
    invoiceElement.style.left = '-9999px';
    invoiceElement.style.top = '-9999px';
    invoiceElement.style.width = '850px'; // Professional width for capture
    invoiceElement.style.background = '#f8fafc';
    
    // Process the professional template
    const processedHTML = compileTemplate(invoiceTemplate, data);
    invoiceElement.innerHTML = processedHTML;

    document.body.appendChild(invoiceElement);

    try {
        const canvas = await html2canvas(invoiceElement, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#f8fafc'
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Invoice_${data.teamName}_Avishkar.pdf`);
    } finally {
        document.body.removeChild(invoiceElement);
    }
};
