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

   Generate three separate secrets locally with:

   ```powershell
   node -e "for (const k of ['SESSION_SECRET','ADMIN_ACCESS_CODE','ADMIN_PASSWORD']) console.log(k+'='+require('crypto').randomBytes(32).toString('base64url'))"
   ```

   Enter the generated values directly in Netlify. Do not add a `NEXT_PUBLIC_` prefix, commit secrets, or send them in chat. Use a separate Neon branch/database for Preview deploys if enabling them.
4. Trigger a deploy. After it succeeds, create an account, sign in, and verify that a thread remains after a new deploy. The private dashboard is at `/admin`.

## Local development

Set `DATABASE_URL` in `.env.local` to use Neon locally. Keep `.env.local` out of Git. The local SQLite database is not used by the Netlify deployment; use the one-time import above if its existing data should be retained.
