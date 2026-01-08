// ==========================================
//      RESTOFLOW POS - CHECKOUT LOGIC
// ==========================================

// --- 1. CONFIGURATION (FILL THESE IN!) ---
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_KEY';
const RAZORPAY_KEY = 'YOUR_RAZORPAY_KEY';

// Initialize Supabase
var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- 2. GLOBAL STATE ---
let cart = [];
let pendingTotalAmount = 0; // Total bill value
let selectedOrderType = 'Dine-In';
let selectedPaymentMethod = 'Cash';

let splitCashAmount = 0;
let splitOnlineAmount = 0;
let lastOrderId = null; // Store for printing

// --- 3. INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    loadCartFromStorage();
    setupEventListeners();
});

/**
 * Loads the cart from localStorage and renders the page.
 * Redirects to home if cart is empty.
 */
function loadCartFromStorage() {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
        cart = JSON.parse(storedCart);
        renderCheckoutPage();
    } else {
        alert("Cart is empty! Redirecting to menu...");
        window.location.href = 'index.html';
    }
}

// --- 4. RENDER UI ---
/**
 * Renders the cart items and calculates totals (Subtotal, Tax, Final).
 * Updates the UI elements accordingly.
 */
function renderCheckoutPage() {
    const container = document.getElementById('checkout-items');
    container.innerHTML = "";

    if (cart.length === 0) {
        container.innerHTML = "<tr><td colspan='4' style='text-align:center;'>Cart is empty.</td></tr>";
        return;
    }

    let subtotal = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.qty;
        subtotal += itemTotal;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><img src="${item.img}" alt="${item.name}"> ${item.name}</td>
            <td>₹${item.price.toFixed(2)}</td>
            <td>${item.qty}</td>
            <td>₹${itemTotal.toFixed(2)}</td>
        `;
        container.appendChild(row);
    });

    // Calculate Totals
    const tax = subtotal * 0.05;
    pendingTotalAmount = subtotal + tax;

    // Update UI text
    document.getElementById('checkout-subtotal').innerText = `₹${subtotal.toFixed(2)}`;
    document.getElementById('checkout-tax').innerText = `₹${tax.toFixed(2)}`;
    document.getElementById('checkout-total').innerText = `₹${pendingTotalAmount.toFixed(2)}`;

    // Update Pay Button Text
    const btn = document.getElementById('confirm-btn');
    if (btn) btn.innerText = `Confirm & Pay ₹${pendingTotalAmount.toFixed(2)}`;
}

// --- 5. USER INTERACTION (SELECTORS) ---
// Make these global so HTML onclick works
/**
 * Selector for Dine-In / Takeaway options.
 * @param {HTMLElement} element - The clicked button.
 * @param {string} type - 'Dine-In' or 'Takeaway'.
 */
window.selectOrderType = function (element, type) {
    selectedOrderType = type;
    document.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('selected'));
    element.classList.add('selected');
}

/**
 * Selector for Payment Method options.
 * @param {HTMLElement} element - The clicked card.
 * @param {string} method - 'Cash', 'Card Machine', 'Split', or 'Online'.
 */
window.selectPaymentMethod = function (element, method) {
    selectedPaymentMethod = method;
    document.querySelectorAll('.pay-card').forEach(card => card.classList.remove('selected'));
    element.classList.add('selected');
}

/**
 * Attaches event listeners to interactive elements.
 */
function setupEventListeners() {
    // Attach click listener to the main Pay Button
    const confirmBtn = document.getElementById('confirm-btn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', handlePayment);
    }
}

// --- 6. MAIN PAYMENT HANDLER (THE BRAIN) ---
/**
 * Master handler for the "Pay" button.
 * Routes the flow based on the selected payment method.
 */
function handlePayment() {
    if (cart.length === 0) return alert("Cart is empty!");

    const confirmBtn = document.getElementById('confirm-btn');
    confirmBtn.innerText = "Processing...";
    confirmBtn.disabled = true;

    // ROUTE BASED ON METHOD
    if (selectedPaymentMethod === 'Cash') {
        openCashModal(pendingTotalAmount); // Open Custom Modal
    }
    else if (selectedPaymentMethod === 'Split') {
        openSplitModal(pendingTotalAmount); // Open Custom Modal
    }
    else if (selectedPaymentMethod === 'Card Machine') {
        processOfflinePayment(pendingTotalAmount, 0, 0); // No cash given, no change
    }
    else {
        processOnlinePayment(pendingTotalAmount); // Razorpay
    }
}

// --- 7. CASH MODAL LOGIC (INTERACTIVE) ---
/**
 * Opens the Cash Payment Modal.
 * Generates smart quick-cash buttons.
 * @param {number} amount - The total bill amount.
 */
window.openCashModal = function (amount) {
    const modal = document.getElementById('cash-modal');
    const input = document.getElementById('cash-input');
    const quickBtns = document.getElementById('quick-cash-btns');

    // Reset UI
    document.getElementById('cp-bill-total').innerText = "₹" + amount.toFixed(2);
    input.value = '';
    document.getElementById('cp-change-display').innerText = "₹0.00";
    document.getElementById('confirm-cash-btn').disabled = true;

    // Generate Smart Buttons
    quickBtns.innerHTML = '';
    createQuickBtn(amount, "Exact", quickBtns);

    // Suggestions: Next 10, Next 100, 500, 2000
    const suggestions = [
        Math.ceil(amount / 10) * 10,
        Math.ceil(amount / 100) * 100,
        500, 2000
    ];
    // Filter unique and valid suggestions
    [...new Set(suggestions)]
        .filter(s => s >= amount && s !== amount)
        .sort((a, b) => a - b)
        .forEach(val => createQuickBtn(val, "₹" + val, quickBtns));

    modal.classList.remove('d-none');
    input.focus();
}

/**
 * Closes the Cash Payment Modal.
 */
window.closeCashModal = function () {
    document.getElementById('cash-modal').classList.add('d-none');
    resetMainButton();
}

/**
 * Calculates change to return based on cash input.
 * Updates UI and enables/disables the confirm button.
 */
window.calculateChange = function () {
    const inputVal = parseFloat(document.getElementById('cash-input').value) || 0;
    const changeEl = document.getElementById('cp-change-display');
    const btn = document.getElementById('confirm-cash-btn');
    const change = inputVal - pendingTotalAmount;

    if (change >= 0) {
        changeEl.innerText = "₹" + change.toFixed(2);
        changeEl.style.color = "var(--accent-green)";
        btn.disabled = false;
    } else {
        changeEl.innerText = "Short by ₹" + Math.abs(change).toFixed(2);
        changeEl.style.color = "red";
        btn.disabled = true;
    }
}

/**
 * Finalizes the Cash payment transaction.
 */
window.submitCashPayment = function () {
    const cashGiven = parseFloat(document.getElementById('cash-input').value);
    const change = cashGiven - pendingTotalAmount;
    document.getElementById('cash-modal').classList.add('d-none');

    // Finish
    processOfflinePayment(pendingTotalAmount, cashGiven, change);
}

/**
 * Helper to create quick cash denomination buttons.
 */
function createQuickBtn(val, text, container) {
    const btn = document.createElement('button');
    btn.className = 'quick-btn';
    btn.innerText = text;
    btn.onclick = () => {
        document.getElementById('cash-input').value = val;
        window.calculateChange();
    };
    container.appendChild(btn);
}

// --- 8. SPLIT PAYMENT LOGIC ---
// --- 8. SPLIT MODAL LOGIC ---
/**
 * Opens the Split Payment Modal.
 * @param {number} total - The total bill amount.
 */
window.openSplitModal = function (total) {
    const modal = document.getElementById('split-modal');
    document.getElementById('sp-bill-total').innerText = "₹" + total.toFixed(2);

    const input = document.getElementById('split-cash-input');
    input.value = '';

    document.getElementById('sp-balance-display').innerText = "₹" + total.toFixed(2);
    document.getElementById('confirm-split-btn').disabled = true;

    modal.classList.remove('d-none');
    input.focus();
}

/**
 * Closes the Split Payment Modal.
 */
window.closeSplitModal = function () {
    document.getElementById('split-modal').classList.add('d-none');
    resetMainButton();
}

/**
 * Calculates the balance amount for online payment in a split scenario.
 */
window.calculateSplit = function () {
    const total = pendingTotalAmount;
    const cash = parseFloat(document.getElementById('split-cash-input').value) || 0;
    const balance = total - cash;
    const balanceEl = document.getElementById('sp-balance-display');
    const btn = document.getElementById('confirm-split-btn');

    if (balance > 0) {
        balanceEl.innerText = "₹" + balance.toFixed(2);
        balanceEl.style.color = "var(--accent-green)";

        // Allow if cash > 0 and cash < total (Real Split)
        if (cash > 0 && cash < total) {
            btn.disabled = false;
        } else {
            btn.disabled = true; // Full cash or Full online should use those methods
        }
    } else {
        balanceEl.innerText = "Invalid Amount";
        balanceEl.style.color = "red";
        btn.disabled = true;
    }
}

/**
 * Finalizes the Split payment (starts the online part).
 */
window.submitSplitPayment = function () {
    const total = pendingTotalAmount;
    const cash = parseFloat(document.getElementById('split-cash-input').value);
    const online = total - cash;

    document.getElementById('split-modal').classList.add('d-none');
    processSplitOnlinePayment(total, cash, online);
}

// --- 9. PROCESSORS & DATABASE SAVING ---

// A. Offline (Cash/Card)
/**
 * Processes offline payments (Cash, Card Machine).
 * Saves order to DB and shows success.
 */
async function processOfflinePayment(total, cashGiven, change) {
    // 1. Save to DB
    const orderId = await saveOrderToDB(selectedPaymentMethod, total, cashGiven, change);

    // 2. Show Success
    if (orderId) {
        const displayId = `ORD-#${orderId}`;
        showSuccessModal(selectedPaymentMethod, total, displayId, cashGiven, change);
    } else {
        alert("CRITICAL ERROR: Order could not be saved to database. Please retry or contact support.");
    }
}

