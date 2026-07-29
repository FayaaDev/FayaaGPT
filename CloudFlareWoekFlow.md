# Next Steps After Adding API Key to GitHub Secrets

**Session ID:** ses_052a95330ffe7aVCGVHWp5VWo7
**Created:** 7/29/2026, 1:06:06 PM
**Updated:** 7/29/2026, 1:08:57 PM

---

## User

I added api key in github secrets, what's next?

---

## Assistant (Coder · GPT-5.6 Terra · 16.3s)

_Thinking:_

**Clarifying GitHub secret removal and API key setup**

Don’t use GitHub Secrets for this project. Remove the API key from GitHub Secrets.

Next:

1. Create a local, uncommitted `.dev.vars` file:
   ```env
   OPENAI_API_KEY=...
   ```
2. Confirm `.dev.vars` is gitignored.
3. For Cloudflare production, set it directly from your Mac:
   ```bash
   bunx wrangler secret put OPENAI_API_KEY
   ```
   Paste the value only when prompted.
4. Deploy manually with Wrangler after the Worker/API is implemented:
   ```bash
   bunx wrangler deploy
   ```

GitHub should never store or deploy this key.

---

## User

I stored it in Github enviroment

---

## Assistant (Coder · GPT-5.6 Terra · 3.7s)

That’s still not the intended location. Remove it from the GitHub environment too.

Use:

- Local development: uncommitted `.dev.vars`
- Production: Cloudflare encrypted Worker secret

```bash
bunx wrangler secret put OPENAI_API_KEY
```

Then paste the key only at Wrangler’s prompt. This keeps the credential out of GitHub and available only to the deployed Worker.

---

## User

what about local?

---

## Assistant (Coder · GPT-5.6 Terra · 4.9s)

For local development, create `.dev.vars` in the project root:

```env
OPENAI_API_KEY=your_key_here
```

Ensure it is ignored by Git:

```bash
git check-ignore .dev.vars
```

Then run the Worker locally with Wrangler:

```bash
bunx wrangler dev
```

Never use `VITE_OPENAI_API_KEY`; Vite would expose it to the browser.

---

## User

Is there any reason to use the github secret in enviroment tap in UI?

---

## Assistant (Coder · GPT-5.6 Terra · 7.6s)

Not for this app’s current deployment plan.

GitHub environment secrets are useful when a **GitHub Actions workflow** needs a credential during CI/CD, such as automatically deploying to Cloudflare. But this project requires manual Wrangler deployment and explicitly avoids storing app secrets in GitHub.

Use Cloudflare Worker secrets for production and `.dev.vars` locally. GitHub environment secrets would only add another copy of the OpenAI key without benefiting the app.

---

## User

Walk me through GitHub Actions workflow to automatically deploying to Cloudflare

---

## Assistant (Coder · GPT-5.6 Terra · 7.6s)

_Thinking:_

**Clarifying GitHub deployment restrictions**

_Thinking:_

**Planning deployment steps and documentation review**

**Tool: skill**

**Input:**
```json
{
  "name": "cloudflare"
}
```

**Output:**
```
<skill_content name="cloudflare">
# Skill: cloudflare

# Cloudflare Platform Skill

Consolidated skill for building on the Cloudflare platform. Use decision trees below to find the right product, then load detailed references.

Your knowledge of Cloudflare APIs, types, limits, and pricing may be outdated. **Prefer retrieval over pre-training** — the references in this skill are starting points, not source of truth.

## Retrieval Sources

Fetch the **latest** information before citing specific numbers, API signatures, or configuration options. Do not rely on baked-in knowledge or these reference files alone.

| Source | How to retrieve | Use for |
|--------|----------------|---------|
| Cloudflare docs | `cloudflare-docs` search tool or `https://developers.cloudflare.com/` | Limits, pricing, API reference, compatibility dates/flags |
| Workers types | `npm pack @cloudflare/workers-types` or check `node_modules` | Type signatures, binding shapes, handler types |
| Wrangler config schema | `node_modules/wrangler/config-schema.json` | Config fields, binding shapes, allowed values |
| Product changelogs | `https://developers.cloudflare.com/changelog/` | Recent changes to limits, features, deprecations |

When a reference file and the docs disagree, **trust the docs**. This is especially important for: numeric limits, pricing tiers, type signatures, and configuration options.

## Quick Decision Trees

### "I need feature flags"

```
Need feature flags?
└─ Feature toggles, targeting rules, percentage rollouts → flagship/
   ├─ Evaluate in Workers → Flagship binding (env.FLAGS)
   ├─ Evaluate in Node.js / browser → OpenFeature SDK (@cloudflare/flagship)
   └─ Manage flags via API → Flagship REST API
```

### "I need to run code"

```
Need to run code?
├─ Serverless functions at the edge → workers/
├─ Full-stack web app with Git deploys → pages/
├─ Stateful coordination/real-time → durable-objects/
├─ Long-running multi-step jobs → workflows/
├─ Run containers → containers/
├─ Multi-tenant (customers deploy code) → workers-for-platforms/
├─ Scheduled tasks (cron) → cron-triggers/
├─ Lightweight edge logic (modify HTTP) → snippets/
├─ Process Worker execution events (logs/observability) → tail-workers/
└─ Optimize latency to backend infrastructure → smart-placement/
```

### "I need to store data"

```
Need storage?
├─ Key-value (config, sessions, cache) → kv/
├─ Relational SQL → d1/ (SQLite) or hyperdrive/ (existing Postgres/MySQL)
├─ Object/file storage (S3-compatible) → r2/
├─ Versioned file trees (repos, build outputs, checkpoints) → artifacts/
├─ Message queue (async processing) → queues/
├─ Vector embeddings (AI/semantic search) → vectorize/
├─ Strongly-consistent per-entity state → durable-objects/ (DO storage)
├─ Secrets management → secrets-store/
├─ Streaming ETL to R2 → pipelines/
├─ Managed Apache Iceberg catalog on R2 → r2-data-catalog/
├─ Serverless SQL analytics over Iceberg tables → r2-sql/
└─ Persistent cache (long-term retention) → cache-reserve/
```

