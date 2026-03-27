# Weekboard Vercel Staging Setup

This project is set up best with:

- one stable staging URL for real end-to-end testing
- normal Vercel preview deployments for branch review
- production configured later when you are ready to launch publicly

## Recommended environment strategy

### Development

- Local only
- Uses `.env.local`
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`

### Preview

- Use for branch review and UI checks
- Keep Deployment Protection enabled
- You can omit `NEXT_PUBLIC_APP_URL` in Preview if you want Weekboard to derive the Vercel preview URL automatically
- Best for layout, flows, and QA
- Not ideal as the long-term base URL for auth emails, invite emails, or Stripe return URLs

### Staging

- Use as the real shared test environment
- Attach a stable custom domain such as `staging.weekboard.app`
- Set `NEXT_PUBLIC_APP_URL=https://staging.weekboard.app`
- Point Supabase, Stripe, and Resend at this stable URL
- Keep it protected until launch

### Production

- Add later when you are ready to go public
- Use the final public domain

## Exact Vercel setup

### 1. Import the project

1. Push the repo to GitHub
2. In Vercel, click `Add New...`
3. Click `Project`
4. Import the Weekboard repository
5. Framework preset should detect `Next.js`
6. Keep the default build settings unless you have a reason to change them

### 2. Create a staging environment

If you are on Vercel Pro, the cleanest path is a Custom Environment:

1. Open the project in Vercel
2. Go to `Settings`
3. Open `Environments`
4. Click `Create Environment`
5. Name it `staging`
6. Set branch tracking to your staging branch, for example `staging`
7. Attach a domain such as `staging.weekboard.app`

If you are not using Custom Environments:

- Use the regular `Preview` environment
- Create a branch like `staging`
- Attach `staging.weekboard.app` to the project
- Deploy that branch and treat it as your stable staging deployment

### 3. Enable deployment protection

1. Open `Settings`
2. Open `Deployment Protection`
3. Enable `Standard Protection`
4. Choose `Vercel Authentication`

This keeps preview and staging deployments private while you test.

### 4. Enable system environment variables

1. Open `Settings`
2. Open `Environment Variables`
3. Turn on `Automatically expose System Environment Variables`

This allows Weekboard to derive Vercel deployment URLs cleanly when `NEXT_PUBLIC_APP_URL` is not explicitly set for Preview.

### 5. Add environment variables

Set these in Vercel for `Preview`, `Staging`, and later `Production` as appropriate:

#### Core

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

#### Stripe

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PLUS_MONTHLY`
- `STRIPE_PRICE_HOME_PRO_MONTHLY`

#### Resend

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `CRON_SECRET`

#### OpenAI

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_WEEKLY_RESET_MODEL`
- `OPENAI_USE_WHAT_WE_HAVE_MODEL`

#### Optional

- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`
- `BARCODE_LOOKUP_API_KEY`
- `BARCODE_LOOKUP_BASE_URL`

## Supabase redirect configuration

In Supabase:

1. Open your project
2. Go to `Authentication`
3. Go to `URL Configuration`

Set:

- `Site URL`
  - staging: `https://staging.weekboard.app`
  - production later: your public domain

Add Redirect URLs:

- `http://localhost:3000/**`
- `https://staging.weekboard.app/**`
- `https://*-<your-team-slug>.vercel.app/**`

If you use a custom preview deployment suffix on Vercel, add that wildcard instead.

Also make sure auth confirmation continues to work with:

- `https://staging.weekboard.app/auth/confirm`
- preview wildcards that include `/auth/confirm`

## Stripe webhook URLs

Use separate webhook endpoints for local and hosted environments.

### Local

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### Staging

```text
https://staging.weekboard.app/api/stripe/webhook
```

### Preview

Use preview webhook endpoints only if you specifically need branch-by-branch Stripe testing.
In most cases, keep Stripe pointed at staging and use preview for UI review only.

Recommended subscribed events:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## Resend and invite/digest links

For stable invite links and weekly digest links, use staging as the shared test environment:

- `NEXT_PUBLIC_APP_URL=https://staging.weekboard.app`

That keeps:

- invite links
- weekly reset digest links
- Stripe return URLs
- auth confirmation links

consistent during testing.

## Suggested branch flow

- `main`
  - reserved for production-ready code
- `staging`
  - deploys to the stable staging URL
- feature branches
  - deploy to protected preview URLs for review

## After Vercel is connected

Run Supabase migrations against the remote project:

```bash
npx supabase link --project-ref your-project-ref
npx supabase db push
```

## Good default testing order

1. Confirm marketing pages load on staging
2. Test login/signup
3. Test onboarding
4. Test invite email flow
5. Test Weekly Reset and AI flows
6. Test Stripe checkout and webhook syncing
7. Test weekly digest cron route manually
