# AGENTS.md — Ambition News Portal Developer & Agent Rules

## 1. ZERO CONFIDENTIAL CREDENTIALS IN CODE (STRICT NO-LEAK RULE)
- **NEVER** hardcode, commit, or log raw passwords, database connection strings (e.g. MongoDB Atlas URIs with credentials), API keys, JWT secrets, or sensitive tokens into git-tracked files.
- All secrets MUST be read exclusively from environment variables (`process.env.VAR_NAME`) via `.env` files.
- `.env` files MUST ALWAYS be listed in `.gitignore` and never staged or committed.
- In deployment configuration files (e.g., `render.yaml`, `vercel.json`), use `sync: false` or environment variable placeholders — NEVER raw credential strings.
- Only safe dummy templates (e.g., `<username>:<password>`) are permitted in `.env.example`.

## 2. WORKSPACE CONSTRAINTS
- **Frontend Stack**: React 19 + TypeScript + Vite + Tailwind CSS. Hosted on Vercel.
- **Backend Stack**: Node.js + Express + TypeScript + Mongoose. Hosted on Render.
- **Database**: MongoDB Atlas. Database name: `ambition_news`.
- All API routes and models must support the 88 districts of Chhattisgarh and Madhya Pradesh.

