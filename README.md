# Khanti Koraputia

An independent Koraput discovery platform built with Next.js App Router, React, PostgreSQL and Drizzle ORM.

## Implemented

- Responsive tourism, local-business and creator directories with search/category/location filters.
- Email/password registration and sign-in with salted scrypt password hashes, random database-backed sessions, HttpOnly cookies and role checks.
- Owner and creator listing submissions, cover-photo uploads, edits, pending/approved/rejected moderation and featured placements.
- Saved discoveries, signed-in reviews, correction reports, contact and collaboration enquiries.
- Owner dashboard with view counts, listing status and enquiry inbox; promotion requests are saved to the administrator inbox.
- Super administrator and staff dashboards for listing moderation and editing.
- Super administrator controls for staff roles and account suspension. Super administrator accounts cannot be changed through ordinary user management.
- Homepage copy, directory categories/locations and article publishing/editing/deletion, including private drafts.
- JSON data export of listings, enquiries, editorial configuration and authorised user records. Passwords/session tokens are never exported.
- Cover photos stored durably in PostgreSQL and served with image-specific content types and immutable caching.
- Khanti Koraputia YouTube channel links, editorial travel guides, directions and phone/WhatsApp links when listing owners provide contact details.

## Local setup

Install dependencies with `npm install`. Set `DATABASE_URL` in the server environment. Apply the schema with `npx drizzle-kit push`, then run `npm run dev`.

Production: `npx next typegen`, `npm exec tsc -- --noEmit --pretty false`, `npm run build`. The hosting platform should run the built Next.js server and check `/api/health`.

## Establishing administrator ownership

There is intentionally no public default administrator account or hardcoded password.

1. Set a long, randomly generated `ADMIN_SETUP_KEY` in the hosting platform's server-side environment and restart/redeploy the application.
2. Open **Log in → Create an account → Platform administrator setup**.
3. Register the owner's email, name and a strong password, and enter the setup key. The server checks the key before granting super administrator access.
4. Remove `ADMIN_SETUP_KEY` from the environment and redeploy after the owner account is established. Additional staff can register normal accounts and be promoted by the owner in **People & permissions**.
5. Set `COOKIE_SECURE=true` on HTTPS deployments. The preview supports local HTTP testing, so this flag is explicit.

Visitors cannot grant themselves administrator/staff privileges by changing the registration role field. A suspended account cannot use existing sessions.

## Editorial operations

Open the dashboard and select **Content & directory**. Categories and locations are one name per line. Preserve names already used by published listings. The first six categories are displayed on the homepage. Articles can be saved as drafts, published, edited and deleted. The public server response excludes draft articles.

## Enquiries and promotions

Messages are persisted in PostgreSQL and visible to the relevant listing owner and authorised staff. Reply links open the operator's email client. There are no simulated emails, booking confirmations or payment receipts.

Premium placements, sponsorships, video collaborations and event promotions currently use a real enquiry workflow. **Online checkout, recurring subscriptions, booking inventory/commissions and automated email delivery are not integrated.** Connect an appropriate payment provider and transactional email service before launching those paid workflows. No payment provider or email-service secret is assumed.

## Content and photography

The four introductory business profiles are illustrative sample listings, clearly identified as community previews. They are not verified operational businesses and their enquiries go to the platform team. Tourism information is editorial; confirm access and conditions locally. Stock photography is illustrative, not evidence of a particular property or destination. Replace preview profiles with approved, owner-supplied listings before a public commercial launch.

Landscape and illustrative imagery is sourced from Pexels. Font families are DM Sans and DM Serif Display, with local system/Georgia fallbacks. The brand links to https://www.youtube.com/c/KhantiKoraputia. No unverified channel subscriber or business rating claims are used.

## Ownership and backups

Keep the domain registrar, hosting project, repository and database credentials in owner-controlled accounts. This application cannot transfer external domain or hosting ownership. Establish restricted staff access and recovery procedures in those services.

The dashboard export is a useful operational export, **not a complete database backup**. Configure automated PostgreSQL backups with retention and tested restores in your hosting environment. Include the `content` table (which stores uploaded images), users, sessions, reviews, saves, listings and enquiries. Treat database backups and exports as confidential personal data. Revoke sessions after restoring older snapshots if necessary.

## Testing

With the app and database running: `npx playwright test tests/platform.spec.ts --workers=1`.

Browser tests create a uniquely named test account, exercise real form submissions and moderation, and remove their data. The test harness temporarily grants its test user an administrator role directly through Drizzle; that capability is not exposed to visitors.

Before a public launch, add verified-email/password-reset workflows, stronger distributed rate limiting and spam protection, consent/privacy documentation for your jurisdiction, security monitoring, image moderation, and production email/payment integrations as appropriate. This is a functioning initial platform, not a claim that every phase of the larger business roadmap is complete.
