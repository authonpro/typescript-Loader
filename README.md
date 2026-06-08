# Authon TypeScript SDK

<p align="center">
  <img src="https://authon.pro/logo.png" alt="Authon" width="80" />
  <br/>
  <strong>Official TypeScript SDK for Authon — Software Licensing & Authentication Platform</strong>
</p>

<p align="center">
  <a href="https://authon.pro">Website</a> •
  <a href="https://authon.pro/docs">Docs</a> •
  <a href="https://discord.gg/jMZCTKPsmE">Discord</a> •
  <a href="https://authon.pro/status">Status</a>
</p>

---

## Requirements

- Node.js 18+ / Deno / Bun
- Full TypeScript type safety

## Installation

```bash
# Copy authon.ts into your project, or:
npx tsx example.ts
```

## Quick Start

```typescript
import { Authon } from './authon';

const auth = new Authon('your-app-id', 'your-api-key');
await auth.init();

const result = await auth.login('username', 'password');
if (result.success) {
  console.log(`Level: ${auth.level}`);
  console.log(`Subscription: ${auth.subscription}`);
}
await auth.logout();
```

## Run Example

```bash
npx tsx example.ts
# or
deno run --allow-net example.ts
# or
bun run example.ts
```

## Links

- 🌐 Website: https://authon.pro
- 📖 Docs: https://authon.pro/docs
- 💬 Discord: https://discord.gg/jMZCTKPsmE
- 📊 Status: https://authon.pro/status
- 🔗 API Health: https://api.authon.pro/health

## License

MIT
