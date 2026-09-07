# Review integrity — 7 September 2026

## What is measured

The counter is **review opens on this website**, not video playback, unique people,
Amazon purchases, or YouTube/TikTok audience figures. Legacy `videos.data.views`
values are retained for audit but are not displayed or imported into the new counts.
The database audit found 64 reviews, 53 with nonzero legacy values. No S8 review
was found; the two current Roborock reviews identify Qrevo S Pro. Neither was deleted.

The browser sends a random per-tab session ID when a visitor opens a review modal.
Repeated opens in that session are deduplicated. Admin-page previews are excluded,
and Do Not Track is respected. This is not bot-proof or identity verification.
The Edge Function checks the existing public browser key, allowed origin and input,
then HMACs the session and network identifiers. No plaintext IP, name or email is
stored by this measurement. Network hashes rotate daily. SQL applies a 60-new-event
per-hour rate gate. Event deduplication records older than eight days are deleted on
subsequent record requests; aggregates remain. Sessions longer than that retention
window can be counted again after a refresh. Closing the page ends session storage.

`review_open_counts` is readable only for RLS-visible reviews. Anonymous users cannot
read raw events, write counters directly, execute the service RPC, or delete reviews.
`review-engagement` uses custom publishable-key checking, so gateway JWT checking is
disabled intentionally; the key is not admin authority. Rotate its pinned SHA-256
digest if the site's public key is changed. Service credentials stay in Edge env.

## Deletion

`delete_catalog_review` uses SECURITY INVOKER, checks the existing catalog-admin
authorization helper, archives the review, deletes it, and detaches a matching
product video URL only if no other review for that product shares it. The transaction
preserves the product, unrelated fields, other reviews, and shared storage files.
The UI changes only after confirmed completion; failures are shown to the owner.
The archive is admin-only. Restore requires an intentional owner-approved database
operation; no restore UI is introduced here.

Schema source: `supabase/sql/review-integrity.sql`; applied remotely via the named
Supabase migration `review_integrity_and_measured_opens`. No keys or auth settings
were deleted and no AI generation or payment was triggered.

## Verification

- TypeScript and Vite production build passed (existing bundle-size warning).
- `scripts/test-review-integrity.sql`: rollback-only fixtures test counts, duplicate
  sessions, hidden reviews, rate gating, archive deletion, shared-media preservation
  and anon restrictions. No test products/events remain committed.
- `scripts/test-review-engagement-api.mjs`: live invalid-key/origin rejection,
  authenticated missing-review rejection without recording an event, aggregate
  read access and raw-event denial.
- Website response identifies `Server: GitHub.com` and a GitHub request ID; Netlify
  screenshots show a separate older skipped deploy. No hosting configuration changed.

## Pre-existing security observations (not remediated in this scoped change)

Supabase's security advisor reports disabled RLS on `videos_backup_20260902` and
`products_backup_20260902`. These historical tables are not the new review archive;
their consumers and grants need a separate review before changing them.
[Supabase RLS remediation guidance](https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public).
Existing authorization helpers have SECURITY DEFINER execution warnings, and leaked
password protection is disabled. No blanket credential/policy changes were made.
The new service-only raw event table intentionally has RLS and no client policy:
[explanation](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).
