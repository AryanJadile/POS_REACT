// SECURITY CHECK
// SECURITY CHECK
if (!localStorage.getItem('chef_auth')) {
    window.location.href = 'index.html';
}

// CONFIGURATION
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_KEY';
var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const grid = document.getElementById('kitchen-grid');
const bell = document.getElementById('bell-sound');

// Debug Helper
/**
 * Debug helper to print messages to console.
 */
function logToScreen(msg) {
    console.log(msg);
}

// 0. INITIAL LOAD (Load recent orders so screen isn't empty)
fetchRecentOrders();

/**
 * Fetches the 20 most recent pending orders on initial load.
 * Populates the kitchen grid.
 */
async function fetchRecentOrders() {
    logToScreen("Fetching recent orders...");
    const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .neq('status', 'done') // Only fetch pending orders
        .order('created_at', { ascending: true })
        .limit(20);

    if (error) {
        logToScreen("Error fetching orders: " + error.message);
        return;
    }

    if (orders) {
        // Reverse to show oldest first in the grid (if that's the style) or just iterate
        // Prepending new ones means we want newest at top?
        // Let's just render them.
        for (const order of orders) {
            // We need items for each. This might be heavy but okay for MVP.
            // Actually, let's just fetch details for each.
            fetchOrderDetails(order.id);
        }
    }
}

// 1. LISTEN FOR NEW ORDERS
supabase
    .channel('kitchen-orders')
    .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
            logToScreen('EVENT RECEIVED: ' + JSON.stringify(payload.new));
            playNotification();
            fetchOrderDetails(payload.new.id);
        }
    )
    .subscribe((status) => {
        logToScreen("Channel Status: " + status);
        if (status === 'SUBSCRIBED') {
            const indicator = document.querySelector('.live-indicator');
            if (indicator) {
                indicator.innerText = "● LIVE (Connected)";
                indicator.style.color = "white";
            }
        }
    });

// Audio Unlock
/**
 * Enables audio playback (workaround for browser autoplay policies).
 */
window.enableSound = function () {
    const btn = document.getElementById('sound-btn');
    bell.play().then(() => {
        btn.innerText = "🔊 Sound Enabled";
        btn.style.background = "#4ade80";
        btn.style.color = "black";
    }).catch(e => {
        logToScreen("Audio error: " + e.message);
    });
}

/**
 * Opens the logout confirmation modal.
 */
window.logoutChef = function () {
    const modal = document.getElementById('logout-modal');
    modal.style.display = 'flex';
}

/**
 * Closes the logout confirmation modal.
 */
window.closeLogoutModal = function () {
    document.getElementById('logout-modal').style.display = 'none';
}

/**
 * Clears authentication token and redirects to login/home.
 */
window.confirmLogout = function () {
    localStorage.removeItem('chef_auth');
    window.location.href = 'index.html';
}

// 2. FETCH DETAILS (Get the food list for the new order)
/**
 * Fetches the line items (product details) for a specific order.
 * delays slightly to ensure database consistency.
 * @param {string} orderId - The ID of the order to fetch details for.
 */
async function fetchOrderDetails(orderId) {
    // Wait 500ms to ensure 'order_items' are saved in DB by the Checkout page
    setTimeout(async () => {
        const { data: items, error } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', orderId);

        if (items) {
            renderTicket(orderId, items);
        }
    }, 1000);
}

// 3. RENDER TICKET (Draw the card)
/**
 * Creates and appends a visual ticket (order card) to the grid.
 * @param {string} id - The order ID.
 * @param {Array} items - List of items in the order.
 */
function renderTicket(id, items) {
    // Remove "Waiting..." text if it exists
    if (grid.innerHTML.includes('<p')) grid.innerHTML = '';

    const div = document.createElement('div');
    div.className = 'order-card';
    div.id = `card-${id}`;

    // Build the food list HTML
    const itemsHtml = items.map(item => `
        <div class="order-item">
            <div><span class="qty-badge">${item.qty}x</span> ${item.product_name}</div>
        </div>
    `).join('');

    div.innerHTML = `
        <div class="order-header">
            <span>ORD #${id}</span>
            <span class="time-ago">Just Now</span>
        </div>
        <div class="items-list">
            ${itemsHtml}
        </div>
        <button class="action-btn" onclick="markDone(${id})">MARK DONE</button>
    `;

    // Add to the START of the grid (Newest first)
    grid.prepend(div);
}

// 4. HELPER: Play Sound
/**
 * Plays the notification chime sound.
 */
function playNotification() {
    // Browsers block auto-play, so this works best after user has clicked once on the page
    bell.play().catch(e => console.log("Click page to enable sound!"));
}

// 5. HELPER: Remove Ticket
// 5. HELPER: Remove Ticket
/**
 * Marks an order as 'done' in the database and removes it from the screen.
 * @param {string} id - The order ID to complete.
 */
window.markDone = async function (id) {
    // 1. Visually remove immediately for responsiveness
    const card = document.getElementById(`card-${id}`);
    if (card) {
        card.style.opacity = '0.5';
        card.style.transform = 'scale(0.9)';
    }

    // 2. Update Database
    const { error } = await supabase
        .from('orders')
        .update({ status: 'done' })
        .eq('id', id);

    if (error) {
        alert("Error updating order: " + error.message);
        // Revert visual change if needed, but let's just keep it simple
        if (card) card.style.opacity = '1';
    } else {
        // 3. Fully remove from DOM after success
        setTimeout(() => { if (card) card.remove() }, 300);
    }
}