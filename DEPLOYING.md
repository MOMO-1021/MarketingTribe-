# Deploy MarketingTribe on Netlify

Netlify's Next.js OpenNext adapter is detected automatically. `netlify.toml` sets the build command and Node.js 22 runtime.

## 1. Create a Neon database

1. Create a PostgreSQL project in the [Neon Console](https://console.neon.tech/).
2. Select **Connect** and copy the pooled connection string for the production branch. Keep it private.
3. Add it as `DATABASE_URL` in the local `.env.local` file when running the app or the SQLite import script. Do not commit this file.

The app creates its tables and starter circles on its first database request.

## 2. Preserve existing local data (optional)

To copy the current local SQLite accounts, threads, replies, and votes into a fresh Neon database:

```powershell
npm run migrate:neon
```

The script loads `DATABASE_URL` from `.env.local`. It aborts if the Neon database already contains community data, so run it once against the new, otherwise-empty database before deploying. Keep a backup of `data/adda.db` until the import is verified.

## 3. Deploy the site

1. Push this project to a Git provider and import that repository in Netlify. Set the project base directory to the repository root.
2. Netlify detects Next.js and uses its OpenNext adapter. The build command is `npm run build`; the runtime is Node.js 22.
3. In **Site configuration → Environment variables**, add the following server-only variables for the Production context:

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | The pooled Neon connection string |
   | `SESSION_SECRET` | A new random secret, at least 32 characters |
   | `ADMIN_ACCESS_CODE` | A private random access code, 16–256 characters |
   | `ADMIN_PASSWORD` | A separate private password, 16–256 characters |
   | `SMTP_HOST` | `smtp.gmail.com` |
   | `SMTP_PORT` | `465` |
   | `SMTP_SECURE` | `true` |
   | `SMTP_USER` | Dedicated Gmail account address |
   | `SMTP_APP_PASSWORD` | Google App Password (not the Gmail sign-in password) |
   | `EMAIL_FROM` | `MarketingTribe <same-address-as-SMTP_USER>` |
   | `APP_URL` | `https://marketingtribe-momo-1021.netlify.app` |

   Generate three separate secrets locally with:

   ```powershell
   node -e "for (const k of ['SESSION_SECRET','ADMIN_ACCESS_CODE','ADMIN_PASSWORD']) console.log(k+'='+require('crypto').randomBytes(32).toString('base64url'))"
   ```

   Enter the generated values directly in Netlify. Do not add a `NEXT_PUBLIC_` prefix, commit secrets, or send them in chat. Use a separate Neon branch/database for Preview deploys if enabling them.
4. Trigger a deploy. After it succeeds, create an account, sign in, and verify that a thread remains after a new deploy. The private dashboard is at `/admin`.

### Password reset email

1. Enable 2-Step Verification on the dedicated Gmail account and create a Google App Password. If an App Password has ever been pasted into a chat, ticket, or source file, revoke it and generate a new one before use.
2. In Netlify, open **Site configuration → Environment variables** and add the `SMTP_*`, `EMAIL_FROM`, and `APP_URL` variables listed above for the Production context. The address in `SMTP_USER` must match the email address inside `EMAIL_FROM`. The app removes spaces from `SMTP_APP_PASSWORD` before authenticating.
3. Keep these variables server-only: do not prefix them with `NEXT_PUBLIC_`, put credentials in the repository, or reuse your Gmail sign-in password.
4. The reset-token table, rate-limit table, and user session-version/deletion columns are created automatically by the app's existing database initialization when the first request reaches the updated deployment. No manual SQL or data import is required.
5. To test production delivery, deploy the update, open `/forgot-password`, and submit an email address belonging to an existing account. Check that mailbox and its spam folder, follow the link promptly, set a new password, and sign in with it. Confirm the former password no longer works and other accounts remain unaffected. The app deliberately shows the same request confirmation for known and unknown addresses.

## Local development

Set `DATABASE_URL` in `.env.local` to use Neon locally. Keep `.env.local` out of Git. The local SQLite database is not used by the Netlify deployment; use the one-time import above if its existing data should be retained.
