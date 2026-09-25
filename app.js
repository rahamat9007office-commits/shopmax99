/* =========================================================
   SHOPMAX99 - APP.JS
   Common Application / Navigation / Cart / Auth / Modals
========================================================= */

(function () {
    "use strict";

    const STORAGE = {
        cart: "shopmax99_cart",
        wishlist: "shopmax99_wishlist",
        user: "shopmax99_user",
        orders: "shopmax99_orders",
        sellers: "shopmax99_sellers",
        products: "shopmax99_products",
        transactions: "shopmax99_transactions"
    };

    window.ShopMax99 = window.ShopMax99 || {};

    /* =====================================================
       STORAGE HELPERS
    ====================================================== */

    function getData(key, fallback) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : fallback;
        } catch (error) {
            console.error("Storage read error:", error);
            return fallback;
        }
    }

    function setData(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error("Storage save error:", error);
        }
    }

    window.ShopMax99.storage = {
        get: getData,
        set: setData,
        keys: STORAGE
    };

    /* =====================================================
       SITE MAINTENANCE / PUBLIC ACCESS CONTROL
    ====================================================== */
    const MAINTENANCE_KEY = "shopmax99_site_maintenance";
    const MASTER_PASSKEY = "9007102062";

    function getMaintenanceState() {
        try {
            const raw = localStorage.getItem(MAINTENANCE_KEY);
            if (!raw) return { active: false };
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === "object"
                ? { active: Boolean(parsed.active), updatedAt: parsed.updatedAt || "" }
                : { active: false };
        } catch { return { active: false }; }
    }

    function isMaintenanceActive() { return getMaintenanceState().active === true; }

    function showMaintenanceScreen() {
        const screen = document.getElementById("shopmax99MaintenanceScreen");
        if (screen) screen.hidden = false;
    }

    function hideMaintenanceScreen() {
        const screen = document.getElementById("shopmax99MaintenanceScreen");
        if (screen) screen.hidden = true;
    }

    function applyMaintenanceState(role) {
        const publicRole = role === "customer" || role === "seller";
        if (isMaintenanceActive() && publicRole) showMaintenanceScreen();
        else hideMaintenanceScreen();
        document.body.classList.toggle("shopmax99-maintenance-active", isMaintenanceActive());
    }

    function setMaintenanceState(active) {
        localStorage.setItem(MAINTENANCE_KEY, JSON.stringify({
            active: Boolean(active),
            updatedAt: new Date().toISOString()
        }));
        applyMaintenanceState(window.ShopMax99.currentRole || "customer");
    }

    function openMaintenanceControl() {
        const modal = document.getElementById("maintenancePasskeyModal");
        const title = document.getElementById("maintenancePasskeyTitle");
        const text = document.getElementById("maintenancePasskeyText");
        const input = document.getElementById("maintenancePasskeyInput");
        if (!modal) { alert("Maintenance control is currently unavailable."); return; }
        const active = isMaintenanceActive();
        if (title) title.textContent = active ? "Enable ShopMax99" : "Put Site Under Maintenance";
        if (text) text.textContent = active
            ? "Enter the master passkey to bring customer and seller access back online."
            : "Enter the master passkey to disable customer and seller access.";
        if (input) input.value = "";
        modal.hidden = false;
        document.body.style.overflow = "hidden";
        setTimeout(() => input?.focus(), 30);
    }

    function verifyMaintenancePasskey(event) {
        event.preventDefault();
        const input = document.getElementById("maintenancePasskeyInput");
        const value = String(input?.value || "").trim();
        if (value !== MASTER_PASSKEY) {
            if (input) { input.value = ""; input.focus(); }
            alert("Incorrect master passkey.");
            return;
        }
        const next = !isMaintenanceActive();
        setMaintenanceState(next);
        const modal = document.getElementById("maintenancePasskeyModal");
        if (modal) modal.hidden = true;
        document.body.style.overflow = "";
        applyMaintenanceState(window.ShopMax99.currentRole || "admin");
        if (typeof window.ShopMax99?.showToast === "function") {
            window.ShopMax99.showToast(next ? "Site maintenance mode enabled." : "ShopMax99 is live again.");
        }
        if (typeof window.renderAdminDashboard === "function") window.renderAdminDashboard();
    }

    window.ShopMax99.maintenance = {
        key: MAINTENANCE_KEY,
        passkey: MASTER_PASSKEY,
        get: getMaintenanceState,
        isActive: isMaintenanceActive,
        set: setMaintenanceState,
        openControl: openMaintenanceControl,
        apply: applyMaintenanceState
    };

    window.addEventListener("storage", event => {
        if (event.key === MAINTENANCE_KEY) applyMaintenanceState(window.ShopMax99.currentRole || "customer");
    });

    // Maintenance screen staff-access fallback. This lives in app.js so the
    // button remains clickable even if bootstrap.js is loaded late/cached.
    document.addEventListener("click", function (event) {
        const button = event.target.closest("#maintenanceStaffAccessBtn");
        if (!button) return;
        event.preventDefault();
        event.stopPropagation();
        // Open the master gate above the full-screen maintenance layer.
        const passkeyModal = document.getElementById("masterPasskeyModal");
        const masterModal = document.getElementById("masterLoginModal");
        if (masterModal) masterModal.hidden = true;
        if (passkeyModal) {
            passkeyModal.hidden = false;
            passkeyModal.style.zIndex = "4000000";
            document.body.style.overflow = "hidden";
            setTimeout(() => document.getElementById("masterPasskeyInput")?.focus(), 30);
        }
        if (typeof window.openMasterLogin === "function") {
            window.openMasterLogin();
        } else if (typeof window.__openShopMax99MasterPasskey === "function") {
            window.__openShopMax99MasterPasskey();
        } else {
            // Retry after the remaining scripts have initialized.
            setTimeout(() => {
                if (typeof window.openMasterLogin === "function") window.openMasterLogin();
                else if (typeof window.__openShopMax99MasterPasskey === "function") window.__openShopMax99MasterPasskey();
                else alert("Master login is currently unavailable.");
            }, 50);
        }
    }, true);

    document.addEventListener("DOMContentLoaded", () => {
        const form = document.getElementById("maintenancePasskeyForm");
        if (form && !form.dataset.bound) {
            form.dataset.bound = "1";
            form.addEventListener("submit", verifyMaintenancePasskey);
        }
    });

    /* =====================================================
       ONE-TIME SELLER / ADMIN DATA RESET
       Keeps the built-in / non-seller catalog listings, while
       removing previously saved seller accounts, seller-created
       listings/requests, and admin/seller login sessions.
    ====================================================== */

    function runFreshBuildResetOnce() {
        const RESET_KEY = "shopmax99_fresh_build_reset_v3";
        if (localStorage.getItem(RESET_KEY) === "done") return;

        // New ZIP/build = clean prototype state. Clear previous ShopMax99
        // local data, including maintenance mode, sessions, OTPs, carts,
        // seller/admin/customer records, settings and old request data.
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.toLowerCase().startsWith("shopmax99")) keysToRemove.push(key);
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        ["nestedProductRequests"].forEach(key => localStorage.removeItem(key));

        // Make the first launch explicitly live. The normal demo catalog will
        // be seeded by the application scripts after this reset.
        localStorage.setItem(MAINTENANCE_KEY, JSON.stringify({ active: false, updatedAt: new Date().toISOString() }));
        localStorage.setItem(RESET_KEY, "done");
    }

    runFreshBuildResetOnce();

    function runSellerAdminDataResetOnce() {
        const RESET_KEY = "shopmax99_100kb_reset_v1";

        if (localStorage.getItem(RESET_KEY) === "done") {
            return;
        }

        const sellerKeys = [
            "shopmax99_sellers",
            "shopmax99Sellers",
            "shopmax99_seller_accounts",
            "shopmax99SellerAccounts"
        ];

        sellerKeys.forEach(key => localStorage.removeItem(key));

        // Legacy seller product storage used by earlier seller-module versions.
        localStorage.removeItem("shopmax99SellerProducts");

        // Remove seller/admin login sessions and OTP state.
        [
            "shopmax99_admin_session",
            "shopmax99_admin_login_otp",
            "shopmax99_seller_session",
            "shopmax99_seller_login_otp",
            "shopmax99SellerSession",
            "shopmax99SellerLoginOTP"
        ].forEach(key => localStorage.removeItem(key));

        // Preserve built-in catalog listings and any product that has
        // no seller ownership. Remove old seller-created listings.
        try {
            const rawProducts = localStorage.getItem(STORAGE.products);
            if (rawProducts) {
                const products = JSON.parse(rawProducts);
                if (Array.isArray(products)) {
                    const preserved = products.filter(product => {
                        if (!product || typeof product !== "object") return false;
                        return !product.sellerEmail && !product.sellerId;
                    });
                    if (preserved.length) {
                        localStorage.setItem(STORAGE.products, JSON.stringify(preserved));
                    } else {
                        // Let customer.js restore its built-in demo catalog.
                        localStorage.removeItem(STORAGE.products);
                    }
                }
            }
        } catch (error) {
            console.warn("ShopMax99 product reset warning:", error);
        }

        // Old pending/rejected product approval requests are seller data.
        localStorage.removeItem("nestedProductRequests");

        localStorage.setItem(RESET_KEY, "done");
    }

    runSellerAdminDataResetOnce();

    function ensureAllProductIds() {
        let products = getData(STORAGE.products, []);
        if (!Array.isArray(products)) products = [];
        const used = new Set();
        let changed = false;
        products = products.map(product => {
            const current = String(product?.id || "").trim();
            if (current && !used.has(current)) {
                used.add(current);
                return product;
            }
            let candidate;
            do {
                const token = (window.crypto && typeof window.crypto.randomUUID === "function")
                    ? window.crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()
                    : Math.random().toString(36).slice(2, 14).toUpperCase();
                candidate = `SM99-P-${Date.now().toString(36).toUpperCase()}-${token}`;
            } while (used.has(candidate));
            used.add(candidate);
            changed = true;
            return { ...product, id: candidate };
        });
        if (changed) setData(STORAGE.products, products);
        window.ShopMax99.ensureAllProductIds = ensureAllProductIds;
        return products;
    }

    ensureAllProductIds();


    /* =====================================================
       ELEMENT HELPERS
    ====================================================== */

    const $ = (selector, parent = document) =>
        parent.querySelector(selector);

    const $$ = (selector, parent = document) =>
        [...parent.querySelectorAll(selector)];


    /* =====================================================
       TOAST
    ====================================================== */

    function showToast(message, type = "success") {

        const container = $("#toastContainer");

        if (!container) return;

        const toast = document.createElement("div");

        toast.className = `toast ${type}`;

        let icon = "fa-circle-check";

        if (type === "error") {
            icon = "fa-circle-xmark";
        }

        if (type === "warning") {
            icon = "fa-triangle-exclamation";
        }

        toast.innerHTML = `
            <i class="fa-solid ${icon}"></i>
            <span>${escapeHTML(message)}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateX(15px)";

            setTimeout(() => toast.remove(), 200);
        }, 2800);
    }

    window.ShopMax99.showToast = showToast;


    /* =====================================================
       HTML ESCAPE
    ====================================================== */

    function escapeHTML(value) {

        if (value === null || value === undefined) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    window.ShopMax99.escapeHTML = escapeHTML;


    /* =====================================================
       LIGHT / DARK MODE
    ====================================================== */
    const THEME_KEY = "shopmax99_theme";

    function applyTheme(theme) {
        const dark = theme === "dark";
        document.documentElement.dataset.theme = dark ? "dark" : "light";
        document.body.classList.toggle("shopmax99-dark", dark);
        const icon = document.getElementById("themeToggleIcon");
        const button = document.getElementById("themeToggleBtn");
        if (icon) icon.className = dark ? "fa-solid fa-sun" : "fa-solid fa-moon";
        if (button) {
            button.title = dark ? "Switch to light mode" : "Switch to dark mode";
            button.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
        }
        localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
    }

    function initTheme() {
        const saved = localStorage.getItem(THEME_KEY);
        const theme = saved === "dark" ? "dark" : "light";
        applyTheme(theme);
        const button = document.getElementById("themeToggleBtn");
        if (button && !button.dataset.bound) {
            button.dataset.bound = "1";
            button.addEventListener("click", () => {
                const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
                applyTheme(next);
            });
        }
    }

    window.ShopMax99.theme = { get: () => document.documentElement.dataset.theme || "light", set: applyTheme };

    /* =====================================================
       MODALS
    ====================================================== */

    function openModal(id) {

        const modal = document.getElementById(id);

        if (!modal) return;

        modal.hidden = false;
        document.body.style.overflow = "hidden";
    }

    function closeModal(id) {

        const modal = document.getElementById(id);

        if (!modal) return;

        modal.hidden = true;

        const anyOpen = $$(".modal-overlay").some(modal => !modal.hidden);

        if (!anyOpen) {
            document.body.style.overflow = "";
        }
    }

    window.ShopMax99.openModal = openModal;
    window.ShopMax99.closeModal = closeModal;


    /* =====================================================
       ROLE SWITCHING
    ====================================================== */

    function showRole(role) {
    if (isMaintenanceActive() && (role === "customer" || role === "seller")) {
        const panels = ["customerApp", "sellerApp", "adminApp", "sellerSupportApp", "customerSupportApp"]
            .map(id => document.getElementById(id));
        panels.forEach(panel => { if (panel) { panel.hidden = true; panel.style.display = "none"; } });
        showMaintenanceScreen();
        window.ShopMax99.currentRole = role;
        return false;
    }

    hideMaintenanceScreen();
    // Never allow direct navigation to protected workspaces.
    if (role === "seller") {
        const session = getData(STORAGE.user, null);
        if (!session || session.role !== "seller" || !session.sellerId) {
            if (typeof window.openSellerLogin === "function") window.openSellerLogin();
            else openModal("sellerLoginModal");
            return false;
        }
    }
    if (role === "admin") {
        const adminSession = getData("shopmax99_admin_session", null);
        if (!adminSession || adminSession.role !== "admin") {
            if (typeof window.openAdminLogin === "function") window.openAdminLogin();
            else openModal("adminLoginModal");
            return false;
        }
    }
    if (role === "seller_support" || role === "customer_support") {
        const supportSession = getData("shopmax99_support_session", null);
        if (!supportSession || supportSession.role !== role) {
            if (typeof window.openSupportLogin === "function") window.openSupportLogin(role);
            return false;
        }
    }

    const customer = document.getElementById("customerApp");
    const seller = document.getElementById("sellerApp");
    const admin = document.getElementById("adminApp");
    const sellerSupport = document.getElementById("sellerSupportApp");
    const customerSupport = document.getElementById("customerSupportApp");

    // Sab roles ko completely hide karo
    [customer, seller, admin, sellerSupport, customerSupport].forEach(panel => {
        if (!panel) return;

        panel.hidden = true;
        panel.style.display = "none";
    });

    // Sirf selected role show karo
    let target = null;

    if (role === "customer") {
        target = customer;
    }

    if (role === "seller") {
        target = seller;
    }

    if (role === "admin") {
        target = admin;
    }
    if (role === "seller_support") {
        target = sellerSupport;
    }
    if (role === "customer_support") {
        target = customerSupport;
    }

    if (!target) return false;

    target.hidden = false;
    target.style.display = "";

    window.ShopMax99.currentRole = role;
    document.body.dataset.activeRole = role;

    // Page ko top par lao
    window.scrollTo({
        top: 0,
        behavior: "auto"
    });

    // Seller initialize
    if (
        role === "seller" &&
        typeof window.initSellerCenter === "function"
    ) {
        window.initSellerCenter();

        if (typeof window.showSellerPage === "function") {
            window.showSellerPage("dashboard");
        }
    }

    // Admin initialize
    if (
        role === "admin" &&
        typeof window.initAdminCenter === "function"
    ) {
        window.initAdminCenter();

        if (typeof window.showAdminPage === "function") {
            window.showAdminPage("dashboard");
        }
    }

    if (
        (role === "seller_support" || role === "customer_support") &&
        typeof window.ShopMax99.showSupport === "function"
    ) {
        // Support workspace is already rendered by the support module.
    }

    // Customer home
    if (
        role === "customer" &&
        typeof window.showCustomerPage === "function"
    ) {
        window.showCustomerPage("home");
    }

    applyMaintenanceState(role);
    return true;
}

// Expose role switcher to seller/admin authentication modules.
window.ShopMax99.showRole = showRole;

    /* =====================================================
       CUSTOMER PAGE NAVIGATION
    ====================================================== */

    function showCustomerPage(page) {

        const pages = $$(".customer-page");

        pages.forEach(section => {
            const isTarget = section.dataset.page === page;

            section.hidden = !isTarget;
            section.classList.toggle("active-page", isTarget);
        });

        $$(".customer-nav-item[data-customer-page]").forEach(item => {
            item.classList.toggle(
                "active",
                item.dataset.customerPage === page
            );
        });

        window.ShopMax99.currentCustomerPage = page;

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

        if (page === "cart" && typeof window.renderCart === "function") {
            window.renderCart();
        }

        if (
            page === "wishlist" &&
            typeof window.renderWishlist === "function"
        ) {
            window.renderWishlist();
        }

        if (
            page === "orders" &&
            typeof window.renderOrders === "function"
        ) {
            window.renderOrders();
        }
    }

    window.ShopMax99.showCustomerPage = showCustomerPage;


    /* =====================================================
       CART
    ====================================================== */

    function getStoreSettings() {
        const settings = getData("shopmax99_settings", {});
        return settings && typeof settings === "object" ? settings : {};
    }

    function getCustomerPrice(product) {
        const productPrice = Number(product?.customerPrice);
        if (Number.isFinite(productPrice) && productPrice > 0) return productPrice;
        const configured = Number(getStoreSettings().customerPrice);
        return Number.isFinite(configured) && configured > 0 ? configured : 99;
    }

    function getCart() {
        return getData(STORAGE.cart, []);
    }

    function saveCart(cart) {
        setData(STORAGE.cart, cart);
        updateCartCount();

        if (typeof window.renderCart === "function") {
            window.renderCart();
        }
    }

    function addToCart(product) {

        if (!product || !product.id) return;

        const cart = getCart();

        const existing = cart.find(
            item => String(item.id) === String(product.id)
        );

        if (existing) {
            existing.quantity = Number(existing.quantity || 1) + 1;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: getCustomerPrice(product),
                sellerPrice: Number(product.sellerPrice || 0),
                sellerEmail: product.sellerEmail || "",
                sellerId: product.sellerId || "",
                image: product.image || "",
                category: product.category || "",
                quantity: 1
            });
        }

        saveCart(cart);

        showToast("Product added to cart.");

        return cart;
    }

    function removeFromCart(productId) {

        let cart = getCart();

        cart = cart.filter(
            item => String(item.id) !== String(productId)
        );

        saveCart(cart);

        showToast("Product removed from cart.", "warning");
    }

    function changeCartQuantity(productId, amount) {

        const cart = getCart();

        const item = cart.find(
            product => String(product.id) === String(productId)
        );

        if (!item) return;

        item.quantity += amount;

        if (item.quantity <= 0) {
            removeFromCart(productId);
            return;
        }

        saveCart(cart);
    }

    function updateCartCount() {

        const cart = getCart();

        const count = cart.reduce(
            (total, item) => total + Number(item.quantity || 0),
            0
        );

        const ids = [
            "cartCount",
            "sidebarCartCount"
        ];

        ids.forEach(id => {
            const element = document.getElementById(id);

            if (element) {
                element.textContent = count;
            }
        });
    }

    window.ShopMax99.cart = {
        get: getCart,
        add: addToCart,
        remove: removeFromCart,
        changeQuantity: changeCartQuantity,
        save: saveCart
    };

    window.ShopMax99.user = {
        get: getUser
    };


    /* =====================================================
       WISHLIST COUNT
    ====================================================== */

    function getWishlist() {
        return getData(STORAGE.wishlist, []);
    }

    function updateWishlistCount() {

        const count = getWishlist().length;

        [
            "wishlistCount",
            "sidebarWishlistCount"
        ].forEach(id => {

            const element = document.getElementById(id);

            if (element) {
                element.textContent = count;
            }
        });
    }

    window.ShopMax99.wishlist = {
        get: getWishlist,
        save: function (items) {
            setData(STORAGE.wishlist, items);
            updateWishlistCount();
        }
    };


    /* =====================================================
       USER
    ====================================================== */

    function getUser() {
        return getData(STORAGE.user, null);
    }

    function updateUserUI() {

        const user = getUser();

        const name =
            user && user.name
                ? user.name
                : "Sign in";

        const sidebarName =
            user && user.name
                ? user.name
                : "ShopMax User";

        const profileName =
            user && user.name
                ? user.name
                : "ShopMax User";

        const email =
            user && user.email
                ? user.email
                : "Not logged in";

        const accountName = $("#accountName");
        const sidebarUserName = $("#sidebarUserName");
        const profileNameElement = $("#profileName");
        const profileEmail = $("#profileEmail");

        if (accountName) accountName.textContent = name;
        if (sidebarUserName) sidebarUserName.textContent = sidebarName;
        if (profileNameElement) profileNameElement.textContent = profileName;
        if (profileEmail) profileEmail.textContent = email;
    }


    /* =====================================================
       LOGIN FORM
    ====================================================== */

    function handleAuthSubmit(event) {

        event.preventDefault();

        const nameInput = $("#authName");
        const emailInput = $("#authEmail");

        const email = emailInput ? emailInput.value.trim() : "";
        const name =
            nameInput && nameInput.value.trim()
                ? nameInput.value.trim()
                : email.split("@")[0] || "ShopMax User";

        if (!email) {
            showToast("Please enter your email.", "error");
            return;
        }

        const user = {
            id: "CUS-" + Date.now(),
            name,
            email,
            createdAt: new Date().toISOString()
        };

        setData(STORAGE.user, user);

        updateUserUI();

        closeModal("authModal");

        showToast("Welcome to ShopMax99!");

        const form = $("#authForm");

        if (form) form.reset();
    }


    /* =====================================================
       SELLER REGISTRATION
    ====================================================== */

    function handleSellerRegistration(event) {

        event.preventDefault();

        const form = event.currentTarget;

        const formData = new FormData(form);

        const seller = {
            id: "SEL-" + Date.now(),

            fullName:
                formData.get("fullName")?.toString().trim(),

            shopName:
                formData.get("shopName")?.toString().trim(),

            email:
                formData.get("email")?.toString().trim(),

            phone:
                formData.get("phone")?.toString().trim(),

            address:
                formData.get("address")?.toString().trim(),

            status: "pending",

            createdAt: new Date().toISOString()
        };

        if (
            !seller.fullName ||
            !seller.shopName ||
            !seller.email ||
            !seller.phone ||
            !seller.address
        ) {
            showToast(
                "Please fill all seller registration fields.",
                "error"
            );

            return;
        }

        const sellers = getData(STORAGE.sellers, []);

        sellers.push(seller);

        setData(STORAGE.sellers, sellers);

        closeModal("sellerRegisterModal");

        form.reset();

        showToast(
            "Seller registration submitted for admin approval."
        );

        if (typeof window.refreshAdminData === "function") {
            window.refreshAdminData();
        }
    }


    /* =====================================================
       SEARCH
    ====================================================== */

    function performSearch() {

        const input = $("#productSearch");

        const query = input
            ? input.value.trim()
            : "";

        if (typeof window.searchProducts === "function") {
            window.searchProducts(query);
        }

        showCustomerPage("home");
    }


    /* =====================================================
       CATEGORY
    ====================================================== */

    function selectCategory(category) {

        if (!category) return;

        $$(".category-link").forEach(item => {
            item.classList.toggle(
                "active",
                item.dataset.category === category
            );
        });

        if (typeof window.filterProducts === "function") {
            window.filterProducts(category);
        }

        showCustomerPage("home");
    }


    /* =====================================================
       CHECKOUT
    ====================================================== */

    function checkout() {

        const cart = getCart();

        if (!cart.length) {
            showToast("Your cart is empty.", "warning");
            return;
        }

        const user = getUser();
        // Refresh checkout from the current cart so stale cart data cannot be submitted.
        renderCheckoutSummary();

        const nameInput = $("#checkoutFullName");
        const phoneInput = $("#checkoutPhone");

        if (nameInput && user?.name && !nameInput.value) {
            nameInput.value = user.name;
        }

        if (phoneInput && user?.phone && !phoneInput.value) {
            phoneInput.value = user.phone;
        }

        showCustomerPage("checkout");
    }

    function renderCheckoutSummary() {
        const cart = getCart();
        const items = $("#checkoutItems");
        const subtotalEl = $("#checkoutSubtotal");
        const totalEl = $("#checkoutTotal");

        let total = 0;

        if (items) {
            items.innerHTML = cart.map(item => {
                const qty = Number(item.quantity || 1);
                const price = Number(item.price || 99);
                total += price * qty;
                return `<div class="checkout-item">
                    <div class="checkout-item-image">${item.image ? `<img src="${escapeHTML(item.image)}" alt="">` : `<i class="fa-solid fa-box"></i>`}</div>
                    <div class="checkout-item-info"><strong>${escapeHTML(item.name)}</strong><span>Qty: ${qty}</span></div>
                    <strong>₹${price * qty}</strong>
                </div>`;
            }).join("");
        } else {
            total = cart.reduce((sum, item) => sum + Number(item.price || 99) * Number(item.quantity || 1), 0);
        }

        if (subtotalEl) subtotalEl.textContent = `₹${total}`;
        if (totalEl) totalEl.textContent = `₹${total}`;
    }

    function placeOrder(event) {
        event.preventDefault();

        const cart = getCart();
        if (!cart.length) {
            showToast("Your cart is empty.", "warning");
            showCustomerPage("cart");
            return;
        }

        const form = event.currentTarget;
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const paymentMethod = form.elements.paymentMethod?.value;
        if (!paymentMethod) {
            showToast("Please select a payment method.", "warning");
            return;
        }

        const total = cart.reduce(
            (sum, item) => sum + Number(item.price || 99) * Number(item.quantity || 1),
            0
        );

        const orders = getData(STORAGE.orders, []);
        const customerSession = getData("shopmax99_customer_session", null);
        const order = {
            id: "ORD-" + Date.now(),
            customerId: customerSession?.customerId || "",
            customerName: customerSession?.name || form.elements.fullName.value.trim(),
            customerMobile: customerSession?.mobile || form.elements.phone.value.trim(),
            items: cart.map(item => ({ ...item })),
            total,
            status: paymentMethod === "COD" ? "Placed" : "Payment Pending",
            paymentMethod,
            paymentStatus: paymentMethod === "COD" ? "Cash on Delivery" : "Pending - gateway required",
            deliveryDetails: {
                fullName: form.elements.fullName.value.trim(),
                phone: form.elements.phone.value.trim(),
                address: form.elements.address.value.trim(),
                city: form.elements.city.value.trim(),
                pincode: form.elements.pincode.value.trim()
            },
            date: new Date().toISOString()
        };

        orders.unshift(order);
        setData(STORAGE.orders, orders);

        // Record seller earnings in the shared financial ledger.
        const transactions = getData(STORAGE.transactions, []);
        const sellers = getData(STORAGE.sellers, []);
        (order.items || []).forEach((item, index) => {
            const sellerEmail = String(item.sellerEmail || "").toLowerCase();
            if (!sellerEmail) return;
            const seller = sellers.find(s => String(s.email || "").toLowerCase() === sellerEmail);
            const txId = `TX-ORDER-${order.id}-${index}-${sellerEmail}`;
            if (transactions.some(t => String(t.id) === txId)) return;
            transactions.push({
                id: txId,
                category: "order",
                type: "credit",
                amount: Number(item.sellerPrice || 0) * Number(item.quantity || 1),
                partyId: seller?.id || sellerEmail,
                partyName: seller?.shopName || seller?.name || sellerEmail,
                sellerId: seller?.id || "",
                sellerEmail,
                reference: order.id,
                description: `Seller earning from ${order.id} - ${item.name || "Product"}`,
                status: "completed",
                createdAt: order.date
            });
        });
        setData(STORAGE.transactions, transactions);

        setData(STORAGE.cart, []);
        updateCartCount();

        if (typeof window.renderCart === "function") window.renderCart();
        if (typeof window.renderOrders === "function") window.renderOrders();

        showCustomerPage("orders");

        if (paymentMethod === "COD") {
            showToast("Order placed successfully with Cash on Delivery!");
        } else {
            showToast("Order recorded. Connect a payment gateway to collect online payment.", "warning");
        }
    }


    /* =====================================================
       EVENT LISTENERS
    ====================================================== */

    function bindEvents() {

        /* Customer navigation */

        document.addEventListener("click", function (event) {

            const pageButton =
                event.target.closest("[data-customer-page]");

            if (pageButton) {

                const page =
                    pageButton.dataset.customerPage;

                showRole("customer");

                showCustomerPage(page);

                return;
            }


            /* Category buttons */

            const categoryButton =
                event.target.closest("[data-category]");

            if (
                categoryButton &&
                categoryButton.dataset.category
            ) {

                selectCategory(
                    categoryButton.dataset.category
                );

                return;
            }


            /* Role buttons */

            const roleButton =
                event.target.closest("[data-role]");

            if (roleButton) {

                showRole(
                    roleButton.dataset.role
                );

                return;
            }


            /* Close modal */

            const closeButton =
                event.target.closest("[data-close-modal]");

            if (closeButton) {

                closeModal(
                    closeButton.dataset.closeModal
                );

                return;
            }


            /* Account actions */

            const accountAction =
                event.target.closest("[data-account-action]");

            if (accountAction) {

                const action =
                    accountAction.dataset.accountAction;

                const dropdown = $("#accountDropdown");

                if (dropdown) {
                    dropdown.hidden = true;
                }

                if (action === "login") {
                    if (typeof window.openCustomerAuth === "function") window.openCustomerAuth();
                    else openModal("authModal");
                }

                if (action === "profile") {
                    showRole("customer");
                    showCustomerPage("profile");
                }

                if (action === "seller") {
                    if (typeof window.openSellerLogin === "function") window.openSellerLogin();
                    else showRole("seller");
                }

                if (action === "admin") {
                    if (typeof window.openAdminLogin === "function") window.openAdminLogin();
                    else showRole("admin");
                }

                return;
            }


            /* Seller nav */

            const sellerNav =
                event.target.closest("[data-seller-page]");

            if (sellerNav) {
                event.preventDefault();
                if (typeof window.showSellerPage === "function") {
                    window.showSellerPage(sellerNav.dataset.sellerPage);
                }
                return;
            }


            /* Admin nav */

            const adminNav =
                event.target.closest("[data-admin-page]");

            if (adminNav) {
                event.preventDefault();
                if (typeof window.showAdminPage === "function") {
                    window.showAdminPage(adminNav.dataset.adminPage);
                }
                return;
            }

        });


        /* Logo */

        const logo = $("#shopLogo");

        if (logo) {
            logo.addEventListener("click", () => {
                showRole("customer");
                showCustomerPage("home");
            });
        }


        /* Search */

        const searchButton = $("#searchBtn");

        if (searchButton) {
            searchButton.addEventListener(
                "click",
                performSearch
            );
        }

        const searchInput = $("#productSearch");

        if (searchInput) {

            searchInput.addEventListener(
                "keydown",
                event => {

                    if (event.key === "Enter") {
                        performSearch();
                    }

                }
            );
        }


        /* Account dropdown */

        const accountButton = $("#accountBtn");
        const accountDropdown = $("#accountDropdown");

        if (accountButton && accountDropdown) {

            accountButton.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    accountDropdown.hidden =
                        !accountDropdown.hidden;
                }
            );

            document.addEventListener("click", event => {

                if (
                    !accountDropdown.contains(event.target) &&
                    !accountButton.contains(event.target)
                ) {
                    accountDropdown.hidden = true;
                }

            });
        }


        /* Login buttons */

        const loginSidebar = $("#loginSidebarBtn");

        if (loginSidebar) {
            loginSidebar.addEventListener(
                "click",
                () => openModal("authModal")
            );
        }

        const profileLogin = $("#profileLoginBtn");

        if (profileLogin) {
            profileLogin.addEventListener(
                "click",
                () => openModal("authModal")
            );
        }


        /* Seller registration */

        const sellerRegister =
            $("#openSellerRegister");

        if (sellerRegister) {
            sellerRegister.addEventListener(
                "click",
                () => openModal("sellerRegisterModal")
            );
        }


        /* Forms */

        const authForm = $("#authForm");

        if (authForm) {
            authForm.addEventListener(
                "submit",
                handleAuthSubmit
            );
        }

        const sellerForm =
            $("#sellerRegisterForm");

        if (sellerForm) {
            sellerForm.addEventListener(
                "submit",
                handleSellerRegistration
            );
        }


        /* Checkout */

        const checkoutButton = $("#checkoutBtn");

        if (checkoutButton) {
            checkoutButton.addEventListener("click", function (event) {
                event.preventDefault();
                checkout();
            });
        }

        const checkoutForm = $("#checkoutForm");
        if (checkoutForm) {
            checkoutForm.addEventListener("submit", placeOrder);
        }

        const backToCartButton = $("#backToCartBtn");
        if (backToCartButton) {
            backToCartButton.addEventListener("click", function () {
                showCustomerPage("cart");
            });
        }


        /* Escape key */

        document.addEventListener(
            "keydown",
            event => {

                if (event.key === "Escape") {

                    $$(".modal-overlay").forEach(
                        modal => {
                            modal.hidden = true;
                        }
                    );

                    document.body.style.overflow = "";
                }
            }
        );
    }


    /* =====================================================
       INITIALIZE
    ====================================================== */

    function initApp() {

        bindEvents();
        initTheme();

        updateCartCount();
        updateWishlistCount();
        updateUserUI();
        applyMaintenanceState("customer");

        showRole("customer");
        showCustomerPage("home");

        if (typeof window.initCustomer === "function") {
            window.initCustomer();
        }
    }


    document.addEventListener(
        "DOMContentLoaded",
        initApp
    );

})();





/* =========================================================
   SHOPMAX99 — LOGOUT
========================================================= */

(function () {
    "use strict";

    function logoutToCustomer() {

        if (typeof window.ShopMax99?.showRole === "function") {
            window.ShopMax99.showRole("customer");
        } else {
            const customer = document.getElementById("customerApp");
            const seller = document.getElementById("sellerApp");
            const admin = document.getElementById("adminApp");

            if (customer) {
                customer.hidden = false;
                customer.style.display = "";
            }

            if (seller) {
                seller.hidden = true;
                seller.style.display = "none";
            }

            if (admin) {
                admin.hidden = true;
                admin.style.display = "none";
            }
        }

        // Unlock every possible scroll lock left by role/login/product modals.
        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";

        // Reset any internal workspace scroll as well.
        document.querySelectorAll(".workspace-content").forEach(el => {
            el.scrollTop = 0;
        });

        if (typeof window.showCustomerPage === "function") {
            window.showCustomerPage("home");
        }

        // Force the actual document scroller to the top after the role switch.
        const scrollRoot = document.scrollingElement || document.documentElement;
        scrollRoot.scrollTop = 0;
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: "auto"
        });
        requestAnimationFrame(() => {
            (document.scrollingElement || document.documentElement).scrollTop = 0;
            window.scrollTo(0, 0);
        });
    }


    /* CUSTOMER LOGOUT */

    window.shopmax99CustomerLogout = function () {

        localStorage.removeItem("shopmax99_user");

        logoutToCustomer();

        if (typeof window.ShopMax99?.showToast === "function") {
            window.ShopMax99.showToast("Customer logout ho gaya.");
        }
    };


    /* SELLER LOGOUT */

    window.shopmax99SellerLogout = function () {

        /*
         * Seller bhi current shopmax99_user
         * se identify hota hai.
         */
        localStorage.removeItem("shopmax99_user");

        logoutToCustomer();

        if (typeof window.ShopMax99?.showToast === "function") {
            window.ShopMax99.showToast("Seller logout ho gaya.");
        }
    };


    /* ADMIN LOGOUT */

    window.shopmax99AdminLogout = function () {

        localStorage.removeItem("shopmax99_admin_session");

        logoutToCustomer();

        if (typeof window.ShopMax99?.showToast === "function") {
            window.ShopMax99.showToast("Admin logout ho gaya.");
        }
    };


    /* CUSTOMER ACCOUNT DROPDOWN */

    document.addEventListener("click", function (event) {

        const logoutButton =
            event.target.closest('[data-account-action="logout"]');

        if (!logoutButton) return;

        event.preventDefault();

        const dropdown =
            document.getElementById("accountDropdown");

        if (dropdown) {
            dropdown.hidden = true;
        }

        window.shopmax99CustomerLogout();
    });


    /* SELLER */

    document.addEventListener("click", function (event) {

        const button =
            event.target.closest("#sellerLogoutBtn");

        if (!button) return;

        event.preventDefault();

        window.shopmax99SellerLogout();
    });


    /* ADMIN */

    document.addEventListener("click", function (event) {

        const button =
            event.target.closest("#adminLogoutBtn");

        if (!button) return;

        event.preventDefault();

        window.shopmax99AdminLogout();
    });

})();

/* =========================================================
   SHOPMAX99 CUSTOMER LOGIN / SIGNUP
   Mobile Number + OTP Verification
   Login -> Logout
========================================================= */

(function () {
    "use strict";

    const CUSTOMER_KEY = "shopmax99_customer_account";
    const CUSTOMER_SESSION_KEY = "shopmax99_customer_session";

    function getCustomer() {
        try {
            return JSON.parse(
                localStorage.getItem(CUSTOMER_KEY) || "null"
            );
        } catch {
            return null;
        }
    }

    function getSession() {
        try {
            return JSON.parse(
                localStorage.getItem(CUSTOMER_SESSION_KEY) || "null"
            );
        } catch {
            return null;
        }
    }

    function saveCustomer(customer) {
        localStorage.setItem(
            CUSTOMER_KEY,
            JSON.stringify(customer)
        );
    }

    function saveSession(customer) {
        localStorage.setItem(
            CUSTOMER_SESSION_KEY,
            JSON.stringify({
                loggedIn: true,
                customerId: customer.id,
                name: customer.name,
                mobile: customer.mobile,
                loginAt: new Date().toISOString()
            })
        );
    }

    function clearSession() {
        localStorage.removeItem(CUSTOMER_SESSION_KEY);
    }

    function makeId() {
        return (
            "CUS_" +
            Date.now() +
            "_" +
            Math.random()
                .toString(36)
                .substring(2, 8)
        );
    }

    function showMessage(message, type = "error") {
        const box = document.getElementById(
            "shopmax99CustomerAuthMessage"
        );

        if (!box) return;

        box.textContent = message;
        box.className =
            "shopmax99-auth-message " + type;
        box.style.display = "block";
    }

    function hideMessage() {
        const box = document.getElementById(
            "shopmax99CustomerAuthMessage"
        );

        if (box) {
            box.style.display = "none";
        }
    }

    /* =====================================================
       UPDATE HEADER
    ===================================================== */

    function updateCustomerHeader() {

        const accountBtn =
            document.getElementById("accountBtn");

        const accountName =
            document.getElementById("accountName");

        if (!accountBtn) return;

        const session = getSession();

        if (session && session.loggedIn) {

            accountBtn.innerHTML = `
                <i class="fa-solid fa-right-from-bracket"></i>

                <span class="account-text">
                    <small>Hello,</small>
                    <strong id="accountName">
                        ${escapeHTML(
                            session.name || "Customer"
                        )}
                    </strong>
                </span>

                <span class="account-logout-text">
                    Logout
                </span>
            `;

            accountBtn.classList.add(
                "customer-logged-in"
            );

            accountBtn.onclick = function (e) {
                e.preventDefault();
                customerLogout();
            };

        } else {

            accountBtn.innerHTML = `
                <i class="fa-regular fa-user"></i>

                <span class="account-text">
                    <small>Hello,</small>
                    <strong id="accountName">
                        Sign in
                    </strong>
                </span>

                <i class="fa-solid fa-chevron-down account-arrow"></i>
            `;

            accountBtn.classList.remove(
                "customer-logged-in"
            );

            accountBtn.onclick = function (e) {
                e.preventDefault();
                openCustomerAuth();
            };
        }
    }

    /* =====================================================
       HTML ESCAPE
    ===================================================== */

    function escapeHTML(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /* =====================================================
       AUTH MODAL
    ===================================================== */

    function createAuthModal() {

        if (
            document.getElementById(
                "shopmax99CustomerAuthModal"
            )
        ) {
            return;
        }

        const modal =
            document.createElement("div");

        modal.id =
            "shopmax99CustomerAuthModal";

        modal.className =
            "shopmax99-auth-overlay";

        modal.innerHTML = `

            <div class="shopmax99-auth-modal">

                <button
                    type="button"
                    class="shopmax99-auth-close"
                    id="shopmax99AuthClose"
                >
                    ×
                </button>

                <div class="shopmax99-auth-logo">
                    <img
                        src="logo.max99"
                        alt="ShopMax99"
                    >
                </div>

                <h2 id="shopmax99AuthTitle">
                    Login / Sign Up
                </h2>

                <p class="shopmax99-auth-subtitle">
                    Login or create your ShopMax99 account
                </p>

                <div
                    id="shopmax99CustomerAuthMessage"
                    class="shopmax99-auth-message"
                ></div>

                <!-- STEP 1 -->

                <form
                    id="shopmax99MobileForm"
                    class="shopmax99-auth-step"
                >

                    <div
                        class="shopmax99-auth-field"
                    >
                        <label>
                            Full Name
                        </label>

                        <input
                            type="text"
                            id="shopmax99CustomerName"
                            placeholder="Enter your full name"
                            maxlength="80"
                            required
                        >
                    </div>

                    <div
                        class="shopmax99-auth-field"
                    >
                        <label>
                            Mobile Number
                        </label>

                        <div
                            class="shopmax99-mobile-input"
                        >
                            <span>+91</span>

                            <input
                                type="tel"
                                id="shopmax99CustomerMobile"
                                placeholder="10-digit mobile number"
                                maxlength="10"
                                inputmode="numeric"
                                required
                            >
                        </div>
                    </div>

                    <div
                        class="shopmax99-auth-field"
                    >
                        <label>
                            Create Password
                        </label>

                        <input
                            type="password"
                            id="shopmax99CustomerPassword"
                            placeholder="Create a password"
                            minlength="6"
                            required
                        >
                    </div>

                    <button
                        type="submit"
                        class="shopmax99-auth-submit"
                    >
                        Send OTP
                    </button>

                </form>

                <!-- STEP 2 -->

                <form
                    id="shopmax99OtpForm"
                    class="shopmax99-auth-step"
                    style="display:none;"
                >

                    <div class="shopmax99-otp-info">
                        <i class="fa-solid fa-mobile-screen-button"></i>

                        <p>
                            OTP verification required
                        </p>

                        <span id="shopmax99OtpMobile">
                            +91 XXXXX XXXXX
                        </span>
                    </div>

                    <div
                        class="shopmax99-auth-field"
                    >
                        <label>
                            Enter OTP
                        </label>

                        <input
                            type="text"
                            id="shopmax99Otp"
                            placeholder="Enter 6-digit OTP"
                            maxlength="6"
                            inputmode="numeric"
                            autocomplete="one-time-code"
                            required
                        >
                    </div>

                    <button
                        type="submit"
                        class="shopmax99-auth-submit"
                    >
                        Verify OTP & Continue
                    </button>

                    <button
                        type="button"
                        id="shopmax99ResendOtp"
                        class="shopmax99-resend-btn"
                    >
                        Resend OTP
                    </button>

                    <button
                        type="button"
                        id="shopmax99ChangeMobile"
                        class="shopmax99-change-btn"
                    >
                        Change Mobile Number
                    </button>

                    <div
                        id="shopmax99DemoOtp"
                        class="shopmax99-demo-otp"
                    ></div>

                </form>

            </div>
        `;

        document.body.appendChild(modal);

        bindAuthEvents();
    }

    /* =====================================================
       OPEN AUTH
    ===================================================== */

    function openCustomerAuth() {

        createAuthModal();

        const modal =
            document.getElementById(
                "shopmax99CustomerAuthModal"
            );

        if (!modal) return;

        modal.style.display = "flex";

        showMobileStep();

        hideMessage();
    }

    /* =====================================================
       CLOSE AUTH
    ===================================================== */

    function closeCustomerAuth() {

        const modal =
            document.getElementById(
                "shopmax99CustomerAuthModal"
            );

        if (modal) {
            modal.style.display = "none";
        }
    }

    /* =====================================================
       MOBILE STEP
    ===================================================== */

    function showMobileStep() {

        const mobileForm =
            document.getElementById(
                "shopmax99MobileForm"
            );

        const otpForm =
            document.getElementById(
                "shopmax99OtpForm"
            );

        if (mobileForm) {
            mobileForm.style.display = "block";
        }

        if (otpForm) {
            otpForm.style.display = "none";
        }

        const title =
            document.getElementById(
                "shopmax99AuthTitle"
            );

        if (title) {
            title.textContent =
                "Login / Sign Up";
        }

        const otpBox =
            document.getElementById(
                "shopmax99DemoOtp"
            );

        if (otpBox) {
            otpBox.textContent = "";
        }
    }

    /* =====================================================
       SEND OTP
    ===================================================== */

    function sendCustomerOTP() {

        const name =
            document.getElementById(
                "shopmax99CustomerName"
            ).value.trim();

        const mobile =
            document.getElementById(
                "shopmax99CustomerMobile"
            ).value.trim();

        const password =
            document.getElementById(
                "shopmax99CustomerPassword"
            ).value;

        if (!name) {
            showMessage(
                "Please enter your full name."
            );
            return;
        }

        if (!/^[6-9]\d{9}$/.test(mobile)) {
            showMessage(
                "Please enter a valid 10-digit Indian mobile number."
            );
            return;
        }

        if (password.length < 6) {
            showMessage(
                "Password must contain at least 6 characters."
            );
            return;
        }

        /*
         * DEMO OTP
         * Real SMS OTP should be generated and sent
         * through backend/SMS provider.
         */

        const otp =
            Math.floor(
                100000 +
                Math.random() * 900000
            ).toString();

        window.shopmax99PendingCustomer = {
            name: name,
            mobile: mobile,
            password: password,
            otp: otp,
            createdAt: Date.now()
        };

        const mobileText =
            document.getElementById(
                "shopmax99OtpMobile"
            );

        if (mobileText) {
            mobileText.textContent =
                "+91 " +
                mobile.substring(0, 5) +
                " " +
                mobile.substring(5);
        }

        const demoOtp =
            document.getElementById(
                "shopmax99DemoOtp"
            );

        if (demoOtp) {
            demoOtp.innerHTML = `
                Demo OTP:
                <strong>${otp}</strong>
            `;
        }

        document.getElementById(
            "shopmax99MobileForm"
        ).style.display = "none";

        document.getElementById(
            "shopmax99OtpForm"
        ).style.display = "block";

        document.getElementById(
            "shopmax99AuthTitle"
        ).textContent = "Verify Mobile Number";

        hideMessage();

        document.getElementById(
            "shopmax99Otp"
        ).focus();
    }

    /* =====================================================
       VERIFY OTP
    ===================================================== */

    function verifyCustomerOTP() {

        const enteredOtp =
            document.getElementById(
                "shopmax99Otp"
            ).value.trim();

        const pending =
            window.shopmax99PendingCustomer;

        if (!pending) {
            showMessage(
                "OTP session expired. Please request a new OTP."
            );
            return;
        }

        if (
            Date.now() -
            pending.createdAt >
            5 * 60 * 1000
        ) {
            showMessage(
                "OTP expired. Please request a new OTP."
            );
            return;
        }

        if (enteredOtp !== pending.otp) {
            showMessage(
                "Incorrect OTP. Please enter the correct OTP."
            );
            return;
        }

        let existingCustomer =
            getCustomer();

        /*
         * Existing account with same mobile:
         * Login with verified mobile.
         */

        if (
            existingCustomer &&
            existingCustomer.mobile === pending.mobile
        ) {

            if (existingCustomer.status === "blocked") {
                showMessage("This customer account is blocked. Please contact ShopMax99 support.");
                return;
            }

            existingCustomer.name =
                pending.name ||
                existingCustomer.name;

            saveCustomer(existingCustomer);

            saveSession(existingCustomer);

        } else {

            /*
             * New customer account
             */

            const customer = {
                id: makeId(),
                name: pending.name,
                mobile: pending.mobile,
                password: pending.password,
                status: "active",
                mobileVerified: true,
                createdAt:
                    new Date().toISOString(),
                updatedAt:
                    new Date().toISOString()
            };

            saveCustomer(customer);
            saveSession(customer);
        }

        window.shopmax99PendingCustomer = null;

        closeCustomerAuth();

        updateCustomerHeader();

        showCustomerLoginSuccess();
    }

    /* =====================================================
       LOGOUT
    ===================================================== */

    function customerLogout() {

        clearSession();

        updateCustomerHeader();

        /*
         * Return to customer home.
         */

        if (
            typeof window.showCustomerSection ===
            "function"
        ) {
            try {
                window.showCustomerSection("home");
            } catch (e) {}
        }

        alert("You have been logged out successfully.");
    }

    /* =====================================================
       SUCCESS MESSAGE
    ===================================================== */

    function showCustomerLoginSuccess() {

        const old =
            document.getElementById(
                "shopmax99LoginSuccess"
            );

        if (old) old.remove();

        const box =
            document.createElement("div");

        box.id =
            "shopmax99LoginSuccess";

        box.innerHTML = `
            <div class="shopmax99-success-box">
                <i class="fa-solid fa-circle-check"></i>
                <strong>Login Successful</strong>
                <span>
                    Welcome to ShopMax99.
                </span>
            </div>
        `;

        document.body.appendChild(box);

        setTimeout(() => {
            box.remove();
        }, 2500);
    }

    /* =====================================================
       RESEND OTP
    ===================================================== */

    function resendOTP() {

        const pending =
            window.shopmax99PendingCustomer;

        if (!pending) {
            showMobileStep();
            return;
        }

        const newOtp =
            Math.floor(
                100000 +
                Math.random() * 900000
            ).toString();

        pending.otp = newOtp;
        pending.createdAt = Date.now();

        const demoOtp =
            document.getElementById(
                "shopmax99DemoOtp"
            );

        if (demoOtp) {
            demoOtp.innerHTML = `
                Demo OTP:
                <strong>${newOtp}</strong>
            `;
        }

        showMessage(
            "A new OTP has been generated.",
            "success"
        );
    }

    /* =====================================================
       EVENT BINDING
    ===================================================== */

    function bindAuthEvents() {

        document
            .getElementById(
                "shopmax99AuthClose"
            )
            ?.addEventListener(
                "click",
                closeCustomerAuth
            );

        document
            .getElementById(
                "shopmax99MobileForm"
            )
            ?.addEventListener(
                "submit",
                function (e) {
                    e.preventDefault();
                    sendCustomerOTP();
                }
            );

        document
            .getElementById(
                "shopmax99OtpForm"
            )
            ?.addEventListener(
                "submit",
                function (e) {
                    e.preventDefault();
                    verifyCustomerOTP();
                }
            );

        document
            .getElementById(
                "shopmax99ResendOtp"
            )
            ?.addEventListener(
                "click",
                resendOTP
            );

        document
            .getElementById(
                "shopmax99ChangeMobile"
            )
            ?.addEventListener(
                "click",
                function () {
                    window.shopmax99PendingCustomer =
                        null;

                    showMobileStep();
                    hideMessage();
                }
            );
    }

    /* =====================================================
       INITIALIZE
    ===================================================== */

    function initCustomerAuth() {

        createAuthModal();

        updateCustomerHeader();

        /*
         * Restrict mobile field to numbers.
         */

        const mobileInput =
            document.getElementById(
                "shopmax99CustomerMobile"
            );

        if (mobileInput) {

            mobileInput.addEventListener(
                "input",
                function () {
                    this.value =
                        this.value
                            .replace(/\D/g, "")
                            .substring(0, 10);
                }
            );
        }

        const otpInput =
            document.getElementById(
                "shopmax99Otp"
            );

        if (otpInput) {

            otpInput.addEventListener(
                "input",
                function () {
                    this.value =
                        this.value
                            .replace(/\D/g, "")
                            .substring(0, 6);
                }
            );
        }
    }

    /*
     * Global functions
     */

    window.openCustomerAuth =
        openCustomerAuth;

    window.customerLogout =
        customerLogout;

    window.updateCustomerHeader =
        updateCustomerHeader;

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initCustomerAuth
        );
    } else {
        initCustomerAuth();
    }

})();