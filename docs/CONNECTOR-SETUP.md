# SellerCFO — Integration Connector Setup Guide

Quick-start guide for creating developer accounts and obtaining API credentials for each SellerCFO integration. Follow each section, paste credentials into Vercel env vars, and you're live.

---

## 1. QuickBooks Online (Accounting)

**Status:** Already partially configured via `/api/qbo/` routes.

1. Go to [developer.intuit.com](https://developer.intuit.com)
2. Sign in or create an Intuit Developer account
3. **Dashboard → Create an App → QuickBooks Online and Payments → Production**
4. App Name: `SellerCFO`
5. Under **Keys & credentials → Production**:
   - Copy **Client ID** → `QBO_CLIENT_ID`
   - Copy **Client Secret** → `QBO_CLIENT_SECRET`
6. Set **Redirect URI**: `https://topsellercfo.com/api/qbo/callback`
7. Required scopes: `com.intuit.quickbooks.accounting`

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

1. Go to [partners.shopify.com](https://partners.shopify.com)
2. Sign in or create a Shopify Partner account (free)
3. **Apps → Create App → Create app manually**
   - App name: `SellerCFO`
   - App URL: `https://topsellercfo.com`
4. Under **App setup → URLs**:
   - Allowed redirection URL: `https://topsellercfo.com/api/integrations/callback?provider=shopify`
5. Under **API credentials**:
   - Copy **Client ID** → `SHOPIFY_CLIENT_ID`
   - Copy **Client secret** → `SHOPIFY_CLIENT_SECRET`
6. Required access scopes: `read_orders`, `read_products`, `read_inventory`, `read_analytics`, `read_reports`

---

## 4. Amazon Selling Partner API (Sales Channel)

This one has more steps than the others:

1. **Register as a developer:**
   - Go to [Seller Central](https://sellercentral.amazon.com) → Apps & Services → Develop Apps
   - Or register at [developer.amazonservices.com](https://developer.amazonservices.com)
2. **Create an IAM Role** (AWS console):
   - Go to AWS IAM → Roles → Create Role
   - Trusted entity: Another AWS account (use Amazon's SP-API account)
   - Name: `SellerCFO-SPAPI`
3. **Register your application** in Seller Central:
   - App name: `SellerCFO`
   - IAM ARN: (from step 2)
   - OAuth redirect: `https://topsellercfo.com/api/integrations/callback?provider=amazon`
4. Copy:
   - **LWA Client ID** → `AMAZON_SP_CLIENT_ID`
   - **LWA Client Secret** → `AMAZON_SP_CLIENT_SECRET`
5. For self-authorization (your own seller account), generate a **Refresh Token** in Seller Central → `AMAZON_SP_REFRESH_TOKEN`

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

## 7. Walmart Marketplace (Sales Channel)

1. Go to [developer.walmart.com](https://developer.walmart.com)
2. Sign in or create a Walmart Developer account
3. **My Apps → Create Application**:
   - App name: `SellerCFO`
   - Select **Marketplace** APIs
4. Copy **Client ID** → `WALMART_CLIENT_ID`
5. Copy **Client Secret** → `WALMART_CLIENT_SECRET`
6. Walmart uses client credentials (not user OAuth) — the user provides their own Seller credentials in the SellerCFO UI.

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

1. **QuickBooks Online** — accounting backbone (may already be done)
2. **Shopify** — most common sales channel, straightforward OAuth
3. **Amazon SP-API** — high-value but most complex setup
4. **Etsy** — simple OAuth 2.0 + PKCE
5. **Xero** — alternative accounting, simple OAuth
6. **Walmart** — client credentials, easy
7. **TikTok Shop** — requires partner verification (slowest approval)
8. **WooCommerce** — no dev account needed, already works
