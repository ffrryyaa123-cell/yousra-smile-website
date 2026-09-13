# Google Search Console readiness — Yousra Smile

The production build now creates search-engine-friendly static URLs for every public product and writes a complete sitemap at:

- https://yousrasmile.com/sitemap.xml
- https://yousrasmile.com/robots.txt

## One-time Google account action still required

Google Search Console ownership cannot be completed from repository code alone because Google requires the site owner to authorize/verify the domain in their Google account.

Recommended setup:

1. Add `yousrasmile.com` as a **Domain property** in Google Search Console.
2. Complete Google's DNS verification at the domain/DNS provider.
3. Submit `https://yousrasmile.com/sitemap.xml` in Search Console → Sitemaps.
4. Use URL Inspection on the home page and several product URLs, then request indexing.

## Optional HTML verification support

If Search Console provides an HTML meta verification token instead of DNS verification, the build already supports it. Add the repository/Actions secret:

`GOOGLE_SITE_VERIFICATION`

with the token only (not the whole meta tag), and expose it to the `Generate product SEO pages and sitemap` workflow step. The SEO generator will inject:

`<meta name="google-site-verification" content="...">`

into generated public pages.

## What is automatic now

- Every public product gets a stable `/product/...` URL.
- Direct product URLs are generated as real static HTML files for GitHub Pages.
- Product HTML includes a title, meta description, canonical URL, Open Graph/Twitter metadata, Product JSON-LD and readable product content before React starts.
- The sitemap is regenerated from the live public Supabase catalog during every production deploy.
- `/admin` is disallowed in robots and receives runtime `noindex, nofollow` metadata.
- Product page views and affiliate link clicks continue to be stored by the existing Supabase engagement measurement; the dashboard shows click-through rate (CTR).
