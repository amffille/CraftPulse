import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron';
import path from 'path';
import fs from 'fs';
import { ServerProcessManager } from './services/processManager';
import { PropertiesParser } from './services/propertiesParser';
import { ModrinthService } from './services/modrinthService';
import { JavaDiscoveryService } from './services/javaDiscovery';
import { TunnelService } from './services/tunnelService';
import { ServerInstance } from '../src/types/server';
import { JarDownloaderService } from './services/jarDownloader';
import { NetworkDiscoveryService } from './services/networkDiscovery';
import { VersionService } from './services/versionService';
import { P2PSyncService } from './services/p2pSyncService';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;
app.on('before-quit', () => { isQuitting = true; });

const processManager = new ServerProcessManager();
const tunnelService = new TunnelService();

// Local metadata storage file
const userDataPath = app.getPath('userData');
const serversDataFile = path.join(userDataPath, 'servers.json');
const p2pSyncService = new P2PSyncService(userDataPath);

function loadServers(): ServerInstance[] {
  try {
    if (fs.existsSync(serversDataFile)) {
      return JSON.parse(fs.readFileSync(serversDataFile, 'utf-8'));
    }
  } catch (err) {
    console.error('Failed to load servers.json:', err);
  }

  // Initial demo/default server if empty
  const defaultDir = path.join(userDataPath, 'servers', 'default-server');
  fs.mkdirSync(defaultDir, { recursive: true });

  const defaultServer: ServerInstance = {
    id: 'server-1',
    name: 'Survival SMP',
    loader: 'paper',
    mcVersion: '1.20.4',
    path: defaultDir,
    minRamGb: 2,
    maxRamGb: 4,
    tunnelEnabled: false,
    tunnelAddress: undefined,
    status: 'STOPPED',
    autoRestart: true,
    createdAt: new Date().toISOString()
  };

  saveServers([defaultServer]);
  return [defaultServer];
}

