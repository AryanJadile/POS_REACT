// --- DATABASE CONFIGURATION ---
// 1. Initialize Supabase Client
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_KEY';
var supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// 2. Define products as an empty global array initially
let products = [];

// 3. Function to Fetch Data from Database
/**
 * Fetches the product list from the Supabase database.
 * Updates the global 'products' array and renders the grid.
 */
async function fetchProducts() {
    console.log("Fetching menu from Supabase...");

    // Select all columns (*) from 'products' table, ordered by ID
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
        console.error("Error loading products:", error);
        // Fallback or Alert
        const container = document.getElementById('product-container');
        if (container) container.innerHTML = "<p>Error loading menu. Please try again.</p>";
    } else {
        console.log("Menu loaded:", data.length, "items");
        products = data; // Update global variable
        displayProducts(products); // Render to screen
    }
}

// 4. Initialize App
document.addEventListener('DOMContentLoaded', () => {
    // Only fetch products if we are on the main page (where product-container exists)
    if (document.getElementById('product-container')) {
        fetchProducts();
    }

    // Check local storage for cart (Existing logic)
    updateCartUI();
});

// async function fetchProducts() {
//     console.log("Fetching menu...");
//     const { data, error } = await supabase
//         .from('products')
//         .select('*');

//     if (error) {
//         alert("Database Error: " + error.message);
//     } else {
//         // alert("Success! Found " + data.length + " items"); 
//         products = data;
//         displayProducts(products);
//     }
// }

// --- DEBUG SEARCH LOGIC ---

const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');

// 1. CLICK LISTENER
if (searchBtn) {
    searchBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log("Search Button Clicked!");

        const isOpen = searchInput.classList.contains('active');
        console.log("Is Search Bar Open?", isOpen);

        if (!isOpen) {
            console.log("Opening Search Bar...");
            searchInput.classList.add('active');
            searchInput.focus();
        } else {
            const term = searchInput.value;
            console.log("Search Bar is open. Current text:", term);

            if (term.trim() === "") {
                console.log("Input empty. Closing...");
                searchInput.classList.remove('active');
            } else {
                console.log("Text found. Executing search...");
                performSearch(term);
            }
        }
    });
} else {
    console.error("ERROR: Could not find element with ID 'search-btn'");
}

if (searchInput) {
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            console.log("Enter key pressed!");
            performSearch(searchInput.value);
        }
    });
} else {
    console.error("ERROR: Could not find element with ID 'search-input'");
}

document.addEventListener('click', (e) => {
    if (searchInput && searchBtn) {
        if (e.target !== searchInput && !searchBtn.contains(e.target)) {
            if (searchInput.classList.contains('active')) {
                console.log("Clicked outside. Closing search...");
                searchInput.classList.remove('active');
            }
        }
    }
});

/**
 * Performs a search on the client-side 'products' array.
 * Filters by name or category and updates the display.
 * @param {string} term - The search query.
 */
