# SellerCFO — Integration Connector Setup Guide

Quick-start guide for creating developer accounts and obtaining API credentials for each SellerCFO integration. Follow each section, paste credentials into Vercel env vars, and you're live.

---

## Quick-Start Checklist

Work top-to-bottom. Each box is one Vercel env var pair to populate.

- [ ] **QBO** — `QBO_CLIENT_ID`, `QBO_CLIENT_SECRET` *(reuse from BuilderCFO — 5 min)*
- [x] **Shopify** — `SHOPIFY_CLIENT_ID`, `SHOPIFY_CLIENT_SECRET` *(done)*
- [x] **Xero** — `XERO_CLIENT_ID`, `XERO_CLIENT_SECRET` *(done)*
- [x] **Etsy** — `ETSY_API_KEY`, `ETSY_SHARED_SECRET` *(done)*
- [ ] **Amazon SP-API** — `AMAZON_SP_CLIENT_ID`, `AMAZON_SP_CLIENT_SECRET`, `AMAZON_SP_REFRESH_TOKEN` *(30–60 min, requires AWS IAM)*
- [x] **Walmart** — BYO per-seller credentials (no platform env vars) *(PRO plan)*
- [ ] **TikTok Shop** — `TIKTOK_SHOP_APP_KEY`, `TIKTOK_SHOP_APP_SECRET` *(1–3 days for partner approval, PRO plan)*
- [ ] **WooCommerce** — no dev account needed, per-store keys *(PRO plan)*

After each section, add the credentials on Vercel → Settings → Environment Variables → Production, then redeploy.

---

## 1. QuickBooks Online (Accounting) — **REUSE FROM BUILDERCFO**

Since you already have a working Intuit app for BuilderCFO, you don't need to create a new one. Add SellerCFO as a second redirect URI on the existing app.

### Option A — Reuse existing BuilderCFO Intuit app (recommended)

