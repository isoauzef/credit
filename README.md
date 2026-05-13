
  # Review Cleaners


  ## Getting Started

  1. Run `npm install` to install dependencies.
  2. Create a `.env` file in the project root and set a strong admin token, for example: `ADMIN_TOKEN=change-me-now`.
  3. Run `npm run dev:full` to start both the Vite dev server (http://localhost:3000) and the Express API (http://localhost:3001).

  ## Available Scripts

  - `npm run dev` – runs only the Vite dev server. Useful if you are pointing the frontend at a remote API.
  - `npm run server` – starts the Express API on port 3001 (uses the built build output if available).
  - `npm run dev:full` – runs the frontend and backend together for local development.
  - `npm run build` – builds the production frontend into the `build` directory.

  ## API Overview

  - `POST /api/contact` – accepts `{ name, phone, email, problem, agreed }` and appends the payload to `server/data/contact-submissions.json`.
  - `GET /api/contact` – returns the full submission history. Requires the admin token via the `x-admin-token` header.

  ## Admin Dashboard

  Visit `http://localhost:3000/admin` and authenticate with the admin token you configured to review submissions in a secure table view.
  