/* =========================================================
   SHOPMAX99 - ADMIN CONTROL CENTER
   COMPLETE admin.js
   Seller/Admin Login + Mobile + OTP Verification
   ========================================================= */

(function () {
    "use strict";

    const SM = window.ShopMax99 || (window.ShopMax99 = {});

    const KEYS = {
        sellers: "shopmax99_sellers",
        products: "shopmax99_products",
        orders: "shopmax99_orders",
        users: "shopmax99_users",
        settings: "shopmax99_settings",
        transactions: "shopmax99_transactions"
    };

    /* =========================================================
       ADMIN LOGIN CREDENTIALS + RECOVERY
       Prototype storage: credentials can be changed only after
       verifying one of the fixed recovery contacts.
    ========================================================= */

    const ADMIN_CREDENTIALS_KEY = "shopmax99_admin_credentials";
    const ADMIN_RECOVERY_PHONE = "9007102062";
    const ADMIN_RECOVERY_EMAIL = "rahamat9007office@gmail.com";
    const DEFAULT_ADMIN_EMAIL = "admin@shopmax99.com";
    const DEFAULT_ADMIN_PASSWORD = "Admin@123";

    function getAdminCredentials() {
        const saved = getData(ADMIN_CREDENTIALS_KEY, null);
        if (saved && typeof saved === "object" && saved.email && saved.password) {
            return {
                email: String(saved.email).trim().toLowerCase(),
                password: String(saved.password)
            };
        }
        const defaults = { email: DEFAULT_ADMIN_EMAIL, password: DEFAULT_ADMIN_PASSWORD };
        saveData(ADMIN_CREDENTIALS_KEY, defaults);
        return defaults;
    }

    function normalizeRecoveryPhone(value) {
        const digits = String(value || "").replace(/\D/g, "");
        return digits.length > 10 ? digits.slice(-10) : digits;
    }

    function verifyAdminRecoveryContact(value) {
        const raw = String(value || "").trim();
        return normalizeRecoveryPhone(raw) === ADMIN_RECOVERY_PHONE || raw.toLowerCase() === ADMIN_RECOVERY_EMAIL;
    }

    function closeAdminRecovery() {
        const modal = document.getElementById("adminRecoveryModal");
        if (modal) modal.hidden = true;
        const verifyForm = document.getElementById("adminRecoveryVerifyForm");
        const changeForm = document.getElementById("adminRecoveryChangeForm");
        if (verifyForm) { verifyForm.hidden = false; verifyForm.reset(); }
        if (changeForm) { changeForm.hidden = true; changeForm.reset(); }
        if (![...document.querySelectorAll(".modal-overlay")].some(m => !m.hidden)) document.body.style.overflow = "";
    }

    function openAdminRecovery() {
        const modal = document.getElementById("adminRecoveryModal");
        if (!modal) return;
        const verifyForm = document.getElementById("adminRecoveryVerifyForm");
        const changeForm = document.getElementById("adminRecoveryChangeForm");
        if (verifyForm) { verifyForm.hidden = false; verifyForm.reset(); }
        if (changeForm) { changeForm.hidden = true; changeForm.reset(); }
        modal.hidden = false;
        document.body.style.overflow = "hidden";
        setTimeout(() => document.getElementById("adminRecoveryContact")?.focus(), 30);
    }

    function initAdminRecovery() {
        const openBtn = document.getElementById("openAdminRecovery");
        const verifyForm = document.getElementById("adminRecoveryVerifyForm");
        const changeForm = document.getElementById("adminRecoveryChangeForm");
        if (openBtn && !openBtn.dataset.bound) {
            openBtn.dataset.bound = "1";
            openBtn.addEventListener("click", openAdminRecovery);
        }
        if (verifyForm && !verifyForm.dataset.bound) {
            verifyForm.dataset.bound = "1";
            verifyForm.addEventListener("submit", function (event) {
                event.preventDefault();
                const contact = document.getElementById("adminRecoveryContact")?.value || "";
                if (!verifyAdminRecoveryContact(contact)) {
                    alert("Recovery contact does not match the authorized Admin recovery phone or email.");
                    return;
                }
                verifyForm.hidden = true;
                if (changeForm) {
                    changeForm.hidden = false;
                    setTimeout(() => document.getElementById("newAdminEmail")?.focus(), 30);
                }
            });
        }
        if (changeForm && !changeForm.dataset.bound) {
            changeForm.dataset.bound = "1";
            changeForm.addEventListener("submit", function (event) {
                event.preventDefault();
                const email = String(document.getElementById("newAdminEmail")?.value || "").trim().toLowerCase();
                const password = String(document.getElementById("newAdminPassword")?.value || "");
                const confirm = String(document.getElementById("confirmAdminPassword")?.value || "");
                if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    alert("Please enter a valid new Admin email.");
                    return;
                }
                if (password.length < 6) {
                    alert("New Admin password must be at least 6 characters.");
                    return;
                }
                if (password !== confirm) {
                    alert("New Admin passwords do not match.");
                    return;
                }
                saveData(ADMIN_CREDENTIALS_KEY, { email, password, updatedAt: new Date().toISOString() });
                localStorage.removeItem("shopmax99_admin_session");
                const loginEmail = document.getElementById("adminLoginEmail");
                const loginPassword = document.getElementById("adminLoginPassword");
                if (loginEmail) loginEmail.value = email;
                if (loginPassword) loginPassword.value = "";
                closeAdminRecovery();
                alert("Admin login details updated successfully. Use the new email and password for the next Admin login. Your recovery phone/email remains unchanged.");
            });
        }
    }

    SM.getAdminCredentials = getAdminCredentials;

    /* =========================================================
       BASIC STORAGE
       ========================================================= */

    function getData(key, fallback = []) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return fallback;

            const data = JSON.parse(raw);
            return data ?? fallback;
        } catch (error) {
            console.warn("ShopMax99 storage read error:", key, error);
            return fallback;
        }
    }

    function saveData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error("ShopMax99 storage save error:", key, error);
        }
    }

    function makeId(prefix = "id") {
        return (
            prefix +
            "_" +
            Date.now() +
            "_" +
            Math.random().toString(36).substring(2, 8)
        );
    }

    function escapeHTML(value) {
        if (value === null || value === undefined) return "";

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function money(value) {
        return "₹" + Number(value || 0).toFixed(0);
    }

    function notify(message) {
        let box = document.getElementById("shopmax99AdminToast");

        if (!box) {
            box = document.createElement("div");
            box.id = "shopmax99AdminToast";

            box.style.cssText = `
                position:fixed;
                right:20px;
                bottom:20px;
                z-index:999999;
                background:#171122;
                color:#fff;
                padding:13px 18px;
                border-radius:10px;
                box-shadow:0 8px 30px rgba(0,0,0,.25);
                font-size:14px;
                max-width:350px;
                display:none;
            `;

            document.body.appendChild(box);
        }

        box.textContent = message;
        box.style.display = "block";

        clearTimeout(window.__shopmax99AdminToastTimer);

        window.__shopmax99AdminToastTimer = setTimeout(() => {
            box.style.display = "none";
        }, 2500);
    }

    /* =========================================================
       ADMIN NAVIGATION
       ========================================================= */

    const sectionAliases = {
        dashboard: "dashboard",

        "seller-accounts": "seller-accounts",
        sellers: "seller-accounts",

        "pending-seller-approval": "pending-seller-approval",
        "pending-sellers": "pending-seller-approval",

        "all-sellers": "all-sellers",

        "blocked-held-sellers": "blocked-held-sellers",
        "blocked-sellers": "blocked-held-sellers",
        blocked: "blocked-held-sellers",

        "all-products": "all-products",
        products: "all-products",

        "pending-products": "pending-products",
        "approved-products": "approved-products",
        "rejected-products": "rejected-products",

        "product-edit": "product-edit",
        "edit-products": "product-edit",

        orders: "orders",
        customers: "customers",
        reports: "reports",
        transactions: "transactions",
        "bank-account": "bank-account",
        bank: "bank-account",
        settings: "settings",
        "support-staff": "support-staff",
        "support-requests": "support-requests",
        "support-audit": "support-audit",
        "pay-to-staff": "pay-to-staff",
        "pay-staff": "pay-to-staff"
    };

    function normalizeSection(section) {
        section = String(section || "")
            .toLowerCase()
            .trim();

        return sectionAliases[section] || section;
    }

    function findAdminSection(section) {
        const normalized = normalizeSection(section);

        const capitalized = normalized
            .split("-")
            .map(
                word =>
                    word.charAt(0).toUpperCase() +
                    word.slice(1)
            )
            .join("");

        const selectors = [
            `[data-admin-section="${normalized}"]`,
            `[data-section="${normalized}"].admin-section`,
            `#admin${capitalized}`,
            `#admin-${normalized}`,
            `#${normalized}`,
            `.admin-section[data-section="${normalized}"]`
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);

            if (element) {
                return element;
            }
        }

        return null;
    }

    function showAdminSection(section) {
        /* Do not re-initialize/reset the Admin workspace when an already
           logged-in admin simply changes menu tabs. */
        if (
            document.body.dataset.activeRole !== "admin" &&
            typeof window.ShopMax99?.showRole === "function"
        ) {
            const switched = window.ShopMax99.showRole("admin");
            if (switched === false) return false;
        }

        const normalized = normalizeSection(section);

        document
            .querySelectorAll(
                ".admin-section, [data-admin-section]"
            )
            .forEach(element => {
                element.style.display = "none";
                element.classList.remove("active");
            });

        const target = findAdminSection(normalized);

        if (target) {
            target.style.display = "";
            target.classList.add("active");
        }

        /* Keep exactly ONE Admin sidebar item active.  The previous selector
           did not include the actual .workspace-nav-item[data-admin-page]
           buttons, so every clicked item could remain highlighted. */
        document
            .querySelectorAll(".admin-sidebar [data-admin-page]")
            .forEach(button => {
                const buttonSection = normalizeSection(
                    button.dataset.adminPage
                );
                button.classList.toggle(
                    "active",
                    buttonSection === normalized
                );
            });

        /* Keep content/action buttons from inheriting an old active state. */
        document
            .querySelectorAll("[data-admin-action]")
            .forEach(button => {
                button.classList.remove("active");
            });

        renderAdminSection(normalized);
        return true;
    }

    window.showAdminSection = showAdminSection;
    SM.showAdminSection = showAdminSection;

    /* =========================================================
       SELLER MANAGEMENT
       ========================================================= */

    function getSellers() {
        const sellers = getData(KEYS.sellers, []);
        return Array.isArray(sellers) ? sellers : [];
    }

    function saveSellers(sellers) {
        saveData(KEYS.sellers, sellers);
    }

    function approveSeller(id) {
        const sellers = getSellers();

        const seller = sellers.find(
            item => String(item.id) === String(id)
        );

        if (!seller) {
            notify("Seller nahi mila.");
            return;
        }

        seller.status = "approved";
        seller.approvedAt = new Date().toISOString();

        saveSellers(sellers);

        notify("Seller approved successfully.");

        renderAllAdminSections();
    }

    function rejectSeller(id) {
        const sellers = getSellers();

        const seller = sellers.find(
            item => String(item.id) === String(id)
        );

        if (!seller) {
            notify("Seller nahi mila.");
            return;
        }

        seller.status = "rejected";
        seller.rejectedAt = new Date().toISOString();

        saveSellers(sellers);

        notify("Seller rejected.");

        renderAllAdminSections();
    }

    function blockSeller(id) {
        const sellers = getSellers();

        const seller = sellers.find(
            item => String(item.id) === String(id)
        );

        if (!seller) {
            notify("Seller nahi mila.");
            return;
        }

        seller.status = "blocked";
        seller.blockedAt = new Date().toISOString();

        saveSellers(sellers);

        notify("Seller blocked.");

        renderAllAdminSections();
    }

    function unblockSeller(id) {
        const sellers = getSellers();

        const seller = sellers.find(
            item => String(item.id) === String(id)
        );

        if (!seller) {
            notify("Seller nahi mila.");
            return;
        }

        seller.status = "approved";

        saveSellers(sellers);

        notify("Seller unblocked.");

        renderAllAdminSections();
    }

    function deleteSeller(id) {
        if (
            !confirm(
                "Is seller account ko permanently delete karna hai?"
            )
        ) {
            return;
        }

        const sellers = getSellers().filter(
            seller => String(seller.id) !== String(id)
        );

        saveSellers(sellers);

        notify("Seller account deleted.");

        renderAllAdminSections();
    }

    /* =========================================================
       PRODUCT MANAGEMENT
       ========================================================= */

    function getProducts() {
        const products = getData(KEYS.products, []);
        return Array.isArray(products) ? products : [];
    }

    function saveProducts(products) {
        saveData(KEYS.products, products);
    }

    function approveProduct(id) {
        const products = getProducts();

        const product = products.find(
            item => String(item.id) === String(id)
        );

        if (!product) {
            notify("Product nahi mila.");
            return;
        }

        product.status = "approved";
        const settings = getData(KEYS.settings, {});
        const configuredCustomerPrice = Number(settings?.customerPrice);
        product.customerPrice = Number.isFinite(configuredCustomerPrice) && configuredCustomerPrice > 0 ? configuredCustomerPrice : 99;
        product.price = product.customerPrice;
        product.approvedAt = new Date().toISOString();

        saveProducts(products);

        notify(
            "Product approved. Ab home par show hoga."
        );

        renderAllAdminSections();

        if (
            typeof window.renderApprovedProducts ===
            "function"
        ) {
            window.renderApprovedProducts();
        }
    }

    function rejectProduct(id) {
        const products = getProducts();

        const product = products.find(
            item => String(item.id) === String(id)
        );

        if (!product) {
            notify("Product nahi mila.");
            return;
        }

        product.status = "rejected";
        product.rejectedAt = new Date().toISOString();

        saveProducts(products);

        notify("Product rejected.");

        renderAllAdminSections();

        if (
            typeof window.renderApprovedProducts ===
            "function"
        ) {
            window.renderApprovedProducts();
        }
    }

    function deleteProduct(id) {
        if (
            !confirm(
                "Is product ko permanently delete karna hai?"
            )
        ) {
            return;
        }

        const products = getProducts().filter(
            product => String(product.id) !== String(id)
        );

        saveProducts(products);

        notify("Product deleted.");

        renderAllAdminSections();

        if (
            typeof window.renderApprovedProducts ===
            "function"
        ) {
            window.renderApprovedProducts();
        }
    }

    async function editProduct(id) {
        const products = getProducts();

        const index = products.findIndex(
            product => String(product.id) === String(id)
        );

        if (index === -1) {
            notify("Product nahi mila.");
            return;
        }

        const product = products[index];

        document
            .getElementById(
                "sm99AdminEditProductModal"
            )
            ?.remove();

        const currentImages = Array.isArray(
            product.images
        )
            ? product.images
            : product.image
            ? [product.image]
            : [];

        const modal = document.createElement("div");

        modal.id = "sm99AdminEditProductModal";

        modal.innerHTML = `
            <div style="
                position:fixed;
                inset:0;
                background:rgba(0,0,0,.55);
                z-index:999999;
                display:flex;
                align-items:center;
                justify-content:center;
                padding:20px;
            ">
                <div style="
                    width:min(700px,100%);
                    max-height:90vh;
                    overflow:auto;
                    background:#fff;
                    border-radius:16px;
                    padding:24px;
                    box-shadow:0 20px 60px rgba(0,0,0,.25);
                ">

                    <div style="
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        gap:12px;
                        margin-bottom:20px;
                    ">
                        <div>
                            <h2 style="margin:0 0 5px;">
                                Edit Product
                            </h2>

                            <p style="
                                margin:0;
                                color:#666;
                                font-size:13px;
                            ">
                                Edit ke baad product dobara
                                approval ke liye Pending hoga.
                            </p>
                        </div>

                        <button
                            type="button"
                            data-close-admin-edit
                            style="
                                border:0;
                                background:#f1f1f1;
                                border-radius:8px;
                                padding:8px 12px;
                                font-size:18px;
                                cursor:pointer;
                            "
                        >×</button>
                    </div>

                    <form id="sm99AdminEditProductForm">

                        <div style="
                            display:grid;
                            grid-template-columns:
                                repeat(2,minmax(0,1fr));
                            gap:14px;
                        ">

                            <label>
                                <span style="
                                    display:block;
                                    font-size:13px;
                                    font-weight:600;
                                    margin-bottom:6px;
                                ">
                                    Product Name *
                                </span>

                                <input
                                    id="sm99AdminEditName"
                                    required
                                    value="${escapeHTML(
                                        product.name || ""
                                    )}"
                                    style="
                                        width:100%;
                                        box-sizing:border-box;
                                        padding:11px;
                                        border:1px solid #ddd;
                                        border-radius:8px;
                                    "
                                >
                            </label>

                            <label>
                                <span style="
                                    display:block;
                                    font-size:13px;
                                    font-weight:600;
                                    margin-bottom:6px;
                                ">
                                    Category *
                                </span>

                                <input
                                    id="sm99AdminEditCategory"
                                    required
                                    value="${escapeHTML(
                                        product.category || ""
                                    )}"
                                    style="
                                        width:100%;
                                        box-sizing:border-box;
                                        padding:11px;
                                        border:1px solid #ddd;
                                        border-radius:8px;
                                    "
                                >
                            </label>

                            <label>
                                <span style="
                                    display:block;
                                    font-size:13px;
                                    font-weight:600;
                                    margin-bottom:6px;
                                ">
                                    Seller Price (₹1–₹70) *
                                </span>

                                <input
                                    id="sm99AdminEditPrice"
                                    type="number"
                                    min="1"
                                    max="70"
                                    required
                                    value="${Number(
                                        product.sellerPrice || 0
                                    )}"
                                    style="
                                        width:100%;
                                        box-sizing:border-box;
                                        padding:11px;
                                        border:1px solid #ddd;
                                        border-radius:8px;
                                    "
                                >
                            </label>

                            <label>
                                <span style="
                                    display:block;
                                    font-size:13px;
                                    font-weight:600;
                                    margin-bottom:6px;
                                ">
                                    Stock *
                                </span>

                                <input
                                    id="sm99AdminEditStock"
                                    type="number"
                                    min="1"
                                    step="1"
                                    required
                                    value="${Number(
                                        product.stock || 1
                                    )}"
                                    style="
                                        width:100%;
                                        box-sizing:border-box;
                                        padding:11px;
                                        border:1px solid #ddd;
                                        border-radius:8px;
                                    "
                                >
                            </label>

                        </div>

                        <label style="
                            display:block;
                            margin-top:14px;
                        ">
                            <span style="
                                display:block;
                                font-size:13px;
                                font-weight:600;
                                margin-bottom:6px;
                            ">
                                Description
                            </span>

                            <textarea
                                id="sm99AdminEditDescription"
                                rows="5"
                                style="
                                    width:100%;
                                    box-sizing:border-box;
                                    padding:11px;
                                    border:1px solid #ddd;
                                    border-radius:8px;
                                    resize:vertical;
                                "
                            >${escapeHTML(
                                product.description || ""
                            )}</textarea>
                        </label>

                        <div style="
                            margin-top:14px;
                            padding:14px;
                            background:#f8f8fb;
                            border-radius:10px;
                        ">
                            <div style="
                                font-size:13px;
                                font-weight:700;
                                margin-bottom:10px;
                            ">
                                Product Images
                            </div>

                            <div
                                id="sm99AdminCurrentImages"
                                style="
                                    display:grid;
                                    grid-template-columns:
                                        repeat(4,1fr);
                                    gap:10px;
                                    margin-bottom:12px;
                                "
                            >
                                ${
                                    currentImages
                                        .map(
                                            (image, i) => `
                                        <div
                                            data-admin-existing-image="${i}"
                                            style="
                                                position:relative;
                                                border:1px solid #ddd;
                                                border-radius:10px;
                                                padding:6px;
                                                background:#fff;
                                            "
                                        >
                                            <img
                                                src="${escapeHTML(
                                                    image
                                                )}"
                                                style="
                                                    width:100%;
                                                    height:90px;
                                                    object-fit:contain;
                                                    border-radius:7px;
                                                    display:block;
                                                "
                                            >

                                            <button
                                                type="button"
                                                data-remove-admin-image="${i}"
                                                style="
                                                    position:absolute;
                                                    top:4px;
                                                    right:4px;
                                                    border:0;
                                                    border-radius:50%;
                                                    width:24px;
                                                    height:24px;
                                                    background:#dc2626;
                                                    color:#fff;
                                                    cursor:pointer;
                                                    font-weight:700;
                                                "
                                            >×</button>
                                        </div>
                                    `
                                        )
                                        .join("")
                                }
                            </div>

                            <label style="
                                display:block;
                                font-size:13px;
                                font-weight:600;
                                margin-bottom:7px;
                            ">
                                Replace / Add Images (maximum 4 total)
                            </label>

                            <div class="sm99-edit-image-input-grid" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;">
                                ${[1,2,3,4].map(i => `
                                    <label style="display:block;border:1px dashed #bbb;border-radius:8px;padding:9px;background:#fff;">
                                        <span style="display:block;font-size:11px;font-weight:700;margin-bottom:6px;color:#666;">Image ${i}</span>
                                        <input class="sm99AdminEditImageInput" type="file" accept="image/jpeg,image/png,image/webp" style="width:100%;box-sizing:border-box;">
                                    </label>
                                `).join("")}
                            </div>

                            <div style="
                                margin-top:6px;
                                font-size:12px;
                                color:#777;
                            ">
                                Existing image par × dabakar remove karo. Neeche 4 separate upload slots hain. Total images maximum 4 rahengi.
                            </div>
                        </div>

                        <div style="
                            display:flex;
                            justify-content:flex-end;
                            gap:10px;
                            margin-top:20px;
                        ">
                            <button
                                type="button"
                                data-close-admin-edit
                                style="
                                    padding:10px 18px;
                                    border:1px solid #ddd;
                                    background:#fff;
                                    border-radius:8px;
                                    cursor:pointer;
                                "
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                style="
                                    padding:10px 20px;
                                    border:0;
                                    background:#6d28d9;
                                    color:#fff;
                                    border-radius:8px;
                                    cursor:pointer;
                                    font-weight:600;
                                "
                            >
                                Save Changes
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const close = () => modal.remove();

        modal
            .querySelectorAll(
                "[data-close-admin-edit]"
            )
            .forEach(button => {
                button.addEventListener(
                    "click",
                    close
                );
            });

        const removedImages = new Set();

        modal
            .querySelectorAll(
                "[data-remove-admin-image]"
            )
            .forEach(button => {
                button.addEventListener(
                    "click",
                    () => {
                        const imageIndex = Number(
                            button.dataset
                                .removeAdminImage
                        );

                        removedImages.add(imageIndex);

                        modal
                            .querySelector(
                                `[data-admin-existing-image="${imageIndex}"]`
                            )
                            ?.remove();
                    }
                );
            });

        modal
            .querySelector(
                "#sm99AdminEditProductForm"
            )
            .addEventListener(
                "submit",
                async event => {
                    event.preventDefault();

                    const name =
                        modal
                            .querySelector(
                                "#sm99AdminEditName"
                            )
                            .value.trim();

                    const category =
                        modal
                            .querySelector(
                                "#sm99AdminEditCategory"
                            )
                            .value.trim();

                    const price = Number(
                        modal.querySelector(
                            "#sm99AdminEditPrice"
                        ).value
                    );

                    const stock = Number(
                        modal.querySelector(
                            "#sm99AdminEditStock"
                        ).value
                    );

                    const description =
                        modal
                            .querySelector(
                                "#sm99AdminEditDescription"
                            )
                            .value.trim();

                    const files = Array.from(
                        modal.querySelectorAll(
                            ".sm99AdminEditImageInput"
                        )
                    )
                        .map(input => input.files?.[0])
                        .filter(Boolean);

                    let images =
                        currentImages.filter(
                            (_, index) =>
                                !removedImages.has(index)
                        );

                    if (files.length) {
                        const newImages =
                            await Promise.all(
                                files.map(
                                    file =>
                                        new Promise(
                                            (
                                                resolve,
                                                reject
                                            ) => {
                                                const reader =
                                                    new FileReader();

                                                reader.onload =
                                                    () =>
                                                        resolve(
                                                            reader.result
                                                        );

                                                reader.onerror =
                                                    reject;

                                                reader.readAsDataURL(
                                                    file
                                                );
                                            }
                                        )
                                )
                            );

                        images =
                            images.concat(
                                newImages
                            );
                    }

                    images = images
                        .filter(Boolean)
                        .slice(0, 4);

                    if (!images.length) {
                        notify(
                            "Kam se kam 1 product image rakho."
                        );
                        return;
                    }

                    if (!name || !category) {
                        notify(
                            "Product name aur category required hain."
                        );
                        return;
                    }

                    if (
                        !Number.isFinite(price) ||
                        price < 1 ||
                        price > 70
                    ) {
                        notify(
                            "Seller price ₹1 se ₹70 ke beech hona chahiye."
                        );
                        return;
                    }

                    if (
                        !Number.isInteger(stock) ||
                        stock < 1
                    ) {
                        notify(
                            "Stock kam se kam 1 hona chahiye."
                        );
                        return;
                    }

                    const now =
                        new Date().toISOString();

                    products[index] = {
                        ...products[index],
                        name,
                        category,
                        sellerPrice: price,
                        customerPrice: 99,
                        stock,
                        description,
                        image: images[0],
                        images,
                        status: "pending",
                        updatedAt: now,
                        approvedAt: null,
                        rejectedAt: null
                    };

                    saveProducts(products);

                    const requests = getData(
                        "nestedProductRequests",
                        []
                    );

                    const filtered =
                        Array.isArray(requests)
                            ? requests.filter(
                                  request =>
                                      String(
                                          request.productId ||
                                              request
                                                  .product
                                                  ?.id ||
                                              ""
                                      ) !==
                                      String(id)
                              )
                            : [];

                    filtered.unshift({
                        id: `REQ-${id}`,
                        type: "product",
                        productId: id,
                        status: "pending",
                        product: products[index],
                        createdAt: now
                    });

                    saveData(
                        "nestedProductRequests",
                        filtered
                    );

                    close();

                    notify(
                        "Product edit save ho gaya aur approval ke liye Pending ho gaya."
                    );

                    renderAllAdminSections();

                    if (
                        typeof window.renderApprovedProducts ===
                        "function"
                    ) {
                        window.renderApprovedProducts();
                    }
                }
            );
    }

    /* =========================================================
       ADMIN HTML BUILDERS
       ========================================================= */

    function statusBadge(status) {
        const value = String(
            status || "pending"
        ).toLowerCase();

        let label = value;

        if (value === "approved")
            label = "Approved";

        if (value === "pending")
            label = "Pending";

        if (value === "rejected")
            label = "Rejected";

        if (value === "blocked")
            label = "Blocked";

        if (value === "held")
            label = "Held";

        return `
            <span
                class="admin-status admin-status-${escapeHTML(
                    value
                )}"
                style="
                    display:inline-block;
                    padding:4px 9px;
                    border-radius:20px;
                    font-size:12px;
                    font-weight:600;
                    background:#eee;
                "
            >
                ${escapeHTML(label)}
            </span>
        `;
    }

    function sellerCard(seller) {
        const status = String(
            seller.status || "pending"
        ).toLowerCase();

        return `
            <div
                class="admin-card"
                data-seller-id="${escapeHTML(
                    seller.id
                )}"
                style="
                    background:#fff;
                    border:1px solid #e5e5e5;
                    border-radius:12px;
                    padding:16px;
                    margin-bottom:12px;
                "
            >

                <div style="
                    display:flex;
                    justify-content:space-between;
                    gap:15px;
                    align-items:flex-start;
                ">

                    <div>
                        <h3 style="
                            margin:0 0 7px;
                        ">
                            ${escapeHTML(
                                seller.shopName ||
                                    seller.name ||
                                    "Seller"
                            )}
                        </h3>

                        <div style="
                            font-size:13px;
                            color:#666;
                        ">
                            Seller:
                            ${escapeHTML(
                                seller.name ||
                                    seller.fullName ||
                                    "-"
                            )}
                        </div>

                        <div style="
                            font-size:13px;
                            color:#666;
                        ">
                            Email:
                            ${escapeHTML(
                                seller.email ||
                                    seller.sellerEmail ||
                                    "-"
                            )}
                        </div>

                        <div style="
                            font-size:13px;
                            color:#666;
                        ">
                            Phone:
                            ${escapeHTML(
                                seller.phone ||
                                    seller.mobile ||
                                    seller.mobileNumber ||
                                    "-"
                            )}
                        </div>
                    </div>

                    <div>
                        ${statusBadge(status)}
                    </div>

                </div>

                <div style="
                    display:flex;
                    flex-wrap:wrap;
                    gap:8px;
                    margin-top:14px;
                ">

                    ${
                        status === "pending"
                            ? `
                                <button
                                    type="button"
                                    class="admin-action-btn approve"
                                    data-admin-action="approve-seller"
                                    data-id="${escapeHTML(
                                        seller.id
                                    )}"
                                >
                                    Approve
                                </button>

                                <button
                                    type="button"
                                    class="admin-action-btn reject"
                                    data-admin-action="reject-seller"
                                    data-id="${escapeHTML(
                                        seller.id
                                    )}"
                                >
                                    Reject
                                </button>
                            `
                            : ""
                    }

                    ${
                        status === "approved"
                            ? `
                                <button
                                    type="button"
                                    class="admin-action-btn block"
                                    data-admin-action="block-seller"
                                    data-id="${escapeHTML(
                                        seller.id
                                    )}"
                                >
                                    Block
                                </button>
                            `
                            : ""
                    }

                    ${
                        status === "blocked" ||
                        status === "held"
                            ? `
                                <button
                                    type="button"
                                    class="admin-action-btn approve"
                                    data-admin-action="unblock-seller"
                                    data-id="${escapeHTML(
                                        seller.id
                                    )}"
                                >
                                    Unblock
                                </button>
                            `
                            : ""
                    }

                    <button
                        type="button"
                        class="admin-action-btn delete"
                        data-admin-action="delete-seller"
                        data-id="${escapeHTML(
                            seller.id
                        )}"
                    >
                        Delete
                    </button>

                </div>
            </div>
        `;
    }

    function productCard(product) {
        const status = String(
            product.status || "pending"
        ).toLowerCase();

        return `
            <div
                class="admin-card"
                data-product-id="${escapeHTML(
                    product.id
                )}"
                style="
                    background:#fff;
                    border:1px solid #e5e5e5;
                    border-radius:12px;
                    padding:16px;
                    margin-bottom:12px;
                "
            >

                <div style="
                    display:flex;
                    justify-content:space-between;
                    gap:15px;
                    align-items:flex-start;
                ">

                    <div>

                        <h3 style="
                            margin:0 0 7px;
                        ">
                            ${escapeHTML(
                                product.name ||
                                    "Product"
                            )}
                        </h3>

                        <div class="admin-product-id">
                            Product ID: <strong>${escapeHTML(product.id || "-")}</strong>
                        </div>

                        <div style="
                            font-size:13px;
                            color:#666;
                        ">
                            Category:
                            ${escapeHTML(
                                product.category ||
                                    "-"
                            )}
                        </div>

                        <div style="
                            font-size:13px;
                            color:#666;
                        ">
                            Seller:
                            ${escapeHTML(
                                product.sellerName ||
                                    product.sellerId ||
                                    "-"
                            )}
                        </div>

                        <div style="
                            font-size:13px;
                            color:#666;
                        ">
                            Seller Price:
                            <strong>
                                ${money(
                                    product.sellerPrice
                                )}
                            </strong>
                        </div>

                        <div style="
                            font-size:13px;
                            color:#666;
                        ">
                            Customer Price:
                            <strong>₹99</strong>
                        </div>

                    </div>

                    <div>
                        ${statusBadge(status)}
                    </div>

                </div>

                <div style="
                    display:flex;
                    flex-wrap:wrap;
                    gap:8px;
                    margin-top:14px;
                ">

                    ${
                        status === "pending"
                            ? `
                                <button
                                    type="button"
                                    class="admin-action-btn approve"
                                    data-admin-action="approve-product"
                                    data-id="${escapeHTML(
                                        product.id
                                    )}"
                                >
                                    Approve
                                </button>

                                <button
                                    type="button"
                                    class="admin-action-btn reject"
                                    data-admin-action="reject-product"
                                    data-id="${escapeHTML(
                                        product.id
                                    )}"
                                >
                                    Reject
                                </button>
                            `
                            : ""
                    }

                    <button
                        type="button"
                        class="admin-action-btn edit"
                        data-admin-action="edit-product"
                        data-id="${escapeHTML(
                            product.id
                        )}"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="admin-action-btn delete"
                        data-admin-action="delete-product"
                        data-id="${escapeHTML(
                            product.id
                        )}"
                    >
                        Delete
                    </button>

                </div>
            </div>
        `;
    }

    /* =========================================================
       CONTAINERS
       ========================================================= */

    function findContainer(type) {
        const map = {
            dashboard: [
                "#adminDashboardContent",
                "#adminDashboard",
                '[data-admin-content="dashboard"]'
            ],

            "seller-accounts": [
                "#adminSellerAccounts",
                '[data-admin-content="seller-accounts"]'
            ],

            "pending-seller-approval": [
                "#adminPendingSellerApproval",
                '[data-admin-content="pending-seller-approval"]'
            ],

            "all-sellers": [
                "#adminAllSellers",
                '[data-admin-content="all-sellers"]'
            ],

            "blocked-held-sellers": [
                "#adminBlockedHeldSellers",
                '[data-admin-content="blocked-held-sellers"]'
            ],

            "all-products": [
                "#adminAllProducts",
                '[data-admin-content="all-products"]'
            ],

            "pending-products": [
                "#adminPendingProducts",
                '[data-admin-content="pending-products"]'
            ],

            "approved-products": [
                "#adminApprovedProducts",
                '[data-admin-content="approved-products"]'
            ],

            "rejected-products": [
                "#adminRejectedProducts",
                '[data-admin-content="rejected-products"]'
            ],

            "product-edit": [
                "#adminProductEdit",
                '[data-admin-content="product-edit"]'
            ],

            orders: [
                "#adminOrders",
                '[data-admin-content="orders"]'
            ],

            customers: [
                "#adminCustomers",
                '[data-admin-content="customers"]'
            ],

            reports: [
                "#adminReports",
                '[data-admin-content="reports"]'
            ],

            transactions: [
                "#adminTransactions",
                '[data-admin-content="transactions"]'
            ],

            settings: [
                "#adminSettings",
                '[data-admin-content="settings"]'
            ]
        };

        const selectors = map[type] || [];

        for (const selector of selectors) {
            const element =
                document.querySelector(selector);

            if (element) return element;
        }

        return null;
    }

    /* =========================================================
       SELLER RENDER
       ========================================================= */

    function renderSellers() {
        const sellers = getSellers();

        const pending = sellers.filter(
            seller =>
                String(
                    seller.status || "pending"
                ) === "pending"
        );

        const approved = sellers.filter(
            seller =>
                String(seller.status) ===
                "approved"
        );

        const blocked = sellers.filter(
            seller =>
                String(seller.status) ===
                    "blocked" ||
                String(seller.status) === "held"
        );

        const allContainer =
            findContainer("all-sellers");

        if (allContainer) {
            allContainer.innerHTML = `
                <h2>All Sellers</h2>

                <div style="margin-bottom:15px;">
                    Total Sellers:
                    <strong>${sellers.length}</strong>
                </div>

                ${
                    sellers.length
                        ? sellers
                              .map(sellerCard)
                              .join("")
                        : "<p>No sellers found.</p>"
                }
            `;
        }

        const pendingContainer =
            findContainer(
                "pending-seller-approval"
            );

        if (pendingContainer) {
            pendingContainer.innerHTML = `
                <h2>Pending Seller Approval</h2>

                ${
                    pending.length
                        ? pending
                              .map(sellerCard)
                              .join("")
                        : "<p>No pending seller requests.</p>"
                }
            `;
        }

        const blockedContainer =
            findContainer(
                "blocked-held-sellers"
            );

        if (blockedContainer) {
            blockedContainer.innerHTML = `
                <h2>Blocked / Held Sellers</h2>

                ${
                    blocked.length
                        ? blocked
                              .map(sellerCard)
                              .join("")
                        : "<p>No blocked or held sellers.</p>"
                }
            `;
        }

        const sellerAccounts =
            findContainer("seller-accounts");

        if (sellerAccounts) {
            sellerAccounts.innerHTML = `
                <h2>Seller Accounts</h2>

                <div style="
                    display:flex;
                    gap:10px;
                    flex-wrap:wrap;
                    margin-bottom:18px;
                ">

                    <div>
                        <strong>${sellers.length}</strong>
                        <small>Total</small>
                    </div>

                    <div>
                        <strong>${pending.length}</strong>
                        <small>Pending</small>
                    </div>

                    <div>
                        <strong>${approved.length}</strong>
                        <small>Approved</small>
                    </div>

                    <div>
                        <strong>${blocked.length}</strong>
                        <small>Blocked</small>
                    </div>

                </div>

                ${
                    sellers.length
                        ? sellers
                              .map(sellerCard)
                              .join("")
                        : "<p>No seller accounts found.</p>"
                }
            `;
        }
    }

    /* =========================================================
       PRODUCT RENDER
       ========================================================= */

    function renderProducts() {
        const products = getProducts();

        const pending = products.filter(
            product =>
                String(
                    product.status || "pending"
                ) === "pending"
        );

        const approved = products.filter(
            product =>
                String(product.status) ===
                "approved"
        );

        const rejected = products.filter(
            product =>
                String(product.status) ===
                "rejected"
        );

        const allContainer =
            findContainer("all-products");

        if (allContainer) {
            allContainer.innerHTML = `
                <h2>All Products</h2>

                <div style="margin-bottom:15px;">
                    Total Products:
                    <strong>${products.length}</strong>
                </div>

                ${
                    products.length
                        ? products
                              .map(productCard)
                              .join("")
                        : "<p>No products found.</p>"
                }
            `;
        }

        const pendingContainer =
            findContainer("pending-products");

        if (pendingContainer) {
            pendingContainer.innerHTML = `
                <h2>Pending Products</h2>

                ${
                    pending.length
                        ? pending
                              .map(productCard)
                              .join("")
                        : "<p>No pending products.</p>"
                }
            `;
        }

        const approvedContainer =
            findContainer("approved-products");

        if (approvedContainer) {
            approvedContainer.innerHTML = `
                <h2>Approved Products</h2>

                ${
                    approved.length
                        ? approved
                              .map(productCard)
                              .join("")
                        : "<p>No approved products.</p>"
                }
            `;
        }

        const rejectedContainer =
            findContainer("rejected-products");

        if (rejectedContainer) {
            rejectedContainer.innerHTML = `
                <h2>Rejected Products</h2>

                ${
                    rejected.length
                        ? rejected
                              .map(productCard)
                              .join("")
                        : "<p>No rejected products.</p>"
                }
            `;
        }

        const editContainer =
            findContainer("product-edit");

        if (editContainer) {
            editContainer.innerHTML = `
                <h2>Product Edit</h2>

                <p style="color:#666;">
                    Admin kisi bhi product ko edit kar sakta hai.
                    Edit ke baad product dobara approval ke liye
                    <strong>Pending</strong> ho jayega.
                </p>

                ${
                    products.length
                        ? products
                              .map(productCard)
                              .join("")
                        : "<p>No products found.</p>"
                }
            `;
        }
    }

    /* =========================================================
       DASHBOARD
       ========================================================= */

    function renderDashboard() {
        const container = findContainer("dashboard");
        if (!container) return;
        const sellers = getSellers();
        const products = getProducts();
        const orders = getData(KEYS.orders, []);
        const users = getData(KEYS.users, []);
        const pendingSellers = sellers.filter(seller => String(seller.status || "pending") === "pending").length;
        const pendingProducts = products.filter(product => String(product.status || "pending") === "pending").length;
        const approvedProducts = products.filter(product => String(product.status) === "approved").length;
        const revenue = orders.reduce((sum, order) => sum + Number(order.total || order.amount || 0), 0);
        const stats = [
          ["Total Sellers", sellers.length, "fa-store", "violet"],
          ["Pending Sellers", pendingSellers, "fa-user-clock", "amber"],
          ["Total Products", products.length, "fa-boxes-stacked", "blue"],
          ["Pending Products", pendingProducts, "fa-clock", "orange"],
          ["Approved Products", approvedProducts, "fa-circle-check", "green"],
          ["Orders", orders.length, "fa-bag-shopping", "pink"],
          ["Customers", users.length, "fa-user-group", "cyan"]
        ];
        container.innerHTML = `
          <div class="admin-dashboard-shell">
            <div class="admin-dashboard-hero"><div><span class="seller-kicker">CONTROL CENTER</span><h1>Good day, Administrator</h1><p>Monitor the ShopMax99 marketplace, approvals, customers, finance and support operations from one place.</p></div><div class="admin-dashboard-hero-actions"><span class="admin-site-status-pill ${window.ShopMax99?.maintenance?.isActive?.() ? "offline" : "online"}"><i class="fa-solid fa-circle"></i>${window.ShopMax99?.maintenance?.isActive?.() ? "Site Offline" : "Site Online"}</span><button type="button" class="admin-maintenance-btn ${window.ShopMax99?.maintenance?.isActive?.() ? "restore" : "danger"}" data-admin-action="maintenance-toggle"><i class="fa-solid ${window.ShopMax99?.maintenance?.isActive?.() ? "fa-power-off" : "fa-screwdriver-wrench"}"></i>${window.ShopMax99?.maintenance?.isActive?.() ? "Enable Site" : "Put Site Under Maintenance"}</button><div class="admin-dashboard-hero-icon"><i class="fa-solid fa-shield-halved"></i></div></div></div>
            <div class="admin-metric-grid">${stats.map(([label,value,icon,tone]) => `<article class="admin-metric-card ${tone}"><div class="admin-metric-icon"><i class="fa-solid ${icon}"></i></div><div><span>${label}</span><strong>${value}</strong></div></article>`).join("")}</div>
            <div class="admin-dashboard-lower">
              <article class="admin-insight-card"><div class="admin-insight-head"><div><span class="seller-kicker">BUSINESS SNAPSHOT</span><h2>Order Value</h2></div><i class="fa-solid fa-chart-line"></i></div><strong class="admin-big-number">${money(revenue)}</strong><p>Combined order value recorded in the local transaction/order dataset.</p></article>
              <article class="admin-insight-card"><div class="admin-insight-head"><div><span class="seller-kicker">ACTION CENTER</span><h2>Needs Attention</h2></div><i class="fa-solid fa-bolt"></i></div><div class="admin-attention-list"><button type="button" data-admin-page="pending-sellers"><span>Pending seller approvals</span><b>${pendingSellers}</b></button><button type="button" data-admin-page="pending-products"><span>Pending product approvals</span><b>${pendingProducts}</b></button><button type="button" data-admin-page="support-requests"><span>Support change requests</span><b>${getData("shopmax99_support_requests", []).filter(x => x.status === "pending").length}</b></button></div></article>
            </div>
          </div>`;
    }

    /* =========================================================
       ORDERS
       ========================================================= */

    function renderOrders() {
        const container =
            findContainer("orders");

        if (!container) return;

        const orders = getData(
            KEYS.orders,
            []
        );

        container.innerHTML = `
            <h2>Orders</h2>

            ${
                orders.length
                    ? orders
                          .map(
                              order => `
                        <div
                            class="admin-card"
                            style="
                                background:#fff;
                                border:1px solid #e5e5e5;
                                border-radius:12px;
                                padding:15px;
                                margin-bottom:10px;
                            "
                        >

                            <strong>
                                Order #${escapeHTML(
                                    order.id ||
                                        "-"
                                )}
                            </strong>

                            <div>
                                Customer:
                                ${escapeHTML(
                                    order.customerName ||
                                        order.customerEmail ||
                                        "-"
                                )}
                            </div>

                            <div>
                                Amount:
                                ${money(
                                    order.total ||
                                        order.amount ||
                                        0
                                )}
                            </div>

                            <div>
                                Status:
                                ${escapeHTML(
                                    order.status ||
                                        "pending"
                                )}
                            </div>

                        </div>
                    `
                          )
                          .join("")
                    : "<p>No orders found.</p>"
            }
        `;
    }

    /* =========================================================
       CUSTOMERS
       ========================================================= */

    function renderCustomers() {
        const container =
            findContainer("customers");

        if (!container) return;

        const users = getData(
            KEYS.users,
            []
        );

        container.innerHTML = `
            <h2>Customers</h2>

            <div style="margin-bottom:15px;">
                Total Customers:
                <strong>${users.length}</strong>
            </div>

            ${
                users.length
                    ? users
                          .map(
                              user => `
                        <div
                            class="admin-card"
                            style="
                                background:#fff;
                                border:1px solid #e5e5e5;
                                border-radius:12px;
                                padding:15px;
                                margin-bottom:10px;
                            "
                        >

                            <strong>
                                ${escapeHTML(
                                    user.name ||
                                        user.email ||
                                        "Customer"
                                )}
                            </strong>

                            <div>
                                Email:
                                ${escapeHTML(
                                    user.email ||
                                        "-"
                                )}
                            </div>

                            <div>
                                Phone:
                                ${escapeHTML(
                                    user.phone ||
                                        "-"
                                )}
                            </div>

                        </div>
                    `
                          )
                          .join("")
                    : "<p>No customers found.</p>"
            }
        `;
    }

    /* =========================================================
       REPORTS
       ========================================================= */

    function renderReports() {
        const container = findContainer("reports");
        if (!container) return;
        const sellers = getSellers();
        const products = getProducts();
        const orders = getData(KEYS.orders, []);
        const users = getData(KEYS.users, []);
        const approvedSellers = sellers.filter(s => s.status === "approved").length;
        const pendingSellers = sellers.filter(s => (s.status || "pending") === "pending").length;
        const blockedSellers = sellers.filter(s => ["blocked", "held"].includes(s.status)).length;
        const approvedProducts = products.filter(p => p.status === "approved").length;
        const pendingProducts = products.filter(p => (p.status || "pending") === "pending").length;
        const rejectedProducts = products.filter(p => p.status === "rejected").length;
        const revenue = orders.reduce((sum, order) => sum + Number(order.total || order.amount || 0), 0);
        const reportCards = [
          ["Seller approvals", approvedSellers, pendingSellers, "fa-users"],
          ["Product approvals", approvedProducts, pendingProducts, "fa-boxes-stacked"],
          ["Seller restrictions", blockedSellers, "", "fa-user-lock"],
          ["Customer base", users.length, "", "fa-user-group"],
          ["Orders", orders.length, "", "fa-bag-shopping"],
          ["Order value", money(revenue), "", "fa-indian-rupee-sign"]
        ];
        container.innerHTML = `
          <div class="admin-reports-shell">
            <div class="admin-report-hero"><div><span class="seller-kicker">ANALYTICS & REPORTING</span><h1>Reports & Insights</h1><p>At-a-glance operational metrics with room for future backend analytics, exports and date-range reporting.</p></div><div class="admin-report-hero-icon"><i class="fa-solid fa-chart-column"></i></div></div>
            <div class="admin-report-grid">${reportCards.map(([title,main,sub,icon]) => `<article class="admin-report-card"><div class="admin-report-card-top"><span>${title}</span><i class="fa-solid ${icon}"></i></div><strong>${main}</strong>${sub !== "" ? `<small>${sub} pending / attention</small>` : `<small>Current recorded value</small>`}</article>`).join("")}</div>
            <div class="admin-report-panel"><div><span class="seller-kicker">PRODUCT MIX</span><h2>Product Status Distribution</h2></div><div class="admin-report-bars"><div><span>Approved</span><b>${approvedProducts}</b><i style="--bar:${products.length ? Math.round(approvedProducts / products.length * 100) : 0}%"></i></div><div><span>Pending</span><b>${pendingProducts}</b><i style="--bar:${products.length ? Math.round(pendingProducts / products.length * 100) : 0}%"></i></div><div><span>Rejected</span><b>${rejectedProducts}</b><i style="--bar:${products.length ? Math.round(rejectedProducts / products.length * 100) : 0}%"></i></div></div></div>
          </div>`;
    }

    /* =========================================================
       SETTINGS
       ========================================================= */

    function renderSettings() {
        const container =
            findContainer("settings");

        if (!container) return;

        const settings = getData(
            KEYS.settings,
            {}
        );

        const defaults = {
            customerPrice: 99,
            maxSellerPrice: 70,
            deliveryFee: 0,
            lowStockAlertThreshold: 5,
            storeName: "ShopMax99",
            storeStatus: "open",
            supportEmail: "",
            supportPhone: "",
            codEnabled: true,
            upiEnabled: true,
            netBankingEnabled: true,
            cardEnabled: true
        };

        const cfg = {
            ...defaults,
            ...settings
        };

        const checked = value =>
            value ? "checked" : "";

        container.innerHTML = `
            <h2>Settings</h2>

            <form
                id="shopmax99AdminSettingsForm"
                style="max-width:760px;"
            >

                <div style="
                    background:#fff;
                    border:1px solid #e5e5e5;
                    border-radius:12px;
                    padding:18px;
                    margin-bottom:14px;
                ">

                    <h3>
                        Pricing & Delivery
                    </h3>

                    <label>
                        Customer Price
                    </label>

                    <input
                        type="number"
                        id="adminCustomerPrice"
                        value="${escapeHTML(
                            cfg.customerPrice
                        )}"
                        min="1"
                        style="
                            width:100%;
                            padding:10px;
                            margin:6px 0 14px;
                        "
                    >

                    <label>
                        Maximum Seller Price
                    </label>

                    <input
                        type="number"
                        id="adminMaxSellerPrice"
                        value="${escapeHTML(
                            cfg.maxSellerPrice
                        )}"
                        min="1"
                        max="70"
                        style="
                            width:100%;
                            padding:10px;
                            margin:6px 0 14px;
                        "
                    >

                    <label>
                        Delivery Fee
                    </label>

                    <input
                        type="number"
                        id="adminDeliveryFee"
                        value="${escapeHTML(
                            cfg.deliveryFee
                        )}"
                        min="0"
                        style="
                            width:100%;
                            padding:10px;
                            margin:6px 0 14px;
                        "
                    >

                    <label>
                        Low Stock Alert Threshold
                    </label>

                    <input
                        type="number"
                        id="adminLowStockThreshold"
                        value="${escapeHTML(
                            cfg.lowStockAlertThreshold
                        )}"
                        min="0"
                        style="
                            width:100%;
                            padding:10px;
                            margin:6px 0 0;
                        "
                    >

                </div>

                <div style="
                    background:#fff;
                    border:1px solid #e5e5e5;
                    border-radius:12px;
                    padding:18px;
                    margin-bottom:14px;
                ">

                    <h3>
                        Store Information
                    </h3>

                    <label>
                        Store Name
                    </label>

                    <input
                        type="text"
                        id="adminStoreName"
                        value="${escapeHTML(
                            cfg.storeName
                        )}"
                        style="
                            width:100%;
                            padding:10px;
                            margin:6px 0 14px;
                        "
                    >

                    <label>
                        Store Status
                    </label>

                    <select
                        id="adminStoreStatus"
                        style="
                            width:100%;
                            padding:10px;
                            margin:6px 0 14px;
                        "
                    >
                        <option
                            value="open"
                            ${
                                cfg.storeStatus ===
                                "open"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Open
                        </option>

                        <option
                            value="closed"
                            ${
                                cfg.storeStatus ===
                                "closed"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Closed
                        </option>

                        <option
                            value="maintenance"
                            ${
                                cfg.storeStatus ===
                                "maintenance"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Maintenance
                        </option>
                    </select>

                    <label>
                        Support Email
                    </label>

                    <input
                        type="email"
                        id="adminSupportEmail"
                        value="${escapeHTML(
                            cfg.supportEmail
                        )}"
                        style="
                            width:100%;
                            padding:10px;
                            margin:6px 0 14px;
                        "
                    >

                    <label>
                        Support Phone
                    </label>

                    <input
                        type="tel"
                        id="adminSupportPhone"
                        value="${escapeHTML(
                            cfg.supportPhone
                        )}"
                        style="
                            width:100%;
                            padding:10px;
                            margin:6px 0 0;
                        "
                    >

                </div>

                <div style="
                    background:#fff;
                    border:1px solid #e5e5e5;
                    border-radius:12px;
                    padding:18px;
                    margin-bottom:14px;
                ">

                    <h3>
                        Payment Options
                    </h3>

                    <label style="
                        display:flex;
                        align-items:center;
                        gap:10px;
                        margin:10px 0;
                    ">
                        <input
                            type="checkbox"
                            id="adminCODEnabled"
                            ${checked(
                                cfg.codEnabled
                            )}
                        >
                        <span>
                            Cash on Delivery
                        </span>
                    </label>

                    <label style="
                        display:flex;
                        align-items:center;
                        gap:10px;
                        margin:10px 0;
                    ">
                        <input
                            type="checkbox"
                            id="adminUPIEnabled"
                            ${checked(
                                cfg.upiEnabled
                            )}
                        >
                        <span>UPI</span>
                    </label>

                    <label style="
                        display:flex;
                        align-items:center;
                        gap:10px;
                        margin:10px 0;
                    ">
                        <input
                            type="checkbox"
                            id="adminNetBankingEnabled"
                            ${checked(
                                cfg.netBankingEnabled
                            )}
                        >
                        <span>
                            Net Banking
                        </span>
                    </label>

                    <label style="
                        display:flex;
                        align-items:center;
                        gap:10px;
                        margin:10px 0;
                    ">
                        <input
                            type="checkbox"
                            id="adminCardEnabled"
                            ${checked(
                                cfg.cardEnabled
                            )}
                        >
                        <span>
                            Credit / Debit Card
                        </span>
                    </label>

                </div>

                <button
                    type="submit"
                    style="
                        padding:11px 18px;
                        font-weight:700;
                    "
                >
                    Save Settings
                </button>

            </form>
        `;
    }

    /* =========================================================
       TRANSACTIONS
       ========================================================= */

    function getTransactions() {
        const transactions =
            getData(
                KEYS.transactions,
                []
            );

        return Array.isArray(
            transactions
        )
            ? transactions
            : [];
    }

    function saveTransactions(items) {
        const activeBankId = window.ShopMax99?.bank?.getActiveAccount?.()?.id || "BANK-CURRENT-001";
        const enriched = (Array.isArray(items) ? items : []).map(item => ({ ...item, bankAccountId: item.bankAccountId || activeBankId }));
        saveData(KEYS.transactions, enriched);
    }

    function transactionCategoryLabel(
        category
    ) {
        const labels = {
            order: "Order",
            seller: "Seller",
            courier: "Courier Partner",
            customer: "Customer",
            platform: "Platform",
            payout: "Payout",
            charge: "Charge",
            other: "Other"
        };

        return (
            labels[
                String(
                    category || "other"
                ).toLowerCase()
            ] || "Other"
        );
    }

    function syncOrderTransactions() {
        const orders = getData(
            KEYS.orders,
            []
        );

        const sellers = getSellers();

        const transactions =
            getTransactions();

        const existing = new Set(
            transactions.map(
                transaction =>
                    String(
                        transaction.id ||
                            ""
                    )
            )
        );

        orders.forEach(order => {
            const orderId = String(
                order.id || ""
            );

            if (!orderId) return;

            (
                Array.isArray(order.items)
                    ? order.items
                    : []
            ).forEach(
                (item, index) => {
                    const sellerEmail =
                        String(
                            item.sellerEmail ||
                                ""
                        )
                            .trim()
                            .toLowerCase();

                    if (!sellerEmail)
                        return;

                    const seller =
                        sellers.find(
                            itemSeller =>
                                String(
                                    itemSeller.email ||
                                        ""
                                )
                                    .trim()
                                    .toLowerCase() ===
                                sellerEmail
                        );

                    const amount =
                        Number(
                            item.sellerPrice ||
                                0
                        ) *
                        Number(
                            item.quantity ||
                                1
                        );

                    const txId =
                        `TX-ORDER-${orderId}-${index}-${sellerEmail}`;

                    if (
                        existing.has(
                            txId
                        )
                    ) {
                        return;
                    }

                    transactions.push({
                        id: txId,
                        category: "order",
                        type: "credit",
                        amount,
                        partyId:
                            seller?.id ||
                            sellerEmail,
                        partyName:
                            seller?.shopName ||
                            seller?.name ||
                            sellerEmail,
                        sellerId:
                            seller?.id ||
                            "",
                        sellerEmail,
                        reference:
                            orderId,
                        description:
                            `Seller earning from ${orderId} - ${
                                item.name ||
                                "Product"
                            }`,
                        status:
                            "completed",
                        createdAt:
                            order.date ||
                            new Date().toISOString()
                    });

                    existing.add(
                        txId
                    );
                }
            );
        });

        saveTransactions(
            transactions
        );

        return transactions;
    }

    function renderTransactions() {
        const container =
            findContainer(
                "transactions"
            );

        if (!container)
            return;

        const transactions =
            syncOrderTransactions().sort(
                (a, b) =>
                    new Date(
                        b.createdAt ||
                            0
                    ) -
                    new Date(
                        a.createdAt ||
                            0
                    )
            );

        const credits =
            transactions
                .filter(
                    item =>
                        String(
                            item.type
                        ).toLowerCase() ===
                        "credit"
                )
                .reduce(
                    (sum, item) =>
                        sum +
                        Number(
                            item.amount ||
                                0
                        ),
                    0
                );

        const debits =
            transactions
                .filter(
                    item =>
                        String(
                            item.type
                        ).toLowerCase() ===
                        "debit"
                )
                .reduce(
                    (sum, item) =>
                        sum +
                        Number(
                            item.amount ||
                                0
                        ),
                    0
                );

        const rows =
            transactions.length
                ? transactions
                      .map(
                          transaction => {
                              const credit =
                                  String(
                                      transaction.type
                                  ).toLowerCase() ===
                                  "credit";

                              return `
                                <tr>
                                    <td>
                                        ${escapeHTML(
                                            new Date(
                                                transaction.createdAt ||
                                                    Date.now()
                                            ).toLocaleString()
                                        )}
                                    </td>

                                    <td>
                                        <strong>
                                            ${escapeHTML(
                                                transactionCategoryLabel(
                                                    transaction.category
                                                )
                                            )}
                                        </strong>
                                    </td>

                                    <td>
                                        ${escapeHTML(
                                            transaction.partyName ||
                                                transaction.sellerEmail ||
                                                "-"
                                        )}
                                    </td>

                                    <td>
                                        ${escapeHTML(
                                            transaction.reference ||
                                                transaction.orderId ||
                                                "-"
                                        )}
                                    </td>

                                    <td style="
                                        color:${
                                            credit
                                                ? "#138a3d"
                                                : "#c62828"
                                        };
                                        font-weight:700;
                                    ">
                                        ${
                                            credit
                                                ? "+"
                                                : "-"
                                        }${money(
                                            transaction.amount
                                        )}
                                    </td>

                                    <td>
                                        ${escapeHTML(
                                            transaction.description ||
                                                "-"
                                        )}
                                    </td>

                                    <td>
                                        ${escapeHTML(
                                            transaction.status ||
                                                "completed"
                                        )}
                                    </td>
                                </tr>
                            `;
                          }
                      )
                      .join("")
                : `
                    <tr>
                        <td
                            colspan="7"
                            style="
                                text-align:center;
                                padding:35px;
                                color:#777;
                            "
                        >
                            No transactions yet.
                        </td>
                    </tr>
                `;

        container.innerHTML = `
            <div
                class="admin-card"
                style="padding:20px;"
            >

                <h2>
                    Transactions
                </h2>

                <div style="
                    display:flex;
                    gap:12px;
                    flex-wrap:wrap;
                    margin:18px 0;
                ">

                    <div style="
                        padding:14px 18px;
                        background:#eefaf2;
                        border-radius:10px;
                    ">
                        <small>
                            Total Credit
                        </small>

                        <strong style="
                            display:block;
                            color:#138a3d;
                            font-size:20px;
                        ">
                            ${money(
                                credits
                            )}
                        </strong>
                    </div>

                    <div style="
                        padding:14px 18px;
                        background:#fff0f0;
                        border-radius:10px;
                    ">
                        <small>
                            Total Debit
                        </small>

                        <strong style="
                            display:block;
                            color:#c62828;
                            font-size:20px;
                        ">
                            ${money(
                                debits
                            )}
                        </strong>
                    </div>

                    <div style="
                        padding:14px 18px;
                        background:#f5f3ff;
                        border-radius:10px;
                    ">
                        <small>
                            Transactions
                        </small>

                        <strong style="
                            display:block;
                            font-size:20px;
                        ">
                            ${
                                transactions.length
                            }
                        </strong>
                    </div>

                </div>

                <div style="
                    overflow:auto;
                ">
                    <table style="
                        width:100%;
                        border-collapse:collapse;
                        min-width:900px;
                    ">

                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Category</th>
                                <th>Party</th>
                                <th>Reference</th>
                                <th>Amount</th>
                                <th>Description</th>
                                <th>Status</th>
                            </tr>
                        </thead>

                        <tbody>
                            ${rows}
                        </tbody>

                    </table>
                </div>

            </div>
        `;
    }

    /* =========================================================
       SECTION RENDER
       ========================================================= */

    function renderAdminSection(
        section
    ) {
        switch (
            normalizeSection(section)
        ) {
            case "dashboard":
                renderDashboard();
                break;

            case "seller-accounts":
            case "pending-seller-approval":
            case "all-sellers":
            case "blocked-held-sellers":
                renderSellers();
                break;

            case "all-products":
            case "pending-products":
            case "approved-products":
            case "rejected-products":
            case "product-edit":
                renderProducts();
                break;

            case "orders":
                renderOrders();
                break;

            case "customers":
                renderCustomers();
                break;

            case "reports":
                renderReports();
                break;

            case "transactions":
                renderTransactions();
                break;

            case "bank-account":
                if (typeof window.renderAdminBankAccount === "function") window.renderAdminBankAccount();
                break;

            case "settings":
                renderSettings();
                break;

            case "support-staff":
                if (typeof window.renderAdminSupportStaff === "function") window.renderAdminSupportStaff();
                break;

            case "support-requests":
                if (typeof window.renderAdminSupportRequests === "function") window.renderAdminSupportRequests();
                break;

            case "support-audit":
                if (typeof window.renderAdminSupportAudit === "function") window.renderAdminSupportAudit();
                break;

            case "pay-to-staff":
                if (typeof window.renderAdminPayToStaff === "function") window.renderAdminPayToStaff();
                break;
        }
    }

    function renderAllAdminSections() {
        renderDashboard();
        renderSellers();
        renderProducts();
        renderOrders();
        renderCustomers();
        renderReports();
        renderTransactions();
        if (typeof window.renderAdminBankAccount === "function") window.renderAdminBankAccount();
        renderSettings();
        if (typeof window.renderAdminSupportStaff === "function") window.renderAdminSupportStaff();
        if (typeof window.renderAdminSupportRequests === "function") window.renderAdminSupportRequests();
        if (typeof window.renderAdminSupportAudit === "function") window.renderAdminSupportAudit();
        if (typeof window.renderAdminPayToStaff === "function") window.renderAdminPayToStaff();
    }

    /* =========================================================
       ADMIN LOGOUT
       ========================================================= */

    function adminLogout() {
        localStorage.removeItem(
            "shopmax99_admin_session"
        );

        notify(
            "Admin logout ho gaya."
        );

        if (
            typeof window.ShopMax99?.showRole ===
            "function"
        ) {
            window.ShopMax99.showRole(
                "customer"
            );
        }

        if (
            typeof window.showCustomerSection ===
            "function"
        ) {
            window.showCustomerSection(
                "home"
            );
        }
    }

    window.adminLogout =
        adminLogout;

    window.showAdminPage =
        showAdminSection;

    window.renderAdminDashboard = renderDashboard;

    /* =========================================================
       ADMIN CLICK HANDLER
       ========================================================= */

    function handleAdminClick(
        event
    ) {
        /* Admin sidebar navigation is handled here as well as through the
           common app bridge, so it remains functional even if the common
           navigation listener is changed or loaded in a different order. */
        const pageButton = event.target.closest("[data-admin-page]");
        if (pageButton) {
            event.preventDefault();
            event.stopPropagation();
            showAdminSection(pageButton.dataset.adminPage);
            return;
        }

        const button =
            event.target.closest(
                "[data-admin-action]"
            );

        if (!button) return;

        const action =
            button.dataset.adminAction;

        const id =
            button.dataset.id;

        if (sectionAliases[action]) {
            event.preventDefault();
            showAdminSection(action);
            return;
        }

        switch (action) {
            case "approve-seller":
                event.preventDefault();
                approveSeller(id);
                break;

            case "reject-seller":
                event.preventDefault();
                rejectSeller(id);
                break;

            case "block-seller":
                event.preventDefault();
                blockSeller(id);
                break;

            case "unblock-seller":
                event.preventDefault();
                unblockSeller(id);
                break;

            case "delete-seller":
                event.preventDefault();
                deleteSeller(id);
                break;

            case "approve-product":
                event.preventDefault();
                approveProduct(id);
                break;

            case "reject-product":
                event.preventDefault();
                rejectProduct(id);
                break;

            case "edit-product":
                event.preventDefault();
                editProduct(id);
                break;

            case "delete-product":
                event.preventDefault();
                deleteProduct(id);
                break;

            case "maintenance-toggle":
                event.preventDefault();
                if (typeof window.ShopMax99?.maintenance?.openControl === "function") {
                    window.ShopMax99.maintenance.openControl();
                } else {
                    alert("Maintenance control is currently unavailable.");
                }
                break;

            case "admin-logout":
                event.preventDefault();
                adminLogout();
                break;
        }
    }

    /* =========================================================
       SETTINGS FORM
       ========================================================= */

    function handleFormSubmit(
        event
    ) {
        if (
            event.target.id !==
            "shopmax99AdminSettingsForm"
        ) {
            return;
        }

        event.preventDefault();

        const customerPrice =
            Number(
                document.getElementById(
                    "adminCustomerPrice"
                )?.value
            );

        const maxSellerPrice =
            Number(
                document.getElementById(
                    "adminMaxSellerPrice"
                )?.value
            );

        if (
            !customerPrice ||
            customerPrice < 1
        ) {
            alert(
                "Customer price valid hona chahiye."
            );
            return;
        }

        if (
            !maxSellerPrice ||
            maxSellerPrice > 70
        ) {
            alert(
                "Maximum seller price ₹70 se zyada nahi ho sakta."
            );
            return;
        }

        const deliveryFee =
            Number(
                document.getElementById(
                    "adminDeliveryFee"
                )?.value
            );

        const lowStockAlertThreshold =
            Number(
                document.getElementById(
                    "adminLowStockThreshold"
                )?.value
            );

        const storeName =
            String(
                document.getElementById(
                    "adminStoreName"
                )?.value ||
                    "ShopMax99"
            ).trim();

        const storeStatus =
            String(
                document.getElementById(
                    "adminStoreStatus"
                )?.value ||
                    "open"
            );

        const supportEmail =
            String(
                document.getElementById(
                    "adminSupportEmail"
                )?.value ||
                    ""
            ).trim();

        const supportPhone =
            String(
                document.getElementById(
                    "adminSupportPhone"
                )?.value ||
                    ""
            ).trim();

        if (
            !Number.isFinite(
                deliveryFee
            ) ||
            deliveryFee < 0
        ) {
            alert(
                "Delivery fee valid hona chahiye."
            );
            return;
        }

        if (
            !Number.isFinite(
                lowStockAlertThreshold
            ) ||
            lowStockAlertThreshold < 0
        ) {
            alert(
                "Low stock threshold valid hona chahiye."
            );
            return;
        }

        saveData(
            KEYS.settings,
            {
                customerPrice,
                maxSellerPrice,
                deliveryFee,
                lowStockAlertThreshold,
                storeName:
                    storeName ||
                    "ShopMax99",
                storeStatus,
                supportEmail,
                supportPhone,
                codEnabled:
                    !!document.getElementById(
                        "adminCODEnabled"
                    )?.checked,
                upiEnabled:
                    !!document.getElementById(
                        "adminUPIEnabled"
                    )?.checked,
                netBankingEnabled:
                    !!document.getElementById(
                        "adminNetBankingEnabled"
                    )?.checked,
                cardEnabled:
                    !!document.getElementById(
                        "adminCardEnabled"
                    )?.checked
            }
        );

        notify(
            "Settings saved successfully."
        );
    }

    /* =========================================================
       GENERIC ADMIN NAVIGATION
       ========================================================= */

    function handleGenericAdminNavigation(
        event
    ) {
        const element =
            event.target.closest(
                "[data-admin-section-link]"
            );

        if (!element) return;

        const section =
            element.dataset
                .adminSectionLink;

        if (!section) return;

        event.preventDefault();

        showAdminSection(section);
    }

    /* =========================================================
       ADMIN WORKSPACE
       ========================================================= */

    function buildAdminWorkspace() {
        const pages =
            document.getElementById(
                "adminPages"
            );

        if (
            !pages ||
            pages.dataset.built === "1"
        ) {
            return;
        }

        const names = [
            "dashboard",
            "seller-accounts",
            "pending-seller-approval",
            "all-sellers",
            "blocked-held-sellers",
            "all-products",
            "pending-products",
            "approved-products",
            "rejected-products",
            "product-edit",
            "orders",
            "customers",
            "reports",
            "transactions",
            "bank-account",
            "settings",
            "support-staff",
            "support-requests",
            "support-audit",
            "pay-to-staff"
        ];

        pages.innerHTML =
            names
                .map(
                    name => `
                        <section
                            class="admin-section"
                            data-admin-section="${name}"
                            data-admin-content="${name}"
                            style="display:none"
                        ></section>
                    `
                )
                .join("");

        pages.dataset.built = "1";
    }

    function initAdmin() {
        if (
            window.__shopmax99AdminInitialized
        ) {
            return;
        }

        window.__shopmax99AdminInitialized =
            true;

        buildAdminWorkspace();

        document.addEventListener(
            "click",
            handleAdminClick
        );

        document.addEventListener(
            "click",
            handleGenericAdminNavigation
        );

        document.addEventListener(
            "submit",
            handleFormSubmit
        );

        renderAllAdminSections();
    }

    window.initAdminCenter =
        initAdmin;

    /* =========================================================
       SELLER / ADMIN LOGIN OTP
       ========================================================= */

    const ROLE_LOGIN_OTP = {
        seller: {
            formId:
                "sellerLoginForm",

            mobileId:
                "sellerLoginMobile",

            otpId:
                "sellerLoginOTP",

            buttonId:
                "sellerLoginSubmitBtn",

            stateKey:
                "shopmax99_seller_login_otp"
        },

        admin: {
            formId:
                "adminLoginForm",

            mobileId:
                "adminLoginMobile",

            otpId:
                "adminLoginOTP",

            buttonId:
                "adminLoginSubmitBtn",

            stateKey:
                "shopmax99_admin_login_otp"
        }
    };

    function normalizeLoginPhone(
        value
    ) {
        const digits =
            String(value || "")
                .replace(/\D/g, "");

        return digits.length > 10
            ? digits.slice(-10)
            : digits;
    }

    function validLoginPhone(
        value
    ) {
        return /^[6-9]\d{9}$/.test(
            normalizeLoginPhone(
                value
            )
        );
    }

    function getSellerRecordsForAuth() {
        const possibleKeys = [
            "shopmax99_sellers",
            "shopmax99Sellers",
            "shopmax99_seller_accounts",
            "shopmax99SellerAccounts"
        ];

        for (
            const key of possibleKeys
        ) {
            try {
                const raw =
                    localStorage.getItem(
                        key
                    );

                if (!raw) continue;

                const parsed =
                    JSON.parse(raw);

                if (
                    Array.isArray(
                        parsed
                    )
                ) {
                    return parsed.filter(
                        item =>
                            item &&
                            typeof item ===
                                "object"
                    );
                }

                if (
                    parsed &&
                    typeof parsed ===
                        "object"
                ) {
                    return Object.values(
                        parsed
                    ).filter(
                        item =>
                            item &&
                            typeof item ===
                                "object"
                    );
                }
            } catch (
                error
            ) {
                console.warn(
                    "Seller auth storage read failed:",
                    error
                );
            }
        }

        return [];
    }

    function sellerAuthEmail(
        seller
    ) {
        return String(
            seller?.email ??
                seller?.sellerEmail ??
                seller?.loginEmail ??
                seller?.username ??
                seller?.login?.email ??
                seller?.credentials
                    ?.email ??
                ""
        )
            .trim()
            .toLowerCase();
    }

    function sellerAuthPassword(
        seller
    ) {
        return String(
            seller?.password ??
                seller?.sellerPassword ??
                seller?.loginPassword ??
                seller?.pass ??
                seller?.login
                    ?.password ??
                seller?.credentials
                    ?.password ??
                ""
        );
    }

    function sellerAuthPhone(
        seller
    ) {
        return normalizeLoginPhone(
            seller?.phone ??
                seller?.mobile ??
                seller?.mobileNumber ??
                seller?.phoneNumber ??
                seller?.sellerPhone ??
                seller?.contactNumber ??
                ""
        );
    }

    /* =========================================================
       ADD MOBILE + OTP FIELDS TO LOGIN FORMS
       ========================================================= */

    function ensureRoleLoginFields(
        role
    ) {
        const cfg =
            ROLE_LOGIN_OTP[role];

        const form =
            document.getElementById(
                cfg.formId
            );

        if (!form) return null;

        let mobile =
            document.getElementById(
                cfg.mobileId
            );

        let otp =
            document.getElementById(
                cfg.otpId
            );

        let button =
            document.getElementById(
                cfg.buttonId
            );

        let demoBox =
            form.querySelector(
                "[data-shopmax99-demo-otp]"
            );

        const passwordInput =
            document.getElementById(
                role === "seller"
                    ? "sellerLoginPassword"
                    : "adminLoginPassword"
            );

        /* =====================================================
           MOBILE FIELD
           ===================================================== */

        if (!mobile) {
            const group =
                document.createElement(
                    "div"
                );

            group.className =
                "form-group shopmax99-role-mobile-group";

            group.innerHTML = `
                <label
                    for="${cfg.mobileId}"
                >
                    Mobile Number
                </label>

                <div style="
                    display:flex;
                    align-items:stretch;
                ">

                    <span style="
                        display:flex;
                        align-items:center;
                        padding:0 12px;
                        border:1px solid #ddd;
                        border-right:0;
                        border-radius:8px 0 0 8px;
                        background:#f7f3fb;
                        color:#4a15a4;
                        font-weight:700;
                    ">
                        +91
                    </span>

                    <input
                        type="tel"
                        id="${cfg.mobileId}"
                        name="mobile"
                        inputmode="numeric"
                        maxlength="10"
                        placeholder="10-digit mobile number"
                        autocomplete="tel"
                        style="
                            border-radius:
                                0 8px 8px 0;
                            flex:1;
                        "
                    >

                </div>

                <small style="
                    display:block;
                    margin-top:6px;
                    color:#777;
                ">
                    OTP verification ke liye mobile number enter karein.
                </small>
            `;

            if (passwordInput) {
                const passwordGroup =
                    passwordInput.closest(
                        ".form-group"
                    );

                if (passwordGroup) {
                    passwordGroup.insertAdjacentElement(
                        "afterend",
                        group
                    );
                } else {
                    form.appendChild(
                        group
                    );
                }
            } else {
                form.insertBefore(
                    group,
                    form.firstChild
                );
            }

            mobile =
                document.getElementById(
                    cfg.mobileId
                );
        }

        /* =====================================================
           OTP FIELD
           ===================================================== */

        if (!otp) {
            const group =
                document.createElement(
                    "div"
                );

            group.className =
                "form-group shopmax99-role-otp-group";

            group.hidden = true;

            group.innerHTML = `
                <label
                    for="${cfg.otpId}"
                >
                    OTP Verification
                </label>

                <input
                    type="text"
                    id="${cfg.otpId}"
                    name="otp"
                    inputmode="numeric"
                    maxlength="6"
                    autocomplete="one-time-code"
                    placeholder="Enter 6-digit OTP"
                >

                <small style="
                    display:block;
                    margin-top:6px;
                    color:#777;
                ">
                    OTP enter karke login complete karein.
                </small>
            `;

            const mobileGroup =
                mobile?.closest(
                    ".form-group"
                );

            if (mobileGroup) {
                mobileGroup.insertAdjacentElement(
                    "afterend",
                    group
                );
            } else {
                form.appendChild(
                    group
                );
            }

            otp =
                document.getElementById(
                    cfg.otpId
                );
        }

        /* =====================================================
           SUBMIT BUTTON ID
           ===================================================== */

        if (!button) {
            button =
                form.querySelector(
                    'button[type="submit"]'
                );

            if (button) {
                button.id =
                    cfg.buttonId;
            }
        }

        /* =====================================================
           DEMO OTP BOX
           ===================================================== */

        if (!demoBox) {
            demoBox =
                document.createElement(
                    "div"
                );

            demoBox.setAttribute(
                "data-shopmax99-demo-otp",
                "1"
            );

            demoBox.hidden = true;

            demoBox.style.cssText = `
                margin:10px 0 14px;
                padding:10px 12px;
                border:1px dashed #d6b64c;
                border-radius:8px;
                background:#fff9df;
                color:#725b00;
                font-size:13px;
                text-align:center;
            `;

            otp
                ?.closest(
                    ".form-group"
                )
                ?.insertAdjacentElement(
                    "afterend",
                    demoBox
                );
        }

        return {
            form,
            mobile,
            otp,
            button,
            demoBox
        };
    }

    /* =========================================================
       OTP HELPERS
       ========================================================= */

    function generateDemoOTP() {
        return String(
            Math.floor(
                100000 +
                    Math.random() *
                        900000
            )
        );
    }

    function savePendingOTP(
        role,
        payload
    ) {
        const cfg =
            ROLE_LOGIN_OTP[role];

        localStorage.setItem(
            cfg.stateKey,
            JSON.stringify(
                payload
            )
        );
    }

    function readPendingOTP(
        role
    ) {
        const cfg =
            ROLE_LOGIN_OTP[role];

        try {
            return JSON.parse(
                localStorage.getItem(
                    cfg.stateKey
                ) || "null"
            );
        } catch {
            return null;
        }
    }

    function clearPendingOTP(
        role
    ) {
        const cfg =
            ROLE_LOGIN_OTP[role];

        localStorage.removeItem(
            cfg.stateKey
        );
    }

    function setRoleLoginButton(
        role,
        verifying
    ) {
        const cfg =
            ROLE_LOGIN_OTP[role];

        const button =
            document.getElementById(
                cfg.buttonId
            );

        if (!button) return;

        button.innerHTML =
            verifying
                ? `
                    Verify OTP & Login
                    <i class="fa-solid fa-shield-halved"></i>
                  `
                : `
                    Send OTP
                    <i class="fa-solid fa-mobile-screen-button"></i>
                  `;
    }

    function showDemoOTP(
        role,
        otp,
        mobile
    ) {
        const ui =
            ensureRoleLoginFields(
                role
            );

        if (!ui?.demoBox)
            return;

        ui.demoBox.hidden = false;

        ui.demoBox.innerHTML = `
            Demo OTP for
            <strong>
                +91 ${escapeHTML(
                    mobile
                )}
            </strong>

            <strong style="
                font-size:17px;
                letter-spacing:2px;
                display:block;
                margin-top:4px;
            ">
                ${escapeHTML(
                    otp
                )}
            </strong>

            <span style="
                display:block;
                margin-top:4px;
                font-size:11px;
            ">
                Frontend prototype —
                real SMS is not sent.
            </span>
        `;
    }

    function clearRoleLoginUI(
        role
    ) {
        const ui =
            ensureRoleLoginFields(
                role
            );

        if (!ui) return;

        ui.form.reset();

        const otpGroup =
            ui.otp?.closest(
                ".form-group"
            );

        if (otpGroup) {
            otpGroup.hidden = true;
        }

        if (ui.demoBox) {
            ui.demoBox.hidden =
                true;
        }

        setRoleLoginButton(
            role,
            false
        );

        clearPendingOTP(
            role
        );
    }

    /* =========================================================
       FINISH SELLER LOGIN
       ========================================================= */

    function finishSellerLogin(
        seller
    ) {
        const email =
            sellerAuthEmail(
                seller
            );

        const phone =
            sellerAuthPhone(
                seller
            );

        const user = {
            id: seller.id,

            name:
                seller.fullName ||
                seller.name ||
                seller.shopName ||
                "Seller",

            email,

            phone,

            role: "seller",

            sellerId:
                seller.id,

            shopName:
                seller.shopName ||
                "",

            createdAt:
                seller.createdAt ||
                new Date().toISOString()
        };

        localStorage.setItem(
            "shopmax99_user",
            JSON.stringify(
                user
            )
        );

        localStorage.setItem(
            "shopmax99CurrentSeller",
            JSON.stringify(
                seller
            )
        );

        localStorage.setItem(
            "currentSeller",
            JSON.stringify(
                seller
            )
        );

        const modal =
            document.getElementById(
                "sellerLoginModal"
            );

        if (modal) {
            modal.hidden = true;
        }

        if (
            typeof window.ShopMax99?.showRole ===
            "function"
        ) {
            window.ShopMax99.showRole(
                "seller"
            );
        } else {
            alert(
                "Seller Center is currently unavailable."
            );
        }

        clearRoleLoginUI(
            "seller"
        );
    }

    /* =========================================================
       FINISH ADMIN LOGIN
       ========================================================= */

    function finishAdminLogin(
        email,
        mobile
    ) {
        localStorage.setItem(
            "shopmax99_admin_session",
            JSON.stringify({
                email,
                mobile,
                role: "admin",
                loggedInAt:
                    new Date().toISOString()
            })
        );

        const modal =
            document.getElementById(
                "adminLoginModal"
            );

        if (modal) {
            modal.hidden = true;
        }

        if (
            typeof window.ShopMax99?.showRole ===
            "function"
        ) {
            window.ShopMax99.showRole(
                "admin"
            );
        } else {
            alert(
                "Admin Control Center is currently unavailable."
            );
        }

        clearRoleLoginUI(
            "admin"
        );
    }

    /* =========================================================
       SELLER / ADMIN LOGIN SUBMIT
       ========================================================= */

    function handleRoleLoginSubmit(
        event
    ) {
        const form =
            event.target;

        if (
            !(form instanceof
                HTMLFormElement)
        ) {
            return;
        }

        let role = null;

        if (
            form.id ===
            ROLE_LOGIN_OTP
                .seller
                .formId
        ) {
            role = "seller";
        }

        if (
            form.id ===
            ROLE_LOGIN_OTP
                .admin
                .formId
        ) {
            role = "admin";
        }

        if (!role) return;

        /*
         * IMPORTANT:
         * Capture phase mein old inline
         * login handler se pehle ye chalega.
         */
        event.preventDefault();
        event.stopImmediatePropagation();

        const ui =
            ensureRoleLoginFields(
                role
            );

        if (!ui) return;

        const emailInput =
            document.getElementById(
                role === "seller"
                    ? "sellerLoginEmail"
                    : "adminLoginEmail"
            );

        const passwordInput =
            document.getElementById(
                role === "seller"
                    ? "sellerLoginPassword"
                    : "adminLoginPassword"
            );

        const email =
            String(
                emailInput?.value ||
                    ""
            )
                .trim()
                .toLowerCase();

        const password =
            String(
                passwordInput?.value ||
                    ""
            );

        const mobile =
            normalizeLoginPhone(
                ui.mobile?.value ||
                    ""
            );

        const enteredOTP =
            String(
                ui.otp?.value ||
                    ""
            ).trim();

        const pending =
            readPendingOTP(
                role
            );

        if (!email || !password) {
            alert(
                "Please enter email and password."
            );
            return;
        }

        if (
            !validLoginPhone(
                mobile
            )
        ) {
            alert(
                "Please enter a valid 10-digit Indian mobile number."
            );
            return;
        }

        /* =====================================================
           SELLER LOGIN
           ===================================================== */

        if (role === "seller") {
            const sellers =
                getSellerRecordsForAuth();

            const seller =
                sellers.find(
                    item =>
                        sellerAuthEmail(
                            item
                        ) === email
                );

            if (!seller) {
                alert(
                    "Seller account not found. Please register first."
                );
                return;
            }

            if (
                sellerAuthPassword(
                    seller
                ) !== password
            ) {
                alert(
                    "Incorrect seller email or password."
                );
                return;
            }

            const savedPhone =
                sellerAuthPhone(
                    seller
                );

            if (
                !savedPhone
            ) {
                alert(
                    "This seller account has no registered mobile number. Please update the seller account first."
                );
                return;
            }

            if (
                savedPhone !==
                mobile
            ) {
                alert(
                    "Mobile number does not match the seller account."
                );
                return;
            }

            const status =
                String(
                    seller.status ||
                        seller.accountStatus ||
                        seller.approvalStatus ||
                        "pending"
                )
                    .trim()
                    .toLowerCase();

            if (
                status ===
                    "blocked" ||
                status ===
                    "rejected"
            ) {
                alert(
                    `Your seller account is currently ${status}. Please contact ShopMax99 support.`
                );
                return;
            }

            if (
                status !==
                    "approved" &&
                status !==
                    "active"
            ) {
                alert(
                    "Your seller account is still pending admin approval."
                );
                return;
            }

            /*
             * First submit:
             * generate OTP.
             */
            if (
                !pending ||
                pending.email !==
                    email ||
                pending.mobile !==
                    mobile
            ) {
                const otp =
                    generateDemoOTP();

                savePendingOTP(
                    role,
                    {
                        email,
                        mobile,
                        otp,
                        createdAt:
                            Date.now(),
                        expiresAt:
                            Date.now() +
                            5 *
                                60 *
                                1000
                    }
                );

                const otpGroup =
                    ui.otp?.closest(
                        ".form-group"
                    );

                if (otpGroup) {
                    otpGroup.hidden =
                        false;
                }

                showDemoOTP(
                    role,
                    otp,
                    mobile
                );

                setRoleLoginButton(
                    role,
                    true
                );

                ui.otp?.focus();

                return;
            }

            if (
                Date.now() >
                Number(
                    pending.expiresAt ||
                        0
                )
            ) {
                clearPendingOTP(
                    role
                );

                alert(
                    "OTP expired. Please send a new OTP."
                );

                setRoleLoginButton(
                    role,
                    false
                );

                return;
            }

            if (
                enteredOTP !==
                String(
                    pending.otp
                )
            ) {
                alert(
                    "Incorrect OTP. Please enter the OTP shown for this login."
                );
                return;
            }

            finishSellerLogin(
                seller
            );

            return;
        }

        /* =====================================================
           ADMIN LOGIN
           ===================================================== */

        const adminCredentials = getAdminCredentials();
        const ADMIN_EMAIL = adminCredentials.email;
        const ADMIN_PASSWORD = adminCredentials.password;

        if (
            email !== ADMIN_EMAIL ||
            password !== ADMIN_PASSWORD
        ) {
            alert(
                "Incorrect admin email or password."
            );
            return;
        }

        /*
         * ADMIN LOGIN
         * -----------------------------------------------------
         * Admin ALWAYS requires a fresh OTP after email, password
         * and registered mobile validation. Never create the admin
         * session before the OTP has been verified.
         */
        if (
            !pending ||
            pending.email !== email ||
            pending.mobile !== mobile
        ) {
            const otp = generateDemoOTP();
            savePendingOTP(role, {
                email,
                mobile,
                otp,
                createdAt: Date.now(),
                expiresAt: Date.now() + 5 * 60 * 1000
            });

            const otpGroup = ui.otp?.closest('.form-group');
            if (otpGroup) otpGroup.hidden = false;
            showDemoOTP(role, otp, mobile);
            setRoleLoginButton(role, true);
            ui.otp?.focus();
            return;
        }

        if (Date.now() > Number(pending.expiresAt || 0)) {
            clearPendingOTP(role);
            alert('OTP expired. Please request a new OTP.');
            setRoleLoginButton(role, false);
            return;
        }

        if (enteredOTP !== String(pending.otp)) {
            alert('Incorrect OTP. Please enter the OTP shown for this login.');
            return;
        }

        clearPendingOTP(role);
        finishAdminLogin(email, mobile);
    }

    /* =========================================================
       LOGO FIX + LOGIN INITIALIZATION
       ========================================================= */

    function fixLoginLogos() {
        document
            .querySelectorAll(
                ".login-form-logo img"
            )
            .forEach(image => {
                image.src =
                    "image/logo.max99.png";

                image.alt =
                    "ShopMax99";

                image.onerror =
                    function () {
                        this.onerror =
                            null;

                        this.src =
                            "./image/logo.max99.png";
                    };
            });
    }

    function initRoleLoginFix() {
        ensureRoleLoginFields(
            "seller"
        );

        ensureRoleLoginFields(
            "admin"
        );

        fixLoginLogos();

        /*
         * Capture listener:
         * old inline sellerLogin/adminLogin
         * ko OTP verification se pehle
         * login complete karne se rokta hai.
         */
        document.addEventListener(
            "submit",
            handleRoleLoginSubmit,
            true
        );
    }

    /* =========================================================
       INITIALIZATION
       ========================================================= */

    function startShopMax99Admin() {
        getAdminCredentials();
        initAdmin();
        initRoleLoginFix();
        initAdminRecovery();
        fixLoginLogos();
    }

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            startShopMax99Admin
        );
    } else {
        startShopMax99Admin();
    }

})();