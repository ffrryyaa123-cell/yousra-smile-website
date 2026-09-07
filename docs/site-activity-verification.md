# Measured activity integration

## Scope delivered

- Page navigation, product-detail opens, Amazon/AliExpress link clicks persist through `site-engagement` to `site_activity_events`.
- Reports are computed in PostgreSQL for rolling 24-hour, 7-day and 30-day windows; product/review totals are database counts, not a potentially truncated browser array.
- Reports/events are admin-only. Anonymous visitors cannot read them or call the privileged recorder directly. The edge endpoint authenticates the public browser key, validates origin/input and sends server-computed hashes; it does not authorize catalog edits.
- Event UUID prevents retry double-counting. Rate gate is 600 events/network-hash/hour. A browser can still fabricate valid events; these are approximate browser measurements, not verified humans or sales.
- Browser identifier expires after 30 days; tab session identifier lasts the session. HMAC hashes, not raw identifiers/IP/email/name, are stored in the database. Records older than 90 days are pruned on new recordings. DNT, hidden tabs and known admin activity are excluded client-side as best effort.
- No backfilled or invented visitor data. No orders/commissions are inferred. Unconnected sales/commissions show unavailable, not zero.
- Cart CTA records only the product actually opened. Existing tagged/short affiliate URLs retain their exact saved tracking fields.

## Verification

- `test-site-activity.sql`: transactional live database fixtures, duplicate event, hidden product rejection, admin report, non-admin/anonymous read denial, client direct-write denial. All fixtures rolled back.
- `test-site-activity-api.mjs`: live invalid key/origin, missing-product rejection, admin-page rejection, anonymous report/raw-event access denied. No real visit/click seeded.
- `test-site-activity.mjs`: browser identity, exact product/store event, admin/DNT exclusion, report errors are not zero.
- `test-public-review-controls.mjs`: public review gallery/player have no management buttons; dashboard preview retains tools.
- TypeScript and production build checked before publishing.

At audit time: 38 saved products had Amazon tags or short links; seven had AliExpress tracking links, 31 had none. This is syntactic verification, not proof that the affiliate accounts belong to the owner or that merchants will attribute commissions. No affiliate destinations were opened to create artificial traffic.

## Still pending

- Affiliate merchant report authorization/import and reconciliation of pending/approved/paid commissions. No connector/account permissions or sales records have been provided for this integration.
- Persistent article-image editor, full content/product matching, recovery of previously missing files, and large-catalog pagination/performance work.
- A live owner browser acceptance test has not been performed; database and API authorization tests use isolated/rolled-back fixtures.

## Existing security advisor findings

No advisor warning targeted the new activity table/functions. Existing catalog backup tables lack RLS; the existing auth helpers are security-definer routines and leaked-password protection is disabled. These were not changed as part of measurement. See [Supabase RLS remediation](https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public) and [password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
