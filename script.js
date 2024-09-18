// Global variable to store business info
let businessInfo = {};

// Show business info input modal at the start
window.onload = function() {
    const businessModal = document.getElementById('business-info-modal');
    businessModal.style.display = 'flex';
};

// Function to submit business info and hide modal
const submitBusinessInfo = () => {
    const name = document.getElementById('business-name').value.trim();
    const addressLine1 = document.getElementById('address-line1').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();

    // Validate required fields
    if (!name || !addressLine1 || !phone || !email) {
        alert('Please fill in all required fields.');
        return;
    }

    // Store business info globally
    businessInfo = {
        name,
        addressLine1,
        addressLine2: document.getElementById('address-line2').value.trim(),
        phone,
        email
    };

    // Hide modal after successful submission
    closeBusinessModal();
};

// Function to close the modal
const closeBusinessModal = () => {
    const modal = document.getElementById('business-info-modal');
    modal.style.display = 'none';
};

// Add functionality to dynamically add items to the invoice
let itemIndex = 1;
document.getElementById('add-item-btn').addEventListener('click', () => {
    const itemsBody = document.getElementById('items-body');
    const itemRowHTML = `
        <tr>
            <td>${itemIndex + 1}</td> <!-- Indexing each new item -->
            <td><input type="text" id="item-${itemIndex}" required></td>
            <td><input type="number" id="amount-${itemIndex}" required></td>
        </tr>
    `;
    itemsBody.insertAdjacentHTML('beforeend', itemRowHTML);
    itemIndex++;
});

// Handle invoice submission
let invoices = {};
const submitInvoice = () => {
    const name = document.getElementById('customer-name').value.trim();
    if (!name) return alert('Please fill in the customer name.');

    const items = [];
    for (let i = 0; i < itemIndex; i++) {
        const item = document.getElementById(`item-${i}`).value.trim();
        const amount = parseFloat(document.getElementById(`amount-${i}`).value.trim());
        if (item && !isNaN(amount)) {
            items.push({ item, amount });
        }
    }

    if (items.length === 0) return alert('Please fill in at least one item and amount.');

    if (!invoices[name]) invoices[name] = [];
    invoices[name].push(...items);
    console.log(`Customer: ${name}, Items:`, items);
    updateTable(name);
    document.getElementById('form').reset();
    itemIndex = 1;
};

// Update the invoices table
const updateTable = (name) => {
    const tbody = document.querySelector('#invoice-table tbody');
    let totalAmount = invoices[name].reduce((acc, i) => acc + i.amount, 0);
    let rows = invoices[name].map(i => `<li>${i.item}: Rs.${i.amount.toFixed(2)}</li>`).join('');

    tbody.innerHTML += `
        <tr>
            <td>${name}</td>
            <td><ul>${rows}</ul></td>
            <td>Rs.${totalAmount.toFixed(2)}</td>
            <td>
                <button onclick="previewInvoice('${name}')">Preview</button>
                <button onclick="exportToPDF('${name}')">Export to PDF</button>
            </td>
        </tr>`;
};

// Preview invoice functionality
// Preview invoice with indexing
const previewInvoice = (name) => {
    const modal = document.getElementById('preview-modal');
    const previewContent = document.getElementById('preview-content');
    
    const { htmlContent } = generateInvoiceContent(name); // Generate content with indexing
    
    previewContent.innerHTML = htmlContent; // Display in modal
    modal.style.display = 'flex';
};

// Close the preview modal
const closeModal = () => {
    document.getElementById('preview-modal').style.display = "none";
};

// Generate invoice content
// Generate invoice content with indexing for preview and exports
const generateInvoiceContent = (name) => {
    const items = invoices[name];
    const totalAmount = items.reduce((acc, i) => acc + i.amount, 0);

    let contentHTML = `
        <h3>${businessInfo.name}</h3>
        <p>${businessInfo.addressLine1}<br>${businessInfo.addressLine2}<br>${businessInfo.phone}<br>${businessInfo.email}</p>
        <hr>
        <p><strong>Bill To:</strong> ${name}</p>
        <table>
            <thead>
                <tr><th>#</th><th>Item Description</th><th>Amount</th></tr>
            </thead>
            <tbody>
    `;

    // Add items with indexing
    items.forEach((item, index) => {
        contentHTML += `<tr><td>${index + 1}</td><td>${item.item}</td><td>Rs.${item.amount.toFixed(2)}</td></tr>`;
    });

    contentHTML += `
            </tbody>
        </table>
        <p><strong>Total Amount:</strong> Rs.${totalAmount.toFixed(2)}</p>
        <hr>
        <p>Thank you for Purchase!</p>
    `;

    // Return the HTML and an array version for export (PDF/Excel)
    return {
        htmlContent: contentHTML,
        items: items.map((i, index) => [`${index + 1}`, i.item, `Rs.${i.amount.toFixed(2)}`]), // Indexed for PDF/Excel
        totalAmount
    };
};


// Export to PDF with indexing
const exportToPDF = (name) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const { items, totalAmount } = generateInvoiceContent(name); // Generate content with indexing

    doc.setFontSize(16).text(businessInfo.name, 105, 20, null, null, "center");
    doc.setFontSize(10).text(`${businessInfo.addressLine1}\n${businessInfo.addressLine2}\n${businessInfo.phone}\n${businessInfo.email}`, 105, 30, null, null, "center");

    doc.setFontSize(10).text(`Bill To: ${name}`, 10, 50);

    // Include the indexed items in the PDF
    doc.autoTable({
        startY: 60,
        head: [["#", "Item Description", "Amount"]],
        body: items.map((item) => [item[0], item[1], item[2]]), // Include the index for each item
        theme: 'striped'
    });

    doc.text(`Total Amount: Rs.${totalAmount.toFixed(2)}`, 150, doc.autoTable.previous.finalY + 10);
    doc.text("Thank you for Purchase!", 105, doc.autoTable.previous.finalY + 30, null, null, "center");

    doc.save(`${name}_invoice.pdf`);
};