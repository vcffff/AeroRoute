# AeroRoute MVP

Next.js App Router + Cloud Firestore adapter + independent Solana wallet connection. The original AeroRoute landing design is preserved. Customer and operator cabinets use its cyan/navy palette, rounded cards and typography.

## Run locally

Requires Node.js 22 or newer. Dependencies are locked in `package-lock.json`.

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Open the URL printed in the terminal (normally `http://localhost:5173`). Register an account, choose **Заказчик** or **Оператор дрона** after login. To test both roles, use two accounts in separate browser profiles or log out between accounts. A role is immutable for this MVP.

Development defaults to demo when the mode is omitted. Builds and production servers require an explicit `AEROROUTE_MODE`; `.env.local` supplies it after the example is copied. Do not overwrite an existing file containing your own Firebase configuration.

```powershell
npm run typecheck
npm run lint
npm test
npm run build
npm start
```

## Existing login and session compatibility

The original Vite application had no external identity provider, user IDs or password-reset service. Its login used `auth:users` and `auth:user` in browser localStorage and stored plaintext passwords. The MVP preserves the username/password flow and supports its legacy string and object user records in **local development demo mode**. Imported users receive deterministic IDs derived from usernames and must choose a new AeroRoute role; the old factory/investor role is not treated as authority.

The development server keeps the original Vite port 5173 so existing local browser sessions remain on the same origin.

Legacy browser storage cannot prove ownership of a remotely managed account: import is a demo data import, never a production authentication mechanism. The browser and origin where the old localStorage exists must be used (ports are part of origins). If you open a different port, old local accounts will not be visible there. New server users can sign in from any browser using their password.

After import the plaintext record for that username is removed from legacy storage. The server stores scrypt password hashes and opaque expiring HttpOnly session cookies; the compatibility `auth:user` mirror is only UI metadata. Forging that mirror does not grant API access. Sessions survive a restart; logout and password reset revoke sessions server-side. A cookie from a signed-out user is rejected.

There was no existing reset feature to reuse. Local demo recovery explicitly displays a one-time 15-minute token instead of sending an email. This is a local testing tool: anyone with access to that development server and username can request it. Both token disclosure and legacy import are disabled when `NODE_ENV=production`. Real Firebase mode uses Firebase email recovery instead.

## Delivery flow

1. Customer creates a parcel with pickup/drop-off addresses, description and weight (0–5 kg, excluding 0). The server derives the price and customer ID; submitted prices and ownership are ignored.
2. In demo mode the customer explicitly confirms **demo payment**. No SOL is transferred; the order becomes available to operators.
3. Operators add drones (maximum payload up to 25 kg) and select an owned active drone with enough capacity. Open offers disclose only coarse city areas, weight, price and ID, not exact addresses or contents.
4. Acceptance atomically assigns both order and drone. Two operators cannot both win, and one drone cannot take two active deliveries.
5. Only the assigned operator can advance `accepted → picked_up → in_transit → delivered`.
6. Only the owning customer can confirm `delivered → received`; this changes demo payment from held to released. An operator cannot confirm receipt or unlock payment. Repeated confirmations cannot pay twice.

Delivery and payment statuses are separate. Tracking polls persisted order stages every 5 seconds and shows the audit timeline. It is manual status tracking; there is no live aircraft telemetry or drone-control command.

## Data and security

- `src/lib/domain.ts`, `service.ts`: server validation, ownership, role checks and state transitions.
- `src/lib/auth.ts`, `http.ts`, `src/app/api/`: authenticated API, cookies, same-origin mutation checks and no-store personalized responses.
- `src/lib/adapters/demo-store.ts`: local JSON persistence, atomic file replacement, per-process queue and cross-process filesystem lock on the same disk. A failed transaction rolls back. Use Firestore for distributed or serverless installations; a local disk is not shared across replicas.
- `src/lib/adapters/firestore-store.ts`: Firestore Admin transactions. All transaction reads occur before writes. Admin bypasses Security Rules, so API authorization remains required independently.
- `firestore.rules`: authenticated own-profile/order/drone reads; operators can read available redacted offers. All direct client writes are denied, including role/payment/status writes. Credentials, sessions and reset tokens are never exposed by rules.
- `profiles/{uid}` ties role to the authenticated user ID. Real Firebase IDs are used unchanged.

