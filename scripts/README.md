# Deployment scripts

Deploy from a Mac with the 1Password desktop app unlocked and CLI integration enabled. Do not use service accounts.

- In **1Password Developer > Environments**, obtain the ID for the pre-created `chatgpt-development` or `chatgpt-production` Environment.
- Each Environment must contain `OPENAI_API_KEY`.
- A 1Password CLI beta build that provides `op environment read` is required; the stable CLI does not include this command.
- Invoke the matching deployment without printing the ID:

  ```bash
  OP_ENVIRONMENT_ID=<1password-environment-id> bun run 1p:dev
  ```

Use `bun run 1p:prod` with the `chatgpt-production` Environment when deploying production.
