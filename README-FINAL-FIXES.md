# SHOPMAX99 Final Fixes

- Seller Support and Customer Support login hardened for role aliases, active/blocked states and legacy credential field names.
- Admin login is now two-step: email/password -> OTP -> Admin Center.
- Prototype OTP is displayed in the OTP modal; replace generation/delivery with server OTP later.
- Footer `New Seller? Register Here` removed. `Become a Seller` opens the same registration form.
- Admin Dashboard and Reports received a visual card/hero upgrade.
- Added Company Bank Account admin tab and ledger linkage metadata.
- Transaction records are assigned a `bankAccountId` so backend migration can map every credit/debit to a company account.
- Added backend migration schema and architecture contract.
- HTML contains no inline CSS or inline event-handler JavaScript.
