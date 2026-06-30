# Teacher Monitoring Portfolio — Cloudflare Deployment Guide

## What you're deploying
A React app hosted on Cloudflare Pages, with a Cloudflare KV store saving each
teacher's portfolio data. Each teacher gets a unique URL. No login required.

---

## Step 1 — Create a free Cloudflare account
Go to https://cloudflare.com and sign up (free). You don't need to transfer any
domain — you can use the free *.pages.dev subdomain.

---

## Step 2 — Create a KV Namespace (the database)
This is where all teacher data will be saved.

1. In Cloudflare dashboard → **Workers & Pages** → **KV**
2. Click **Create a namespace**
3. Name it: `PORTFOLIOS`
4. Copy the **Namespace ID** shown — you'll need it in Step 4

---

## Step 3 — Upload this project to GitHub
Cloudflare Pages deploys from GitHub.

1. Create a free GitHub account at https://github.com if you don't have one
2. Create a new repository called `teacher-monitoring-portfolio`
3. Upload all the files from this folder into that repository
   (drag and drop them into the GitHub web interface, or use GitHub Desktop)

---

## Step 4 — Update wrangler.toml
Open `wrangler.toml` and replace:
- `REPLACE_WITH_YOUR_KV_NAMESPACE_ID` with the ID you copied in Step 2
- `REPLACE_WITH_YOUR_KV_PREVIEW_ID` with the same ID (or create a second one for previews)

Commit this change to GitHub.

---

## Step 5 — Create a Cloudflare Pages project
1. In Cloudflare dashboard → **Workers & Pages** → **Pages**
2. Click **Create a project** → **Connect to Git**
3. Connect your GitHub account and select the `teacher-monitoring-portfolio` repo
4. Build settings:
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. Click **Save and Deploy**

Cloudflare will build and deploy the project. You'll get a URL like:
`https://teacher-monitoring-portfolio.pages.dev`

---

## Step 6 — Bind the KV namespace to your Pages project
This connects the database to the app.

1. Go to your Pages project → **Settings** → **Functions**
2. Scroll to **KV namespace bindings**
3. Click **Add binding**:
   - **Variable name**: `PORTFOLIOS`  ← must be exactly this
   - **KV namespace**: select the `PORTFOLIOS` namespace you created
4. Click **Save**
5. Redeploy (go to Deployments → click the latest deployment → Retry deployment)

---

## Step 7 — Create teacher links
Each teacher gets a unique URL based on their name. Just share the link with them.

Examples:
```
https://yourschool.pages.dev/portfolio/miss-amy
https://yourschool.pages.dev/portfolio/mr-jones
https://yourschool.pages.dev/portfolio/mrs-smith-y2
```

Rules for the ID part (after /portfolio/):
- Lowercase only
- Use hyphens instead of spaces
- No special characters

**You can use any name format you like.** Examples:
- `/portfolio/miss-amy-y3`
- `/portfolio/mr-jones-oak`
- `/portfolio/reception-mrs-patel`

---

## How it works in practice

1. You share `https://yourschool.pages.dev/portfolio/miss-amy` with Miss Amy
2. She opens it in any browser on any device
3. She fills in fields — the form auto-saves after every change (1.5s delay)
4. She can close the tab and come back later — everything is saved
5. She can hit Print to get a PDF version at any time
6. You (as admin) can open her link any time to see the current state of her portfolio

---

## Viewing all teachers (admin)
There's no admin dashboard built yet — to see a teacher's portfolio, simply
open their link. All data is stored in the KV namespace and accessible via the URL.

If you'd like an admin dashboard added later, that can be built as an additional page.

---

## Cost
Everything above is on Cloudflare's **free tier**:
- Pages: unlimited deployments, free
- KV: 100,000 reads/day, 1,000 writes/day, free
- For a school of 20-30 teachers this will cost £0.

---

## Questions / support
If you get stuck on any step, the most common issues are:
1. KV binding variable name must be exactly `PORTFOLIOS` (capital letters, no spaces)
2. After adding the KV binding you must redeploy for it to take effect
3. The `_redirects` file must be in the `public` folder — don't move it
