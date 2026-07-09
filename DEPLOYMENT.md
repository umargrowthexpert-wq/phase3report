# Deployment guide

## 1. Supabase (database)
1. Create a project at supabase.com
2. Project Settings -> Database -> copy both connection strings:
   - Pooled (port 6543) -> DATABASE_URL
   - Direct (port 5432) -> DIRECT_URL
3. Locally run: `npx prisma db push` (creates every table)

## 2. Google Cloud (OAuth + APIs)
1. console.cloud.google.com -> new project
2. APIs & Services -> Enable:
   - Google Search Console API
   - Google Analytics Data API
   - (Later) Business Profile APIs: these require Google's access request
     form at developers.google.com/my-business -> "Request access".
     Approval is manual and can take days to weeks.
3. OAuth consent screen -> External -> add scopes:
   openid, email, profile,
   https://www.googleapis.com/auth/webmasters.readonly,
   https://www.googleapis.com/auth/analytics.readonly
4. Credentials -> Create OAuth Client ID (Web):
   - Authorized redirect URI: https://YOUR-DOMAIN/api/auth/callback/google
     (and http://localhost:3000/api/auth/callback/google for dev)
5. Copy Client ID/Secret into env vars.

## 3. Anthropic (AI analyst)
console.anthropic.com -> API Keys -> create -> ANTHROPIC_API_KEY.
Add billing credit; monthly analyses cost cents per client.

## 4. Vercel
1. Push this folder to GitHub, import at vercel.com/new
2. Environment Variables: everything from .env.example
   (NEXTAUTH_URL = your production URL)
3. Build command is already `prisma generate && next build`
4. Deploy.

## 5. First data
- Create your agency + user rows (Prisma Studio: `npm run db:studio`)
- Add a client: POST /api/clients
- Log work: POST /api/worklog
- Generate a report: POST /api/reports/generate {clientId, month}
