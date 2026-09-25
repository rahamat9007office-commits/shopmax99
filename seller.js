/* =========================================================
   SHOPMAX99 - SELLER CENTER
   Complete Seller Panel
========================================================= */
(function () {
    "use strict";

    const KEYS = {
        sellers: "shopmax99_sellers",
        products: "shopmax99_products",
        orders: "shopmax99_orders",
        user: "shopmax99_user",
        transactions: "shopmax99_transactions"
    };

    // Seller product images: maximum 100 KB per image.
    const MAX_SELLER_IMAGE_BYTES = 100 * 1024;

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => [
        ...root.querySelectorAll(selector)
    ];

    function read(key, fallback = []) {
        try {
            const value = JSON.parse(localStorage.getItem(key));
            return value ?? fallback;
        } catch (error) {
            return fallback;
        }
    }

    function write(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function esc(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function generateUniqueProductId(existingProducts) {
        const used = new Set(existingProducts.map(item => String(item?.id || "")).filter(Boolean));
        let candidate;
        do {
            const token = (window.crypto && typeof window.crypto.randomUUID === "function")
                ? window.crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()
                : Math.random().toString(36).slice(2, 14).toUpperCase();
            candidate = `SM99-P-${Date.now().toString(36).toUpperCase()}-${token}`;
        } while (used.has(candidate));
        return candidate;
    }

    function toast(message) {
        if (window.ShopMax99?.showToast) {
            window.ShopMax99.showToast(message);
        } else {
            alert(message);
        }
    }

    /* =====================================================
       CURRENT SELLER
    ===================================================== */

    function getCurrentSeller() {
        const sellers = read(KEYS.sellers, []);
        const user = read(KEYS.user, null);

        const email = String(user?.email || "").toLowerCase();

        if (email) {
            const seller = sellers.find(
                s => String(s.email || "").toLowerCase() === email
            );

            if (seller) return seller;
        }

        return sellers[sellers.length - 1] || null;
    }

    function sellerProducts(seller) {
        if (!seller) return [];

        return read(KEYS.products, []).filter(product =>
            String(product.sellerEmail || "").toLowerCase() ===
            String(seller.email || "").toLowerCase()
        );
    }

    function statusLabel(status) {
        const value = String(status || "pending").toLowerCase();

        if (value === "approved") return "Approved";
        if (value === "rejected") return "Rejected";

        return "Pending Approval";
    }

    /* =====================================================
       INITIALIZE SELLER CENTER
    ===================================================== */

    function initSellerCenter() {
        const pages = $("#sellerPages");

        if (!pages) return;

        if (!pages.dataset.built) {
            pages.dataset.built = "1";

            pages.innerHTML = `
                <div id="sellerPageContent"></div>
            `;
        }

        const seller = getCurrentSeller();

        const headerName = $("#sellerHeaderName");
        const headerStatus = $("#sellerHeaderStatus");

        if (headerName) {
            headerName.textContent =
                seller?.shopName ||
                seller?.fullName ||
                "Seller";
        }

        if (headerStatus) {
            headerStatus.textContent = seller
                ? statusLabel(seller.status)
                : "Not Registered";
        }

        $$("[data-seller-page]").forEach(button => {

            if (button.dataset.sellerBound === "1") return;

            button.dataset.sellerBound = "1";

            button.addEventListener("click", event => {
                event.preventDefault();

                showSellerPage(
                    button.dataset.sellerPage
                );
            });
        });

        showSellerPage("dashboard");
    }

    /* =====================================================
       PAGE ROUTER
    ===================================================== */

    function showSellerPage(page = "dashboard") {

        const content =
            $("#sellerPageContent") ||
            $("#sellerPages");

        if (!content) return;

        $$("[data-seller-page]").forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.sellerPage === page
            );
        });

        const seller = getCurrentSeller();

        if (!seller) {

            content.innerHTML = `
                <div class="seller-empty-panel">

                    <div class="seller-empty-icon">
                        <i class="fa-solid fa-store"></i>
                    </div>

                    <h2>Seller Center</h2>

                    <p>
                        No seller registration found.
                    </p>

                    <button
                        type="button"
                        class="seller-primary-btn"
                        id="sellerRegisterFromPanel"
                    >
                        Register as Seller
                    </button>

                </div>
            `;

            $("#sellerRegisterFromPanel")?.addEventListener(
                "click",
                () => {
                    window.ShopMax99?.openModal(
                        "sellerRegisterModal"
                    );
                }
            );

            return;
        }

        switch (page) {

            case "list-product":
                renderListProduct(content, seller);
                break;

            case "approved":
                renderProductsPage(
                    content,
                    seller,
                    "approved"
                );
                break;

            case "pending":
                renderProductsPage(
                    content,
                    seller,
                    "pending"
                );
                break;

            case "rejected":
                renderProductsPage(
                    content,
                    seller,
                    "rejected"
                );
                break;

            case "edit-products":
                renderProductsPage(
                    content,
                    seller,
                    "edit"
                );
                break;

            case "orders":
                renderOrders(content, seller);
                break;

            case "earnings":
                renderEarnings(content, seller);
                break;

            case "profile":
                renderProfile(content, seller);
                break;

            default:
                renderDashboard(content, seller);
        }
    }

    /* =====================================================
       DASHBOARD
    ===================================================== */

    function renderDashboard(content, seller) {

        const products = sellerProducts(seller);

        const total =
            products.length;

        const approved =
            products.filter(
                p =>
                    String(p.status).toLowerCase() ===
                    "approved"
            ).length;

        const pending =
            products.filter(
                p =>
                    String(p.status).toLowerCase() ===
                    "pending"
            ).length;

        const rejected =
            products.filter(
                p =>
                    String(p.status).toLowerCase() ===
                    "rejected"
            ).length;

        content.innerHTML = `

            <div class="seller-page-header">

                <div>
                    <span class="seller-kicker">
                        SELLER CENTER
                    </span>

                    <h1>
                        Dashboard
                    </h1>

                    <p>
                        Manage your ShopMax99 store.
                    </p>
                </div>

            </div>

            <div class="seller-stats-grid">

                <div class="seller-stat-card">
                    <span>Total Products</span>
                    <strong>${total}</strong>
                </div>

                <div class="seller-stat-card approved">
                    <span>Approved</span>
                    <strong>${approved}</strong>
                </div>

                <div class="seller-stat-card pending">
                    <span>Pending</span>
                    <strong>${pending}</strong>
                </div>

                <div class="seller-stat-card rejected">
                    <span>Rejected</span>
                    <strong>${rejected}</strong>
                </div>

            </div>

            <div class="seller-info-card">

                <h2>
                    ${esc(
                        seller.shopName ||
                        "My Store"
                    )}
                </h2>

                <div class="seller-info-row">
                    <span>Owner</span>
                    <strong>
                        ${esc(seller.fullName)}
                    </strong>
                </div>

                <div class="seller-info-row">
                    <span>Email</span>
                    <strong>
                        ${esc(seller.email)}
                    </strong>
                </div>

                <div class="seller-info-row">
                    <span>Status</span>
                    <strong>
                        ${esc(
                            statusLabel(
                                seller.status
                            )
                        )}
                    </strong>
                </div>

            </div>
        `;
    }

    /* =====================================================
       LIST NEW PRODUCT
    ===================================================== */

    function renderListProduct(content, seller) {

    const sellerStatus = String(seller?.status || "pending").toLowerCase();
    if (sellerStatus !== "approved" && sellerStatus !== "active") {
        content.innerHTML = `
            <div class="seller-empty-panel">
                <div class="seller-empty-icon"><i class="fa-solid fa-hourglass-half"></i></div>
                <h2>Seller approval required</h2>
                <p>Your seller account is currently <strong>${esc(statusLabel(sellerStatus))}</strong>. You can list products after Admin approves your seller account.</p>
            </div>
        `;
        return;
    }

    content.innerHTML = `
        <div class="seller-page-header">
            <div>
                <span class="seller-kicker">PRODUCTS</span>
                <h1>List New Product</h1>
                <p>Add your product details and submit it for admin approval.</p>
            </div>
        </div>

        <form id="sellerProductForm" class="seller-product-form">

            <!-- PRODUCT IMAGES -->
            <div class="seller-field seller-field-full">

                <label>
                    Product Images
                    <b>*</b>
                </label>

                <div class="seller-image-grid">

                    <label class="seller-image-slot">
                        <span class="seller-image-placeholder">
                            <i class="fa-solid fa-plus"></i>
                            <small>Image 1</small>
                        </span>

                        <input
                            type="file"
                            class="seller-image-input"
                            accept="image/jpeg,image/png,image/webp"
                        >
                    </label>

                    <label class="seller-image-slot">
                        <span class="seller-image-placeholder">
                            <i class="fa-solid fa-plus"></i>
                            <small>Image 2</small>
                        </span>

                        <input
                            type="file"
                            class="seller-image-input"
                            accept="image/jpeg,image/png,image/webp"
                        >
                    </label>

                    <label class="seller-image-slot">
                        <span class="seller-image-placeholder">
                            <i class="fa-solid fa-plus"></i>
                            <small>Image 3</small>
                        </span>

                        <input
                            type="file"
                            class="seller-image-input"
                            accept="image/jpeg,image/png,image/webp"
                        >
                    </label>

                    <label class="seller-image-slot">
                        <span class="seller-image-placeholder">
                            <i class="fa-solid fa-plus"></i>
                            <small>Image 4</small>
                        </span>

                        <input
                            type="file"
                            class="seller-image-input"
                            accept="image/jpeg,image/png,image/webp"
                        >
                    </label>

                </div>

                <small>
                    Minimum 1 image required. Maximum 4 images.
                    JPG, PNG or WebP. <strong>Maximum 100 KB per image.</strong>
                </small>

            </div>


            <!-- PRODUCT NAME -->

            <div class="seller-form-grid">

                <div class="seller-field seller-field-full">

                    <label for="sellerProductName">
                        Product Name
                        <b>*</b>
                    </label>

                    <input
                        id="sellerProductName"
                        name="name"
                        type="text"
                        required
                        maxlength="120"
                        placeholder="Enter product name"
                    >

                </div>


                <!-- CATEGORY -->

                <div class="seller-field">

                    <label for="sellerProductCategory">
                        Category
                        <b>*</b>
                    </label>

                    <select
                        id="sellerProductCategory"
                        name="category"
                        required
                    >

                        <option value="">
                            Select Category
                        </option>

                        <option value="Men">Men</option>
                        <option value="Women">Women</option>
                        <option value="Kids">Kids</option>
                        <option value="Home & Living">
                            Home & Living
                        </option>
                        <option value="Beauty">Beauty</option>
                        <option value="Mobile">Mobile</option>
                        <option value="Fitness">Fitness</option>
                        <option value="More">More</option>

                    </select>

                </div>


                <!-- STOCK -->

                <div class="seller-field">

                    <label for="sellerProductStock">
                        Stock
                        <b>*</b>
                    </label>

                    <input
                        id="sellerProductStock"
                        name="stock"
                        type="number"
                        min="1"
                        step="1"
                        required
                        placeholder="Enter stock"
                    >

                </div>


                <!-- SELLER PRICE -->

                <div class="seller-field">

                    <label for="sellerProductPrice">
                        Seller Price
                        <b>*</b>
                    </label>

                    <div class="seller-price-input">

                        <span>₹</span>

                        <input
                            id="sellerProductPrice"
                            name="sellerPrice"
                            type="number"
                            min="1"
                            max="70"
                            step="1"
                            required
                            placeholder="1 - 70"
                        >

                    </div>

                    <small>
                        Maximum seller price: ₹70
                    </small>

                </div>


                <!-- CUSTOMER PRICE -->

                <div class="seller-field">

                    <label>
                        Customer Price
                    </label>

                    <div class="seller-fixed-price">
                        ₹99
                    </div>

                    <small>
                        Customer selling price is fixed at ₹99.
                    </small>

                </div>


                <!-- DESCRIPTION -->

                <div class="seller-field seller-field-full">

                    <label for="sellerProductDescription">
                        Description
                        <b>*</b>
                    </label>

                    <textarea
                        id="sellerProductDescription"
                        name="description"
                        rows="6"
                        maxlength="2500"
                        required
                        placeholder="Describe your product..."
                    ></textarea>

                </div>

            </div>


            <!-- INFO -->

            <div class="seller-product-info">

                <div class="seller-product-info-icon">
                    <i class="fa-solid fa-circle-info"></i>
                </div>

                <div>

                    <strong>
                        Admin approval required
                    </strong>

                    <p>
                        Product customer side par tabhi
                        dikhega jab Admin approve karega.
                    </p>

                </div>

            </div>


            <!-- MESSAGE -->

            <div
                id="sellerProductMessage"
                class="seller-product-message"
            ></div>


            <!-- BUTTONS -->

            <div class="seller-form-actions">

                <button
                    type="reset"
                    class="seller-secondary-btn"
                    id="sellerResetProduct"
                >
                    <i class="fa-solid fa-rotate-left"></i>
                    Reset
                </button>

                <button
                    type="submit"
                    class="seller-primary-btn"
                >
                    <i class="fa-solid fa-paper-plane"></i>
                    Submit for Approval
                </button>

            </div>

        </form>
    `;


    const form =
        document.getElementById(
            "sellerProductForm"
        );

    if (!form) return;


    /* =====================================================
       IMAGE UPLOAD PREVIEW
    ===================================================== */

    const imageInputs =
        [
            ...form.querySelectorAll(
                ".seller-image-input"
            )
        ];


    imageInputs.forEach(
        input => {

            input.addEventListener(
                "change",
                event => {

                    const file =
                        event.target.files?.[0];

                    if (!file) return;


                    const allowed =
                        [
                            "image/jpeg",
                            "image/png",
                            "image/webp"
                        ];


                    if (
                        !allowed.includes(
                            file.type
                        )
                    ) {

                        alert(
                            "Only JPG, PNG or WebP images are allowed."
                        );

                        input.value = "";

                        return;
                    }


                    if (
                        file.size >
                        MAX_SELLER_IMAGE_BYTES
                    ) {

                        alert(
                            "Har image maximum 100 KB honi chahiye. Is image ka size " +
                            (file.size / 1024).toFixed(1) +
                            " KB hai."
                        );

                        input.value = "";

                        return;
                    }


                    const reader =
                        new FileReader();


                    reader.onload =
                        () => {

                            const slot =
                                input.closest(
                                    ".seller-image-slot"
                                );

                            if (!slot) return;


                            slot.classList.add(
                                "has-image"
                            );


                            slot.style.backgroundImage =
                                `url("${reader.result}")`;


                            const placeholder =
                                slot.querySelector(
                                    ".seller-image-placeholder"
                                );


                            if (
                                placeholder
                            ) {

                                placeholder.innerHTML = `
                                    <i class="fa-solid fa-check"></i>
                                    <small>Selected</small>
                                `;

                            }

                        };


                    reader.readAsDataURL(
                        file
                    );

                }
            );

        }
    );


    /* =====================================================
       RESET IMAGE PREVIEWS
    ===================================================== */

    form.addEventListener(
        "reset",
        () => {

            setTimeout(
                () => {

                    form
                        .querySelectorAll(
                            ".seller-image-slot"
                        )
                        .forEach(
                            slot => {

                                slot.classList.remove(
                                    "has-image"
                                );

                                slot.style.backgroundImage =
                                    "";

                                slot.innerHTML = `
                                    <span class="seller-image-placeholder">
                                        <i class="fa-solid fa-plus"></i>
                                        <small>
                                            Add Image
                                        </small>
                                    </span>

                                    <input
                                        type="file"
                                        class="seller-image-input"
                                        accept="image/jpeg,image/png,image/webp"
                                    >
                                `;

                            }
                        );


                    /* Rebind inputs */

                    renderListProduct(
                        content,
                        seller
                    );

                },
                0
            );

        }
    );


    /* =====================================================
       SUBMIT
    ===================================================== */

    form.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const message =
                document.getElementById(
                    "sellerProductMessage"
                );


            const name =
                document.getElementById(
                    "sellerProductName"
                ).value.trim();


            const category =
                document.getElementById(
                    "sellerProductCategory"
                ).value;


            const stock =
                Number(
                    document.getElementById(
                        "sellerProductStock"
                    ).value
                );


            const sellerPrice =
                Number(
                    document.getElementById(
                        "sellerProductPrice"
                    ).value
                );


            const description =
                document.getElementById(
                    "sellerProductDescription"
                ).value.trim();


            /* Collect images */

            const images = [];


            imageInputs.forEach(
                input => {

                    const slot =
                        input.closest(
                            ".seller-image-slot"
                        );

                    if (
                        slot &&
                        slot.style.backgroundImage
                    ) {

                        const bg =
                            slot.style.backgroundImage;

                        const match =
                            bg.match(
                                /url\(["']?(.*?)["']?\)/
                            );

                        if (
                            match &&
                            match[1]
                        ) {

                            images.push(
                                match[1]
                            );

                        }

                    }

                }
            );


            if (!name) {

                message.textContent =
                    "Product name required hai.";

                message.className =
                    "seller-product-message error";

                return;
            }


            if (!category) {

                message.textContent =
                    "Category select karo.";

                message.className =
                    "seller-product-message error";

                return;
            }


            if (
                !Number.isInteger(stock) ||
                stock < 1
            ) {

                message.textContent =
                    "Stock minimum 1 hona chahiye.";

                message.className =
                    "seller-product-message error";

                return;
            }


            if (
                !Number.isFinite(
                    sellerPrice
                ) ||
                sellerPrice < 1 ||
                sellerPrice > 70
            ) {

                message.textContent =
                    "Seller price ₹1 se ₹70 ke beech hona chahiye.";

                message.className =
                    "seller-product-message error";

                return;
            }


            if (!description) {

                message.textContent =
                    "Product description required hai.";

                message.className =
                    "seller-product-message error";

                return;
            }


            if (!images.length) {

                message.textContent =
                    "Kam se kam 1 product image upload karo.";

                message.className =
                    "seller-product-message error";

                return;
            }


            /* =================================================
               SAVE PRODUCT
            ================================================= */

            const products =
                JSON.parse(
                    localStorage.getItem(
                        "shopmax99_products"
                    ) || "[]"
                );


            const product = {

                id:
                    generateUniqueProductId(products),

                name,

                category,

                description,

                sellerPrice,

                customerPrice: 99,

                price: 99,

                stock,

                images,

                image:
                    images[0],

                status:
                    "pending",

                sellerEmail:
                    seller.email,

                sellerId:
                    seller.id || "",

                createdAt:
                    new Date()
                        .toISOString()

            };


            products.unshift(
                product
            );


            localStorage.setItem(
                "shopmax99_products",
                JSON.stringify(
                    products
                )
            );


            /* Also save in seller product storage
               used by the existing seller module */

            const sellerProducts =
                JSON.parse(
                    localStorage.getItem(
                        "shopmax99SellerProducts"
                    ) || "[]"
                );


            sellerProducts.unshift(
                {
                    ...product,
                    status:
                        "Pending Admin Approval"
                }
            );


            localStorage.setItem(
                "shopmax99SellerProducts",
                JSON.stringify(
                    sellerProducts
                )
            );


            /* Admin approval request */

            const requests =
                JSON.parse(
                    localStorage.getItem(
                        "nestedProductRequests"
                    ) || "[]"
                );


            requests.unshift({

                id:
                    "REQ-" +
                    product.id,

                productId:
                    product.id,

                type:
                    "product",

                status:
                    "pending",

                product:
                    JSON.parse(
                        JSON.stringify(
                            product
                        )
                    ),

                createdAt:
                    new Date()
                        .toISOString()

            });


            localStorage.setItem(
                "nestedProductRequests",
                JSON.stringify(
                    requests
                )
            );


            message.textContent =
                "Product Admin approval ke liye successfully submit ho gaya.";

            message.className =
                "seller-product-message success";


            form.reset();


            setTimeout(
                () => {

                    renderListProduct(
                        content,
                        seller
                    );

                },
                1200
            );


            window.dispatchEvent(
                new CustomEvent(
                    "shopmax99-products-updated"
                )
            );

        }
    );
}

    /* =====================================================
       PRODUCTS
    ===================================================== */

   function renderProductsPage(content, seller, filter) {

    let products = sellerProducts(seller);

    if (filter !== "edit") {
        products = products.filter(product =>
            String(product.status || "").toLowerCase() ===
            filter
        );
    }

    const title =
        filter === "edit"
            ? "Edit Products"
            : statusLabel(filter);

    content.innerHTML = `
        <div class="seller-page-header">

            <div>
                <span class="seller-kicker">
                    PRODUCTS
                </span>

                <h1>
                    ${title}
                </h1>

                <p>
                    Manage your submitted products.
                </p>
            </div>

        </div>

        <div class="seller-products-list">

            ${
                products.length
                    ? products.map(product =>
                        productCard(product)
                    ).join("")
                    : `
                        <div class="seller-empty-panel">

                            <div class="seller-empty-icon">
                                <i class="fa-solid fa-box-open"></i>
                            </div>

                            <h3>
                                No products found
                            </h3>

                            <p>
                                There are no products
                                in this section yet.
                            </p>

                        </div>
                    `
            }

        </div>
    `;


    /* EDIT */

    content
        .querySelectorAll("[data-edit-product]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    editProduct(
                        button.dataset.editProduct
                    );

                }
            );

        });


    /* DELETE */

    content
        .querySelectorAll("[data-delete-product]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    deleteSellerProduct(
                        button.dataset.deleteProduct
                    );

                }
            );

        });
}

   function productCard(product) {

    const status =
        String(
            product.status || "pending"
        ).toLowerCase();


    return `
        <div class="seller-product-card">

            <div class="seller-product-image">

                ${
                    product.image ||
                    product.images?.[0]
                        ? `
                            <img
                                src="${esc(
                                    product.image ||
                                    product.images?.[0]
                                )}"
                                alt="${esc(
                                    product.name
                                )}"
                            >
                        `
                        : `
                            <i class="fa-solid fa-box"></i>
                        `
                }

            </div>


            <div class="seller-product-details">

                <h3>
                    ${esc(product.name)}
                </h3>

                <div class="seller-product-id">Product ID: <strong>${esc(product.id || "-")}</strong></div>

                <p>
                    ${esc(product.category || "More")}
                    · Stock ${Number(product.stock || 0)}
                </p>

                <div class="seller-product-prices">

                    <span>
                        Seller ₹${Number(
                            product.sellerPrice || 0
                        )}
                    </span>

                    <span>
                        Customer ₹${Number(
                            product.customerPrice || 99
                        )}
                    </span>

                </div>


                <span
                    class="
                        seller-status-badge
                        ${
                            status.includes("approved")
                                ? "approved"
                                : status.includes("rejected")
                                    ? "rejected"
                                    : "pending"
                        }
                    "
                >
                    ${
                        status.includes("approved")
                            ? "Approved"
                            : status.includes("rejected")
                                ? "Rejected"
                                : "Pending Approval"
                    }
                </span>

            </div>


            <!-- SELLER ACTIONS -->

            <div class="seller-product-actions">

                <button
                    type="button"
                    class="seller-edit-btn"
                    data-edit-product="${esc(
                        product.id
                    )}"
                >
                    <i class="fa-solid fa-pen"></i>
                    Edit
                </button>


                <button
                    type="button"
                    class="seller-delete-btn"
                    data-delete-product="${esc(
                        product.id
                    )}"
                >
                    <i class="fa-solid fa-trash"></i>
                    Delete
                </button>

            </div>

        </div>
    `;
}

    /* =====================================================
       EDIT PRODUCT
    ===================================================== */

    function editProduct(id) {
        const products = read(KEYS.products, []);
        const index = products.findIndex(
            product => String(product.id) === String(id)
        );

        if (index === -1) {
            toast("Product nahi mila.");
            return;
        }

        const product = products[index];
        const existingImages = Array.isArray(product.images)
            ? product.images
            : (product.image ? [product.image] : []);

        document.getElementById("sm99SellerEditModal")?.remove();

        const modal = document.createElement("div");
        modal.id = "sm99SellerEditModal";
        modal.innerHTML = `
            <div style="position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;">
                <div style="width:min(680px,100%);max-height:90vh;overflow:auto;background:#fff;border-radius:16px;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,.25);">
                    <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:20px;">
                        <div>
                            <h2 style="margin:0 0 5px;">Edit Product</h2>
                            <p style="margin:0;color:#666;font-size:13px;">Save karne ke baad product dobara Admin approval mein jayega.</p>
                        </div>
                        <button type="button" data-close-edit style="border:0;background:#f1f1f1;border-radius:8px;padding:8px 12px;font-size:18px;cursor:pointer;">×</button>
                    </div>

                    <form id="sm99SellerEditForm">
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
                            <label style="display:block;">
                                <span style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;">Product Name *</span>
                                <input id="sm99SellerEditName" required value="${esc(product.name || "")}" style="width:100%;box-sizing:border-box;padding:11px;border:1px solid #ddd;border-radius:8px;">
                            </label>
                            <label style="display:block;">
                                <span style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;">Category *</span>
                                <input id="sm99SellerEditCategory" required value="${esc(product.category || "")}" style="width:100%;box-sizing:border-box;padding:11px;border:1px solid #ddd;border-radius:8px;">
                            </label>
                            <label style="display:block;">
                                <span style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;">Seller Price (₹1–₹70) *</span>
                                <input id="sm99SellerEditPrice" type="number" min="1" max="70" required value="${Number(product.sellerPrice || 0)}" style="width:100%;box-sizing:border-box;padding:11px;border:1px solid #ddd;border-radius:8px;">
                            </label>
                            <label style="display:block;">
                                <span style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;">Stock *</span>
                                <input id="sm99SellerEditStock" type="number" min="1" step="1" required value="${Number(product.stock || 1)}" style="width:100%;box-sizing:border-box;padding:11px;border:1px solid #ddd;border-radius:8px;">
                            </label>
                        </div>

                        <label style="display:block;margin-top:14px;">
                            <span style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;">Description *</span>
                            <textarea id="sm99SellerEditDescription" required rows="5" style="width:100%;box-sizing:border-box;padding:11px;border:1px solid #ddd;border-radius:8px;resize:vertical;">${esc(product.description || "")}</textarea>
                        </label>

                        <div style="margin-top:14px;padding:14px;background:#f8f8fb;border-radius:10px;">
                            <div style="font-size:13px;font-weight:700;margin-bottom:10px;">Product Images</div>
                            <div id="sm99SellerCurrentImages" style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px;">
                                ${existingImages.map((img, i) => `
                                    <div data-existing-image="${i}" style="position:relative;border:1px solid #ddd;border-radius:10px;padding:6px;background:#fff;">
                                        <img src="${esc(img)}" style="width:100%;height:90px;object-fit:contain;border-radius:7px;display:block;">
                                        <button type="button" data-remove-existing-image="${i}" style="position:absolute;top:4px;right:4px;border:0;border-radius:50%;width:24px;height:24px;background:#dc2626;color:#fff;cursor:pointer;font-weight:700;">×</button>
                                    </div>`).join("")}
                            </div>
                            <label style="display:block;font-size:13px;font-weight:600;margin-bottom:7px;">Replace / Add Images (maximum 4 total)</label>
                            <div class="sm99-edit-image-input-grid" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;">
                                ${[1,2,3,4].map(i => `
                                    <label style="display:block;border:1px dashed #bbb;border-radius:8px;padding:9px;background:#fff;">
                                        <span style="display:block;font-size:11px;font-weight:700;margin-bottom:6px;color:#666;">Image ${i}</span>
                                        <input class="sm99SellerEditImageInput" type="file" accept="image/jpeg,image/png,image/webp" style="width:100%;box-sizing:border-box;">
                                    </label>
                                `).join("")}
                            </div>
                            <div style="margin-top:6px;font-size:12px;color:#777;">Existing image par × dabakar remove karo. Neeche 4 separate upload slots hain. Total images maximum 4 rahengi. <strong>Har nayi image maximum 100 KB honi chahiye.</strong> JPG, PNG ya WebP.</div>
                        </div>

                        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:20px;">
                            <button type="button" data-close-edit style="padding:10px 18px;border:1px solid #ddd;background:#fff;border-radius:8px;cursor:pointer;">Cancel</button>
                            <button type="submit" style="padding:10px 20px;border:0;background:#6d28d9;color:#fff;border-radius:8px;cursor:pointer;font-weight:600;">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Validate each seller edit-image slot immediately.
        modal.querySelectorAll(".sm99SellerEditImageInput").forEach(input => {
            input.addEventListener("change", event => {
                const file = event.target.files?.[0];
                if (!file) return;

                const allowed = [
                    "image/jpeg",
                    "image/png",
                    "image/webp"
                ];

                if (!allowed.includes(file.type)) {
                    alert("Only JPG, PNG or WebP images are allowed.");
                    event.target.value = "";
                    return;
                }

                if (file.size > MAX_SELLER_IMAGE_BYTES) {
                    alert(
                        "Har image maximum 100 KB honi chahiye. Is image ka size " +
                        (file.size / 1024).toFixed(1) +
                        " KB hai."
                    );
                    event.target.value = "";
                }
            });
        });

        const close = () => modal.remove();
        modal.querySelectorAll("[data-close-edit]").forEach(button => {
            button.addEventListener("click", close);
        });

        const removedImages = new Set();
        modal.querySelectorAll("[data-remove-existing-image]").forEach(button => {
            button.addEventListener("click", () => {
                const i = Number(button.dataset.removeExistingImage);
                removedImages.add(i);
                modal.querySelector(`[data-existing-image="${i}"]`)?.remove();
            });
        });

        modal.querySelector("#sm99SellerEditForm").addEventListener("submit", async event => {
            event.preventDefault();

            const name = $("#sm99SellerEditName", modal).value.trim();
            const category = $("#sm99SellerEditCategory", modal).value.trim();
            const price = Number($("#sm99SellerEditPrice", modal).value);
            const stock = Number($("#sm99SellerEditStock", modal).value);
            const description = $("#sm99SellerEditDescription", modal).value.trim();
            const imageFiles = Array.from(modal.querySelectorAll(".sm99SellerEditImageInput"))
                .map(input => input.files?.[0])
                .filter(Boolean);
            let updatedImages = existingImages.filter((_, i) => !removedImages.has(i));

            const oversizedImage = imageFiles.find(
                file => file.size > MAX_SELLER_IMAGE_BYTES
            );

            if (oversizedImage) {
                toast(
                    "Har image maximum 100 KB honi chahiye. " +
                    oversizedImage.name +
                    " is limit se badi hai."
                );
                return;
            }

            if (imageFiles.length) {
                const fileImages = await Promise.all(imageFiles.map(file => new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                })));
                updatedImages = updatedImages.concat(fileImages);
            }

            updatedImages = updatedImages.filter(Boolean).slice(0, 4);
            if (!updatedImages.length) {
                toast("Kam se kam 1 product image rakho.");
                return;
            }

            if (!name || !category || !description) {
                toast("Name, category aur description required hain.");
                return;
            }

            if (!Number.isFinite(price) || price < 1 || price > 70) {
                toast("Seller price ₹1 se ₹70 ke beech hona chahiye.");
                return;
            }

            if (!Number.isInteger(stock) || stock < 1) {
                toast("Stock kam se kam 1 hona chahiye.");
                return;
            }

            const updated = {
                ...products[index],
                name,
                category,
                sellerPrice: price,
                customerPrice: Number(product.customerPrice || 99),
                stock,
                description,
                images: updatedImages,
                image: updatedImages[0],
                status: "pending",
                updatedAt: new Date().toISOString(),
                approvedAt: null,
                rejectedAt: null
            };

            products[index] = updated;
            write(KEYS.products, products);

            const requests = read("nestedProductRequests", []);
            const filtered = requests.filter(
                request => String(request.productId || request.product?.id || "") !== String(id)
            );
            filtered.unshift({
                id: `REQ-${id}`,
                type: "product",
                productId: id,
                status: "pending",
                product: updated,
                createdAt: updated.updatedAt
            });
            write("nestedProductRequests", filtered);

            window.dispatchEvent(new CustomEvent("shopmax99-products-updated"));
            close();
            showSellerPage("edit-products");
            toast("Product update ho gaya aur Admin approval ke liye bhej diya gaya.");
        });
    }

    function deleteSellerProduct(id) {

    let products =
        read(
            KEYS.products,
            []
        );


    const index =
        products.findIndex(
            product =>
                String(product.id) ===
                String(id)
        );


    if (index === -1) {

        toast(
            "Product nahi mila."
        );

        return;
    }


    const product =
        products[index];


    const confirmed =
        confirm(
            `Delete "${product.name}" permanently?`
        );


    if (!confirmed) {
        return;
    }


    products.splice(
        index,
        1
    );


    write(
        KEYS.products,
        products
    );


    const requests =
        read(
            "nestedProductRequests",
            []
        );


    const filteredRequests =
        requests.filter(
            request =>
                String(
                    request.productId ||
                    request.product?.id ||
                    ""
                ) !==
                String(id)
        );


    write(
        "nestedProductRequests",
        filteredRequests
    );


    const sellerProductsData =
        read(
            "shopmax99SellerProducts",
            []
        );


    const filteredSellerProducts =
        sellerProductsData.filter(
            product =>
                String(product.id) !==
                String(id)
        );


    write(
        "shopmax99SellerProducts",
        filteredSellerProducts
    );


    window.dispatchEvent(
        new CustomEvent(
            "shopmax99-products-updated"
        )
    );


    toast(
        "Product successfully deleted."
    );


    const seller =
        getCurrentSeller();


    if (seller) {

        showSellerPage(
            "edit-products"
        );

    }
}

    /* =====================================================
       ORDERS
    ===================================================== */

    function renderOrders(
        content,
        seller
    ) {

        const orders =
            read(
                KEYS.orders,
                []
            );


        const sellerEmail =
            String(
                seller.email || ""
            ).toLowerCase();


        const mine =
            orders.filter(
                order =>
                    (order.items || [])
                        .some(
                            item =>
                                String(
                                    item.sellerEmail ||
                                    ""
                                ).toLowerCase() ===
                                sellerEmail
                        )
            );


        content.innerHTML = `

            <div class="seller-page-header">

                <div>

                    <span class="seller-kicker">
                        ORDERS
                    </span>

                    <h1>
                        Orders
                    </h1>

                    <p>
                        Orders containing your products.
                    </p>

                </div>

            </div>


            <div class="seller-orders-list">

                ${
                    mine.length
                        ? mine
                              .map(
                                  order => `
                                    <div class="seller-order-card">

                                        <div>

                                            <strong>
                                                ${esc(
                                                    order.id
                                                )}
                                            </strong>

                                            <p>
                                                ${esc(
                                                    order.status ||
                                                    "Placed"
                                                )}
                                            </p>

                                        </div>

                                        <strong>
                                            ₹${Number(
                                                order.total ||
                                                0
                                            )}
                                        </strong>

                                    </div>
                                `
                              )
                              .join("")
                        : `
                            <div class="seller-empty-panel">

                                <div class="seller-empty-icon">
                                    <i class="fa-solid fa-bag-shopping"></i>
                                </div>

                                <h3>
                                    No orders yet
                                </h3>

                                <p>
                                    Orders containing your products
                                    will appear here.
                                </p>

                            </div>
                        `
                }

            </div>
        `;
    }

    /* =====================================================
       EARNINGS
    ===================================================== */

    function renderEarnings(content, seller) {
        const orders = read(KEYS.orders, []);
        const transactions = read(KEYS.transactions, []);
        const sellerEmail = String(seller.email || "").toLowerCase();

        // Backfill order credits into the shared ledger. This keeps seller and admin views synchronized.
        const existingIds = new Set(transactions.map(t => String(t.id || "")));
        orders.forEach(order => {
            (order.items || []).forEach((item, index) => {
                const itemSellerEmail = String(item.sellerEmail || "").toLowerCase();
                if (itemSellerEmail !== sellerEmail) return;
                const txId = `TX-ORDER-${order.id}-${index}-${sellerEmail}`;
                if (existingIds.has(txId)) return;
                transactions.push({
                    id: txId,
                    category: "order",
                    type: "credit",
                    amount: Number(item.sellerPrice || 0) * Number(item.quantity || 1),
                    sellerId: seller.id || "",
                    sellerEmail,
                    reference: order.id,
                    description: `Order earning - ${item.name || "Product"}`,
                    status: "completed",
                    createdAt: order.date || new Date().toISOString()
                });
                existingIds.add(txId);
            });
        });
        write(KEYS.transactions, transactions);

        const mine = transactions
            .filter(t => String(t.sellerId || "") === String(seller.id || "") || String(t.sellerEmail || "").toLowerCase() === sellerEmail)
            .sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        const credits = mine.filter(t => String(t.type).toLowerCase() === "credit").reduce((sum,t)=>sum+Number(t.amount||0),0);
        const debits = mine.filter(t => String(t.type).toLowerCase() === "debit").reduce((sum,t)=>sum+Number(t.amount||0),0);
        const balance = credits - debits;

        content.innerHTML = `
            <div class="seller-page-header"><div><span class="seller-kicker">FINANCE</span><h1>Earnings</h1><p>Every seller credit, debit, charge and payout is recorded here.</p></div></div>
            <div class="seller-stats-grid">
                <div class="seller-stat-card approved"><span>Total Credits</span><strong>₹${credits.toFixed(0)}</strong></div>
                <div class="seller-stat-card"><span>Total Debits / Charges</span><strong>₹${debits.toFixed(0)}</strong></div>
                <div class="seller-stat-card"><span>Available Balance</span><strong>₹${balance.toFixed(0)}</strong></div>
            </div>
            <div class="seller-panel" style="margin-top:20px;overflow:auto;">
                <h2>Transaction History</h2>
                ${mine.length ? `<table style="width:100%;border-collapse:collapse;min-width:760px;"><thead><tr><th style="text-align:left;padding:10px;border-bottom:1px solid #ddd;">Date</th><th style="text-align:left;padding:10px;border-bottom:1px solid #ddd;">Category</th><th style="text-align:left;padding:10px;border-bottom:1px solid #ddd;">Reference</th><th style="text-align:left;padding:10px;border-bottom:1px solid #ddd;">Description</th><th style="text-align:left;padding:10px;border-bottom:1px solid #ddd;">Amount</th><th style="text-align:left;padding:10px;border-bottom:1px solid #ddd;">Status</th></tr></thead><tbody>${mine.map(t=>{const credit=String(t.type).toLowerCase()==='credit'; return `<tr><td style="padding:10px;border-bottom:1px solid #eee;">${esc(new Date(t.createdAt||Date.now()).toLocaleString())}</td><td style="padding:10px;border-bottom:1px solid #eee;">${esc(t.category||'other')}</td><td style="padding:10px;border-bottom:1px solid #eee;">${esc(t.reference||'-')}</td><td style="padding:10px;border-bottom:1px solid #eee;">${esc(t.description||'-')}</td><td style="padding:10px;border-bottom:1px solid #eee;color:${credit?'#138a3d':'#c62828'};font-weight:700;">${credit?'+':'-'}₹${Number(t.amount||0).toFixed(0)}</td><td style="padding:10px;border-bottom:1px solid #eee;">${esc(t.status||'completed')}</td></tr>`}).join('')}</tbody></table>` : `<p style="color:#777;">No transactions yet.</p>`}
            </div>`;
    }

    /* =====================================================
       SELLER PROFILE
    ===================================================== */

    function renderProfile(
        content,
        seller
    ) {

        content.innerHTML = `

            <div class="seller-page-header">

                <div>

                    <span class="seller-kicker">
                        ACCOUNT
                    </span>

                    <h1>
                        Seller Profile
                    </h1>

                </div>

            </div>


            <div class="seller-profile-card">

                <div class="seller-profile-row">
                    <span>Shop</span>
                    <strong>
                        ${esc(
                            seller.shopName ||
                            "-"
                        )}
                    </strong>
                </div>

                <div class="seller-profile-row">
                    <span>Owner</span>
                    <strong>
                        ${esc(
                            seller.fullName ||
                            "-"
                        )}
                    </strong>
                </div>

                <div class="seller-profile-row">
                    <span>Email</span>
                    <strong>
                        ${esc(
                            seller.email ||
                            "-"
                        )}
                    </strong>
                </div>

                <div class="seller-profile-row">
                    <span>Phone</span>
                    <strong>
                        ${esc(
                            seller.phone ||
                            "-"
                        )}
                    </strong>
                </div>

                <div class="seller-profile-row">
                    <span>Address</span>
                    <strong>
                        ${esc(
                            seller.address ||
                            "-"
                        )}
                    </strong>
                </div>

                <div class="seller-profile-row">
                    <span>Status</span>

                    <strong>
                        ${esc(
                            statusLabel(
                                seller.status
                            )
                        )}
                    </strong>

                </div>

            </div>
        `;
    }

    /* =====================================================
       GLOBAL FUNCTIONS
    ===================================================== */

    window.initSellerCenter =
        initSellerCenter;

    window.showSellerPage =
        showSellerPage;

    window.showSellerSection =
        showSellerPage;


    /* =====================================================
       START
    ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initSellerCenter
        );

    } else {

        initSellerCenter();

    }

})();