### "I need AI/ML"

```
Need AI?
├─ Run inference (LLMs, embeddings, images) → workers-ai/
├─ Vector database for RAG/search → vectorize/
├─ Build stateful AI agents → agents-sdk/
├─ Gateway for any AI provider (caching, routing) → ai-gateway/
└─ AI-powered search widget → ai-search/
```

### "I need networking/connectivity"

```
Need networking?
├─ Expose local service to internet → tunnel/
├─ TCP/UDP proxy (non-HTTP) → spectrum/
├─ WebRTC TURN server → turn/
├─ Private network connectivity → network-interconnect/
├─ Optimize routing → argo-smart-routing/
├─ Optimize latency to backend (not user) → smart-placement/
└─ Real-time video/audio → realtimekit/ or realtime-sfu/
```

### "I need security"

```
Need security?
├─ Web Application Firewall → waf/
├─ DDoS protection → ddos/
├─ Bot detection/management → bot-management/
├─ API protection → api-shield/
├─ CAPTCHA alternative → turnstile/
└─ Credential leak detection → waf/ (managed ruleset)
```

### "I need media/content"

```
Need media?
├─ Image optimization/transformation → images/
├─ Video streaming/encoding → stream/
├─ Browser automation/screenshots → browser-rendering/
└─ Third-party script management → zaraz/
```

### "I need analytics/metrics data"

```
Need analytics?
├─ Query across all Cloudflare products (HTTP, Workers, DNS, etc.) → graphql-api/
├─ Custom high-cardinality metrics from Workers → analytics-engine/
├─ Client-side (RUM) performance data → web-analytics/
├─ Workers Logs and real-time debugging → observability/
├─ SQL over Iceberg data lake (logs, events) → r2-sql/ (+ pipelines/, r2-data-catalog/)
└─ Raw logs (Logpush to external tools) → Cloudflare docs
```

### "I need infrastructure-as-code"

```
Need IaC? → pulumi/ (Pulumi), terraform/ (Terraform), or api/ (REST API)
```

## Product Index

### Feature Flags
| Product | Reference |
|---------|-----------|
| Flagship | `references/flagship/` |

### Compute & Runtime
| Product | Reference |
|---------|-----------|
| Workers | `references/workers/` |
| Pages | `references/pages/` |
| Pages Functions | `references/pages-functions/` |
| Durable Objects | `references/durable-objects/` |
| Workflows | `references/workflows/` |
| Containers | `references/containers/` |
| Workers for Platforms | `references/workers-for-platforms/` |
| Cron Triggers | `references/cron-triggers/` |
| Tail Workers | `references/tail-workers/` |
| Snippets | `references/snippets/` |
| Smart Placement | `references/smart-placement/` |

### Storage & Data
| Product | Reference |
|---------|-----------|
| KV | `references/kv/` |
| D1 | `references/d1/` |
| R2 | `references/r2/` |
| Artifacts | `references/artifacts/` |
| Queues | `references/queues/` |
| Hyperdrive | `references/hyperdrive/` |
| DO Storage | `references/do-storage/` |
| Secrets Store | `references/secrets-store/` |
| Pipelines | `references/pipelines/` |
| R2 Data Catalog | `references/r2-data-catalog/` |
| R2 SQL | `references/r2-sql/` |

### AI & Machine Learning
| Product | Reference |
|---------|-----------|
| Workers AI | `references/workers-ai/` |
| Vectorize | `references/vectorize/` |
| Agents SDK | `references/agents-sdk/` |
| AI Gateway | `references/ai-gateway/` |
| AI Search | `references/ai-search/` |

### Networking & Connectivity
| Product | Reference |
|---------|-----------|
| Tunnel | `references/tunnel/` |
| Spectrum | `references/spectrum/` |
| TURN | `references/turn/` |
| Network Interconnect | `references/network-interconnect/` |
| Argo Smart Routing | `references/argo-smart-routing/` |
| Workers VPC | `references/workers-vpc/` |

### Security
| Product | Reference |
|---------|-----------|
| WAF | `references/waf/` |
| DDoS Protection | `references/ddos/` |
| Bot Management | `references/bot-management/` |
| API Shield | `references/api-shield/` |
| Turnstile | `references/turnstile/` |

### Media & Content
| Product | Reference |
|---------|-----------|
| Images | `references/images/` |
| Stream | `references/stream/` |
| Browser Rendering | `references/browser-rendering/` |
| Zaraz | `references/zaraz/` |

### Real-Time Communication
| Product | Reference |
|---------|-----------|
| RealtimeKit | `references/realtimekit/` |
| Realtime SFU | `references/realtime-sfu/` |

### Developer Tools
| Product | Reference |
|---------|-----------|
| Wrangler | `references/wrangler/` |
| Miniflare | `references/miniflare/` |
| C3 | `references/c3/` |
| Observability | `references/observability/` |
| GraphQL Analytics API | `references/graphql-api/` |
| Analytics Engine | `references/analytics-engine/` |
| Web Analytics | `references/web-analytics/` |
| Sandbox | `references/sandbox/` |
| Workerd | `references/workerd/` |
| Workers Playground | `references/workers-playground/` |

### Infrastructure as Code
| Product | Reference |
|---------|-----------|
| Pulumi | `references/pulumi/` |
| Terraform | `references/terraform/` |
| API | `references/api/` |

### Other Services
| Product | Reference |
|---------|-----------|
| Email Routing | `references/email-routing/` |
| Email Workers | `references/email-workers/` |
| Static Assets | `references/static-assets/` |
| Bindings | `references/bindings/` |
| Cache Reserve | `references/cache-reserve/` |

