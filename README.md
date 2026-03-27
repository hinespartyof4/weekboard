# Weekboard

Weekboard is a calm, premium household organization app for couples and families. This scaffold now includes a Supabase-backed authentication foundation with server/client utilities, protected app routes, and a clean auth UI built on Next.js App Router, TypeScript, Tailwind CSS, and shadcn/ui-style components.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui conventions
- Vercel-ready project structure

## Local setup

1. Install Node.js 22 or newer.
2. Install dependencies:

```bash
npm install
```

3. Copy the environment template:

```bash
cp .env.example .env.local
```

4. Start the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000).

## Vercel staging deployment

There is now a dedicated setup guide for running Weekboard on Vercel with:

- protected preview deployments
- a stable staging URL
- Supabase redirect configuration
- Stripe webhook endpoints

See [`docs/vercel-staging.md`](/Users/caseyhines/Documents/Weekboard/docs/vercel-staging.md).

## Supabase auth setup

1. Create a Supabase project.
2. Copy your project URL and publishable key from the Supabase Connect or API Keys screen.
3. Add the values to `.env.local`:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

4. In Supabase Auth settings:
- Set Site URL to `http://localhost:3000` for local development.
- Add `http://localhost:3000/auth/confirm` to the allowed redirect URLs.
- Keep Email auth enabled.

5. If email confirmation is enabled, update the Confirm signup template:
- Replace `{{ .ConfirmationURL }}` with `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`

6. Restart the development server after updating your environment variables.

## OpenAI setup

Weekboard currently uses the OpenAI API for:

- Weekly Reset narrative summaries
- "Use What We Have" pantry suggestions

Add these values to `.env.local`:

```bash
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-5-mini
OPENAI_WEEKLY_RESET_MODEL=gpt-5-mini
OPENAI_USE_WHAT_WE_HAVE_MODEL=gpt-5-mini
```

Notes:

- `OPENAI_API_KEY` is required for AI features.
- `OPENAI_MODEL` is the shared default model if the feature-specific model vars are omitted.
- `OPENAI_WEEKLY_RESET_MODEL` and `OPENAI_USE_WHAT_WE_HAVE_MODEL` let you tune cost/quality separately later.

## Barcode lookup setup

Weekboard includes a Home Pro barcode scanning flow for Shopping and Household Inventory.

Add these values to `.env.local`:

```bash
BARCODE_LOOKUP_API_KEY=your-barcode-lookup-api-key
BARCODE_LOOKUP_BASE_URL=https://api.barcodelookup.com/v3/products
WEEKBOARD_PREVIEW_PLAN_TIER=home_pro
```

Notes:

- `BARCODE_LOOKUP_API_KEY` enables live server-side product lookups after a barcode scan.
- `BARCODE_LOOKUP_BASE_URL` is optional and defaults to Barcode Lookup's v3 product endpoint.
- If no API key is set, Weekboard falls back to built-in mock barcode matches so the UI can still be tested locally.
- `WEEKBOARD_PREVIEW_PLAN_TIER` is optional and lets preview mode simulate `free`, `plus`, or `home_pro` for barcode entitlement testing.
- Built-in local test barcodes include matched examples plus a `000000000000` no-match path.
- Real mobile camera testing works best on a secure origin. `localhost` works on the machine running the app, but phones on the same Wi-Fi usually need a secure preview deployment or tunnel.

How to test:

1. Make sure the active household is on `Home Pro`.
2. Open `/app/shopping` or `/app/pantry`.
3. Use `Scan item` to test the live camera flow.
4. Use `Enter barcode manually` to test the manual lookup flow.
5. In mock mode, try:
- `012345678905` for a matched shopping example
- `036000291452` for a matched cleaning example
- `000000000000` for a no-match fallback flow
6. Use `Continue without barcode` to test pure manual item creation from the same confirmation form.

Plan-state testing:

- Preview mode:
  set `WEEKBOARD_PREVIEW_PLAN_TIER=free`, `plus`, or `home_pro` in `.env.local`
- Real Supabase data:
  update the current household `subscriptions.plan_tier` and `subscriptions.status`

Expected behavior:

- `free`: scan button opens a locked premium modal
- `plus`: scan button opens the live scanner
- `home_pro`: scan button opens the live scanner

## PostHog setup

Weekboard includes lightweight product analytics for key household milestones and billing actions.

Add these values to `.env.local`:

```bash
NEXT_PUBLIC_POSTHOG_KEY=your-posthog-project-key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

What is tracked:

- signup completed
- household created
- first shopping item added
- first inventory item added
- first recurring item created
- first task created
- weekly reset viewed
- AI helper used
- checkout started
- subscription activated

Notes:

- PostHog is initialized client-side for pageviews and identified app usage.
- Core milestone events are captured server-side where it matters, so billing and creation events do not depend on the browser being open.

## Sentry setup

Weekboard includes lightweight Sentry initialization for client, server, and edge runtime error tracking.

Add this value to `.env.local`:

```bash
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

Optional:

```bash
SENTRY_AUTH_TOKEN=your-sentry-auth-token
```

Notes:

- `NEXT_PUBLIC_SENTRY_DSN` enables runtime error tracking.
- `SENTRY_AUTH_TOKEN` is not required for the runtime integration in this repo, but you may want it later for source map upload workflows.

