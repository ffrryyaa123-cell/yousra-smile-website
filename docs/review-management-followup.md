# Review management follow-up

- Public gallery, video player and product video panels hide management controls, including for a saved owner session. Import entry point rejects non-dashboard calls. This is UI separation, not a replacement for database authorization.
- Dashboard retains import, upload, thumbnail editing, image deletion, complete review deletion and preview/export.
- Replacement requires an explicitly selected existing review and exactly one uploaded file (or one link). It updates that review ID with an optimistic timestamp check, never upserts a deleted review. Cover, title and metadata stay unchanged; old storage files are not deleted.
- Replacement changes the selected review only; it does not change the product's separately stored primary video URL. The dialog discloses this limitation. Multi-file addition remains separate.
- An exact same URL already present for a product is rejected by the link-add UI. Different URLs or concurrent submissions are not globally deduplicated.
- Live read-only audit at implementation time found 39 review rows for 26 product IDs. Narwal has four distinct media URLs (1/4–4/4), Kasa has three distinct media URLs. Distinct URLs do not prove distinct visual content. No live reviews/products were deleted by this change.

Validation: TypeScript; production Vite build; rendered public/dashboard component tests; mocked actual storage service tests for exact identity, field preservation, denied writes and timestamp conflicts. No live owner upload/replacement was executed against customer data.

Still pending: persistent article-image editor; audited visitor/page-view analytics; affiliate sales/commission report integration; full visual review-to-product matching audit. Do not claim these are delivered by this patch.

## Persistence follow-up

- New reviews wait for a returned database row before entering React/local-storage state. Failed writes report failure and do not create a temporary card; upload, generator and agent success indicators await this result.
- Temporary blob URLs cannot be saved as permanent review URLs.
- File upload now writes one complete review record, not an intermediate partial record and a second asynchronous overwrite.
- Overlapping catalog reads ignore responses from older requests.
- Read-only live audit: 6 archived review IDs were absent from the active table, with all six storage files present. Two active review storage paths were absent from storage.objects and failed HTTP HEAD (400). One review had a missing product. This is not proof that all historical disappearance reports have been explained.
- No archive restoration, deletion or storage mutation was performed. Restoring missing files and verifying which older reviews the owner intended to keep remains pending.