1. Go to [developer.intuit.com](https://developer.intuit.com) → sign in with the same account you used for BuilderCFO.
2. **Dashboard → My Apps** → click the existing **BuilderCFO** app.
3. Left sidebar: **Production Settings → Keys & OAuth**.
4. Under **Redirect URIs**, click **Add URI** and paste:
   ```
   https://topsellercfo.com/api/qbo/callback
   ```
   (Keep the existing BuilderCFO URI in place — Intuit allows multiple.)
5. Click **Save**.
6. Still on the same page, copy:
   - **Client ID** → will become `QBO_CLIENT_ID`
   - **Client Secret** → will become `QBO_CLIENT_SECRET`
7. Paste them into Vercel:
   - Vercel → `sellercfo` project → **Settings → Environment Variables**
   - Add `QBO_CLIENT_ID` (Production), `QBO_CLIENT_SECRET` (Production)
   - Also verify `QBO_REDIRECT_URI=https://topsellercfo.com/api/qbo/callback` is set
8. Redeploy SellerCFO (any dummy commit, or hit **Redeploy** in the Vercel dashboard).
9. Test: open `https://topsellercfo.com/dashboard/integrations` → click **Connect** on QuickBooks Online → you should be bounced to Intuit's auth screen.

### Option B — Create a new Intuit app for SellerCFO (if you want isolation)

1. [developer.intuit.com](https://developer.intuit.com) → **Dashboard → Create an App → QuickBooks Online and Payments → Production**
2. App Name: `SellerCFO`
3. **Redirect URI**: `https://topsellercfo.com/api/qbo/callback`
4. Required scopes: `com.intuit.quickbooks.accounting`
5. Copy **Client ID** → `QBO_CLIENT_ID`, **Client Secret** → `QBO_CLIENT_SECRET`
6. Paste into Vercel env vars, redeploy.

**Why you'd pick B:** keeps logs, usage limits, and app-level audit cleanly separated per brand. Not required — Option A is faster.

---

## 2. Xero (Accounting)

1. Go to [developer.xero.com/app/manage](https://developer.xero.com/app/manage)
2. Sign in or create a Xero account
3. **New App**:
   - App name: `SellerCFO`
   - Integration type: **Web app**
   - Company URL: `https://topsellercfo.com`
   - Redirect URI: `https://topsellercfo.com/api/integrations/callback?provider=xero`
4. Copy **Client ID** → `XERO_CLIENT_ID`
5. Generate **Client Secret** → `XERO_CLIENT_SECRET`
6. Required scopes: `openid profile email accounting.transactions.read accounting.reports.read accounting.contacts.read accounting.settings.read`

---

## 3. Shopify (Sales Channel)

1. Go to [partners.shopify.com](https://partners.shopify.com) and sign in (or create a free Partner account — no business verification needed).
2. Left sidebar: **Apps → Create app → Create app manually**.
   - App name: `SellerCFO`
   - App URL: `https://topsellercfo.com`
3. Once created, go to **Configuration** in the app sidebar:
   - **App URL**: `https://topsellercfo.com`
   - **Allowed redirection URL(s)**: add `https://topsellercfo.com/api/integrations/callback?provider=shopify`
   - Save.
4. Go to **Overview** (or **Client credentials** depending on Shopify's current UI):
   - Copy **Client ID** → `SHOPIFY_CLIENT_ID`
   - Copy **Client secret** → `SHOPIFY_CLIENT_SECRET`
5. Scopes your app needs to request at install time (already hardcoded in `src/lib/integrations/shopify.ts`):
   `read_orders`, `read_products`, `read_inventory`, `read_analytics`, `read_reports`, `read_customers`, `read_price_rules`, `read_discounts`
6. **Distribution:** leave as "Custom distribution" while testing, switch to "Public distribution" before you list in Shopify App Store (not required for your own customers to install via OAuth link).

---

## 4. Amazon Selling Partner API (Sales Channel)

This is the longest one — plan 30–60 minutes. You need an AWS account, a Seller Central account, and patience.

### Step 1 — Register as an SP-API developer
1. Go to [sellercentral.amazon.com](https://sellercentral.amazon.com) and sign in as a seller (or create a Professional Seller account — $39.99/mo).
2. Top-right menu → **Apps and Services → Develop Apps**.
3. Accept the Developer Agreement when prompted.

### Step 2 — Create an IAM user in AWS (for SP-API to assume)
1. Log in to [AWS Console](https://console.aws.amazon.com) (create a free account if needed).
2. Go to **IAM → Users → Create user**.
3. Name: `sellercfo-spapi`. No console access needed.
4. Attach policy: create an inline policy with this minimum permission:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Action": "execute-api:Invoke",
       "Resource": "arn:aws:execute-api:*:*:*"
     }]
   }
   ```
5. After creation, copy the user's **ARN** (e.g. `arn:aws:iam::123456789012:user/sellercfo-spapi`). You'll paste this into Seller Central.

### Step 3 — Register your application in Seller Central
1. Back in Seller Central → **Develop Apps → Add new app client**.
2. Fill in:
   - **App name**: `SellerCFO`
   - **API type**: `SP-API`
   - **IAM ARN**: paste from Step 2
   - **OAuth Login URI**: `https://topsellercfo.com/integrations`
   - **OAuth Redirect URI**: `https://topsellercfo.com/api/integrations/callback?provider=amazon`
3. Under **Roles**, select at minimum:
   - Pricing, Inventory and Order Management, Finance and Accounting
4. Save.

### Step 4 — Grab your LWA credentials
After saving, click **View** next to your new app:
- **LWA Client ID** → `AMAZON_SP_CLIENT_ID`
- **LWA Client Secret** → `AMAZON_SP_CLIENT_SECRET`

### Step 5 — Self-authorize (optional but recommended for your own test seller account)
1. On the same app detail page → **Authorize** → follow the flow with your own seller login.
2. Copy the **Refresh Token** that Amazon returns → `AMAZON_SP_REFRESH_TOKEN`.
3. This lets SellerCFO hit SP-API as your own account without going through OAuth each time — useful for testing.

**Note:** For other sellers using SellerCFO, they'll go through the normal OAuth install flow from your Seller Central app listing. You only need the refresh token for your own testing.

---

## 5. Etsy (Sales Channel)

1. Go to [etsy.com/developers](https://www.etsy.com/developers)
2. Sign in with your Etsy account
3. **Create a New App**:
   - App name: `SellerCFO`
   - Description: `E-commerce financial dashboard`
4. Copy **Keystring (API Key)** → `ETSY_API_KEY`
5. Copy **Shared Secret** → `ETSY_SHARED_SECRET`
6. Set **Callback URL**: `https://topsellercfo.com/api/integrations/callback?provider=etsy`
7. Etsy uses OAuth 2.0 with PKCE. Required scopes: `transactions_r`, `listings_r`, `shops_r`

---

## 6. WooCommerce (Sales Channel)

**No developer account needed.** WooCommerce uses per-store REST API keys.

Each user connects by:
1. Going to their WordPress admin → WooCommerce → Settings → Advanced → REST API
2. Creating a new API key with **Read** permissions
3. Entering their Store URL + Consumer Key in SellerCFO's Integrations page

Credentials are stored per-organization in Supabase — no env vars required.

---

## 7. Walmart Marketplace (Sales Channel) — **BYO Credentials Model**

**No platform-level env vars required.** Walmart Marketplace API does not support a Partner / Solution-Provider OAuth-redirect flow by default. Every seller generates their own Client ID + Client Secret directly in their Walmart Seller Center and pastes them into SellerCFO. Credentials are stored encrypted per-organization in `integration_connections.config` and used to mint short-lived access tokens on demand.

### What customers do in the SellerCFO UI

1. Dashboard → **Integrations** → click **Connect** on the Walmart tile.
2. Paste three values into the Walmart form:
   - **Client ID** — from Walmart Seller Center
   - **Client Secret** — from Walmart Seller Center
   - **Seller ID** (optional) — their Walmart Seller/Partner ID, used for labeling
3. Click **Validate & Connect**. SellerCFO immediately exchanges the creds for an access token via Walmart's client-credentials flow, verifies it by hitting `/v3/items?limit=1`, and stores the BYO credentials + token in Supabase.

### How a customer generates their Walmart Client ID + Secret

Coach any SellerCFO customer through these steps when they connect Walmart:

1. Log in to [Walmart Seller Center](https://sellercenter.walmart.com).
2. Top-right gear icon → **Settings**.
3. Left sidebar → **API Key Management** (under the Developer section).
4. Click **Add Key for a Solution Provider** → choose **SellerCFO** (or **Other** if not listed yet), or click **Add Key** for a self-generated pair.
5. Walmart displays a **Client ID** and **Client Secret**. Copy both — the secret is shown only once.
6. Paste into SellerCFO's Walmart connect form and submit.

### Why no env vars

- No `WALMART_CLIENT_ID` / `WALMART_CLIENT_SECRET` in Vercel. If you see those in old code, they're dead.
- The platform code path is in `src/lib/integrations/walmart.ts` — `getAccessToken(clientId, clientSecret)` accepts explicit BYO credentials, and `ensureFreshToken(connection)` pulls them from `connection.config` on every sync.
- Token refresh is automatic and uses the stored per-tenant credentials. No refresh token needed because client-credentials grant mints a new access token each time.

### If you want to upgrade to a true Partner app later

Walmart does support a Solution Provider onboarding path, but it's a weeks-long partner-approval process (business verification, tech review, sandbox testing) and only unlocks a hosted install-link UX — the underlying token flow is still client-credentials. BYO is the right starting posture until SellerCFO has enough paid Walmart sellers to justify the partnership effort.

---

## 8. TikTok Shop (Sales Channel)

1. Go to [partner.tiktokshop.com](https://partner.tiktokshop.com)
2. Sign up as a **Technology Partner** (requires business verification — can take 1-3 days)
3. **App Management → Create App**:
   - App name: `SellerCFO`
   - Category: `ERP/Financial Tools`
4. Under **App credentials**:
   - Copy **App Key** → `TIKTOK_SHOP_APP_KEY`
   - Copy **App Secret** → `TIKTOK_SHOP_APP_SECRET`
5. Set **Redirect URL**: `https://topsellercfo.com/api/integrations/callback?provider=tiktok_shop`
6. Required permissions: `order.read`, `product.read`, `finance.read`

---

## Setting Env Vars on Vercel

Once you have credentials, add them all in one go:

1. Go to [Vercel Dashboard](https://vercel.com) → sellercfo project → Settings → Environment Variables
2. Add each key/value pair for **Production** (and optionally Preview/Development)
3. Redeploy to pick up the new vars

Or use the Vercel CLI:
```bash
vercel env add SHOPIFY_CLIENT_ID production
vercel env add SHOPIFY_CLIENT_SECRET production
# ... repeat for each
```

---

## Priority Order

If you want to get connectors live incrementally:

1. **QuickBooks Online** — accounting backbone (reuse from BuilderCFO)
2. **Shopify** — most common sales channel, straightforward OAuth
3. **Amazon SP-API** — high-value but most complex setup
4. **Etsy** — simple OAuth 2.0 + PKCE
5. **Xero** — alternative accounting, simple OAuth
6. **Walmart** — BYO per-seller creds (no env vars)
7. **TikTok Shop** — requires partner verification (slowest approval)
8. **WooCommerce** — no dev account needed, already works

---

## What Claude can and can't do here

**Can do:**
- Walk you through each platform step-by-step while you're at your computer
- Open the right browser pages via Chrome and pre-fill non-sensitive fields (app name, description, redirect URIs)
- Help you copy credentials into Vercel env vars via the CLI or UI walk-through
- Verify the OAuth callback routes in `src/app/api/integrations/callback/route.ts` match what each platform expects

**Cannot do (safety):**
- Create developer accounts on your behalf (Intuit, Shopify Partners, AWS, Seller Central, Etsy, Walmart, TikTok)
- Enter credit card, banking, or SSN data into any signup form
- Click final "Accept Terms & Conditions" or "Create Account" buttons without your explicit confirmation
- Handle password entry or 2FA codes — you'll sign in yourself

You'll drive the clicks on any "create account" and "accept terms" flows. Claude will navigate, fill fields, and coach you through each screen.