## Resend + weekly digest setup

Weekboard now includes a weekly email digest for the Weekly Reset flow.
The same Resend setup is also used for household invitation emails.

Add these values to `.env.local`:

```bash
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL="Weekboard <weekly@yourdomain.com>"
CRON_SECRET=your-random-secret
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Notes:

- `RESEND_API_KEY` is required for sending the digest.
- `RESEND_FROM_EMAIL` should use a Resend-verified sending domain.
- `CRON_SECRET` secures the scheduled route. The app also supports the legacy `WEEKLY_RESET_CRON_SECRET` fallback.
- `SUPABASE_SERVICE_ROLE_KEY` is required because the cron job reads household data across users and marks digests as delivered.

Manual local trigger example:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/weekly-digest
```

## Stripe billing setup

Weekboard includes Stripe Checkout, webhook syncing, and a billing page for household plan management.

Add these values to `.env.local`:

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
STRIPE_PRICE_PLUS_MONTHLY=price_xxx
STRIPE_PRICE_HOME_PRO_MONTHLY=price_xxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

Stripe dashboard setup:

1. Create two recurring monthly prices in Stripe:
- `Plus`
- `Home Pro`
2. Copy those price IDs into `STRIPE_PRICE_PLUS_MONTHLY` and `STRIPE_PRICE_HOME_PRO_MONTHLY`.
3. Enable the Stripe customer portal if you want households to manage billing changes after checkout.
4. Create a webhook endpoint:
- Local development with Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

- Production endpoint:
  `https://your-domain.com/api/stripe/webhook`

5. Subscribe the webhook to at least these events:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Notes:

- Checkout is created from the authenticated billing page and tied to the active household.
- Stripe webhook delivery is what keeps the `subscriptions` table in sync with the real Stripe subscription state.
- `SUPABASE_SERVICE_ROLE_KEY` is required so webhook handlers can safely upsert subscription state server-side.

## Vercel cron setup

The repo includes a `vercel.json` cron configuration:

```json
{
  "crons": [
    {
      "path": "/api/cron/weekly-digest",
      "schedule": "0 13 * * *"
    }
  ]
}
```

This runs daily at `13:00 UTC`, and the route only sends a digest when a household is on its configured `reset_day` and has not already been delivered for that week.

## Supabase database migrations

The initial Weekboard schema and row-level security policies live in:

- `supabase/migrations/20260327100000_init_weekboard_schema.sql`
- `supabase/migrations/20260327101000_weekboard_rls.sql`
- `supabase/migrations/20260327102000_household_invitations_and_onboarding.sql`
- `supabase/migrations/20260327110000_upgrade_shopping_items_and_default_list.sql`
- `supabase/migrations/20260327113000_upgrade_inventory_items_for_pantry.sql`
- `supabase/migrations/20260327120000_upgrade_recurring_items_fields.sql`
- `supabase/migrations/20260327123000_link_shopping_items_to_recurring_sources.sql`
- `supabase/migrations/20260327130000_upgrade_household_tasks_for_recurrence.sql`
- `supabase/migrations/20260327133000_link_shopping_items_to_inventory_sources.sql`
- `supabase/migrations/20260327150000_add_weekly_digest_settings.sql`
- `supabase/migrations/20260327170000_accept_pending_household_invites.sql`
- `supabase/migrations/20260327173000_add_invite_tokens_and_explicit_acceptance.sql`
- `supabase/migrations/20260327190000_add_barcodes_to_items.sql`
- `supabase/migrations/20260327191000_add_product_metadata_to_items.sql`

Typical local commands:

```bash
npx supabase init
npx supabase start
npx supabase db reset
```

To apply the same migrations to a linked remote project:

```bash
npx supabase link --project-ref your-project-ref
npx supabase db push
```

## Local demo data

Beyond preview mode, Weekboard now includes a local-only demo data seeding utility inside Settings.

How to use it:

1. Run the app locally with Supabase configured.
2. Create or log into a real local account.
3. Open `/app/settings`.
4. Use the `Demo data` card to seed an empty household with sample shopping, pantry, recurring, and task records.

This utility is hidden in production and is meant only for local development.

## Scripts

- `npm run dev` starts the local dev server.
- `npm run build` creates a production build.
- `npm run start` serves the production build.
- `npm run lint` runs ESLint.

## Environment variables

Set these values in `.env.local` before wiring real integrations:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_URL`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PLUS_MONTHLY`
- `STRIPE_PRICE_HOME_PRO_MONTHLY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `CRON_SECRET`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_WEEKLY_RESET_MODEL`
- `OPENAI_USE_WHAT_WE_HAVE_MODEL`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`
- `WEEKBOARD_ENCRYPTION_KEY`
- `WEEKLY_RESET_CRON_SECRET`

## Structure

```text
.
├── src
│   ├── app
│   │   ├── (marketing)
│   │   └── (application)
│   ├── components
│   │   ├── app
│   │   ├── layout
│   │   ├── marketing
│   │   └── ui
│   ├── config
│   └── lib
├── .env.example
└── components.json
```

## Next steps

- Add Weekboard household tables, row-level security, and member relationships.
- Add server actions and schema validation for create/update flows.
- Wire Stripe billing to `Billing` and plan gating.
- Add analytics, email, and AI workflows.
# weekboard
