# Para-Inc Public Site — Deploy Guide

Unified site: services (fast revenue) + $10 product (compounding asset).
Build-ready. Deployment is an external-visible action → requires Omar's approval.

## Pre-deploy checklist (Omar)
- [ ] LEADS_EMAIL set in app.js (where service inquiries land)
- [ ] Product wallets verified owned by Omar (or product section hidden)
- [ ] Domain decision: para.inc (if owned) or GitHub Pages / Vercel subdomain
- [ ] Deployment approved by Omar

## Deploy options (free)
1. **GitHub Pages** — push `site/` to a repo, enable Pages on main branch `/site`.
2. **Vercel / Netlify** — drag `site/` folder, get a subdomain.
3. **Cloudflare Pages** — connect repo, build command none, output `site`.

## Files
- `index.html` — unified landing (services + product)
- `app.js` — CONFIG block at top (emails, wallets, prices)
- `bundle/` — product PDFs + zip (copy from /home/Omar/para-inc-site/bundle)
