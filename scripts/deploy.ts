const stage = Bun.argv[2];

if (stage !== 'development' && stage !== 'production') {
  console.error('Usage: bun scripts/deploy.ts <development|production>');
  process.exit(1);
}

const environmentId = Bun.env.OP_ENVIRONMENT_ID;
if (!environmentId) {
  console.error('OP_ENVIRONMENT_ID must be set to the matching 1Password Environment ID.');
  process.exit(1);
}

if (Bun.env.OP_SERVICE_ACCOUNT_TOKEN) {
  console.error('Service accounts are not supported. Use 1Password desktop app integration.');
  process.exit(1);
}

const run = (command: string[], output = 'inherit') => Bun.spawnSync(command, {
  stderr: output,
  stdout: output,
});

if (run(['op', 'environment', 'read', '--help'], 'ignore').exitCode !== 0) {
  console.error('A 1Password CLI beta build with the environment command is required. Install the latest beta, ensure it is first on PATH, and enable desktop app integration.');
  process.exit(1);
}

if (run(['op', 'whoami'], 'ignore').exitCode !== 0) {
  console.error('1Password CLI authentication failed. Unlock the 1Password desktop app and enable CLI integration.');
  process.exit(1);
}

if (run(['bun', 'run', 'build']).exitCode !== 0) process.exit(1);

const temporaryFile = run(['mktemp', `${Bun.env.TMPDIR ?? '/tmp'}/chatgpt-secrets.XXXXXX`], 'pipe');
if (temporaryFile.exitCode !== 0) {
  console.error('Could not create a temporary secrets file.');
  process.exit(1);
}

const secretsFile = new TextDecoder().decode(temporaryFile.stdout).trim();
const cleanup = () => {
  if (secretsFile) run(['rm', '-f', secretsFile], 'ignore');
};

process.on('SIGINT', () => {
  cleanup();
  process.exit(130);
});
process.on('SIGTERM', () => {
  cleanup();
  process.exit(143);
});

try {
  if (run(['chmod', '600', secretsFile], 'ignore').exitCode !== 0) {
    console.error('Could not secure the temporary secrets file.');
    process.exit(1);
  }

  const environment = run(['op', 'environment', 'read', environmentId], 'pipe');
  if (environment.exitCode !== 0) {
    console.error('Could not read the 1Password Environment.');
    process.exit(1);
  }

  await Bun.write(secretsFile, environment.stdout);
  process.exitCode = run(['bunx', '--bun', 'wrangler', 'deploy', '--env', stage, '--secrets-file', secretsFile]).exitCode;
} finally {
  cleanup();
}
