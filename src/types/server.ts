export type ServerStatus = 'STOPPED' | 'STARTING' | 'RUNNING' | 'STOPPING' | 'CRASHED';

export type ServerLoader = 'vanilla' | 'paper' | 'fabric' | 'forge' | 'neoforge';

export interface ServerProperties {
  difficulty: 'peaceful' | 'easy' | 'normal' | 'hard';
  gamemode: 'survival' | 'creative' | 'adventure' | 'spectator';
  hardcore: boolean;
  pvp: boolean;
  'white-list': boolean;
  'online-mode': boolean;
  'enable-command-block': boolean;
  'spawn-monsters': boolean;
  'spawn-animals': boolean;
  'spawn-npcs': boolean;
  'allow-nether': boolean;
  'generate-structures': boolean;
  'spawn-protection': number;
  'max-players': number;
  'view-distance': number;
  'simulation-distance': number;
  'server-port': number;
  motd: string;
  'level-seed': string;
  'level-name': string;
  'enforce-whitelist': boolean;
  [key: string]: any;
}

export interface ServerInstance {
  id: string;
  name: string;
  loader: ServerLoader;
  mcVersion: string;
  loaderVersion?: string;
  path: string;
  minRamGb: number;
  maxRamGb: number;
  javaPath?: string;
  tunnelEnabled: boolean;
  tunnelAddress?: string;
  status: ServerStatus;
  autoRestart: boolean;
  createdAt: string;
  isShared?: boolean;
  syncToken?: string;
  sharedPeersCount?: number;
}

export interface ModItem {
  id: string;
  title: string;
  filename: string;
  slug?: string;
  description?: string;
  iconUrl?: string;
  author?: string;
  downloads?: number;
  isEnabled: boolean;
  installedVersion?: string;
  latestVersion?: string;
  isUpdateAvailable?: boolean;
}

export interface ModrinthSearchResult {
  project_id: string;
  title: string;
  slug: string;
  description: string;
  icon_url: string;
  author: string;
  downloads: number;
  categories: string[];
  versions: string[];
}

export interface PlayerInfo {
  name: string;
  uuid?: string;
  isOp?: boolean;
  isWhitelisted?: boolean;
  isBanned?: boolean;
}

export interface HostLockState {
  serverId: string;
  isLocked: boolean;
  activeHostId?: string;
  activeHostName?: string;
  hostAddress?: string;
  leaseExpiresAt?: number;
  isSelfHosting: boolean;
}

export interface SyncPeer {
  id: string;
  name: string;
  address?: string;
  status: 'connected' | 'connecting' | 'disconnected';
  lastSeen: number;
}

export interface P2PSyncStatus {
  serverId: string;
  syncState: 'idle' | 'syncing' | 'synced' | 'error';
  peersCount: number;
  peers: SyncPeer[];
  hostLock: HostLockState;
  lastSyncedAt?: string;
  pendingFilesCount?: number;
}
