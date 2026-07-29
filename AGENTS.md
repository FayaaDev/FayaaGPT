# AGENTS.md

## Project Mission

Build a custom ChatGPT-style web interface from the existing open-source
`lencx/ChatGPT` React/Vite/Tauri code in this repository.

The primary deployment target is Cloudflare. Reuse the existing UI, styling,
icons, and useful React components where practical, but do not assume the
Tauri desktop runtime is available in a browser. The current `src/App.tsx`
depends on Tauri webview labels, so create a browser-safe application entry
point rather than attempting to deploy the desktop shell unchanged. Keep
desktop-specific code isolated unless desktop support is explicitly requested.

### Required Outcome

- A responsive ChatGPT-style web UI with a conversation list, message thread,
  composer, send/stop controls, loading and error states, and streamed model
  output.
- A server-side Cloudflare Worker API that calls OpenAI. The browser must never
  call OpenAI directly or receive an OpenAI credential.
- Conversation persistence through the selected database API once its provider,
  schema, and authentication model are confirmed.
- One Cloudflare deployment serving both the web application and its API when
  the selected Cloudflare architecture supports that cleanly.
- Local development and production deployment workflows that source secrets
  from 1Password Environments.

## Existing Codebase Rules

- Treat this repository as the starting point; do not replace it wholesale with
  a new template.
- Preserve attribution and comply with the upstream project's license.
- Reuse existing design elements when they fit the web interface.
- Remove or change Tauri dependencies only when necessary for the web build;
  do not break the desktop application accidentally.
- Keep changes small and verifiable. Do not add unrelated features or perform
  broad refactors.
- Use Bun because this repository contains `bun.lock`.

## Architecture

### Frontend

- Continue using React, TypeScript, Vite, and the existing Tailwind setup.
- Browser code may call only same-origin application endpoints such as
  `/api/chat` and `/api/conversations`.
- Render assistant content safely. Do not inject unsanitized model-generated
  HTML into the page.
- Support incremental streamed responses and cancellation with
  `AbortController`; do not buffer an entire model response before displaying
  it.
- Keep secret values and privileged database operations out of all `VITE_*`
  variables because Vite exposes those variables to browser bundles.

### Cloudflare Backend

- Use a Cloudflare Worker for privileged API operations and Cloudflare Static
  Assets for the built Vite frontend unless repository constraints justify a
  different Cloudflare product.
- Before writing Worker code or configuration, consult current Cloudflare and
  Wrangler documentation. Use `wrangler.jsonc`, a current
  `compatibility_date`, generated Worker binding types, and observability.
- Stream the OpenAI response through the Worker to the client. Do not read an
  unbounded response fully into Worker memory.
- Validate request bodies, constrain accepted message sizes, return structured
  errors, and avoid exposing provider responses, stack traces, or secrets.
- Do not keep request or user state in mutable module-level variables.
- Every promise must be awaited, returned, explicitly voided, or passed to
  `ctx.waitUntil()`.
- Use Cloudflare bindings rather than Cloudflare REST calls from inside the
  Worker. If the chosen database is external PostgreSQL or MySQL, evaluate
  Hyperdrive before using direct database connections.

### OpenAI Integration

- Retrieve current OpenAI API documentation before implementation; do not rely
  on stale endpoint, model, or SDK assumptions.
- Keep model selection and other non-secret defaults in typed server-side
  configuration. Do not hardcode credentials.
- Preserve the model's streamed text/events end to end and handle upstream
  cancellation and errors.
- Never log prompts, responses, API keys, database credentials, or authorization
  headers by default.

### Database Integration

- Do not silently choose a database provider, schema, or authentication model.
  If these are not yet specified, pause and ask before implementing persistence.
- Access the database only from the Worker. Never expose a privileged database
  key to the frontend.
- Scope every conversation query and mutation to the authenticated user. Do not
  implement shared, unscoped conversation history.
- Use migrations for schema changes and add indexes needed for user-scoped,
  newest-first conversation queries.
