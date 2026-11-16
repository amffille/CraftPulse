import { ServerInstance, ServerProperties, ModItem, ModrinthSearchResult, ProcessLogEvent, HostLockState } from './server';

export interface CraftPulseAPI {
  getServers: () => Promise<ServerInstance[]>;
  createServer: (data: any) => Promise<ServerInstance>;
  deleteServer: (id: string) => Promise<boolean>;
  startServer: (id: string) => Promise<boolean>;
  stopServer: (id: string, force?: boolean) => Promise<boolean>;
  sendCommand: (serverId: string, command: string) => Promise<boolean>;
  onConsoleLog: (callback: (event: ProcessLogEvent) => void) => () => void;
  onStatusChange: (callback: (event: { serverId: string; status: any; exitCode?: number }) => void) => () => void;
  getProperties: (serverId: string) => Promise<ServerProperties>;
  saveProperties: (serverId: string, properties: ServerProperties) => Promise<boolean>;
  searchModrinth: (query: string, loader: string, mcVersion: string) => Promise<ModrinthSearchResult[]>;
  getInstalledMods: (serverId: string) => Promise<ModItem[]>;
  toggleMod: (serverId: string, filename: string) => Promise<{ success: boolean; newFilename?: string; error?: string }>;
  deleteMod: (serverId: string, filename: string) => Promise<boolean>;
  installMod: (serverId: string, projectId: string, loader: string, mcVersion: string) => Promise<{ success: boolean; filename?: string; error?: string }>;
  getJavaInstallations: () => Promise<any[]>;
  getVersions: (loader: string) => Promise<string[]>;
  toggleTunnel: (serverId: string, enabled: boolean) => Promise<{ enabled: boolean; address?: string }>;
  getNetworkAddresses: () => Promise<{ lanIpv4: string; globalIpv6: string | null; publicIpv4: string | null }>;
  onTunnelUpdate: (callback: (data: { serverId: string; address: string | null }) => void) => () => void;
  getDeviceIdentity: () => Promise<{ deviceId: string; deviceName: string }>;
  createShareCode: (serverId: string, hostAddress: string) => Promise<{ inviteCode: string; token: string }>;
  joinSharedServer: (inviteCode: string) => Promise<ServerInstance>;
  getSharedLockState: (serverId: string) => Promise<HostLockState>;
  takeoverHost: (serverId: string) => Promise<{ success: boolean; currentLock: HostLockState }>;
  syncSharedServer: (serverId: string) => Promise<{ success: boolean; updatedFiles: number }>;
  onLockChange: (callback: (data: { serverId: string; lock: HostLockState }) => void) => () => void;
  onSyncStatus: (callback: (data: any) => void) => () => void;
}

declare global {
  interface Window {
    craftPulseAPI: CraftPulseAPI;
  }
}
