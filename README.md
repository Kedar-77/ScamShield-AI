# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

## Supabase backend setup

ScamShield uses Supabase Auth for email/password accounts and a private Postgres table for signed-in scan reports. Guest reports remain in the current browser. The database migration enables row-level security and restricts every report to its owner.

1. Create a Supabase project.
2. Open the project's SQL Editor and run [`supabase/migrations/20261028010000_create_scan_reports.sql`](supabase/migrations/20261028010000_create_scan_reports.sql).
3. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from the project's Connect dialog.
4. In Supabase Auth URL settings, set the site URL to your app URL and add redirect URLs for local development and deployment, including `/reset-password`.
5. Restart the dev server after changing environment variables.

For a Lovable or Cloudflare deployment, add both `VITE_` variables in the platform's build environment settings and redeploy. These are build-time browser variables; changing them requires a new build. Do not add the values to `src/lib/supabase.ts` or commit a populated `.env.local`.

The publishable key is intended for browser use. Never put a Supabase secret or `service_role` key in a `VITE_` variable. Access control is enforced by the SQL row-level security policies, not by hiding the publishable key.

Signed-in users' submitted scan text and reports are stored in their Supabase account so history can sync across devices. Do not submit passwords, OTPs, or other sensitive information to a scan.

If Supabase environment values are missing, guest scanning still works and account controls stay disabled.