Base directory for this skill: /Users/fayaa/.agents/skills/cloudflare
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>
<file>/Users/fayaa/.agents/skills/cloudflare/references/r2/configuration.md</file>
<file>/Users/fayaa/.agents/skills/cloudflare/references/r2/patterns.md</file>
<file>/Users/fayaa/.agents/skills/cloudflare/references/r2/README.md</file>
<file>/Users/fayaa/.agents/skills/cloudflare/references/r2/api.md</file>
<file>/Users/fayaa/.agents/skills/cloudflare/references/r2/gotchas.md</file>
<file>/Users/fayaa/.agents/skills/cloudflare/references/tunnel/configuration.md</file>
<file>/Users/fayaa/.agents/skills/cloudflare/references/tunnel/patterns.md</file>
<file>/Users/fayaa/.agents/skills/cloudflare/references/tunnel/README.md</file>
<file>/Users/fayaa/.agents/skills/cloudflare/references/tunnel/networking.md</file>
<file>/Users/fayaa/.agents/skills/cloudflare/references/tunnel/api.md</file>
</skill_files>
</skill_content>
```

---

## Assistant (Coder · GPT-5.6 Terra · 3.0s)

**Tool: skill**

**Input:**
```json
{
  "name": "github"
}
```

**Output:**
```
<skill_content name="github">
# Skill: github

# GitHub Skill

Use the `gh` CLI to interact with GitHub. Always specify `--repo owner/repo` when not in a git directory, or use URLs directly.

## Pull Requests

Check CI status on a PR:
```bash
gh pr checks 55 --repo owner/repo
```

List recent workflow runs:
```bash
gh run list --repo owner/repo --limit 10
```

View a run and see which steps failed:
```bash
gh run view <run-id> --repo owner/repo
```

View logs for failed steps only:
```bash
gh run view <run-id> --repo owner/repo --log-failed
```

### Debugging a CI Failure

Follow this sequence to investigate a failing CI run:

1. **Check PR status** — identify which checks are failing:
   ```bash
   gh pr checks 55 --repo owner/repo
   ```
2. **List recent runs** — find the relevant run ID:
   ```bash
   gh run list --repo owner/repo --limit 10
   ```
3. **View the failed run** — see which jobs and steps failed:
   ```bash
   gh run view <run-id> --repo owner/repo
   ```
4. **Fetch failure logs** — get the detailed output for failed steps:
   ```bash
   gh run view <run-id> --repo owner/repo --log-failed
   ```

## API for Advanced Queries

The `gh api` command is useful for accessing data not available through other subcommands.

Get PR with specific fields:
```bash
gh api repos/owner/repo/pulls/55 --jq '.title, .state, .user.login'
```

## JSON Output

Most commands support `--json` for structured output.  You can use `--jq` to filter:

```bash
gh issue list --repo owner/repo --json number,title --jq '.[] | "\(.number): \(.title)"'
```

Base directory for this skill: /Users/fayaa/.agents/skills/github
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>
<file>/Users/fayaa/.agents/skills/github/agents/openai.yaml</file>
</skill_files>
</skill_content>
```

---

## Assistant (Coder · GPT-5.6 Terra · 6.9s)

**Tool: cloudflare_docs**

**Input:**
```json
{
  "query": "GitHub Actions deploy Cloudflare Workers Wrangler API token permissions secrets deploy Workers static assets"
}
```

**Output:**
```
<result>
<url>https://developers.cloudflare.com/workers/ci-cd/builds/configuration/</url>
<title>Configuration</title>
<text>
### Automatic configuration for new projects

If your repository does not have a Wrangler configuration file, the deploy command (`wrangler deploy`) will trigger [automatic project configuration](/workers/framework-guides/automatic-configuration/). This detects your framework, creates the necessary configuration, and opens a [pull request](/workers/ci-cd/builds/automatic-prs/) for you to review. Once you merge the PR, your project is configured and future builds will deploy normally.

### API token

The API token in Workers Builds defines the access granted to Workers Builds for interacting with your account's resources. Currently, only user tokens are supported, with account-owned token support coming soon.

When you select **Create new token**, a new API token will be created automatically with the following permissions:

* **Account:** Account Settings (read), Workers Scripts (edit), Workers KV Storage (edit), Workers R2 Storage (edit)
* **Zone:** Workers Routes (edit) for all zones on the account
* **User:** User Details (read), Memberships (read)

You can configure the permissions of this API token by navigating to **My Profile** \> **API Tokens** for user tokens.

It is recommended to consistently use the same API token across all uploads and deployments of your Worker to maintain consistent access permissions.

## Framework support

[Static assets](/workers/static-assets/) and [frameworks](/workers/framework-guides/) are now supported in Cloudflare Workers. Learn to set up Workers projects and the commands for each framework in the framework guides:


