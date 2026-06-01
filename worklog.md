---
Task ID: 1
Agent: Main
Task: Fix bun run build failure and push to GitHub

Work Log:
- Investigated build failure: `next build` succeeded but post-build `cp -r .next/static .next/standalone/.next/` failed because `output: "standalone"` is not set in next.config.ts (and shouldn't be for Vercel)
- Fixed package.json: changed build script from `next build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/` to just `next build`
- Verified build passes with `bun run build`
- Pushed Prisma schema to Neon PostgreSQL database (already in sync)
- Seeded database via `/api/seed` endpoint
- Tested all critical APIs: activation, auth, dashboard — all return 200
- Committed and pushed fix to GitHub (commit 6aecda2)

Stage Summary:
- Build failure fixed by removing standalone cp commands from build script
- Database is in sync and seeded with demo data
- All APIs verified working: activation, auth (owner + tenant login), dashboard
- Code pushed to GitHub at apexflowerp/EduFlow
- Vercel deployment should now succeed on next build
