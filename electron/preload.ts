import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('craftPulseAPI', {
  // Server Management
  getServers: () => ipcRenderer.invoke('server:getAll'),
  createServer: (data: any) => ipcRenderer.invoke('server:create', data),
  deleteServer: (id: string) => ipcRenderer.invoke('server:delete', id),
  startServer: (id: string) => ipcRenderer.invoke('server:start', id),
  stopServer: (id: string, force?: boolean) => ipcRenderer.invoke('server:stop', id, force),
  
  // Console & Terminal
  sendCommand: (serverId: string, command: string) => ipcRenderer.invoke('server:sendCommand', serverId, command),
  onConsoleLog: (callback: (event: any) => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('server:log', handler);
    return () => ipcRenderer.removeListener('server:log', handler);
  },
  onStatusChange: (callback: (event: any) => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('server:status', handler);
    return () => ipcRenderer.removeListener('server:status', handler);
  },

  // Configuration Properties
  getProperties: (serverId: string) => ipcRenderer.invoke('properties:get', serverId),
  saveProperties: (serverId: string, properties: any) => ipcRenderer.invoke('properties:save', serverId, properties),

  // Mod Hub & Modrinth
  searchModrinth: (query: string, loader: string, mcVersion: string) => 
    ipcRenderer.invoke('modrinth:search', query, loader, mcVersion),
  getInstalledMods: (serverId: string) => ipcRenderer.invoke('mods:getInstalled', serverId),
  toggleMod: (serverId: string, filename: string) => ipcRenderer.invoke('mods:toggle', serverId, filename),
  deleteMod: (serverId: string, filename: string) => ipcRenderer.invoke('mods:delete', serverId, filename),
  installMod: (serverId: string, projectId: string, loader: string, mcVersion: string) =>
    ipcRenderer.invoke('mods:install', serverId, projectId, loader, mcVersion),

  // Windows System & Java
  getJavaInstallations: () => ipcRenderer.invoke('system:getJava'),
  getVersions: (loader: string) => ipcRenderer.invoke('versions:get', loader),
  toggleTunnel: (serverId: string, enabled: boolean) => ipcRenderer.invoke('server:toggleTunnel', serverId, enabled),
  getNetworkAddresses: () => ipcRenderer.invoke('network:getAddresses'),
  onTunnelUpdate: (callback: (event: any) => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('server:tunnelUpdated', handler);
    return () => ipcRenderer.removeListener('server:tunnelUpdated', handler);
  },

  // P2P Shared Multi-Host Sync
  getDeviceIdentity: () => ipcRenderer.invoke('p2p:getIdentity'),
  createShareCode: (serverId: string, hostAddress: string) => ipcRenderer.invoke('p2p:createShareCode', serverId, hostAddress),
  joinSharedServer: (inviteCode: string) => ipcRenderer.invoke('p2p:joinSharedServer', inviteCode),
  getSharedLockState: (serverId: string) => ipcRenderer.invoke('p2p:getLockState', serverId),
  takeoverHost: (serverId: string) => ipcRenderer.invoke('p2p:takeoverHost', serverId),
  syncSharedServer: (serverId: string) => ipcRenderer.invoke('p2p:syncNow', serverId),
  onLockChange: (callback: (data: any) => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('p2p:lockChanged', handler);
    return () => ipcRenderer.removeListener('p2p:lockChanged', handler);
  },
  onSyncStatus: (callback: (data: any) => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('p2p:syncStatus', handler);
    return () => ipcRenderer.removeListener('p2p:syncStatus', handler);
  }
});
