# SHOPMAX99 Backend Migration Contract

This build remains a frontend/localStorage prototype, but the data boundaries are intentionally named so the next migration can replace persistence without redesigning the UI.

## Recommended modules

- `auth`: customer, seller, admin and support authentication; OTP; sessions; password recovery.
- `users`: customer/admin/support identities and role permissions.
- `sellers`: seller profiles, KYC, bank details, approval and status.
- `products`: product catalog, unique product IDs, seller ownership and approval state.
- `orders`: order lifecycle and customer ownership.
- `payments`: payment gateway callbacks, payment intents and reconciliation.
- `company-bank`: active company current account metadata and bank integration adapter.
- `ledger`: immutable credits/debits; every transaction references `company_bank_accounts.id`.
- `support`: scoped read access, change requests, before/after snapshots and approvals.
- `audit`: append-only administrative/security events.
- `staff-payments`: support/seller/courier payout records linked to the ledger.

## API contract direction

Use REST or GraphQL with the same entity names. Frontend actions should become API calls rather than direct localStorage mutations. Keep IDs stable and use UUID/ULID on the server.

### Important endpoints

- `POST /auth/admin/login` -> credential check -> OTP challenge
- `POST /auth/admin/otp/verify` -> authenticated admin session
- `POST /auth/support/login`
- `POST /auth/seller/login`
- `POST /auth/customer/otp/verify`
- `GET /products?search=`
- `PATCH /products/:id` (seller owner/admin only; support creates request instead)
- `POST /support/requests`
- `POST /support/requests/:id/accept`
- `POST /support/requests/:id/reject`
- `POST /support/requests/:id/apply`
- `DELETE /support/requests/:id`
- `GET /support/requests?status=&type=&q=`
- `GET /company-bank/accounts`
- `PUT /company-bank/accounts/:id`
- `GET /transactions`
- `POST /staff-payments`

## Approval rule

Support edits must contain:

1. Target entity ID.
2. Before snapshot.
3. Proposed after snapshot.
4. Requesting staff ID.
5. Request status.
6. Admin reviewer ID/time.
7. Final applied snapshot.

The backend must perform the final authorization and mutation inside a transaction so the browser cannot bypass Admin approval.

## Banking rule

The current browser tab only stores configuration metadata. Actual company-bank linkage and fund movement must be implemented by a server-side bank/payment provider adapter. No bank password, API secret, card credential or OTP should be stored in localStorage.
