import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
}

export const generateInvoice = async (data: InvoiceData) => {
    // Create a hidden div for the invoice
    const invoiceElement = document.createElement('div');
    invoiceElement.style.position = 'absolute';
    invoiceElement.style.left = '-9999px';
    invoiceElement.style.top = '-9999px';
    invoiceElement.style.width = '800px';
    invoiceElement.style.padding = '40px';
    invoiceElement.style.background = '#fff';
    invoiceElement.style.color = '#000';
    invoiceElement.style.fontFamily = 'Arial, sans-serif';

    invoiceElement.innerHTML = `
        <div style="border: 2px solid #000; padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px;">
                <div>
                    <h1 style="margin: 0; color: #5227ff; font-size: 28px;">AVISHKAR '26</h1>
                    <p style="margin: 5px 0; color: #666;">National Level Technical Festival</p>
                </div>
                <div style="text-align: right;">
                    <h2 style="margin: 0; font-size: 20px;">TAX INVOICE / RECEIPT</h2>
                    <p style="margin: 5px 0;"><strong>Date:</strong> ${data.date}</p>
                    <p style="margin: 5px 0;"><strong>Invoice #:</strong> INV-${data.paymentId.slice(-6)}</p>
                </div>
            </div>

            <div style="margin-bottom: 30px;">
                <h3 style="border-bottom: 1px solid #eee; padding-bottom: 10px;">TEAM DETAILS</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #666; width: 150px;">Team Name:</td>
                        <td style="padding: 8px 0; font-weight: bold;">${data.teamName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666;">Team Leader:</td>
                        <td style="padding: 8px 0;">${data.leaderName} (${data.avrId})</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666;">Competition:</td>
                        <td style="padding: 8px 0;">Param-X Hackathon '26</td>
                    </tr>
                </table>
            </div>

            <div style="margin-bottom: 30px;">
                <h3 style="border-bottom: 1px solid #eee; padding-bottom: 10px;">PAYMENT SUMMARY</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr style="background: #f9f9f9;">
                        <th style="padding: 12px; text-align: left; border: 1px solid #eee;">Description</th>
                        <th style="padding: 12px; text-align: right; border: 1px solid #eee;">Amount</th>
                    </tr>
                    <tr>
                        <td style="padding: 12px; border: 1px solid #eee;">Param-X Hackathon Registration Fee</td>
                        <td style="padding: 12px; border: 1px solid #eee; text-align: right;">₹${data.amount}</td>
                    </tr>
                    <tr style="font-weight: bold; font-size: 18px;">
                        <td style="padding: 12px; border: 1px solid #eee; text-align: right;">Total Paid</td>
                        <td style="padding: 12px; border: 1px solid #eee; text-align: right; color: #5227ff;">₹${data.amount}</td>
                    </tr>
                </table>
            </div>

            <div style="background: #f0fdf4; border: 1px solid #bdf4c9; padding: 15px; border-radius: 8px; margin-bottom: 30px;">
                <p style="margin: 0; color: #166534;"><strong>Payment Confirmed via Razorpay</strong></p>
                <p style="margin: 5px 0 0 0; color: #166534; font-size: 14px;">Transaction ID: ${data.paymentId}</p>
            </div>

            <div style="margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end;">
                <div style="font-size: 12px; color: #999;">
                    <p>This is a computer-generated document. No signature required.</p>
                    <p>Avishkar '26 | Zeal Education Society</p>
                </div>
                <div style="text-align: center;">
                    <div style="width: 120px; height: 1px; background: #000; margin-bottom: 10px;"></div>
                    <p style="margin: 0; font-weight: bold;">Authorized Signatory</p>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(invoiceElement);

    try {
        const canvas = await html2canvas(invoiceElement, {
            scale: 2,
            useCORS: true,
            logging: false
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Invoice_${data.teamName}_ParamX.pdf`);
    } finally {
        document.body.removeChild(invoiceElement);
    }
};
