# Review management follow-up

- Public gallery, video player and product video panels hide management controls, including for a saved owner session. Import entry point rejects non-dashboard calls. This is UI separation, not a replacement for database authorization.
- Dashboard retains import, upload, thumbnail editing, image deletion, complete review deletion and preview/export.
- Replacement requires an explicitly selected existing review and exactly one uploaded file (or one link). It updates that review ID with an optimistic timestamp check, never upserts a deleted review. Cover, title and metadata stay unchanged; old storage files are not deleted.
- Replacement changes the selected review only; it does not change the product's separately stored primary video URL. The dialog discloses this limitation. Multi-file addition remains separate.
- An exact same URL already present for a product is rejected by the link-add UI. Different URLs or concurrent submissions are not globally deduplicated.
- Live read-only audit at implementation time found 39 review rows for 26 product IDs. Narwal has four distinct media URLs (1/4–4/4), Kasa has three distinct media URLs. Distinct URLs do not prove distinct visual content. No live reviews/products were deleted by this change.

Validation: TypeScript; production Vite build; rendered public/dashboard component tests; mocked actual storage service tests for exact identity, field preservation, denied writes and timestamp conflicts. No live owner upload/replacement was executed against customer data.

Still pending: persistent article-image editor; audited visitor/page-view analytics; affiliate sales/commission report integration; full visual review-to-product matching audit. Do not claim these are delivered by this patch.