function saveServers(servers: ServerInstance[]): void {
  try {
    fs.mkdirSync(path.dirname(serversDataFile), { recursive: true });
    fs.writeFileSync(serversDataFile, JSON.stringify(servers, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save servers.json:', err);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#121417',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('close', (event) => {
    // If running in production with active servers, minimize to tray
    const servers = loadServers();
    const hasRunningServer = servers.some(s => processManager.getStatus(s.id) === 'RUNNING');
    if (hasRunningServer && !isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  // Forward process manager events to renderer
  processManager.on('log', (data) => {
    mainWindow?.webContents.send('server:log', data);
  });

  processManager.on('status-change', (data) => {
    mainWindow?.webContents.send('server:status', data);
  });

  tunnelService.on('tunnel-started', (data) => {
    mainWindow?.webContents.send('server:tunnelUpdated', data);
  });

  tunnelService.on('tunnel-stopped', (data) => {
    mainWindow?.webContents.send('server:tunnelUpdated', { serverId: data.serverId, address: null });
  });

  p2pSyncService.on('lock-changed', (data) => {
    mainWindow?.webContents.send('p2p:lockChanged', data);
  });

  p2pSyncService.on('sync-status', (data) => {
    mainWindow?.webContents.send('p2p:syncStatus', data);
  });

  // Setup IPC Handlers
  ipcMain.handle('server:getAll', () => {
    const servers = loadServers();
    return servers.map(s => ({
      ...s,
      status: processManager.getStatus(s.id),
      tunnelAddress: tunnelService.getTunnelAddress(s.id) || undefined
    }));
  });

  ipcMain.handle('server:create', async (_, data) => {
    const servers = loadServers();
    const id = `server-${Date.now()}`;
    const serverDir = path.join(userDataPath, 'servers', id);
    fs.mkdirSync(serverDir, { recursive: true });

    // Generate initial server.properties
    PropertiesParser.save(path.join(serverDir, 'server.properties'), {
      motd: `${data.name} - Hosted with CraftPulse`
    });

    const newServer: ServerInstance = {
      id,
      name: data.name,
      loader: data.loader,
      mcVersion: data.mcVersion,
      path: serverDir,
      minRamGb: data.minRamGb || 2,
      maxRamGb: data.maxRamGb || 4,
      tunnelEnabled: false,
      status: 'STOPPED',
      autoRestart: true,
      createdAt: new Date().toISOString()
    };

    servers.push(newServer);
    saveServers(servers);
    return newServer;
  });

  ipcMain.handle('server:delete', (_, id) => {
    const servers = loadServers().filter(s => s.id !== id);
    saveServers(servers);
    return true;
  });

  ipcMain.handle('server:start', async (_, id) => {
    const servers = loadServers();
    const server = servers.find(s => s.id === id);
    if (!server) return false;

    // Check shared host lock
    const lock = p2pSyncService.getLockState(id);
    if (lock.isLocked && !lock.isSelfHosting) {
      mainWindow?.webContents.send('server:status', { serverId: id, status: 'STOPPED' });
      mainWindow?.webContents.send('server:log', {
        serverId: id,
        type: 'system',
        data: `[CraftPulse] Cannot start server: Currently locked and hosted by ${lock.activeHostName || 'another friend'}.\r\n`
      });
      return false;
    }

    const jarName = 'server.jar';

    // 1. Download official server JAR if missing or invalid
    const ensureResult = await JarDownloaderService.ensureJar(
      server.path,
      server.loader,
      server.mcVersion,
      (logMessage) => {
        mainWindow?.webContents.send('server:log', {
          serverId: id,
          type: 'system',
          data: logMessage
        });
      }
    );

    if (!ensureResult.success) {
      mainWindow?.webContents.send('server:status', { serverId: id, status: 'CRASHED' });
      mainWindow?.webContents.send('server:log', {
        serverId: id,
        type: 'system',
        data: `[CraftPulse] Startup aborted: Could not obtain a valid server JAR: ${ensureResult.error}\r\n`
      });
      return false;
    }

    // 2. Resolve Java Runtime compatible with Minecraft version
    const javaResolution = await JavaDiscoveryService.resolveBestJava(server.mcVersion, server.javaPath);
    if (!javaResolution.meetsRequirement) {
      mainWindow?.webContents.send('server:status', { serverId: id, status: 'CRASHED' });
      mainWindow?.webContents.send('server:log', {
        serverId: id,
        type: 'system',
        data: `\x1b[31m[CraftPulse] ERROR: Incompatible Java runtime detected!\x1b[0m\r\n` +
              `[CraftPulse] Minecraft ${server.mcVersion} requires Java ${javaResolution.requiredVersion} or higher.\r\n` +
              `[CraftPulse] Your system is currently using Java ${javaResolution.majorVersion || 'Unknown'} (${javaResolution.path})\r\n` +
              `\x1b[33m[CraftPulse] Solution: Please download & install Java ${javaResolution.requiredVersion} (or Java 21) from:\x1b[0m\r\n` +
              `https://adoptium.net/temurin/releases/?version=${javaResolution.requiredVersion}\r\n`
      });
      return false;
    }

    mainWindow?.webContents.send('server:log', {
      serverId: id,
      type: 'system',
      data: `[CraftPulse] Using Java ${javaResolution.majorVersion} (${javaResolution.path})\r\n`
    });

    // 3. Start tunnel if enabled
    if (server.tunnelEnabled) {
      await tunnelService.startTunnel(id, 25565);
    }

    // 4. Launch the Java process and start P2P host heartbeat
    const netAddrs = NetworkDiscoveryService.getLocalAddresses();
    const myHostAddr = netAddrs.globalIpv6 ? `[${netAddrs.globalIpv6}]:25565` : `${netAddrs.lanIpv4}:25565`;
    p2pSyncService.startHeartbeat(id, myHostAddr);

    return processManager.startServer(
      id,
      server.path,
      jarName,
      server.minRamGb,
      server.maxRamGb,
      javaResolution.path
    );
  });

  ipcMain.handle('server:stop', (_, id, force) => {
    tunnelService.stopTunnel(id);
    p2pSyncService.stopHeartbeat(id);
    return processManager.stopServer(id, force);
  });

  ipcMain.handle('server:sendCommand', (_, id, cmd) => {
    return processManager.sendCommand(id, cmd);
  });

  ipcMain.handle('properties:get', (_, id) => {
    const servers = loadServers();
    const server = servers.find(s => s.id === id);
    if (!server) return {};
    return PropertiesParser.parse(path.join(server.path, 'server.properties'));
  });

  ipcMain.handle('properties:save', (_, id, properties) => {
    const servers = loadServers();
    const server = servers.find(s => s.id === id);
    if (!server) return false;
    PropertiesParser.save(path.join(server.path, 'server.properties'), properties);
    return true;
  });

  ipcMain.handle('modrinth:search', (_, query, loader, mcVersion) => {
    return ModrinthService.searchMods(query, loader, mcVersion);
  });

  ipcMain.handle('mods:getInstalled', (_, id) => {
    const servers = loadServers();
    const server = servers.find(s => s.id === id);
    if (!server) return [];
    return ModrinthService.listInstalledMods(server.path);
  });

  ipcMain.handle('mods:toggle', (_, id, filename) => {
    const servers = loadServers();
    const server = servers.find(s => s.id === id);
    if (!server) return { success: false, error: 'Server not found' };
    return ModrinthService.toggleMod(server.path, filename);
  });

  ipcMain.handle('mods:delete', (_, id, filename) => {
    const servers = loadServers();
    const server = servers.find(s => s.id === id);
    if (!server) return false;
    return ModrinthService.deleteMod(server.path, filename);
  });

  ipcMain.handle('mods:install', (_, id, projectId, loader, mcVersion) => {
    const servers = loadServers();
    const server = servers.find(s => s.id === id);
    if (!server) return { success: false, error: 'Server not found' };
    return ModrinthService.installMod(server.path, projectId, loader, mcVersion);
  });

  ipcMain.handle('system:getJava', () => {
    return JavaDiscoveryService.findJavaInstallations();
  });

  ipcMain.handle('server:toggleTunnel', async (_, id, enabled) => {
    if (enabled) {
      const res = await tunnelService.startTunnel(id);
      return { enabled: true, address: res.address };
    } else {
      tunnelService.stopTunnel(id);
      return { enabled: false };
    }
  });

  ipcMain.handle('network:getAddresses', () => {
    return NetworkDiscoveryService.getAllAddresses();
  });

  ipcMain.handle('versions:get', (_, loader) => {
    return VersionService.getVersions(loader);
  });

  // P2P Shared Multi-Host Sync Handlers
  ipcMain.handle('p2p:getIdentity', () => {
    return p2pSyncService.getIdentity();
  });

  ipcMain.handle('p2p:createShareCode', (_, serverId, hostAddress) => {
    const servers = loadServers();
    const server = servers.find(s => s.id === serverId);
    if (!server) throw new Error('Server not found');

    const net = NetworkDiscoveryService.getLocalAddresses();
    const bestHost = hostAddress || (net.globalIpv6 ? `[${net.globalIpv6}]` : net.lanIpv4);
    const inviteCode = p2pSyncService.generateInviteCode(serverId, server.name, bestHost);
    
    server.isShared = true;
    saveServers(servers);

    return { inviteCode, token: serverId };
  });

  ipcMain.handle('p2p:joinSharedServer', async (_, inviteCode) => {
    const parsed = p2pSyncService.parseInviteCode(inviteCode);
    const servers = loadServers();
    
    // Check if server already exists
    let server = servers.find(s => s.id === parsed.serverId);
    if (!server) {
      const serverDir = path.join(userDataPath, 'servers', parsed.serverId);
      fs.mkdirSync(serverDir, { recursive: true });

      server = {
        id: parsed.serverId,
        name: parsed.name,
        loader: 'paper',
        mcVersion: '1.21.4',
        path: serverDir,
        minRamGb: 2,
        maxRamGb: 4,
        tunnelEnabled: false,
        status: 'STOPPED',
        autoRestart: true,
        createdAt: new Date().toISOString(),
        isShared: true,
        syncToken: parsed.token
      };

      servers.push(server);
      saveServers(servers);
    }

    p2pSyncService.registerSharedServer(parsed.serverId, parsed.token);

    // Initial sync from peer
    if (parsed.peer && parsed.port) {
      p2pSyncService.syncFromPeer(parsed.serverId, parsed.peer, parsed.port, parsed.token).catch(e => {
        console.warn('Initial P2P sync deferred:', e.message);
      });
    }

    return server;
  });

  ipcMain.handle('p2p:getLockState', (_, serverId) => {
    return p2pSyncService.getLockState(serverId);
  });

  ipcMain.handle('p2p:takeoverHost', (_, serverId) => {
    const ident = p2pSyncService.getIdentity();
    const net = NetworkDiscoveryService.getLocalAddresses();
    const myHostAddr = net.globalIpv6 ? `[${net.globalIpv6}]:25565` : `${net.lanIpv4}:25565`;
    return p2pSyncService.claimLock(serverId, ident.deviceId, ident.deviceName, myHostAddr);
  });

  ipcMain.handle('p2p:syncNow', async (_, serverId) => {
    const servers = loadServers();
    const server = servers.find(s => s.id === serverId);
    if (!server || !server.syncToken) return { success: false, updatedFiles: 0 };
    return { success: true, updatedFiles: 0 };
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