// B. Online (Full)
/**
 * Initiates valid online payment via Razorpay.
 */
function processOnlinePayment(amount) {
    const options = {
        "key": RAZORPAY_KEY,
        "amount": (amount * 100).toFixed(0),
        "currency": "INR",
        "name": "RestoFlow",
        "description": "Order Payment",
        "handler": async function (response) {
            const orderId = await saveOrderToDB("Online (Razorpay)", amount, 0, 0);
            showSuccessModal("Online", amount, `ORD-#${orderId}`, 0, 0);
        },
        "modal": { "ondismiss": () => resetMainButton() }
    };
    const rzp = new Razorpay(options);
    rzp.open();
}

// C. Split (Online Part)
/**
 * Specific handler for Split payments (Cash + Online).
 */
function processSplitOnlinePayment(total, cashPart, onlinePart) {
    const options = {
        "key": RAZORPAY_KEY,
        "amount": (onlinePart * 100).toFixed(0), // Balance only
        "currency": "INR",
        "name": "RestoFlow Split",
        "description": `Split: Cash(${cashPart}) + Online`,
        "handler": async function (response) {
            const methodStr = `Split: Cash(₹${cashPart}) & UPI`;
            const orderId = await saveOrderToDB(methodStr, total, cashPart, 0);
            showSuccessModal(methodStr, total, `ORD-#${orderId}`, cashPart, 0);
        },
        "modal": { "ondismiss": () => resetMainButton() }
    };
    const rzp = new Razorpay(options);
    rzp.open();
}