- Prefer a native binding for Cloudflare storage. For an external database API,
  keep its URL and secret key in Worker secrets supplied from 1Password.

## API Baseline

Unless requirements call for a different contract, use this minimal API shape:

- `POST /api/chat` validates input and streams the assistant response.
- `GET /api/conversations` lists the current user's conversations.
- `POST /api/conversations` creates a conversation.
- `GET /api/conversations/:id` returns a user-owned conversation and messages.
- `DELETE /api/conversations/:id` deletes only a user-owned conversation.

Do not add account administration, billing, tools, file uploads, image
generation, or retrieval-augmented generation unless explicitly requested.

## Implementation Order

1. Make the existing React UI run safely in a normal browser while retaining
   reusable project assets and components.
2. Add the Cloudflare Worker and a mocked/tested streaming chat path without
   exposing secrets.
3. Connect the Worker to OpenAI using the current documented API.
4. Confirm the database provider, schema, and authentication requirements, then
   add user-scoped persistence.
5. Add deployment scripts that obtain values from the appropriate 1Password
   Environment and deploy with Wrangler.
6. Verify type checking, tests, production build, local Worker behavior,
   streaming/cancellation, and absence of secrets in source and build output.

## Definition of Done

- `bun run build` succeeds and the production frontend runs without a Tauri
  runtime.
- Worker type checking and automated tests pass.
- Chat output appears incrementally and can be cancelled.
- Unauthorized users cannot read or modify another user's conversations.
- OpenAI and database secrets occur only in 1Password and encrypted Cloudflare
  runtime secrets, never in source, client bundles, logs, fixtures, screenshots,
  or committed environment files.
- A fresh developer can follow the documented 1Password-based local workflow,
  and an operator can follow the documented manual Wrangler deployment workflow.

## Secrets Management

### Source of Truth
- Use 1Password Environments as the only source of truth for secrets.
- Do not store application secrets in GitHub Secrets.
- Do not create or use 1Password Service Accounts.
- Cloudflare Secrets are runtime copies, not the source of truth.

### Environment Structure
Create one 1Password Environment per application and deployment stage.
Vault name: Env
command: 1p --help

For this application, use:
- chatgpt-development
- chatgpt-production

Expected secret names should be documented by name only, never by value. At a
minimum, plan for:
- `OPENAI_API_KEY`
- The database API URL and server-side credential required by the selected
  provider (final names must match that provider and Worker bindings).

Do not invent placeholder secret values that could be mistaken for real ones.

Login with 1p whoami, it is already authenticated.

Do not create Environments based on `.env`, `.env.local`, or other filenames.

### Local Development
- Authenticate with the local 1Password desktop app.
- Generate temporary `.dev.vars` (or equivalent) from 1Password.
- Never commit generated environment files.
- Delete temporary files after use.
- Ensure `.dev.vars`, `.env`, `.env.*`, and generated secret files are ignored.
- Prefer scripts that clean up temporary files with a shell `trap`, including
  when development commands fail or are interrupted.
- Never print resolved secret values to the terminal, logs, or command history.

### Cloudflare Deployment
- Deploy manually from the Mac using Wrangler.
- Read secrets from the corresponding 1Password Environment.
- Upload them to Cloudflare using `wrangler deploy --secrets-file`.
- Cloudflare stores encrypted runtime copies of the secrets.
- Keep non-secret configuration and binding declarations in `wrangler.jsonc`.
- Do not enable Git-based deployment if it requires copying application secrets
  into GitHub or another CI provider.
- Load the Wrangler guidance and check the installed Wrangler version before
  creating deployment scripts or running deployment commands.

### Security Rules
- Never commit secrets to Git.
- Never hardcode secrets.
- Never manually duplicate secrets across platforms.
- Rotate secrets only in 1Password, then redeploy to Cloudflare.
- Treat Cloudflare as the runtime destination, not the authority.
- Never expose provider credentials through frontend code, `VITE_*` variables,
  API responses, source maps, test snapshots, or client-side storage.
- Before committing or deploying, inspect staged files and the production build
  for secret names, resolved values, and generated environment files.
