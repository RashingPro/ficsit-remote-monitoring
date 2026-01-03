# Ficsit Remote Monitoring

<div align="center">
    <img src="https://img.shields.io/github/actions/workflow/status/RashingPro/ficsit-remote-monitoring/push-verification.yaml?label=tests" alt="tests workflow status badge"/>
    <a href="https://www.npmjs.com/package/ficsit-remote-monitoring/">
        <img src="https://img.shields.io/npm/dw/ficsit-remote-monitoring?label=npm%20downloads&color=cc3838" alt="npm downloads count badge"/>
    </a>
    <a href="https://www.npmjs.com/package/ficsit-remote-monitoring/">
        <img src="https://img.shields.io/npm/v/ficsit-remote-monitoring/latest" alt="npm latest version badge"/>
    </a>
    <a href="https://www.codefactor.io/repository/github/rashingpro/ficsit-remote-monitoring">
        <img src="https://www.codefactor.io/repository/github/rashingpro/ficsit-remote-monitoring/badge" alt="CodeFactor badge"/>
    </a>
</div>

> [!NOTE]
> Developers of mod Ficsit Remote Monitoring in no way connected to this project. Don't ask them about anything related to this

## Info

This package provides a well-typed Node.js interface for Satisfactory's mod called [Ficsit Remote Monitoring](https://ficsit.app/mod/FicsitRemoteMonitoring) with schema validation.

## Using

### Installation

```shell
npm i ficsit-remote-monitoring
```

### Using

```typescript
import FicsitRemoteMonitoring from "ficsit-remote-monitoring";

async function main() {
    const frm = new FicsitRemoteMonitoring(8080, "my token goes here");
    console.log(await frm.ping());

    const factory = (await frm.getFactory())[0];
    await frm.setEnabled({
        id: res.id,
        status: res.isPaused
    });
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
