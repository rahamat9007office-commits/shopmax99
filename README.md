# SHOPMAX99 — Support + Product Workflow Update

This build keeps the existing SHOPMAX99 customer, seller, admin and review functionality and adds the requested support/product workflow.

## Product IDs
- Every product in `shopmax99_products` is guaranteed a unique Product ID.
- New seller listings generate IDs in the `SM99-P-...` format.
- Existing products missing IDs are assigned IDs automatically.
- Product IDs are shown in customer, seller, admin and support views.

## Seller Support — Product Workflow
1. Seller Support can search products by Product ID, product name, seller ID, seller name/shop, email or phone.
2. Staff opens **Edit Product**.
3. Staff can prepare changes to name, category, description, seller price, customer price, stock, status and product images.
4. Product images remain limited to **100 KB per image**, JPG/PNG/WebP, maximum 4 images.
5. Staff clicks **Done — Send for Admin Approval**.
6. The live product is NOT changed at this stage. A request containing Before/After snapshots is created.

## Admin Support Requests
- Pending requests have separate **Accept** and **Reject** actions.
- Accepting a request does not silently apply the change.
- Accepted requests open an Admin review editor with **Before Edit** and **After Edit** tabs.
- Admin can edit the proposed values, **Accept & Apply Changes**, or **Reject Request**.
- Accepted-but-not-yet-applied requests can still be rejected.
- Requests can be searched/filtered by request ID, Product ID, staff, target, status, request type and staff role.
- Admin can select requests and permanently delete them.
- Audit events are recorded for request creation, review, approval, rejection, deletion and payouts.

## Pay to Staff
Admin has a dedicated **Pay to Staff** tab with searchable category-wise lists:
- Seller Support Staff
- Customer Support Staff
- Sellers
- Courier Partners

Each category has a sublist searchable by name, username/contact and ID. Admin can view payout history and record a payment with amount, reference and note.

## File structure
- `index.html` — markup only; no inline CSS or inline JavaScript.
- `style.css` — all page styles.
- `app.js` — common application/navigation/storage utilities.
- `customer.js` — customer experience.
- `seller.js` — seller workspace and seller product listing/editing.
- `admin.js` — Admin Control Center/navigation.
- `support.js` — support staff, product edit drafts, approval workflow, audit and payouts.
- `bootstrap.js` — footer actions, master passkey bridge, seller/admin login wiring and seller registration wiring moved out of HTML.

## Prototype limitation
This project is still a browser/localStorage prototype. For public production deployment, authentication, authorization, password storage, approval enforcement and payment records should be moved to a server-side database/API with secure sessions.
