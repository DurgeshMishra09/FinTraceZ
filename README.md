# FinTrace Z — Team CodeRhythm

**IBM Z Datathon 2026 | Theme: AI Secured: Innovation Without Exposure**
**Event code: SSF2026**

FinTrace Z is a web prototype that helps an investigator follow scam money through connected bank accounts: where it started, how it moved, and where it ended.

## Runs on IBM LinuxONE
- Built and served on the IBM LinuxONE Community Cloud (s390x), inside the JupyterLab Docker container, using Node.js 22 for s390x.
- Tailwind CSS 4 needs native binaries that do not exist for s390x, so the project uses Tailwind CSS 3 (pure JavaScript). 

## Run it
    npm install
    npm run build
    npm run preview -- --host

Open http://localhost:4173. For development use `npm run dev -- --host` (http://localhost:5173).

## What it does today
- **CSV analysis in the browser:** the file is never uploaded to a server. Needs sender, receiver and amount columns; a timestamp column enables speed checks.
- **Five transparent, rule-based checks with points:** fast pass-through, fan-in, fan-out, chain hopping, cash-out point.
- **Money trail:** a top-down tree from the scam source, accounts numbered in time order, each route labelled with its amount, and a red arrow where the money ends.
- **Account details:** click an account to see its path from the start, how it divides, and where it ends. Trails above 14 accounts open one account at a time.

## Planned, not built yet
Federated learning, differential privacy and secure aggregation.

An alert is a lead for a human to review, not proof of fraud. The sample data is fictional.

## Open-source libraries used
- React: https://react.dev
- Vite: https://vite.dev
- TypeScript: https://www.typescriptlang.org
- Tailwind CSS 3: https://tailwindcss.com
- Framer Motion: https://www.framer.com/motion
- Lenis: https://lenis.darkroom.engineering
