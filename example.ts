import { Authon } from './authon';
import * as readline from 'readline';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q: string): Promise<string> => new Promise((r) => rl.question(q, r));

const auth = new Authon('your-app-id', 'your-api-key');

async function main() {
  if (!await auth.init()) { console.log('[-] Connection failed'); process.exit(1); }
  console.log(`[+] Connected: ${auth.appName} v${auth.appVersion}`);

  console.log('\n[1] Login\n[2] License Key');
  const choice = await ask('\n> ');

  const result = choice === '1'
    ? await auth.login(await ask('Username: '), await ask('Password: '))
    : await auth.license(await ask('License Key: '));

  if (!result.success) { console.log(`\n[-] ${result.message}`); process.exit(1); }

  console.log(`\n[+] Authenticated! Level: ${auth.level}, Sub: ${auth.subscription ?? 'None'}`);

  const msg = await auth.getVar('welcome_message');
  if (msg) console.log(`[*] ${msg}`);

  await auth.log('TypeScript SDK example executed');
  await auth.logout();
  console.log('[+] Done.');
  rl.close();
}

main();
