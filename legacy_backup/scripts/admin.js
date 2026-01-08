
// --- CONFIGURATION ---
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_KEY';
var supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// --- STATE ---
let adminProducts = [];
let adminOrders = [];

// --- AUTHENTICATION ---
document.addEventListener('DOMContentLoaded', () => {
    const passInput = document.getElementById('admin-pass');
    if (passInput) {
        passInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                checkLogin();
            }
        });
    }
});

/**
 * Validates the admin password.
 * Unlocks the dashboard on success.
 */
function checkLogin() {
    const passInput = document.getElementById('admin-pass');
    const errorMsg = document.getElementById('login-error');
    const overlay = document.getElementById('login-overlay');
    const app = document.getElementById('admin-app');

    const enteredPass = passInput.value.trim();

    // Simple hardcoded check for MVP
    if (enteredPass === 'admin123') {
        overlay.classList.add('d-none');
        app.classList.remove('d-none');
        // Initialize Data
        fetchAdminProducts();
    } else {
        errorMsg.classList.remove('d-none');
        // optional: shake animation or clear input
    }
}

/**
 * Handles admin logout by reloading the page (clearing state).
 */
function logout() {
    location.reload(); // Simple logout
}

// --- NAVIGATION ---
/**
 * Switches between admin dashboard sections.
 * @param {string} sectionId - The ID section to show ('menu' or 'orders').
 */
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(s => s.classList.add('d-none'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));

    // Deactivate nav buttons
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    // Show target
    document.getElementById('section-' + sectionId).classList.remove('d-none');
    document.getElementById('section-' + sectionId).classList.add('active');

    // Activate button (simple logic based on onclick binding context not being direct, 
    // so we just find by text or index. For now manual toggling is fine or we improve later)
    // Actually, let's just re-fetch if needed
    if (sectionId === 'orders') {
        fetchOrders();
    }
}

// --- MENU MANAGEMENT ---
/**
 * Fetches the current menu products for editing.
 */
async function fetchAdminProducts() {
    console.log("Fetching products for admin...");
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
        alert("Error fetching menu: " + error.message);
    } else {
        adminProducts = data;
        renderAdminMenu();
    }
}

/**
 * Renders the tabular view of products with Edit/Delete actions.
 */
