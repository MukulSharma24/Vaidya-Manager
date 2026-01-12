// js/utils/InvoiceRenderer.js
// Responsible ONLY for invoice UI rendering & download

class InvoiceRenderer {
    static generateInvoiceHTML(invoice) {
        const date = new Date(invoice.date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });

        const balance = invoice.total - invoice.amountPaid;

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Invoice ${invoice.invoiceNumber}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: #f6f6f6;
            padding: 40px;
        }
        .invoice {
            background: #fff;
            max-width: 800px;
            margin: auto;
            padding: 40px;
            border-radius: 8px;
        }
        .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #4caf8a;
            margin: 0;
        }
        .section {
            margin-bottom: 25px;
        }
        .section h3 {
            margin-bottom: 8px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 4px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th {
            background: #4caf8a;
            color: #fff;
            padding: 10px;
            text-align: left;
        }
        td {
            padding: 10px;
            border-bottom: 1px solid #ddd;
        }
        .totals {
            width: 300px;
            margin-left: auto;
        }
        .totals td {
            padding: 6px;
        }
        .totals .grand {
            font-weight: bold;
            font-size: 16px;
        }
        .footer {
            margin-top: 30px;
            font-size: 14px;
        }
        .signature {
            margin-top: 50px;
            text-align: right;
            font-family: cursive;
            font-size: 24px;
        }
    </style>
</head>
<body>
<div class="invoice">
    <div class="header">
        <div>
            <h1>INVOICE</h1>
            <p><strong>Invoice No:</strong> ${invoice.invoiceNumber}</p>
            <p><strong>Date:</strong> ${date}</p>
        </div>
        <div>
            <strong>Shajag Vaidya Manager</strong><br>
            Ayurvedic Clinic
        </div>
    </div>

    <div class="section">
        <h3>Patient Details</h3>
        <p><strong>Name:</strong> ${invoice.patientName}</p>
        <p><strong>Phone:</strong> ${invoice.patientPhone}</p>
    </div>

    <div class="section">
        <h3>Services</h3>
        <table>
            <thead>
                <tr>
                    <th>Service</th>
                    <th>Qty</th>
                    <th>Rate</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                ${invoice.items.map(item => `
                    <tr>
                        <td>${item.name}</td>
                        <td>${item.quantity}</td>
                        <td>₹${item.price.toLocaleString()}</td>
                        <td>₹${(item.price * item.quantity).toLocaleString()}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <table class="totals">
        <tr>
            <td>Subtotal:</td>
            <td>₹${invoice.subtotal.toLocaleString()}</td>
        </tr>
        <tr>
            <td>GST:</td>
            <td>₹${invoice.gstAmount.toLocaleString()}</td>
        </tr>
        ${invoice.discount > 0 ? `
        <tr>
            <td>Discount:</td>
            <td>-₹${invoice.discount.toLocaleString()}</td>
        </tr>` : ''}
        <tr class="grand">
            <td>Total:</td>
            <td>₹${invoice.total.toLocaleString()}</td>
        </tr>
        <tr>
            <td>Paid:</td>
            <td>₹${invoice.amountPaid.toLocaleString()}</td>
        </tr>
        <tr>
            <td>Balance:</td>
            <td>₹${balance.toLocaleString()}</td>
        </tr>
    </table>

    <div class="footer">
        <p><strong>Payment Method:</strong> ${invoice.paymentMethod}</p>
        <p><strong>Status:</strong> ${invoice.paymentStatus}</p>
        ${invoice.notes ? `<p><strong>Notes:</strong> ${invoice.notes}</p>` : ''}
    </div>

    <div class="signature">Authorized Signature</div>
</div>
</body>
</html>
        `;
    }

    static downloadInvoice(invoice) {
        const html = this.generateInvoiceHTML(invoice);
        const win = window.open('', '_blank');
        win.document.write(html);
        win.document.close();
        win.focus();

        // Give browser time to render before print
        setTimeout(() => win.print(), 500);
    }
}

window.InvoiceRenderer = InvoiceRenderer;
