# Frontend — Tracebound

Purpose
- The frontend is a Next.js application that provides a clear, interactive UI for composing intents, previewing workflow steps, starting executions, and exploring verifiable traces and on-chain proofs.

Key responsibilities
- Provide intent input UI and presets for quick testing.
- Show a step-by-step execution timeline with live status updates and outputs.
- Display on-chain transaction proofs and links to explorer for verification.
- Call backend APIs for workflow previews, execution control, and fetching trace data.

Important files & components
- `src/app/page.tsx` — main page and entry for the UI.
- `src/app/components/ExecutionTimeline.tsx` — timeline visualization of steps and statuses.
- `src/app/components/IntentInput.tsx` — intent composition and presets.
- `src/app/components/WorkflowTrace.tsx` — detailed trace view showing step outputs and branching.
- `src/app/components/OnchainProof.tsx` — UI for viewing tx hashes and on-chain proof details.

Quickstart (local)
```powershell
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

Environment variables
- Copy `.env.local.example` → `.env.local` and set:
  - `NEXT_PUBLIC_API_BASE` — backend API base URL (default: `http://localhost:4000`).

Build & deployment
- Build for production:
```powershell
cd frontend
npm run build
npm run start
```

Developer notes
- UI components are written with React and Tailwind CSS; follow existing component patterns when adding new views.
- The frontend consumes the backend API for previews and real-time execution events; ensure the backend server is running when testing end-to-end flows.
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