function renderAdminMenu() {
    const list = document.getElementById('admin-menu-list');
    list.innerHTML = adminProducts.map(p => `
        <tr>
            <td><img src="${p.img}" class="admin-img" alt="img"></td>
            <td><strong>${p.name}</strong></td>
            <td>${p.category}</td>
            <td>₹${p.price.toFixed(2)}</td>
            <td>
                <button class="action-btn edit" onclick="openEditModal(${p.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete" onclick="deleteProduct(${p.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// ADD / EDIT ITEM
/**
 * Opens the 'Add New Item' modal with empty fields.
 */
function openAddModal() {
    document.getElementById('add-modal').classList.remove('d-none');
    document.getElementById('modal-title').innerText = "Add New Item";
    document.getElementById('edit-id').value = ""; // Clear ID
    document.getElementById('btn-save').innerText = "Add Item";

    // Clear inputs
    document.getElementById('new-name').value = '';
    document.getElementById('new-price').value = '';
    document.getElementById('new-img').value = '';
}

/**
 * Opens the 'Edit Item' modal pre-filled with product details.
 * @param {number} id - Product ID to edit.
 */
function openEditModal(id) {
    const product = adminProducts.find(p => p.id === id);
    if (!product) return;

    document.getElementById('add-modal').classList.remove('d-none');
    document.getElementById('modal-title').innerText = "Edit Item";
    document.getElementById('edit-id').value = product.id; // Set ID
    document.getElementById('btn-save').innerText = "Update Item";

    // Fill inputs
    document.getElementById('new-name').value = product.name;
    document.getElementById('new-category').value = product.category;
    document.getElementById('new-price').value = product.price;
    document.getElementById('new-img').value = product.img;
}

/**
 * Closes the Add/Edit modal.
 */
function closeAddModal() {
    document.getElementById('add-modal').classList.add('d-none');
}

/**
 * Saves the product (Insert or Update) based on presence of ID.
 */
async function saveProduct() {
    const id = document.getElementById('edit-id').value;
    const name = document.getElementById('new-name').value;
    const category = document.getElementById('new-category').value;
    const price = parseFloat(document.getElementById('new-price').value);
    const img = document.getElementById('new-img').value || 'https://placehold.co/200';

    if (!name || !price) {
        alert("Please fill in Name and Price");
        return;
    }

    let error = null;

    if (id) {
        // UPDATE EXISTING
        const { error: updateError } = await supabase
            .from('products')
            .update({ name, category, price, img })
            .eq('id', id);
        error = updateError;
    } else {
        // INSERT NEW
        const { error: insertError } = await supabase
            .from('products')
            .insert([{ name, category, price, img }]);
        error = insertError;
    }

    if (error) {
        alert("Error saving: " + error.message);
    } else {
        // Close form
        closeAddModal();
        // Show Success Modal
        const successMsg = id ? "Item updated successfully." : "Item added to menu successfully.";
        document.querySelector('#success-modal p').innerText = successMsg;
        document.getElementById('success-modal').classList.remove('d-none');

        // Refresh Data
        fetchAdminProducts();
    }
}

/**
 * Closes the success confirmation modal.
 */
function closeSuccessModal() {
    document.getElementById('success-modal').classList.add('d-none');
}

/**
 * Deletes a product from the database after confirmation.
 * @param {number} id - Product ID to delete.
 */
async function deleteProduct(id) {
    if (!confirm("Are you sure you want to delete this item?")) return;

    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

    if (error) {
        alert("Error deleting: " + error.message);
    } else {
        fetchAdminProducts(); // Refresh
    }
}

// --- ORDER HISTORY ---
// --- ORDER HISTORY ---
/**
 * Fetches full order history including line items.
 * Joins 'orders' and 'order_items' data manually.
 */
async function fetchOrders() {
    const btnIcon = document.querySelector('#refresh-orders-btn i');
    if (btnIcon) btnIcon.classList.add('fa-spin');

    console.log("Fetching orders (robust mode)...");

    // 1. Fetch Orders
    const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

    if (ordersError) {
        alert("Error loading orders: " + ordersError.message);
        if (btnIcon) btnIcon.classList.remove('fa-spin');
        return;
    }

    if (!orders || orders.length === 0) {
        adminOrders = [];
        renderOrders(false);
        return;
    }

    // 2. Fetch Order Items for these orders
    const orderIds = orders.map(o => o.id);
    const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds);

    if (itemsError) {
        console.warn("Could not load details:", itemsError);
        // Still render orders, just without details
        adminOrders = orders;
        renderOrders(false);
        return;
    }

    // 3. Join in memory
    // Create a map for faster lookup
    // Structure: { order_id: [item1, item2] }
    const itemsMap = {};
    items.forEach(item => {
        if (!itemsMap[item.order_id]) itemsMap[item.order_id] = [];
        itemsMap[item.order_id].push(item);
    });

    // Attach items to orders
    adminOrders = orders.map(order => ({
        ...order,
        order_items: itemsMap[order.id] || []
    }));

    renderOrders(true);
    if (btnIcon) btnIcon.classList.remove('fa-spin');
}

/**
 * Renders the order history table.
 * @param {boolean} hasItems - Whether line item details are available.
 */
function renderOrders(hasItems) {
    const list = document.getElementById('admin-order-list');
    if (adminOrders.length === 0) {
        list.innerHTML = "<tr><td colspan='5'>No orders found.</td></tr>";
        return;
    }

    list.innerHTML = adminOrders.map(o => {
        let itemsDesc = "Details unavail using simple mode";
        if (hasItems && o.order_items) {
            itemsDesc = o.order_items.map(i => `${i.qty}x ${i.product_name}`).join(', ');
        }

        const date = new Date(o.created_at).toLocaleString();

        return `
        <tr>
            <td>#${o.id}</td>
            <td>${date}</td>
            <td>${o.payment_method}</td>
            <td><strong>₹${o.total_amount.toFixed(2)}</strong></td>
            <td style="font-size:0.85rem; color:#666;">${itemsDesc}</td>
        </tr>
    `;
    }).join('');
}
