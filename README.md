# CraftPulse ⛏️

A modern, native Windows desktop application to host, configure, and manage Minecraft servers with ease — featuring direct dual-stack IPv6 hosting, visual toggles, Modrinth mod hub, and embedded peer-to-peer multi-host world syncing.

---

## 🌟 Key Features

1. **Visual Toggles & Configuration Dashboard**:
   - Complete visual controls for `server.properties`: Gamemode, Difficulty, Hardcore, PvP, Whitelist, Command Blocks, Nether, Structures.
   - Dual-sliders for JVM heap memory (`-Xms` and `-Xmx`), chunk view distance, and simulation distance.
   - Live formatted in-game preview for the Server MOTD with Minecraft color codes (`§` or `&`).
   - World seed input with instant randomizer.

2. **Direct Dual-Stack IPv6 Hosting (Zero Third-Party Relays)**:
   - Native dual-stack socket binding (`-Djava.net.preferIPv4Stack=false -Djava.net.preferIPv6Addresses=system`).
   - Bypasses router CGNAT restrictions naturally — friends connect directly PC-to-PC via bracketed format (`[IPv6]:25565`) without port forwarding.
   - Built-in backup tunnel option for friends on legacy IPv4-only networks.

3. **Co-op Multi-Host World Sync (Option B Embedded P2P)**:
   - Zero-account, peer-to-peer world synchronization between friends.
   - 1-Click invite code (`CP-SYNC-...`) containing direct IP, cryptographic device ID, and auth token.
   - Automatic 3-minute lease **Host Lock** with 20s heartbeat preventing conflicting world saves.
   - SHA-256 delta world manifest generator: syncs only changed chunk files when friends take over hosting.

4. **Mod & Plugin Hub (Modrinth API)**:
   - Search and discover mods directly from the **Modrinth API v2**, automatically filtered by your server loader (Paper, Fabric, Forge, NeoForge) and Minecraft version.
   - 1-Click installation into the server's `mods/` or `plugins/` folder.
   - **On/Off Mod Toggles**: Enable or disable mods with a single switch (renames `.jar` $\leftrightarrow$ `.jar.disabled`) without deleting files.

5. **Beginner-Friendly In-App User Guide**:
   - Built-in visual guide explaining all features in plain English with zero confusing technical jargon.
   - Step-by-step instructions for quick start, inviting friends, co-op hosting, console OP commands, and Windows Firewall setup.

6. **Live Terminal & Console**:
   - Embedded `@xterm/xterm` bidirectional terminal connected to `java.exe` stdin/stdout.
   - Preset quick command triggers (`/op`, `/whitelist add`, `/time set day`, `/weather clear`, `/gamemode creative`, `/stop`).

7. **Windows-Native Process & Java Auto-Discovery**:
   - Automated Java runtime discovery across Windows Registry (`HKLM\SOFTWARE\JavaSoft`), `JAVA_HOME`, and `Program Files`.
   - Validates Java 17 and Java 21 class file requirements for Minecraft 1.18 through 1.21+.
   - Clean shutdown with graceful `stop\r\n` and guaranteed orphan prevention via `taskkill /pid <PID> /T /F`.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- Java 17 (for MC 1.18-1.20.4) or Java 21 (for MC 1.20.5 and 1.21+)

### Development Mode
```bash
# Install dependencies
npm install

# Run both the Vite renderer and Electron main process in live reload
npm run dev
```

### Production Build for Windows (.exe)
```bash
# Compiles TypeScript, builds Vite bundles, and creates the portable Windows executable:
npm run build
```
The output portable executable will be generated in `release/CraftPulse 1.0.0.exe`.

---

## 📂 Project Architecture

```
craftpulse/
├── electron/
│   ├── main.ts                     # Window lifecycle, IPC handlers, system tray
│   ├── preload.ts                  # Typed security bridge (window.craftPulseAPI)
│   └── services/
│       ├── processManager.ts       # Java spawner, dual-stack JVM flags, taskkill
│       ├── propertiesParser.ts     # Bi-directional server.properties parser
│       ├── modrinthService.ts      # Modrinth search, 1-click download, .disabled toggle
│       ├── javaDiscovery.ts        # Windows Registry, PATH, Adoptium scanner
│       ├── jarDownloader.ts        # Official PaperMC, Fabric, Vanilla JAR downloader
│       ├── versionService.ts       # Live release manifest fetcher (1.21.x+)
│       ├── networkDiscovery.ts     # Dual-stack IPv6 and LAN address discovery
│       ├── p2pSyncService.ts       # Embedded P2P daemon, SHA-256 delta sync, host lock
│       └── tunnelService.ts        # Optional backup multiplayer tunnel
├── src/
│   ├── components/
│   │   ├── Sidebar.tsx             # Server selector, co-op badges, navigation
│   │   ├── Dashboard.tsx           # Status, RAM allocation, IPv6 hero card, host lock
│   │   ├── ConfigToggles.tsx       # Gameplay, world, security toggles & MOTD preview
│   │   ├── ModHub.tsx              # Modrinth search & installed mod toggler
│   │   ├── TerminalConsole.tsx     # Embedded xterm console & command bar
│   │   ├── CreateServerModal.tsx   # Server wizard with live version manifests
│   │   ├── SharedServerModal.tsx   # P2P multi-host share & join modal (Option B)
│   │   └── UserGuide.tsx           # Plain-English user guide & feature tour
│   ├── types/
│   │   ├── server.ts               # Server, mod, lock, and peer definitions
│   │   └── electron.d.ts           # Global IPC window typings
│   ├── App.tsx                     # Main layout, tab router, modal orchestration
│   ├── main.tsx                    # React DOM entry
│   └── index.css                   # Custom scrollbars and styling
├── package.json
└── vite.config.ts
```
