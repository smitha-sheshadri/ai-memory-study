# LLM Memory Study project

This package contains:

- `transcripts/` — transcript bank and rotation documentation.
- `study-app/` — TypeScript/React/Vite frontend.

Run locally:

```bash
cd study-app
npm install
npm run dev
```

The app now captures Prolific IDs, saves responses locally, and can POST completed interactions to a backend configured through `VITE_API_URL`.