Demo data lives in ignored `.aeroroute/demo.json` (override with `AEROROUTE_DEMO_FILE`). No data or secrets are committed. A crashed process may leave an empty `.lock` directory beside the file; the server fails closed after a lock timeout. Recover that lock only after all processes using that demo file have stopped. Do not delete it while an operation is active.

## Enable real Firebase accounts and Firestore

1. Create/configure your Firebase project; enable email/password Firebase Authentication and Firestore.
2. Set `AEROROUTE_MODE=firestore` and the `NEXT_PUBLIC_FIREBASE_*` and server credential variables from `.env.example`. Use the same Firebase project for client and server. Server credentials support a PEM private key or Application Default Credentials via `GOOGLE_APPLICATION_CREDENTIALS`.
3. Deploy `firestore.rules` and `firestore.indexes.json` using your configured Firebase CLI/project. Credentials must have the needed IAM permissions. This repository does not deploy to your cloud automatically.
4. Rebuild after changing public Firebase variables. Configure `AEROROUTE_APP_ORIGIN` to the public HTTPS origin when using a reverse proxy.

The real mode verifies Firebase ID tokens, checks recent sign-in, issues server session cookies and verifies revocation. Firestore stores profiles, drones, orders and redacted offers. Configuration errors do not silently fall back to demo.

**No escrow contract is implemented.** Real mode can authenticate, create and view unpaid orders; payment and payout return 503 until a real verified escrow adapter is supplied. Nothing becomes a real paid delivery through a demo button. Real escrow will need transaction verification, idempotent receipts, payout addresses/signatures and a revised payment lifecycle; do not add network transfers inside a Firestore transaction callback, because callbacks can retry.

Phantom connection uses the existing Solana library and actual browser extension. It is separate from account login and is not payment confirmation. No fake public keys, balances or transaction hashes are generated.

## Verification

`npm test` covers role immutability, validation, redaction, ownership, state transitions, simultaneous acceptance, same-drone conflicts, single receipt release, demo persistence/rollback and file locking across separate Node processes.

For HTTP integration, start a **separate development server with an isolated demo data file**, then run:

```powershell
$env:AEROROUTE_TEST_URL='http://localhost:3000'
npm test
$env:BASE_URL=$env:AEROROUTE_TEST_URL
node tests/auth-http.mjs
```

HTTP tests create disposable accounts and orders. The auth suite checks login, migration, logout/revocation, reset token replay and cross-site rejection. For the expiry fixture, `AEROROUTE_AUTH_TEST_STORE` can point at that isolated server's JSON store; do not point it at user data. A normal `npm test` skips only the HTTP suite when no URL is configured.

Cloud Firestore/Firebase credential operations and Security Rules emulator behavior require a configured project or emulator and are not verified against a live project here. The rules were reviewed, and API authorization was exercised through real local HTTP requests. Phantom prompts and real transactions require the extension/network and have no fabricated success path.

Original Vite source/configs remain under `legacy/` for reference; they are excluded from active builds and lint. The historical NFT/royalty sample and its credentials are not active in the delivery application. Documentation in `legacy/METAPLEX_INTEGRATION.md` is historical and does not imply a real delivery escrow integration.

Official implementation references: [Next.js cookies](https://nextjs.org/docs/app/api-reference/functions/cookies), [Firebase session cookies](https://firebase.google.com/docs/auth/admin/manage-cookies), [Firestore transactions](https://firebase.google.com/docs/firestore/manage-data/transactions), [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started).
