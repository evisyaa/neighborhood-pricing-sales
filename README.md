# Neighborhood Pricing — Salesman App

Mobile-first field sales app for **Neighborhood Pricing / ROL-E500**.

This starter is designed for:

- GitHub → Vercel auto-deploy
- Supabase Auth (Sales Code + PIN)
- Supabase Postgres + Row Level Security
- Salesman-specific coverage only
- Map-only field workflow
- Potential / Grosir / Retail layers
- P25 / P50 / P75 AOI
- Store recommendation + strata
- Pitch / visit / order usage logging
- Manager adoption monitoring

## Pilot dataset included

The private starter contains the existing **KRANJI pilot** data extracted from the mobile prototype:

- 11 salesman
- 235 Grosir
- 2696 Retail
- 705 engine result rows (P25/P50/P75)

Keep the GitHub repository **Private** because the pilot seed contains outlet-level information.

---

## 1. Supabase setup

1. Create a Supabase project.
2. Open **SQL Editor**.
3. Run `supabase/schema.sql`.
4. Go to **Project Settings / API** and copy:
   - Project URL
   - Publishable key
   - Service role key (local seed only; never put this in frontend code)

Create `.env.local` from `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SEED_DEMO_PIN=1234
```

Then locally:

```bash
npm install
npm run seed:kranji
npm run dev
```

The seed script creates Supabase Auth users with internal email aliases:

```text
<sales_code>@sales.np.local
```

Salesman only sees **Sales Code + PIN** in the UI.

> `SUPABASE_SERVICE_ROLE_KEY` is used only by the local seed script. Do not add it to browser code and do not commit `.env.local`.

---

## 2. Upload to GitHub

Upload the **contents of this folder** to the private repository `neighborhood-pricing-sales`.

Recommended workflow:

```text
main      → Production
feature/* → Vercel Preview URLs
```

Every push automatically creates a Vercel deployment after the repo is connected.

---

## 3. Connect Vercel

1. Vercel → **Add New → Project**.
2. Import the `neighborhood-pricing-sales` GitHub repository.
3. Framework should be detected as **Next.js**.
4. Add only these browser-safe Environment Variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

5. Deploy.

Do **not** put `SUPABASE_SERVICE_ROLE_KEY` in public/client variables.

---

## 4. Salesman flow

```text
Sales Code + PIN
      ↓
Supabase Auth
      ↓
RLS resolves sales_code
      ↓
Only assigned Grosir + Retail are returned
      ↓
Map
      ↓
Click Grosir
      ↓
AOI + quadrant + potential + recommendation
      ↓
Pitch / Visit / Actual Order
      ↓
usage_events
```

## 5. Manager monitoring

Set a user's `sales_users.role` to `manager` after creating the manager Auth user.

Manager URL:

```text
/manager
```

Current manager KPIs:

- active salesman
- store viewed
- pitch shown
- visit completed
- order commit
- actual order value
- breakdown per salesman

---

## 6. Data refresh

UI/code revision:

```text
Git push → Vercel auto-deploy
```

Engine/data revision:

```text
Update Supabase tables → app sees new data without rebuilding frontend
```

This is the key reason the production Salesman app should not embed the national HTML dataset.

---

## 7. Recommendation definition used in pilot

`recommended_order` is a **recommended Rupiah value per order**, carried over from the current engine output. It is not carton/pcs quantity.

Physical SKU/carton recommendation requires an additional SKU master with:

- selling price
- pack conversion
- carton conversion

---

## 8. Security notes

- Repository: **Private**
- RLS: enabled on profile, engine, retail, and usage tables
- Browser uses publishable key only
- Service role: local/admin tasks only
- Never hard-code salesman PINs in source
- Production PIN/password policy should be changed from the pilot value
