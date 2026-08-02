# Borrowed History Journal

A calm, private practice for noticing where knowledge comes from:

- **Deduction** — reached by reasoning
- **Direct Experience / Intuition** — felt or observed first-hand
- **Borrowed History** — received from books, media, culture, AI, testimony

Entries stay on the reader’s device (browser storage + a durable browser database).  
Use **Export backup** / **Restore** so a practice can survive device changes.

The fuller framework is explored in [*The Borrowed History Predicament*](https://twocentphilosophy.com/products/the-borrowed-history-predicament).

## Permanence checklist

| Layer | Status you want |
| --- | --- |
| **Source code** | This GitHub repo (already set) |
| **Live website** | Deploy on [Vercel](https://vercel.com) from this repo |
| **Custom address** | e.g. `journal.twocentphilosophy.com` via CNAME in DNS |
| **Reader entries** | Private on their device; export JSON for backups |

### Deploy on Vercel (once)

1. Sign in at [vercel.com](https://vercel.com) with GitHub  
2. **Add New → Project** → import `ApexMachina/borrowed-history-journal`  
3. **Deploy** (defaults are fine)  
4. Open the `*.vercel.app` URL and confirm the journal loads  
5. **Settings → Domains** → add `journal.twocentphilosophy.com`  
6. In Shopify (or your DNS host), add the **CNAME** Vercel shows for `journal`

After that, the site stays live independently of this chat or any preview.

## Local development

```bash
npm install
npm run dev
```

## Privacy

No accounts. Nothing is uploaded to a server by the journal itself.  
Backups are files the user downloads and keeps.