| **[API token](/workers/ci-cd/builds/configuration/#api-token)** _(Optional)_                                          | The API token is used to authenticate your build request and authorize the upload and deployment of your Worker to Cloudflare. By default, Cloudflare will automatically generate an API token for your account when using Workers Builds, and continue to use this API token for all subsequent builds. Alternatively, you can [create your own API token](/workers/wrangler/migration/v1-to-v2/wrangler-legacy/authentication/#generate-tokens), or select one that you already own. |
| **Build variables and secrets** _(Optional)_                                                                          | Add environment variables and secrets accessible only to your build. Build variables will not be accessible at runtime. If you would like to configure runtime variables you can do so in **Settings** \> **Variables & Secrets**                                                                                                                                                                                                                                                      |

Note

Currently, Workers Builds does not honor the configurations set in [Custom Builds](/workers/wrangler/custom-builds/) within your Wrangler configuration file.

### Deploy command

You can run your deploy command using the package manager of your choice.

If you have added a Wrangler deploy command as a script in your `package.json`, then you can run it by setting it as your deploy command. For example, `npm run deploy`.

Examples of other deploy commands you can set include:

| Example Command                        | Description                                                                                                                                                                                                                                                                     |

</text>
</result>
<result>
<url>https://developers.cloudflare.com/secrets-store/access-control/</url>
<title>Access Control</title>
<text>
## API token permissions

[API tokens](/fundamentals/api/get-started/create-token/) have two Secrets Store permission levels: **Read** and **Edit**. The permission you need depends on what the token is doing, not on whether you intend to modify the secret itself.

* **Account Secrets Store Read**: Allows the caller to view metadata for secrets (for example, listing secrets or fetching the name, ID, scopes, and comments of a secret). This permission does not grant access to the value of a secret, and does not allow binding a secret to another resource.
* **Account Secrets Store Edit**: Allows the caller to create, edit, duplicate, or delete secrets. **Edit is also required to bind a secret to another Cloudflare resource**, such as adding a Secrets Store binding to a Worker or associating a secret with an AI Gateway. Attaching a secret to a resource is treated as a write against the secret.

Deploying Workers from CI/CD

If you use Wrangler in a CI/CD pipeline (for example, [wrangler-action ↗](https://github.com/cloudflare/wrangler-action) in GitHub Actions) to deploy a Worker that has a [Secrets Store binding](/secrets-store/integrations/workers/), the API token used by the pipeline must have **Account Secrets Store Edit** permission. A token with only **Read** will fail at deploy time with an authorization error such as `failed to fetch secrets store binding due to authorization error - check deploy permissions and secret scopes`.

## Secret scopes

Each secret has a list of **scopes** that determine which Cloudflare services are allowed to consume it. Scopes are set when a secret is created, and can be updated later by editing the secret.

The currently supported scopes are:


</text>
</result>
<result>
<url>https://developers.cloudflare.com/workers/wrangler/commands/workers/</url>
<title>Workers</title>
<text>
* Folder of static assets to be served. Replaces [Workers Sites](/workers/configuration/sites/). Visit [assets](/workers/static-assets/) for more information.
* `--site` ` string ` optional deprecated, use \`--assets\`

  * Folder of static assets for Workers Sites.  
  Warning  
  Workers Sites is deprecated. Please use [Workers Assets](/workers/static-assets/) or [Pages](/pages/).
* `--site-include` ` string[] ` optional deprecated

  * Array of `.gitignore`\-style patterns that match file or directory names from the sites directory. Only matched items will be uploaded.
* `--site-exclude` ` string[] ` optional deprecated

  * Array of `.gitignore`\-style patterns that match file or directory names from the sites directory. Matched items will not be uploaded.
* `--var` ` key:value\[] ` optional

  * Array of `key:value` pairs to inject as variables into your code. The value will always be passed as a string to your Worker.
  * For example, `--var git_hash:$(git rev-parse HEAD) test:123` makes the `git_hash` and `test` variables available in your Worker's `env`.
  * This flag is an alternative to defining [vars](/workers/wrangler/configuration/#non-inheritable-keys) in your [Wrangler configuration file](/workers/wrangler/configuration/). If defined in both places, this flag's values will be used.
* `--define` ` key:value\[] ` optional


## `deploy`

Deploy your Worker to Cloudflare.

When you run `wrangler deploy` in a project directory without a Wrangler configuration file, Wrangler will [automatically detect your framework](/workers/framework-guides/automatic-configuration/) and configure your project for Cloudflare Workers. This command will prompt you to confirm the detected settings before applying changes. Confirm that you would like to proceed, and your project will be configured and deployed.

To deploy from an AI agent or another environment before Cloudflare authentication is available, use `wrangler deploy --temporary`. This flow requires Wrangler 4.102.0 or later. Wrangler creates or reuses a temporary preview account, deploys to that account, and prints a claim URL. For more information, refer to [Claim deployments](/workers/platform/claim-deployments/).

To configure your project without deploying, use [wrangler setup](#setup) instead.

```txt
wrangler deploy [<PATH>] [OPTIONS]
```

Note

None of the options for this command are required. Also, many can be set in your Wrangler file. Refer to the [Wrangler configuration](/workers/wrangler/configuration/) documentation for more information.

* `PATH` ` string `

  * A path specific what needs to be deployed, this can either be:  
    * The path to an entry point for your Worker.

      * Only required if your [Wrangler configuration file](/workers/wrangler/configuration/) does not include a `main` key (for example, `main = "index.js"`).
    * Or the path to an assets directory for the deployment of a static site.


</text>
</result>
<result>
<url>https://developers.cloudflare.com/changelog/32/</url>
<title>32</title>
<text>
[Deploy to Cloudflare buttons now support Worker environment variables, secrets, and Secrets Store secrets](/changelog/post/2025-07-01-workers-deploy-button-supports-environment-variables-and-secrets/)

[Workers](/workers/)[Secrets Store](/secrets-store/)

Any template which uses [Worker environment variables](/workers/configuration/environment-variables/), [secrets](/workers/configuration/secrets/), or [Secrets Store secrets](/secrets-store/) can now be deployed using a [Deploy to Cloudflare button](/workers/platform/deploy-buttons/).

Define environment variables and secrets store bindings in your Wrangler configuration file as normal:

```jsonc
{
  "name": "my-worker",
  "main": "./src/index.ts",
	// Set this to today's date
	"compatibility_date": "2026-07-29",
  "vars": {
    "API_HOST": "https://example.com",
  },
	"secrets_store_secrets": [
		{
			"binding": "API_KEY",
			"store_id": "demo",
			"secret_name": "api-key"
		}
	]
}
```

```toml
name = "my-worker"
main = "./src/index.ts"
# Set this to today's date
compatibility_date = "2026-07-29"

[vars]
API_HOST = "https://example.com"

[[secrets_store_secrets]]
binding = "API_KEY"
store_id = "demo"
secret_name = "api-key"
```

Add secrets to a `.dev.vars.example` or `.env.example` file:


</text>
</result>
<result>
<url>https://developers.cloudflare.com/r2/api/workers/workers-api-usage/</url>
<title>Workers Api Usage</title>
<text>
# Check requests for a pre-shared secret
def has_valid_header(request, env):
  return request.headers.get("X-Custom-Auth-Key") == env.AUTH_KEY_SECRET


def authorize_request(request, env, key):
  if request.method in ["PUT", "DELETE"]:
    return has_valid_header(request, env)
  elif request.method == "GET":
    return key in ALLOW_LIST
  else:
    return False


class Default(WorkerEntrypoint):
  async def fetch(self, request):
    url = urlparse(request.url)
    key = url.path[1:]


    if not authorize_request(request, self.env, key):
      return Response("Forbidden", status=403)


    # ...
```

For this to work, you need to create a secret via Wrangler:

```sh
npx wrangler secret put AUTH_KEY_SECRET
```

This command will prompt you to enter a secret in your terminal:

```sh
npx wrangler secret put AUTH_KEY_SECRET
```

```sh
Enter the secret text you'd like assigned to the variable AUTH_KEY_SECRET on the script named <YOUR_WORKER_NAME>:
*********
🌀  Creating the secret for script name <YOUR_WORKER_NAME>
✨  Success! Uploaded secret AUTH_KEY_SECRET.
```

This secret is now available as `AUTH_KEY_SECRET` on the `env` parameter in your Worker.

## 6\. Deploy your Worker

With your Worker and bucket set up, run the `npx wrangler deploy` [command](/workers/wrangler/commands/general/#deploy) to deploy to Cloudflare's global network:

```sh
npx wrangler deploy
```

You can verify your authorization logic is working through the following commands, using your deployed Worker endpoint:

Warning

When uploading files to R2 via `curl`, ensure you use **[\--data-binary ↗](https://everything.curl.dev/http/post/binary)** instead of `--data` or `-d`. Files will otherwise be truncated.

```sh
# Attempt to write an object without providing the "X-Custom-Auth-Key" header
curl https://your-worker.dev/cat-pic.jpg -X PUT --data-binary 'test'
#=> Forbidden
# Expected because header was missing



</text>
</result>
<result>
<url>https://developers.cloudflare.com/changelog/post/2025-07-01-workers-deploy-button-supports-environment-variables-and-secrets/</url>
<title>2025 07 01 Workers Deploy Button Supports Environment Variables And Secrets</title>
<text>
---
description: Worker environment variables, secrets, and Secrets Store secrets can now be used in Workers templates
title: Deploy to Cloudflare buttons now support Worker environment variables, secrets, and Secrets Store secrets
image: https://developers.cloudflare.com/og-changelog.png
---

[Skip to content](#main-content)

[View RSS feeds](https://developers.cloudflare.com/fundamentals/new-features/available-rss-feeds/)[Subscribe to RSS](/changelog/rss/index.xml)

[Back to all posts](/changelog)

July 29, 2025

## Deploy to Cloudflare buttons now support Worker environment variables, secrets, and Secrets Store secrets

[Workers](/workers/)[Secrets Store](/secrets-store/)

Any template which uses [Worker environment variables](/workers/configuration/environment-variables/), [secrets](/workers/configuration/secrets/), or [Secrets Store secrets](/secrets-store/) can now be deployed using a [Deploy to Cloudflare button](/workers/platform/deploy-buttons/).

Define environment variables and secrets store bindings in your Wrangler configuration file as normal:

```jsonc
{
  "name": "my-worker",
  "main": "./src/index.ts",
	// Set this to today's date
	"compatibility_date": "2026-07-29",
  "vars": {
    "API_HOST": "https://example.com",
  },
	"secrets_store_secrets": [
		{
			"binding": "API_KEY",
			"store_id": "demo",
			"secret_name": "api-key"
		}
	]
}
```

```toml
name = "my-worker"
main = "./src/index.ts"
# Set this to today's date
compatibility_date = "2026-07-29"

[vars]
API_HOST = "https://example.com"

[[secrets_store_secrets]]
binding = "API_KEY"
store_id = "demo"
secret_name = "api-key"
```

Add secrets to a `.dev.vars.example` or `.env.example` file:


</text>
</result>
<result>
<url>https://developers.cloudflare.com/workers/configuration/secrets/</url>
<title>Secrets</title>
<text>
### Adding secrets to your project

#### Via Wrangler

Secrets can be added through [wrangler secret put](/workers/wrangler/commands/general/#secret) or [wrangler versions secret put](/workers/wrangler/commands/general/#versions-secret-put) commands.

`wrangler secret put` creates a new version of the Worker and deploys it immediately.

```sh
npx wrangler secret put <KEY>
```

If using [gradual deployments](/workers/versions-and-deployments/gradual-deployments/), instead use the `wrangler versions secret put` command. This will only create a new version of the Worker, that can then be deploying using [wrangler versions deploy](/workers/wrangler/commands/general/#versions-deploy).

Note

Wrangler versions before 3.73.0 require you to specify a `--x-versions` flag.

```sh
npx wrangler versions secret put <KEY>
```

#### Via the dashboard

To add a secret via the dashboard:

1. In the Cloudflare dashboard, go to the **Workers & Pages** page.  
[ Go to **Workers & Pages** ](https://dash.cloudflare.com/?to=/:account/workers-and-pages)
2. In **Overview**, select your Worker > **Settings**.
3. Under **Variables and Secrets**, select **Add**.
4. Select the type **Secret**, input a **Variable name**, and input its **Value**. This secret will be made available to your Worker but the value will be hidden in Wrangler and the dashboard.
5. (Optional) To add more secrets, select **Add variable**.
6. Select **Deploy** to implement your changes.

#### Upload secrets alongside code


</text>
</result>
<result>
<url>https://developers.cloudflare.com/changelog/post/2025-04-08-deploy-to-cloudflare-button/</url>
<title>2025 04 08 Deploy To Cloudflare Button</title>
<text>
## Deploy a Workers application in seconds with one-click

[Workers](/workers/)

You can now add a [Deploy to Cloudflare](/workers/platform/deploy-buttons/) button to the README of your Git repository containing a Workers application — making it simple for other developers to quickly set up and deploy your project!

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/saas-admin-template)

The Deploy to Cloudflare button:


</text>
</result>
```

---

## Assistant (Coder · GPT-5.6 Terra · 9.8s)

_Thinking:_

**Outlining Cloudflare API token workflow**

**Tool: cloudflare_docs**

**Input:**
```json
{
  "query": "Cloudflare documentation GitHub Actions Wrangler deploy CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID workflow"
}
```

**Output:**
```
<result>
<url>https://developers.cloudflare.com/workers/ci-cd/builds/configuration/</url>
<title>Configuration</title>
<text>
| **[API token](/workers/ci-cd/builds/configuration/#api-token)** _(Optional)_                                          | The API token is used to authenticate your build request and authorize the upload and deployment of your Worker to Cloudflare. By default, Cloudflare will automatically generate an API token for your account when using Workers Builds, and continue to use this API token for all subsequent builds. Alternatively, you can [create your own API token](/workers/wrangler/migration/v1-to-v2/wrangler-legacy/authentication/#generate-tokens), or select one that you already own. |
| **Build variables and secrets** _(Optional)_                                                                          | Add environment variables and secrets accessible only to your build. Build variables will not be accessible at runtime. If you would like to configure runtime variables you can do so in **Settings** \> **Variables & Secrets**                                                                                                                                                                                                                                                      |

Note

Currently, Workers Builds does not honor the configurations set in [Custom Builds](/workers/wrangler/custom-builds/) within your Wrangler configuration file.

### Deploy command

You can run your deploy command using the package manager of your choice.

If you have added a Wrangler deploy command as a script in your `package.json`, then you can run it by setting it as your deploy command. For example, `npm run deploy`.

Examples of other deploy commands you can set include:

| Example Command                        | Description                                                                                                                                                                                                                                                                     |

</text>
</result>
<result>
<url>https://developers.cloudflare.com/changelog/product-group/developer-platform/</url>
<title>Developer Platform</title>
<text>
The API returns a claim URL that lets the user make the temporary account and its resources permanent.

[Cloudflare Drop ↗](https://www.cloudflare.com/drop/) demonstrates this preview-and-claim pattern for static sites. Someone can upload a site, test and share it for one hour, then sign in or create an account only when they want to keep it.

This API expands the flow first introduced with [wrangler deploy --temporary](/changelog/post/2026-06-19-temporary-accounts-for-agents/). Your backend now controls the provisioning and deployment experience directly:

1. Show Cloudflare's Terms of Service and Privacy Policy in your product, and require the user to accept them.
2. Request and solve a proof-of-work challenge.
3. Create a temporary preview account.
4. Deploy with the returned temporary account ID and API token.
5. Show the deployed Worker URL and claim URL to the user.

```bash
curl "https://api.cloudflare.com/client/v4/provisioning/previews/challenge" \
  -X POST \
  -H "Content-Type: application/json" \
  --data '{}'

curl "https://api.cloudflare.com/client/v4/provisioning/previews" \
  -X POST \
  -H "Content-Type: application/json" \
  --data '{
    "termsOfService": "https://www.cloudflare.com/terms/",
    "privacyPolicy": "https://www.cloudflare.com/privacypolicy/",
    "acceptTermsOfService": "yes",
    "challengeToken": "<CHALLENGE_TOKEN>",
    "solution": {
      "checkpoints": "<BASE64_CHECKPOINTS>"
    }
  }'
```


</text>
</result>
<result>
<url>https://developers.cloudflare.com/changelog/2/</url>
<title>2</title>
<text>
The API returns a claim URL that lets the user make the temporary account and its resources permanent.

[Cloudflare Drop ↗](https://www.cloudflare.com/drop/) demonstrates this preview-and-claim pattern for static sites. Someone can upload a site, test and share it for one hour, then sign in or create an account only when they want to keep it.

This API expands the flow first introduced with [wrangler deploy --temporary](/changelog/post/2026-06-19-temporary-accounts-for-agents/). Your backend now controls the provisioning and deployment experience directly:

1. Show Cloudflare's Terms of Service and Privacy Policy in your product, and require the user to accept them.
2. Request and solve a proof-of-work challenge.
3. Create a temporary preview account.
4. Deploy with the returned temporary account ID and API token.
5. Show the deployed Worker URL and claim URL to the user.

```bash
curl "https://api.cloudflare.com/client/v4/provisioning/previews/challenge" \
  -X POST \
  -H "Content-Type: application/json" \
  --data '{}'

curl "https://api.cloudflare.com/client/v4/provisioning/previews" \
  -X POST \
  -H "Content-Type: application/json" \
  --data '{
    "termsOfService": "https://www.cloudflare.com/terms/",
    "privacyPolicy": "https://www.cloudflare.com/privacypolicy/",
    "acceptTermsOfService": "yes",
    "challengeToken": "<CHALLENGE_TOKEN>",
    "solution": {
      "checkpoints": "<BASE64_CHECKPOINTS>"
    }
  }'
```


</text>
</result>
<result>
<url>https://developers.cloudflare.com/changelog/product/workflows/</url>
<title>Workflows</title>
<text>
#### Get started

You can get started with Workflows by [following our get started guide](/workflows/get-started/guide/) and/or using `npm create cloudflare` to pull down the starter project:

```sh
npm create cloudflare@latest workflows-starter -- --template "cloudflare/workflows-starter"
```

You can open the `src/index.ts` file, extend it, and use `wrangler deploy` to deploy your first Workflow. From there, you can:

* Learn the [Workflows API](/workflows/build/workers-api/)
* [Trigger Workflows](/workflows/build/trigger-workflows/) via your Workers apps.
* Understand the [Rules of Workflows](/workflows/build/rules-of-workflows/) and how to adopt best practices

```json
{"@context":"https://schema.org","@type":"BlogPosting","@id":"https://developers.cloudflare.com/changelog/product/workflows/#page","headline":"Workflows Changelog | Cloudflare Docs","url":"https://developers.cloudflare.com/changelog/product/workflows/","inLanguage":"en","image":"https://developers.cloudflare.com/og-changelog.png","publisher":{"@type":"Organization","name":"Cloudflare","url":"https://www.cloudflare.com/"},"isPartOf":{"@type":"WebSite","@id":"https://developers.cloudflare.com/#website","name":"Cloudflare Docs","url":"https://developers.cloudflare.com/"}}
```
</text>
</result>
<result>
<url>https://developers.cloudflare.com/workers/wrangler/system-environment-variables/</url>
<title>System Environment Variables</title>
<text>
## Supported environment variables

Wrangler supports the following environment variables:

* `CLOUDFLARE_ACCOUNT_ID` ` string ` optional

  * The [account ID](/fundamentals/account/find-account-and-zone-ids/) for the Workers related account.
* `CLOUDFLARE_API_TOKEN` ` string ` optional

  * The [API token](/fundamentals/api/get-started/create-token/) for your Cloudflare account, can be used for authentication for situations like CI/CD, and other automation.
* `CLOUDFLARE_API_KEY` ` string ` optional

  * The API key for your Cloudflare account, usually used for older authentication method with `CLOUDFLARE_EMAIL=`.
* `CLOUDFLARE_EMAIL` ` string ` optional

  * The email address associated with your Cloudflare account, usually used for older authentication method with `CLOUDFLARE_API_KEY=`.
* `CLOUDFLARE_ACCESS_CLIENT_ID` ` string ` optional

  * The Client ID of a [Cloudflare Access Service Token](/cloudflare-one/access-controls/service-credentials/service-tokens/), used to authenticate with Access-protected domains in non-interactive environments such as CI/CD pipelines. Must be set together with `CLOUDFLARE_ACCESS_CLIENT_SECRET`. When both variables are set, Wrangler authenticates using the service token instead of launching `cloudflared access login`. For the full Access policy and service token setup, refer to [Connect to Access-protected Workers](/workers/local-development/#connect-to-access-protected-workers).
* `CLOUDFLARE_ACCESS_CLIENT_SECRET` ` string ` optional


</text>
</result>
<result>
<url>https://developers.cloudflare.com/workers/wrangler/</url>
<title>Wrangler</title>
<text>
```json
{"@context":"https://schema.org","@type":"WebPage","@id":"https://developers.cloudflare.com/workers/wrangler/#page","headline":"Wrangler · Cloudflare Workers docs","description":"Wrangler is the CLI for the Cloudflare Developer Platform. Use it to build, test, and deploy Workers projects.","url":"https://developers.cloudflare.com/workers/wrangler/","inLanguage":"en","image":"https://developers.cloudflare.com/dev-products-preview.png","dateModified":"2026-07-03","publisher":{"@type":"Organization","name":"Cloudflare","url":"https://www.cloudflare.com/"},"isPartOf":{"@type":"WebSite","@id":"https://developers.cloudflare.com/#website","name":"Cloudflare Docs","url":"https://developers.cloudflare.com/"}}
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/workers/","name":"Workers"}},{"@type":"ListItem","position":3,"item":{"@id":"/workers/wrangler/","name":"Wrangler"}}]}
```
</text>
</result>
<result>
<url>https://developers.cloudflare.com/workflows/build/trigger-workflows/</url>
<title>Trigger Workflows</title>
<text>
## REST API (HTTP)

Refer to the [Workflows REST API documentation](/api/resources/workflows/subresources/instances/methods/create/).

## Command line (CLI)

Refer to the [CLI quick start](/workflows/get-started/guide/) to learn more about how to manage and trigger Workflows via the command-line.

```json
{"@context":"https://schema.org","@type":"TechArticle","@id":"https://developers.cloudflare.com/workflows/build/trigger-workflows/#page","headline":"Trigger Workflows · Cloudflare Workflows docs","description":"Trigger Workflows from Workers bindings, the REST API, or the Wrangler CLI.","url":"https://developers.cloudflare.com/workflows/build/trigger-workflows/","inLanguage":"en","image":"https://developers.cloudflare.com/dev-products-preview.png","dateModified":"2026-07-13","publisher":{"@type":"Organization","name":"Cloudflare","url":"https://www.cloudflare.com/"},"isPartOf":{"@type":"WebSite","@id":"https://developers.cloudflare.com/#website","name":"Cloudflare Docs","url":"https://developers.cloudflare.com/"},"keywords":["Bindings"]}
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/workflows/","name":"Workflows"}},{"@type":"ListItem","position":3,"item":{"@id":"/workflows/build/","name":"Build with Workflows"}},{"@type":"ListItem","position":4,"item":{"@id":"/workflows/build/trigger-workflows/","name":"Trigger Workflows"}}]}
```
</text>
</result>
<result>
<url>https://developers.cloudflare.com/changelog/post/2025-10-09-workflows-terraform/</url>
<title>2025 10 09 Workflows Terraform</title>
<text>
#### Try it out

* Get started with [the Cloudflare Terraform provider (v5.11.0) ↗](https://registry.terraform.io/providers/cloudflare/cloudflare/5.11.0/docs) and the new [cloudflare\_workflow resource ↗](https://registry.terraform.io/providers/cloudflare/cloudflare/latest/docs/resources/workflow).

```json
{"@context":"https://schema.org","@type":"BlogPosting","@id":"https://developers.cloudflare.com/changelog/post/2025-10-09-workflows-terraform/#page","headline":"You can now deploy and manage Workflows in Terraform · Changelog","description":"You can now deploy and manage Workflows in Terraform, using the Cloudflare Terraform provider v5.11.0.","url":"https://developers.cloudflare.com/changelog/post/2025-10-09-workflows-terraform/","inLanguage":"en","image":"https://developers.cloudflare.com/og-changelog.png","dateModified":"2025-10-09","datePublished":"2025-10-09","publisher":{"@type":"Organization","name":"Cloudflare","url":"https://www.cloudflare.com/"},"isPartOf":{"@type":"WebSite","@id":"https://developers.cloudflare.com/#website","name":"Cloudflare Docs","url":"https://developers.cloudflare.com/"}}
```
</text>
</result>
<result>
<url>https://developers.cloudflare.com/agent-setup/github-copilot/</url>
<title>Github Copilot</title>
<text>
## Tips

* The Cloudflare API MCP server uses Code Mode — Copilot writes JavaScript against a typed API to reach any of 2,500+ endpoints in \~1,000 tokens.
* Use `@workspace` in Copilot Chat to give the agent full context of your Workers project before asking it to build or deploy.
* Commit a `.github/copilot-instructions.md` file with repository-wide conventions — Copilot loads it automatically on every interaction, complementing Skills which are loaded on demand.

## FAQ

Does Copilot support Cloudflare Skills?

Yes. GitHub Copilot added Agent Skills support for VS Code agent mode, the Copilot CLI, and the cloud agent. Run `npx skills add https://github.com/cloudflare/skills` to install them. Refer to the [About agent skills ↗](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills)guide for details on where Copilot looks for Skills.

Should I use Skills, the MCP server, Wrangler CLI, or all of them?

All three. Skills load Cloudflare expertise into every agent-mode session. The Cloudflare API MCP server handles platform operations (DNS, WAF, Zero Trust, R2 buckets). Wrangler runs local dev and deploys in the VS Code terminal. The bundled `wrangler` Skill teaches Copilot when to reach for which.

Do I still need .github/copilot-instructions.md?

It's complementary. Use custom instructions for simple repository-wide conventions that apply to almost every task (coding standards, preferred libraries). Use Skills for detailed, situational guidance Copilot should only load when relevant.

Can Copilot deploy to Cloudflare directly?

Yes, via Wrangler in the VS Code terminal, or via a GitHub Actions workflow that Copilot can generate for you.

## Troubleshooting

Skills do not load in Copilot


</text>
</result>
<result>
<url>https://developers.cloudflare.com/d1/tutorials/build-an-api-to-access-d1/</url>
<title>Build An Api To Access D1</title>
<text>
## 11\. Deploy the API

Now that everything is working as expected, the last step is to deploy it to the Cloudflare network. You will use Wrangler to deploy the API.

1. To use the API in production instead of using it locally, you need to add the table to your remote (production) database. To add the table to your production database, run the following command:  
```  
npx wrangler d1 execute d1-http-example --file=./schemas/schema.sql --remote  
```  
You should now be able to view the table on the [Cloudflare dashboard > **Storage & Databases** \> **D1**. ↗](https://dash.cloudflare.com/?to=/:account/workers/d1/)
2. To deploy the application to the Cloudflare network, run the following command:  
```  
npx wrangler deploy  
```  
```  
 ⛅️ wrangler 3.78.4 (update available 3.78.5)-------------------------------------------------------  
Total Upload: 53.00 KiB / gzip: 13.16 KiBYour worker has access to the following bindings:- D1 Databases:  - DB: d1-http-example (DATABASE_ID)Uploaded d1-http (4.29 sec)Deployed d1-http triggers (5.57 sec)  [DEPLOYED_APP_LINK]Current Version ID: [BINDING_ID]  
```  
Upon successful deployment, you will get the link of the deployed app in the terminal (`DEPLOYED_APP_LINK`). Make a note of it.
3. Generate a new API key to use in production.  
Terminal window  
```  
openssl rand -base64 32  
```  
```  
[YOUR_API_KEY]  
```
4. Execute the `wrangler secret put` command to add an API to the deployed project.  
```  
npx wrangler secret put API_KEY  
```  
```  
✔ Enter a secret value:  
```  
The terminal will prompt you to enter a secret value.
5. Enter the value of your API key (`YOUR_API_KEY`). Your API key will now be added to your project. Using this value you can make secure API calls to your deployed API.
</text>
</result>
```

---

## Assistant (Coder · GPT-5.6 Terra · 13.9s)

Yes—GitHub Actions can deploy automatically **without putting the OpenAI key in GitHub**.

## 1. Keep secrets in the right places

| Secret | Store it in |
|---|---|
| `OPENAI_API_KEY` | Cloudflare Worker secret only |
| `CLOUDFLARE_API_TOKEN` | GitHub Environment secret |
| `CLOUDFLARE_ACCOUNT_ID` | GitHub Environment variable or secret |

Remove `OPENAI_API_KEY` from GitHub. Set it once in Cloudflare:

```bash
bunx wrangler secret put OPENAI_API_KEY
```

This is a runtime Worker secret; CI does not need its value.

## 2. Create a least-privilege Cloudflare API token

In Cloudflare: **My Profile → API Tokens → Create Token**.

Create a token that can deploy the Worker. At minimum it needs:

- **Account → Workers Scripts → Edit**
- **Account → Account Settings → Read**
- If deploying to a custom domain: **Zone → Workers Routes → Edit** for that zone
- Add edit permissions for any bindings you later deploy (for example D1, KV, or R2).

Copy it once.

## 3. Add GitHub Environment values

In GitHub: **Repository → Settings → Environments → New environment**: `production`.

Add:

- Secret: `CLOUDFLARE_API_TOKEN`
- Variable (or secret): `CLOUDFLARE_ACCOUNT_ID`

Protect this environment with required reviewers if this is a production site.

## 4. Add `.github/workflows/deploy.yml`

This workflow validates the project, then deploys only when `main` is updated:

```yaml
name: Deploy to Cloudflare

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Build
        run: bun run build

      - name: Deploy Worker
        run: bunx wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
```

This requires the repository to have its Worker entry and `wrangler.jsonc` configured first. Do **not** add `OPENAI_API_KEY` to the workflow or its build environment.

---