// --- 10. DATABASE FUNCTION (SUPABASE) ---
/**
 * Saves the authenticated order to Supabase.
 * Returns the new Order ID.
 */
async function saveOrderToDB(method, total, cashGiven, change) {
    console.log("Saving to Supabase...");

    // 1. Insert Order Header
    const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
            payment_method: method,
            total_amount: total,
            cash_given: cashGiven,
            change_returned: change,
            order_type: selectedOrderType
        }])
        .select();

    if (orderError) {
        console.error("DB Error details:", JSON.stringify(orderError));
        alert("Database Error: " + (orderError.message || orderError.details || "Unknown error"));
        return null;
    }

    const newOrderId = orderData[0].id;

    // 2. Insert Items
    const orderItems = cart.map(item => ({
        order_id: newOrderId,
        product_name: item.name,
        price: item.price,
        qty: item.qty
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

    if (itemsError) {
        console.error("Items Error:", itemsError);
        alert("Warning: Order placed but items failed to save! " + itemsError.message);
    }

    return newOrderId;
}

// --- 11. FINAL SUCCESS MODAL ---
/**
 * Displays the final Success Modal with order details.
 */
function showSuccessModal(method, amount, txId, cashGiven, change) {
    // Store for printing
    lastOrderId = txId;
    document.getElementById('modal-method').innerText = method;
    document.getElementById('modal-amount').innerText = "₹" + amount.toFixed(2);
    document.getElementById('modal-id').innerText = txId;

    const rowCash = document.getElementById('row-cash-given');
    const rowChange = document.getElementById('row-change');

    if (cashGiven > 0) {
        rowCash.classList.remove('d-none');
        rowChange.classList.remove('d-none');
        document.getElementById('modal-cash-given').innerText = "₹" + cashGiven.toFixed(2);
        document.getElementById('modal-change').innerText = "₹" + change.toFixed(2);
    } else {
        rowCash.classList.add('d-none');
        rowChange.classList.add('d-none');
    }

    document.getElementById('success-modal').classList.remove('d-none');
}

/**
 * Generates and prints a thermal-style receipt.
 */
window.printReceipt = function () {
    if (!lastOrderId) return alert("No order to print!");

    const date = new Date().toLocaleString();
    let itemsHtml = '';

    cart.forEach(item => {
        itemsHtml += `
            <tr>
                <td>${item.name}</td>
                <td>${item.qty}</td>
                <td>₹${(item.price * item.qty).toFixed(2)}</td>
            </tr>
        `;
    });

    const tax = pendingTotalAmount - (pendingTotalAmount / 1.05); // Back-calculate for display if needed or use stored
    // For simplicity using the UI values or recalculating:
    const subtotal = pendingTotalAmount / 1.05;

    // Get values from modal for accuracy (since they are there)
    const method = document.getElementById('modal-method').innerText;
    const amount = document.getElementById('modal-amount').innerText;
    const cashGiven = document.getElementById('modal-cash-given').innerText;
    const change = document.getElementById('modal-change').innerText;

    const receiptContent = `
        <html>
        <head>
            <title>Receipt - RestoFlow</title>
            <style>
                body { font-family: 'Courier New', monospace; width: 300px; padding: 10px; font-size: 12px; }
                .center { text-align: center; }
                .bold { font-weight: bold; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                td { padding: 4px 0; }
                .right { text-align: right; }
                .line { border-top: 1px dashed #000; margin: 10px 0; }
                .header { font-size: 1.2rem; font-weight: bold; margin-bottom: 5px; }
            </style>
        </head>
        <body>
            <div class="center">
                <div class="header">RestoFlow POS</div>
                <div> Kothrud, Pune</div>
                <div>Ph: 1234567890</div>
                <div class="line"></div>
                <div class="bold">Receipt</div>
                <div>${date}</div>
                <div class="bold">Order: ${lastOrderId}</div>
            </div>

            <div class="line"></div>

            <table>
                <thead>
                    <tr style="border-bottom: 1px solid #000;">
                        <td style="text-align:left">Item</td>
                        <td style="text-align:center">Qty</td>
                        <td class="right">Amt</td>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>

            <div class="line"></div>

            <table>
                <tr>
                    <td>Subtotal:</td>
                    <td class="right bold">₹${subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                    <td>Tax:</td>
                    <td class="right bold">₹${tax.toFixed(2)}</td>
                </tr>
</table>
            <div class="line"></div>
<table>
                <tr>
                    <td>Total:</td>
                    <td class="right bold">₹${(Number(String(amount).replace(/[^0-9.]/g, '')) || 0).toFixed(2)}</td>
                </tr>
                <tr>
                    <td>Payment Method:</td>
                    <td class="right">${method}</td>
                </tr>
            </table>

            <div class="center" style="margin-top: 20px;">
                *** Thank You! ***
            </div>
            
            <script>
                window.print();
                window.onafterprint = function() { window.close(); };
            </script>
        </body>
        </html>
    `;

    const printWindow = window.open('', '', 'height=600,width=400');
    printWindow.document.write(receiptContent);
    printWindow.document.close();
}

/**
 * Clears the cart and redirects back to the main POS.
 */
window.finalizeOrder = function () {
    localStorage.removeItem('cart'); // Clear cart
    window.location.href = 'index.html'; // Go Home
}

// Helper to unlock button
/**
 * Helper to re-enable the main pay button if canceled.
 */
function resetMainButton() {
    const btn = document.getElementById('confirm-btn');
    btn.disabled = false;
    btn.innerText = `Confirm & Pay ₹${pendingTotalAmount.toFixed(2)}`;
}