function performSearch(term) {
    console.log("Running Search Logic for:", term);

    if (typeof products === 'undefined' || !products) {
        console.error("CRITICAL ERROR: 'products' array is missing!");
        return;
    }

    const lowerTerm = term.toLowerCase().trim();

    const searchResults = products.filter(product => {
        return product.name.toLowerCase().includes(lowerTerm) ||
            product.category.toLowerCase().includes(lowerTerm);
    });

    console.log("Results found:", searchResults.length);

    if (searchResults.length > 0) {
        displayProducts(searchResults);
    } else {
        const productContainer = document.getElementById('product-container');
        productContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; margin-top: 50px;">
                <p>No matches for "<b>${term}</b>"</p>
                <button onclick="displayProducts(products)" style="padding:5px 10px; margin-top:10px; cursor:pointer;">Clear Search</button>
            </div>
        `;
    }
}

// State to hold cart items
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// DOM Elements
const productContainer = document.getElementById('product-container');
const cartItemsContainer = document.getElementById('cart-items');
const subtotalEl = document.getElementById('subtotal-price');
const taxEl = document.getElementById('tax-price');

// 2. RENDER PRODUCTS: Display items on the page
/**
 * Renders the product cards into the main container.
 * @param {Array} items - The list of products to display. Defaults to all products.
 */
function displayProducts(items = products) {
    if (!productContainer) return;
    productContainer.innerHTML = items.map(product => `
        <div class="card" onclick="addToCart(${product.id})">
            <img src="${product.img}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p class="price">₹${product.price.toFixed(2)}</p>
        </div>
    `).join('');
}

/**
 * Adds a product to the cart or increments its quantity if already exists.
 * @param {number} id - The ID of the product to add.
 */
function addToCart(id) {
    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        existingItem.qty++;
    } else {
        const product = products.find(p => p.id === id);
        cart.push({ ...product, qty: 1 });
    }

    saveCart();
    updateCartUI();
    openCartDrawer();
}

/**
 * Persists the current cart state to localStorage.
 */
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

/**
 * Updates the cart sidebar UI with current items.
 * Calculates line totals and manages empty state.
 */
function updateCartUI() {
    if (!cartItemsContainer) return;
    cartItemsContainer.innerHTML = "";

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = "<p class='empty-cart-msg'>Cart is empty</p>";
        updateTotals();
        return;
    }

    cart.forEach(item => {
        const cartItemEl = document.createElement('div');
        cartItemEl.classList.add('cart-item');

        cartItemEl.innerHTML = `
            <img src="${item.img}" alt="${item.name}">
            <div class="item-details">
                <span class="item-name">${item.name}</span>
                <span class="item-price">@ ₹${item.price.toFixed(2)}</span>
            </div>
            <div class="qty-control">
                <button class="qty-btn" onclick="changeQty(${item.id}, -1)">-</button>
                <span class="qty-count">${item.qty}</span>
                <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
            </div>
            <span class="item-total">₹${(item.price * item.qty).toFixed(2)}</span>
        `;

        cartItemsContainer.appendChild(cartItemEl);
    });

    updateTotals();
}

/**
 * Changes variables for a cart item (increment/decrement).
 * Removes the item if quantity drops to zero.
 * @param {number} id - Product ID.
 * @param {number} change - +1 or -1.
 */
function changeQty(id, change) {
    const item = cart.find(i => i.id === id);

    if (item) {
        item.qty += change;

        if (item.qty <= 0) {
            cart = cart.filter(i => i.id !== id);
        }
    }

    saveCart();
    updateCartUI();
}

/**
 * Calculates and updates the subtotal and tax fields in the cart drawer.
 */
function updateTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const tax = subtotal * 0.05; // 5% Tax example (optional)

    subtotalEl.innerText = `₹${subtotal.toFixed(2)}`;
    taxEl.innerText = `₹${tax.toFixed(2)}`;
}

/**
 * Filters the displayed products by a specific category.
 * @param {string} category - The category name or 'all'.
 */
function filterProducts(category) {
    if (category === 'all') {
        displayProducts(products);
    } else {
        const filteredItems = products.filter(item => item.category === category);
        displayProducts(filteredItems);
    }

    const drawer = document.getElementById('cat-drawer');
    if (drawer) {
        drawer.classList.remove('open');
    }
}

/**
 * Toggles the visibility of the category filter drawer (mobile/tablet).
 */
function toggleCategoryMenu() {
    const drawer = document.getElementById('cat-drawer');
    drawer.classList.toggle('open');
    if (!drawer.classList.contains('open')) {
        filterProducts('all');
    }
}

// Initial Render
if (productContainer) {
    displayProducts();
}
updateCartUI(); // Restore cart UI on load

// Cart Drawer Logic
const cartToggleBtn = document.getElementById('cart-toggle');
const cartCloseBtn = document.getElementById('cart-close');
const cartSection = document.querySelector('.cart-section');

/**
 * Opens the cart drawer and hides the toggle button.
 */
function openCartDrawer() {
    if (cartSection) cartSection.classList.add('show');
    if (cartToggleBtn) cartToggleBtn.classList.add('d-none');
}

/**
 * Closes the cart drawer and shows the toggle button.
 */
function closeCartDrawer() {
    if (cartSection) cartSection.classList.remove('show');
    if (cartToggleBtn) cartToggleBtn.classList.remove('d-none');
}

if (cartToggleBtn) {
    cartToggleBtn.addEventListener('click', openCartDrawer);
}

if (cartCloseBtn) {
    cartCloseBtn.addEventListener('click', closeCartDrawer);
}



// Checkout Button in Sidebar (index.html)
const sidebarCheckoutBtn = document.querySelector('.checkout-btn');
if (sidebarCheckoutBtn) {
    sidebarCheckoutBtn.addEventListener('click', () => {
        if (cart.length > 0) {
            window.location.href = 'checkout.html';
        } else {
            alert("Cart is empty!");
        }
    });
}

// --- NAVIGATION SIDEBAR LOGIC ---
const navDrawer = document.getElementById('nav-drawer');
const navOverlay = document.getElementById('nav-overlay');
const menuBtn = document.querySelector('.menu-btn');
const navCloseBtn = document.getElementById('nav-close');

/**
 * Opens the main navigation drawer.
 */
function openNav() {
    navDrawer.classList.add('open');
    navOverlay.classList.add('open');
}

/**
 * Closes the main navigation drawer.
 */
function closeNav() {
    navDrawer.classList.remove('open');
    navOverlay.classList.remove('open');
}

if (menuBtn) {
    menuBtn.addEventListener('click', openNav);
}

if (navCloseBtn) {
    navCloseBtn.addEventListener('click', closeNav);
}

if (navOverlay) {
    navOverlay.addEventListener('click', closeNav);
}

// --- CHEF AUTHENTICATION ---
/**
 * Opens the chef login modal. 
 * Checks for existing session first.
 */
function openChefLogin() {
    closeNav(); // Close the drawer first

    // Check if already logged in this session
    if (localStorage.getItem('chef_auth') === 'true') {
        window.open('kitchen.html', '_blank');
        return;
    }

    const modal = document.getElementById('chef-login-overlay');
    const input = document.getElementById('chef-pass');
    input.value = '';
    document.getElementById('chef-login-error').classList.add('d-none');

    modal.classList.remove('d-none');
    modal.style.display = 'flex'; // Ensure flex for centering (if class 'd-none' toggles display:none)
    input.focus();
}

/**
 * Closes the chef login modal.
 */
function closeChefLogin() {
    document.getElementById('chef-login-overlay').classList.add('d-none');
}

/**
 * Validates the chef password.
 * On success, sets auth flag and opens kitchen view.
 */
function checkChefLogin() {
    const pass = document.getElementById('chef-pass').value;
    const errorMsg = document.getElementById('chef-login-error');

    if (pass === 'chef123') {
        // Success
        localStorage.setItem('chef_auth', 'true');
        closeChefLogin();
        // Redirect to new page (New Tab)
        window.open('kitchen.html', '_blank');
    } else {
        // Fail
        errorMsg.classList.remove('d-none');
        document.getElementById('chef-pass').value = '';
        document.getElementById('chef-pass').focus();
    }
}

// Add Enter key support for chef login
document.getElementById('chef-pass')?.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        checkChefLogin();
    }
});
