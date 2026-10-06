const { spawn } = require('child_process');

const child = spawn('npx', ['eas-cli', 'credentials', '-p', 'ios'], {
  cwd: '/Users/guilhermesilva/.gemini/antigravity/scratch/appclienteprovedor',
  env: { ...process.env, APP_PROVIDER: 'webconnect' },
  stdio: ['pipe', 'pipe', 'pipe']
});

child.stdout.on('data', (data) => {
  const str = data.toString();
  process.stdout.write(str);
  
  if (str.includes('Which build profile')) {
    // Select production:webconnect (arrow down 4 times)
    child.stdin.write('\u001b[B\u001b[B\u001b[B\u001b[B\r');
  } else if (str.includes('log in to your Apple account')) {
    child.stdin.write('n\r');
  } else if (str.includes('What do you want to do')) {
    console.log('\n[Action Needed in Credentials Menu]\n');
  }
});

child.stderr.on('data', (data) => {
  process.stderr.write(data.toString());
});

child.on('exit', (code) => {
  console.log(`\nExited with code: ${code}`);
  process.exit(code);
});
