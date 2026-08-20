# AI Memory Study frontend

TypeScript + React + Vite.

## Run locally

```bash
npm install
npm run dev
```

## Current study flow

0. **Dev mode only:** select `G1`–`G4`.
1. Instructions.
2. Interaction screen styled like an AI chat:
   - the user message types in;
   - the assistant waits/thinks for **5 seconds**;
   - the memory update appears;
   - after another **5 seconds**, the assistant response appears.
3. `Proceed to survey`.
4. Survey questions appear **one at a time** with a progress bar.
   - Participant-facing questions are numbered `1, 2, 3...`.
   - Internal variable IDs remain `PB1–PB3`, `PV1–PV5`, `PR1`, and `ATTN`.
   - A randomized attention check is included. Both the requested response (1–7) and the question's position within the survey are randomized for each interaction.
   - **Dev mode only:** `Skip all (dev)`.
5. Repeat for all 15 interactions.

## Participant IDs / Prolific

The app automatically reads Prolific URL parameters when present:

- `PROLIFIC_PID`
- `STUDY_ID`
- `SESSION_ID`

`PROLIFIC_PID` becomes the participant ID. If the page is opened outside Prolific, the app creates a local anonymous ID and stores it in `localStorage`.

Example Prolific-style URL:

```text
https://your-study.example/?PROLIFIC_PID=abc123&STUDY_ID=study1&SESSION_ID=session1
```

## Response storage

Responses are saved incrementally to browser `localStorage` so a page refresh does not immediately erase completed responses.

The app also contains backend submission logic. Set:

```bash
VITE_API_URL=https://your-api-endpoint.example.com/responses
```

When configured, the frontend POSTs a JSON record after every completed interaction and a completion event at the end.

For AWS, the intended next step is:

```text
React app on Amplify
        ↓
API Gateway
        ↓
Lambda
        ↓
DynamoDB
```

The frontend is already structured for this: once an API Gateway endpoint exists, put it in `VITE_API_URL` in Amplify's environment variables. No AWS credentials should be embedded in the browser.

## Production build

```bash
npm run build
```

The static build is written to `dist/`.
