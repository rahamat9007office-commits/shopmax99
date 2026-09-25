/* =========================================================
   SHOPMAX99 - CUSTOMER.JS
   Products / Categories / Wishlist / Cart / Orders
========================================================= */

(function () {
    "use strict";

    const STORAGE = window.ShopMax99.storage.keys;

    const $ = selector =>
        document.querySelector(selector);

    const $$ = selector =>
        [...document.querySelectorAll(selector)];


    /* =====================================================
       DEMO PRODUCTS
    ====================================================== */

    const DEFAULT_PRODUCTS = [

        {
            id: "P001",
            name: "Premium Casual T-Shirt",
            category: "men",
            price: 99,
            sellerPrice: 65,
            rating: 4.5,
            image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=700&q=80",
            description: "Comfortable casual t-shirt for everyday wear."
        },

        {
            id: "P002",
            name: "Women's Stylish Top",
            category: "women",
            price: 99,
            sellerPrice: 68,
            rating: 4.4,
            image: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=700&q=80",
            description: "Modern stylish top designed for everyday comfort."
        },

        {
            id: "P003",
            name: "Kids Casual Hoodie",
            category: "kids",
            price: 99,
            sellerPrice: 62,
            rating: 4.6,
            image: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=700&q=80",
            description: "Soft and comfortable hoodie for kids."
        },

        {
            id: "P004",
            name: "Decorative Table Lamp",
            category: "home",
            price: 99,
            sellerPrice: 70,
            rating: 4.3,
            image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=700&q=80",
            description: "Elegant decorative lamp for your living space."
        },

        {
            id: "P005",
            name: "Beauty Care Set",
            category: "beauty",
            price: 99,
            sellerPrice: 66,
            rating: 4.5,
            image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=700&q=80",
            description: "Everyday beauty and personal care essentials."
        },

        {
            id: "P006",
            name: "Wireless Mobile Earbuds",
            category: "mobile",
            price: 99,
            sellerPrice: 69,
            rating: 4.2,
            image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=700&q=80",
            description: "Compact wireless earbuds for everyday listening."
        },

        {
            id: "P007",
            name: "Resistance Workout Bands",
            category: "fitness",
            price: 99,
            sellerPrice: 55,
            rating: 4.7,
            image: "https://images.unsplash.com/photo-1598289431512-b97b0917affc?auto=format&fit=crop&w=700&q=80",
            description: "Resistance bands for home workouts and training."
        },

        {
            id: "P008",
            name: "Classic Men's Wallet",
            category: "men",
            price: 99,
            sellerPrice: 58,
            rating: 4.3,
            image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=700&q=80",
            description: "Compact and stylish everyday wallet."
        }

    ];


    /* =====================================================
       INITIAL PRODUCT DATA
    ====================================================== */

    function initializeProducts() {

        const existing =
            window.ShopMax99.storage.get(
                STORAGE.products,
                null
            );

        if (!existing || !Array.isArray(existing)) {

            window.ShopMax99.storage.set(
                STORAGE.products,
                DEFAULT_PRODUCTS
            );

            return DEFAULT_PRODUCTS;
        }

        return existing;
    }


    /* =====================================================
       GET PRODUCTS
    ====================================================== */

    function getProducts() {

        const products = window.ShopMax99.storage.get(
            STORAGE.products,
            DEFAULT_PRODUCTS
        );

        return Array.isArray(products)
            ? products.filter(product => {
                const status = String(product.status || "approved").toLowerCase();
                return !product.sellerEmail || status === "approved";
            })
            : DEFAULT_PRODUCTS;
    }


    /* =====================================================
       CATEGORY NAME
    ====================================================== */

    function categoryName(category) {

        const names = {
            all: "All Categories",
            men: "Men",
            women: "Women",
            kids: "Kids",
            home: "Home & Living",
            beauty: "Beauty",
            mobile: "Mobile",
            fitness: "Fitness",
            more: "More"
        };

        return names[category] || category;
    }



    function customerPrice(product) {
        const direct = Number(product?.customerPrice);
        if (Number.isFinite(direct) && direct > 0) return direct;
        const settings = window.ShopMax99.storage.get("shopmax99_settings", {});
        const configured = Number(settings?.customerPrice);
        return Number.isFinite(configured) && configured > 0 ? configured : 99;
    }

    /* =====================================================
       PRODUCT CARD
    ====================================================== */

    function productCard(product) {

        const wishlist =
            window.ShopMax99.wishlist.get();

        const isWishlisted =
            wishlist.some(
                item =>
                    String(item.id) ===
                    String(product.id)
            );

        const image = product.image
            ? `
                <img
                    src="${product.image}"
                    alt="${window.ShopMax99.escapeHTML(product.name)}"
                    loading="lazy"
                >
            `
            : `
                <div class="product-placeholder">
                    <i class="fa-solid fa-box"></i>
                </div>
            `;

        return `
            <article
                class="product-card"
                data-product-id="${product.id}"
            >

                <div class="product-image-wrap">

                    ${image}

                    <span class="product-category-tag">
                        ${window.ShopMax99.escapeHTML(
                            categoryName(product.category)
                        )}
                    </span>

                    <button
                        type="button"
                        class="product-wishlist-btn ${
                            isWishlisted ? "active" : ""
                        }"
                        data-action="wishlist"
                        data-product-id="${product.id}"
                        aria-label="Add to wishlist"
                    >
                        <i class="${
                            isWishlisted
                                ? "fa-solid"
                                : "fa-regular"
                        } fa-heart"></i>
                    </button>

                </div>


                <div class="product-info">

                    <h3>
                        ${window.ShopMax99.escapeHTML(product.name)}
                    </h3>

                    <div class="customer-product-id">Product ID: ${window.ShopMax99.escapeHTML(product.id || "-")}</div>

                    <p class="product-description">
                        ${window.ShopMax99.escapeHTML(
                            product.description || ""
                        )}
                    </p>


                    <div class="product-price-row">

                        <div>
                            <span class="product-price">
                                ₹${customerPrice(product)}
                            </span>

                            ${
                                product.sellerPrice
                                    ? `
                                        <span class="product-old-price">
                                            ₹${product.sellerPrice}
                                        </span>
                                    `
                                    : ""
                            }
                        </div>

                        <div class="product-rating">
                            <i class="fa-solid fa-star"></i>
                            <span>
                                ${product.rating || "4.5"}
                            </span>
                        </div>

                    </div>


                    <div class="product-actions">

                        <button
                            type="button"
                            class="product-add-btn"
                            data-action="add-cart"
                            data-product-id="${product.id}"
                        >
                            <i class="fa-solid fa-cart-plus"></i>
                            Add to Cart
                        </button>

                        <button
                            type="button"
                            class="product-view-btn"
                            data-action="view-product"
                            data-product-id="${product.id}"
                            aria-label="View product"
                        >
                            <i class="fa-regular fa-eye"></i>
                        </button>

                    </div>

                </div>

            </article>
        `;
    }


    /* =====================================================
       RENDER PRODUCTS
    ====================================================== */

    function renderProducts(products = getProducts()) {

        const grid = $("#productGrid");

        const emptyState = $("#productEmptyState");

        const resultText = $("#productResultText");

        if (!grid) return;

        if (!products.length) {

            grid.innerHTML = "";

            if (emptyState) {
                emptyState.hidden = false;
            }

            if (resultText) {
                resultText.textContent =
                    "No products found";
            }

            return;
        }

        if (emptyState) {
            emptyState.hidden = true;
        }

        grid.innerHTML =
            products.map(productCard).join("");

        if (resultText) {
            resultText.textContent =
                `Showing ${products.length} product${
                    products.length === 1 ? "" : "s"
                }`;
        }
    }


    /* =====================================================
       FILTER
    ====================================================== */

    let currentCategory = "all";
    let currentSearch = "";


    function filterProducts(category = "all") {

        currentCategory = category;

        const products = getProducts();

        let filtered = products;

        if (
            category &&
            category !== "all" &&
            category !== "more"
        ) {
            filtered = filtered.filter(
                product =>
                    product.category === category
            );
        }

        if (currentSearch) {

            const query =
                currentSearch.toLowerCase();

            filtered = filtered.filter(product => {

                return (
                    product.name
                        .toLowerCase()
                        .includes(query) ||

                    product.category
                        .toLowerCase()
                        .includes(query) ||

                    (product.description || "")
                        .toLowerCase()
                        .includes(query)
                );
            });
        }

        renderProducts(filtered);
    }

    window.filterProducts = filterProducts;


    /* =====================================================
       SEARCH
    ====================================================== */

    function searchProducts(query) {

        currentSearch =
            String(query || "").trim();

        filterProducts(currentCategory);

        if (currentSearch) {
            window.ShopMax99.showToast(
                `Searching for "${currentSearch}"`
            );
        }
    }

    window.searchProducts = searchProducts;


    /* =====================================================
       WISHLIST
    ====================================================== */

    function toggleWishlist(productId) {

        const products = getProducts();

        const product =
            products.find(
                item =>
                    String(item.id) ===
                    String(productId)
            );

        if (!product) return;

        let wishlist =
            window.ShopMax99.wishlist.get();

        const index =
            wishlist.findIndex(
                item =>
                    String(item.id) ===
                    String(productId)
            );

        if (index >= 0) {

            wishlist.splice(index, 1);

            window.ShopMax99.wishlist.save(
                wishlist
            );

            window.ShopMax99.showToast(
                "Removed from wishlist.",
                "warning"
            );

        } else {

            wishlist.push({
                ...product
            });

            window.ShopMax99.wishlist.save(
                wishlist
            );

            window.ShopMax99.showToast(
                "Added to wishlist."
            );
        }

        renderProducts(
            getFilteredProducts()
        );

        renderWishlist();
    }


    /* =====================================================
       FILTERED PRODUCTS
    ====================================================== */

    function getFilteredProducts() {

        let products = getProducts();

        if (
            currentCategory &&
            currentCategory !== "all" &&
            currentCategory !== "more"
        ) {
            products =
                products.filter(
                    product =>
                        product.category ===
                        currentCategory
                );
        }

        if (currentSearch) {

            const query =
                currentSearch.toLowerCase();

            products =
                products.filter(product =>
                    product.name
                        .toLowerCase()
                        .includes(query) ||

                    product.category
                        .toLowerCase()
                        .includes(query) ||

                    (product.description || "")
                        .toLowerCase()
                        .includes(query)
                );
        }

        return products;
    }


    /* =====================================================
       RENDER WISHLIST
    ====================================================== */

    function renderWishlist() {

        const grid = $("#wishlistGrid");

        const empty = $("#wishlistEmptyState");

        if (!grid) return;

        const wishlist =
            window.ShopMax99.wishlist.get();

        if (!wishlist.length) {

            grid.innerHTML = "";

            if (empty) {
                empty.hidden = false;
            }

            return;
        }

        if (empty) {
            empty.hidden = true;
        }

        grid.innerHTML =
            wishlist.map(productCard).join("");
    }

    window.renderWishlist = renderWishlist;


    /* =====================================================
       CART RENDER
    ====================================================== */

    function renderCart() {

        const container = $("#cartItems");
        const empty = $("#cartEmptyState");
        const summaryItems = $("#summaryItems");
        const summarySubtotal = $("#summarySubtotal");
        const summaryTotal = $("#summaryTotal");

        if (!container) return;

        const cart =
            window.ShopMax99.cart.get();

        if (!cart.length) {

            container.innerHTML = "";

            if (empty) {
                empty.hidden = false;
            }

            if (summaryItems) {
                summaryItems.textContent = "0";
            }

            if (summarySubtotal) {
                summarySubtotal.textContent = "₹0";
            }

            if (summaryTotal) {
                summaryTotal.textContent = "₹0";
            }

            return;
        }

        if (empty) {
            empty.hidden = true;
        }

        let totalItems = 0;
        let subtotal = 0;

        container.innerHTML =
            cart.map(item => {

                const quantity =
                    Number(item.quantity || 1);

                const price =
                    Number(item.price || customerPrice(item));

                totalItems += quantity;

                subtotal +=
                    price * quantity;

                return `
                    <div
                        class="cart-item"
                        data-cart-id="${item.id}"
                    >

                        <div class="cart-item-image">

                            ${
                                item.image
                                    ? `
                                        <img
                                            src="${item.image}"
                                            alt="${window.ShopMax99.escapeHTML(item.name)}"
                                        >
                                    `
                                    : `
                                        <i class="fa-solid fa-box"></i>
                                    `
                            }

                        </div>


                        <div class="cart-item-info">

                            <h3>
                                ${window.ShopMax99.escapeHTML(item.name)}
                            </h3>

                            <p>
                                ${window.ShopMax99.escapeHTML(
                                    categoryName(item.category)
                                )}
                            </p>

                            <div class="cart-item-price">
                                ₹${price}
                            </div>

                        </div>


                        <div class="cart-quantity">

                            <button
                                type="button"
                                class="qty-btn"
                                data-cart-action="minus"
                                data-product-id="${item.id}"
                            >
                                <i class="fa-solid fa-minus"></i>
                            </button>

                            <span class="qty-value">
                                ${quantity}
                            </span>

                            <button
                                type="button"
                                class="qty-btn"
                                data-cart-action="plus"
                                data-product-id="${item.id}"
                            >
                                <i class="fa-solid fa-plus"></i>
                            </button>

                        </div>


                        <button
                            type="button"
                            class="cart-remove-btn"
                            data-cart-action="remove"
                            data-product-id="${item.id}"
                            aria-label="Remove"
                        >
                            <i class="fa-solid fa-trash"></i>
                        </button>

                    </div>
                `;
            }).join("");

        if (summaryItems) {
            summaryItems.textContent =
                totalItems;
        }

        if (summarySubtotal) {
            summarySubtotal.textContent =
                `₹${subtotal}`;
        }

        if (summaryTotal) {
            summaryTotal.textContent =
                `₹${subtotal}`;
        }
    }

    window.renderCart = renderCart;


    /* =====================================================
       ORDERS
    ====================================================== */

    function renderOrders() {

        const container =
            $("#customerOrdersList");

        const empty =
            $("#ordersEmptyState");

        if (!container) return;

        const orders =
            window.ShopMax99.storage.get(
                STORAGE.orders,
                []
            );

        if (!orders.length) {

            container.innerHTML = "";

            if (empty) {
                empty.hidden = false;
            }

            return;
        }

        if (empty) {
            empty.hidden = true;
        }

        container.innerHTML =
            orders.map(order => {

                const date =
                    new Date(order.date)
                        .toLocaleDateString(
                            "en-IN",
                            {
                                day: "2-digit",
                                month: "short",
                                year: "numeric"
                            }
                        );

                const itemCount =
                    order.items.reduce(
                        (sum, item) =>
                            sum +
                            Number(item.quantity || 1),
                        0
                    );

                return `
                    <div class="order-card">

                        <div class="order-header">

                            <div>
                                <div class="order-id">
                                    ${order.id}
                                </div>

                                <div class="order-date">
                                    ${date}
                                    ·
                                    ${itemCount} item${
                                        itemCount === 1
                                            ? ""
                                            : "s"
                                    }
                                </div>
                            </div>

                            <span class="order-status status-success">
                                ${window.ShopMax99.escapeHTML(
                                    order.status
                                )}
                            </span>

                        </div>

                        <div style="
                            margin-top:14px;
                            display:flex;
                            justify-content:space-between;
                            align-items:center;
                            gap:15px;
                        ">

                            <span style="
                                color:#77707f;
                                font-size:10px;
                            ">
                                Order Total
                            </span>

                            <strong style="
                                color:#6d28d9;
                                font-size:16px;
                            ">
                                ₹${order.total}
                            </strong>

                        </div>

                    </div>
                `;
            }).join("");
    }

    window.renderOrders = renderOrders;


    /* =====================================================
       PRODUCT MODAL
    ====================================================== */

    function getProductReviews(productId) {
        try {
            const all = JSON.parse(localStorage.getItem("shopmax99_reviews") || "[]");
            return Array.isArray(all)
                ? all.filter(r => String(r.productId) === String(productId))
                : [];
        } catch (error) {
            return [];
        }
    }

    function hasPurchasedProduct(productId) {
        try {
            const key = window.ShopMax99.storage?.keys?.orders;
            const orders = key
                ? window.ShopMax99.storage.get(key, [])
                : [];
            return Array.isArray(orders) && orders.some(order =>
                Array.isArray(order.items) && order.items.some(item =>
                    String(item.id) === String(productId)
                )
            );
        } catch (error) {
            return false;
        }
    }

    function saveProductReview(review) {
        try {
            const all = JSON.parse(localStorage.getItem("shopmax99_reviews") || "[]");
            const reviews = Array.isArray(all) ? all : [];
            reviews.unshift(review);
            localStorage.setItem("shopmax99_reviews", JSON.stringify(reviews));
            return true;
        } catch (error) {
            return false;
        }
    }

    function renderReviewStars(rating, interactive = false) {
        const value = Math.max(0, Math.min(5, Number(rating) || 0));
        return [1, 2, 3, 4, 5].map(star => {
            const active = star <= value;
            if (interactive) {
                return `
                    <button type="button" class="review-star-btn ${active ? "active" : ""}" data-review-rating="${star}" aria-label="${star} star${star > 1 ? "s" : ""}">
                        <i class="fa-${active ? "solid" : "regular"} fa-star"></i>
                    </button>`;
            }
            return `<i class="fa-${active ? "solid" : "regular"} fa-star"></i>`;
        }).join("");
    }

    function currentReviewUser() {
        // Primary customer login/session.
        try {
            const session = JSON.parse(localStorage.getItem("shopmax99_customer_session") || "null");
            if (session && session.loggedIn && session.customerId) {
                return {
                    id: session.customerId,
                    customerId: session.customerId,
                    name: session.name || "Customer",
                    mobile: session.mobile || ""
                };
            }
        } catch (error) {
            console.error("Customer review session read error:", error);
        }

        // Compatibility with the older customer email-login flow.
        // Never treat seller/admin sessions as customer review sessions.
        try {
            const user = window.ShopMax99.user?.get?.() || null;
            if (user && user.role !== "seller" && user.role !== "admin") {
                return {
                    id: user.id || user.customerId || user.email,
                    customerId: user.id || user.customerId || user.email,
                    name: user.name || user.email?.split("@")[0] || "Customer",
                    email: user.email || "",
                    mobile: user.mobile || ""
                };
            }
        } catch (error) {
            console.error("Legacy customer session read error:", error);
        }

        return null;
    }

    function renderProductReviews(product) {
        const reviews = getProductReviews(product.id);
        const total = reviews.length;
        const average = total
            ? reviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0) / total
            : 0;

        const reviewCards = reviews.length
            ? reviews.map(review => `
                <article class="sm99-review-card">
                    <div class="sm99-review-card-head">
                        <div class="sm99-review-user">
                            <div class="sm99-review-avatar">
                                <i class="fa-solid fa-user"></i>
                            </div>
                            <div>
                                <strong>${window.ShopMax99.escapeHTML(review.name || "Customer")}</strong>
                                ${review.verifiedPurchase !== false
                                    ? `<span class="sm99-verified"><i class="fa-solid fa-circle-check"></i> Verified Purchase</span>`
                                    : `<span class="sm99-review-customer-badge"><i class="fa-solid fa-user"></i> Customer Review</span>`}
                            </div>
                        </div>
                        <time>${review.createdAt ? new Date(review.createdAt).toLocaleDateString("en-IN") : ""}</time>
                    </div>
                    <div class="sm99-review-stars-static" aria-label="${Number(review.rating) || 0} out of 5 stars">
                        ${renderReviewStars(review.rating)}
                    </div>
                    <p>${window.ShopMax99.escapeHTML(review.text || "")}</p>
                    ${review.image ? `<img class="sm99-review-photo" src="${review.image}" alt="Customer review photo">` : ""}
                </article>
            `).join("")
            : `
                <div class="sm99-no-reviews-card">
                    <div class="sm99-no-reviews-icon"><i class="fa-regular fa-comment-dots"></i></div>
                    <strong>No reviews yet</strong>
                    <span>Be the first customer to review this product.</span>
                </div>
            `;

        const purchased = hasPurchasedProduct(product.id);
        const canReview = Boolean(currentReviewUser());

        return `
            <section class="sm99-reviews-section">
                <div class="sm99-reviews-header">
                    <div>
                        <span class="sm99-section-kicker">CUSTOMER FEEDBACK</span>
                        <h3>Ratings & Reviews</h3>
                    </div>
                    <div class="sm99-rating-summary">
                        <strong>${total ? average.toFixed(1) : "0.0"}</strong>
                        <div class="sm99-review-stars-static">${renderReviewStars(total ? average : 0)}</div>
                        <span>${total} review${total === 1 ? "" : "s"}</span>
                    </div>
                </div>

                ${canReview ? `
                    <form class="sm99-review-form" data-product-id="${product.id}">
                        <div class="sm99-review-form-title">
                            <div>
                                <strong>Write a review</strong>
                                <span>Share your experience with other customers.</span>
                            </div>
                            ${purchased
                                ? `<span class="sm99-review-purchase-note"><i class="fa-solid fa-circle-check"></i> Verified purchase</span>`
                                : `<span class="sm99-review-purchase-note sm99-review-unverified-note"><i class="fa-solid fa-user"></i> Customer review</span>`}
                        </div>

                        <div class="sm99-rating-picker">
                            <span>Your rating</span>
                            <div class="sm99-review-stars-picker">
                                ${renderReviewStars(0, true)}
                            </div>
                            <input type="hidden" name="rating" value="0">
                        </div>

                        <textarea name="reviewText" maxlength="800" required placeholder="What did you like or dislike about this product?"></textarea>

                        <div class="sm99-review-form-bottom">
                            <label class="sm99-photo-upload">
                                <i class="fa-regular fa-image"></i>
                                <span>Add product photo</span>
                                <input type="file" name="reviewImage" accept="image/jpeg,image/png,image/webp">
                            </label>
                            <button type="submit" class="sm99-review-submit">
                                Submit Review <i class="fa-solid fa-arrow-right"></i>
                            </button>
                        </div>
                        <small class="sm99-review-help">${purchased
                            ? "Your review is marked as Verified Purchase because this product appears in a completed order."
                            : "You can review this product while signed in. Because you have not purchased it yet, your review will not carry a Verified Purchase badge."}</small>
                    </form>
                ` : `
                    <div class="sm99-review-locked">
                        <div class="sm99-review-locked-icon"><i class="fa-solid fa-lock"></i></div>
                        <div>
                            <strong>${!canReview ? "Sign in to review this product" : "Review available after purchase"}</strong>
                            <span>${!canReview ? "Please sign in with your customer account first." : "Buy this product first. After your order is recorded, you can submit your rating, review and product photo here."}</span>
                        </div>
                    </div>
                `}

                <div class="sm99-review-list">
                    ${reviewCards}
                </div>
            </section>
        `;
    }

    function openProduct(productId) {
        const product = getProducts().find(
            item => String(item.id) === String(productId)
        );
        if (!product) return;

        const content = $("#productModalContent");
        if (!content) return;

        const currentUser = currentReviewUser();
        const reviewsHtml = renderProductReviews(product);
        const productImages = Array.from(new Set(
            (Array.isArray(product.images) ? product.images : [])
                .concat(product.image ? [product.image] : [])
                .filter(Boolean)
        )).slice(0, 4);
        const galleryImages = productImages.length ? productImages : [""];

        content.innerHTML = `
            <div class="product-detail">
                <div class="product-detail-image sm99-product-gallery" data-gallery-index="0">
                    <div class="sm99-gallery-stage">
                        ${galleryImages[0]
                            ? `<img class="sm99-gallery-main-image" src="${galleryImages[0]}" alt="${window.ShopMax99.escapeHTML(product.name)}">`
                            : `<i class="fa-solid fa-box" aria-hidden="true"></i>`}
                        ${galleryImages.length > 1 ? `
                            <button type="button" class="sm99-gallery-btn sm99-gallery-prev" data-gallery-action="prev" aria-label="Previous image"><i class="fa-solid fa-chevron-left"></i></button>
                            <button type="button" class="sm99-gallery-btn sm99-gallery-next" data-gallery-action="next" aria-label="Next image"><i class="fa-solid fa-chevron-right"></i></button>
                            <span class="sm99-gallery-counter">1 / ${galleryImages.length}</span>
                        ` : ""}
                    </div>
                    ${galleryImages.length > 1 ? `
                        <div class="sm99-gallery-thumbs">
                            ${galleryImages.map((img, i) => `<button type="button" class="sm99-gallery-thumb ${i === 0 ? "active" : ""}" data-gallery-thumb="${i}" aria-label="View image ${i + 1}"><img src="${img}" alt=""></button>`).join("")}
                        </div>
                    ` : ""}
                </div>

                <div class="product-detail-info">
                    <div class="product-detail-category">
                        ${window.ShopMax99.escapeHTML(categoryName(product.category))}
                    </div>
                    <h2>${window.ShopMax99.escapeHTML(product.name)}</h2>
                    <div class="product-detail-rating-row">
                        <span class="product-detail-rating-stars">${renderReviewStars(product.rating || 0)}</span>
                        <span>${product.rating || "No rating"}</span>
                    </div>
                    <div class="product-detail-price">₹${customerPrice(product)}</div>
                    <p class="product-detail-description">
                        ${window.ShopMax99.escapeHTML(product.description || "Product details will be updated soon.")}
                    </p>

                    <div class="product-detail-actions">
                        <button type="button" class="product-detail-wishlist" data-action="modal-wishlist" data-product-id="${product.id}">
                            <i class="fa-regular fa-heart"></i> Wishlist
                        </button>
                        <button type="button" class="primary-btn product-detail-cart" data-action="modal-add-cart" data-product-id="${product.id}">
                            <i class="fa-solid fa-cart-plus"></i> Add to Cart
                        </button>
                    </div>
                </div>
            </div>
            ${reviewsHtml}
        `;

        window.ShopMax99.openModal("productModal");
        bindProductReviewEvents(product);
    }

    function bindProductReviewEvents(product) {
        const content = $("#productModalContent");
        if (!content) return;

        content.querySelector('[data-action="modal-wishlist"]')?.addEventListener("click", () => {
            toggleWishlist(product.id);
            const icon = content.querySelector('[data-action="modal-wishlist"] i');
            const wished = window.ShopMax99.wishlist.get().some(item => String(item.id) === String(product.id));
            if (icon) icon.className = wished ? "fa-solid fa-heart" : "fa-regular fa-heart";
        });

        // Product image gallery: Previous / Next + thumbnail navigation.
        const gallery = content.querySelector(".sm99-product-gallery");
        if (gallery) {
            const images = Array.from(new Set(
                (Array.isArray(product.images) ? product.images : [])
                    .concat(product.image ? [product.image] : [])
                    .filter(Boolean)
            )).slice(0, 4);
            let galleryIndex = 0;
            const updateGallery = () => {
                if (!images.length) return;
                galleryIndex = (galleryIndex + images.length) % images.length;
                const main = gallery.querySelector(".sm99-gallery-main-image");
                if (main) main.src = images[galleryIndex];
                const counter = gallery.querySelector(".sm99-gallery-counter");
                if (counter) counter.textContent = `${galleryIndex + 1} / ${images.length}`;
                gallery.querySelectorAll("[data-gallery-thumb]").forEach(btn => {
                    btn.classList.toggle("active", Number(btn.dataset.galleryThumb) === galleryIndex);
                });
            };
            gallery.querySelector('[data-gallery-action="prev"]')?.addEventListener("click", () => { galleryIndex--; updateGallery(); });
            gallery.querySelector('[data-gallery-action="next"]')?.addEventListener("click", () => { galleryIndex++; updateGallery(); });
            gallery.querySelectorAll("[data-gallery-thumb]").forEach(btn => {
                btn.addEventListener("click", () => { galleryIndex = Number(btn.dataset.galleryThumb) || 0; updateGallery(); });
            });
        }

        const form = content.querySelector(".sm99-review-form");
        if (!form) return;

        let selectedRating = 0;
        form.querySelectorAll("[data-review-rating]").forEach(button => {
            button.addEventListener("click", () => {
                selectedRating = Number(button.dataset.reviewRating) || 0;
                const hidden = form.querySelector('input[name="rating"]');
                if (hidden) hidden.value = String(selectedRating);
                form.querySelectorAll("[data-review-rating]").forEach(starButton => {
                    const active = Number(starButton.dataset.reviewRating) <= selectedRating;
                    starButton.classList.toggle("active", active);
                    const icon = starButton.querySelector("i");
                    if (icon) icon.className = `fa-${active ? "solid" : "regular"} fa-star`;
                });
            });
        });

        form.addEventListener("submit", event => {
            event.preventDefault();
            const text = form.reviewText.value.trim();
            const file = form.reviewImage.files?.[0];
            const user = currentReviewUser();

            if (!selectedRating) {
                window.ShopMax99.showToast?.("Please select a star rating.", "error");
                return;
            }
            if (!text) {
                window.ShopMax99.showToast?.("Please write a review.", "error");
                return;
            }
            if (!user) {
                window.ShopMax99.showToast?.("Please sign in before writing a review.", "error");
                return;
            }
            if (file && !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
                window.ShopMax99.showToast?.("Only JPG, PNG or WebP images are allowed.", "error");
                return;
            }

            const save = image => {
                const ok = saveProductReview({
                    id: `REV-${Date.now()}`,
                    productId: product.id,
                    name: user.name || user.email?.split("@")[0] || "Customer",
                    rating: selectedRating,
                    text,
                    image: image || "",
                    verifiedPurchase: hasPurchasedProduct(product.id),
                    createdAt: new Date().toISOString()
                });
                if (!ok) {
                    window.ShopMax99.showToast?.("Could not save the review.", "error");
                    return;
                }
                window.ShopMax99.showToast?.("Review submitted successfully.", "success");
                openProduct(product.id);
            };

            if (!file) {
                save("");
                return;
            }

            const reader = new FileReader();
            reader.onload = () => save(reader.result);
            reader.readAsDataURL(file);
        });
    }


    /* =====================================================
       CUSTOMER CLICK EVENTS
    ====================================================== */

    function bindCustomerEvents() {

        document.addEventListener(
            "click",
            function (event) {

                const actionButton =
                    event.target.closest(
                        "[data-action]"
                    );

                if (actionButton) {

                    const action =
                        actionButton.dataset.action;

                    const productId =
                        actionButton.dataset.productId;

                    if (action === "wishlist") {

                        toggleWishlist(productId);

                        return;
                    }

                    if (action === "add-cart") {

                        event.preventDefault();
                        event.stopPropagation();
                        const savedScrollY = window.scrollY;

                        const product =
                            getProducts().find(
                                item =>
                                    String(item.id) ===
                                    String(productId)
                            );

                        if (product) {

                            window.ShopMax99.cart.add(
                                product
                            );
                            requestAnimationFrame(() => {
                                window.scrollTo(0, savedScrollY);
                            });
                        }

                        return;
                    }

                    if (action === "view-product") {

                        openProduct(productId);

                        return;
                    }

                    if (action === "modal-add-cart") {

                        event.preventDefault();
                        event.stopPropagation();
                        const product =
                            getProducts().find(
                                item =>
                                    String(item.id) ===
                                    String(productId)
                            );

                        if (product) {

                            window.ShopMax99.cart.add(
                                product
                            );

                            window.ShopMax99.closeModal(
                                "productModal"
                            );
                        }

                        return;
                    }
                }


                const cartAction =
                    event.target.closest(
                        "[data-cart-action]"
                    );

                if (cartAction) {

                    const action =
                        cartAction.dataset.cartAction;

                    const productId =
                        cartAction.dataset.productId;

                    if (action === "plus") {

                        window.ShopMax99.cart.changeQuantity(
                            productId,
                            1
                        );
                    }

                    if (action === "minus") {

                        window.ShopMax99.cart.changeQuantity(
                            productId,
                            -1
                        );
                    }

                    if (action === "remove") {

                        window.ShopMax99.cart.remove(
                            productId
                        );
                    }

                    return;
                }

            }
        );
    }


    /* =====================================================
       INITIALIZE CUSTOMER
    ====================================================== */

    function initCustomer() {

        initializeProducts();

        bindCustomerEvents();

        renderProducts();

        renderWishlist();

        renderCart();

        renderOrders();
    }

    window.initCustomer = initCustomer;

})();