# Ficsit Remote Monitoring

> [!NOTE]
> Developers of mod Ficsit Remote Monitoring in no way connected to this project. Don't ask them about anything related to this

## Info

This package is a Node.js interface for Satisfactory's mod called [Ficsit Remote Monitoring](https://ficsit.app/mod/FicsitRemoteMonitoring). There are also TypeScript types included.

## Using

### Installation

```shell
npm i ficsit-remote-monitoring
```

### Using

```typescript
import FicsitRemoteMonitoring from "ficsit-remote-monitoring";

async function main() {
    const frm = new FicsitRemoteMonitoring();
    console.log(await frm.ping());
}

main();
```

## Developing progress

Implemented methods:

- `createPing`
- `setEnabled`
- `setSwitches`
- `getChatMessages`
- `sendChatMessage`
- `getSessionInfo`
- `getPlayers`
- `getFactory`
- `getAssemblers`
- `getBlenders`
- `getConstructors`
- `getParticleAccelerators`
- `getConverters`
- `getFoundries`
- `getManufacturers`
- `getPackagers`
- `getRefineries`
- `getSmelters`
- `getSwitches`
