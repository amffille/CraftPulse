import fs from 'fs';
import path from 'path';
import os from 'os';
import http from 'http';
import crypto from 'crypto';
import { EventEmitter } from 'events';
import { HostLockState, P2PSyncStatus, SyncPeer } from '../../src/types/server';

export interface DeviceIdentity {
  deviceId: string;
  deviceName: string;
  created: string;
}

export interface FileManifestEntry {
  relPath: string;
  size: number;
  mtime: number;
  hash?: string;
}

export class P2PSyncService extends EventEmitter {
  private identity!: DeviceIdentity;
  private serverHttp: http.Server | null = null;
  private serverPort: number = 25575;
  private activeLocks = new Map<string, HostLockState>();
  private knownPeers = new Map<string, SyncPeer[]>();
  private syncTokens = new Map<string, string>(); // serverId -> secret token
  private heartbeatTimers = new Map<string, NodeJS.Timeout>();
  private userDataDir: string;

  constructor(userDataDir: string) {
    super();
    this.userDataDir = userDataDir;
    this.initIdentity();
    this.startP2PServer();
  }

  /**
   * Initialize or load the unique local cryptographic device identity
   */
  private initIdentity(): void {
    const identPath = path.join(this.userDataDir, 'device_identity.json');
    if (fs.existsSync(identPath)) {
      try {
        this.identity = JSON.parse(fs.readFileSync(identPath, 'utf-8'));
        return;
      } catch (e) {}
    }

    const deviceId = crypto.randomBytes(8).toString('hex');
    const deviceName = `${os.userInfo().username || 'Player'}-${os.hostname().substring(0, 8)}`;
    this.identity = {
      deviceId,
      deviceName,
      created: new Date().toISOString()
    };

    try {
      fs.mkdirSync(this.userDataDir, { recursive: true });
      fs.writeFileSync(identPath, JSON.stringify(this.identity, null, 2), 'utf-8');
    } catch (e) {}
  }

  getIdentity(): DeviceIdentity {
    return this.identity;
  }

  /**
   * Start the local background HTTP server for P2P file & lock exchange
   */
  private startP2PServer(): void {
    this.serverHttp = http.createServer(async (req, res) => {
      const url = new URL(req.url || '/', `http://localhost:${this.serverPort}`);
      const token = url.searchParams.get('token');
      const serverId = url.searchParams.get('serverId');

      // Verify token
      if (!token || !serverId || this.syncTokens.get(serverId) !== token) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized or invalid token' }));
        return;
      }

      const serverDir = path.join(this.userDataDir, 'servers', serverId);

      // 1. GET /sync/lock - Query host lock status
      if (url.pathname === '/sync/lock') {
        const lock = this.getLockState(serverId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(lock));
        return;
      }

      // 2. POST /sync/lock/claim - Claim host lease
      if (url.pathname === '/sync/lock/claim' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          try {
            const data = JSON.parse(body || '{}');
            const result = this.claimLock(serverId, data.hostId, data.hostName, data.hostAddress);
            res.writeHead(result.success ? 200 : 409, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
          } catch (e: any) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
          }
        });
        return;
      }

      // 3. POST /sync/lock/release - Release host lock
      if (url.pathname === '/sync/lock/release' && req.method === 'POST') {
        this.releaseLock(serverId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
        return;
      }

      // 4. GET /sync/manifest - Return file manifest of world, mods, properties
      if (url.pathname === '/sync/manifest') {
        const manifest = this.generateManifest(serverDir);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(manifest));
        return;
      }

      // 5. GET /sync/file - Stream specific file
      if (url.pathname === '/sync/file') {
        const relPath = url.searchParams.get('path');
        if (!relPath) {
          res.writeHead(400).end('Missing path');
          return;
        }

        const safeRel = path.normalize(relPath).replace(/^(\.\.[\/\\])+/, '');
        const targetPath = path.join(serverDir, safeRel);

        if (!targetPath.startsWith(serverDir) || !fs.existsSync(targetPath)) {
          res.writeHead(404).end('Not found');
          return;
        }

        res.writeHead(200, {
          'Content-Type': 'application/octet-stream',
          'Content-Length': fs.statSync(targetPath).size
        });
        fs.createReadStream(targetPath).pipe(res);
        return;
      }

      res.writeHead(404).end('Endpoint not found');
    });

    this.serverHttp.listen(this.serverPort, () => {
      console.log(`[P2PSyncService] P2P Sync Server listening on port ${this.serverPort}`);
    }).on('error', () => {
      // If 25575 is busy, try dynamic port
      this.serverHttp?.listen(0, () => {
        const addr = this.serverHttp?.address() as any;
        if (addr) this.serverPort = addr.port;
      });
    });
  }

  /**
   * Register a shared server with a secret token
   */
  registerSharedServer(serverId: string, token: string): void {
    this.syncTokens.set(serverId, token);
  }

  /**
   * Generate an invite code string for sharing with friends
   */
  generateInviteCode(serverId: string, serverName: string, hostAddress: string): string {
    let token = this.syncTokens.get(serverId);
    if (!token) {
      token = crypto.randomBytes(16).toString('hex');
      this.syncTokens.set(serverId, token);
    }

    const payload = {
      v: 1,
      serverId,
      name: serverName,
      token,
      hostId: this.identity.deviceId,
      hostName: this.identity.deviceName,
      peer: hostAddress,
      port: this.serverPort
    };

    const b64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return `CP-SYNC-${b64}`;
  }

  /**
   * Parse an invite code shared by a friend
   */
  parseInviteCode(code: string): any {
    if (!code.startsWith('CP-SYNC-')) {
      throw new Error('Invalid invite code format. Must start with CP-SYNC-');
    }
    const raw = code.replace('CP-SYNC-', '');
    const jsonStr = Buffer.from(raw, 'base64url').toString('utf-8');
    return JSON.parse(jsonStr);
  }

  /**
   * Generate file manifest for server files (excluding logs and crash reports)
   */
  generateManifest(serverDir: string): FileManifestEntry[] {
    const entries: FileManifestEntry[] = [];
    if (!fs.existsSync(serverDir)) return entries;

    const walk = (dir: string, baseDir: string) => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        // Exclude logs and cache
        if (file === 'logs' || file === 'crash-reports' || file === '.git' || file === 'cache') continue;

        const fullPath = path.join(dir, file);
        const relPath = path.relative(baseDir, fullPath);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          walk(fullPath, baseDir);
        } else {
          entries.push({
            relPath: relPath.replace(/\\/g, '/'),
            size: stat.size,
            mtime: Math.floor(stat.mtimeMs)
          });
        }
      }
    };

    walk(serverDir, serverDir);
    return entries;
  }

  /**
   * Synchronize local server folder with a peer
   */
  async syncFromPeer(serverId: string, peerHost: string, peerPort: number, token: string): Promise<{ success: boolean; updatedFiles: number }> {
    const serverDir = path.join(this.userDataDir, 'servers', serverId);
    fs.mkdirSync(serverDir, { recursive: true });

    try {
      this.emit('sync-status', { serverId, status: 'syncing' });

      // 1. Fetch remote lock state
      const lockData = await this.fetchJson(`http://${peerHost}:${peerPort}/sync/lock?serverId=${serverId}&token=${token}`);
      if (lockData) {
        this.activeLocks.set(serverId, lockData);
      }

      // 2. Fetch remote manifest
      const remoteManifest: FileManifestEntry[] = await this.fetchJson(
        `http://${peerHost}:${peerPort}/sync/manifest?serverId=${serverId}&token=${token}`
      );

      if (!Array.isArray(remoteManifest)) {
        throw new Error('Invalid manifest received from peer');
      }

      const localManifest = this.generateManifest(serverDir);
      const localMap = new Map(localManifest.map(e => [e.relPath, e]));

      let updatedCount = 0;

      for (const remoteFile of remoteManifest) {
        const local = localMap.get(remoteFile.relPath);
        // If file missing or remote is newer by more than 1 second
        if (!local || remoteFile.mtime > local.mtime + 1000) {
          const destPath = path.join(serverDir, remoteFile.relPath);
          fs.mkdirSync(path.dirname(destPath), { recursive: true });

          await this.downloadFile(
            `http://${peerHost}:${peerPort}/sync/file?serverId=${serverId}&token=${token}&path=${encodeURIComponent(remoteFile.relPath)}`,
            destPath
          );
          fs.utimesSync(destPath, new Date(), new Date(remoteFile.mtime));
          updatedCount++;
        }
      }

      this.emit('sync-status', { serverId, status: 'synced', updatedFiles: updatedCount });
      return { success: true, updatedFiles: updatedCount };
    } catch (err: any) {
      this.emit('sync-status', { serverId, status: 'error', error: err.message });
      return { success: false, updatedFiles: 0 };
    }
  }

  // --- Host Lock Management ---

  getLockState(serverId: string): HostLockState {
    const lock = this.activeLocks.get(serverId);
    const now = Date.now();

    if (!lock || (lock.leaseExpiresAt && lock.leaseExpiresAt < now)) {
      return {
        serverId,
        isLocked: false,
        isSelfHosting: false
      };
    }

    return {
      ...lock,
      isSelfHosting: lock.activeHostId === this.identity.deviceId
    };
  }

  claimLock(serverId: string, hostId: string, hostName: string, hostAddress?: string): { success: boolean; currentLock: HostLockState } {
    const current = this.getLockState(serverId);

    // If locked by someone else and lease has not expired
    if (current.isLocked && current.activeHostId !== hostId) {
      return { success: false, currentLock: current };
    }

    const newLock: HostLockState = {
      serverId,
      isLocked: true,
      activeHostId: hostId,
      activeHostName: hostName,
      hostAddress,
      leaseExpiresAt: Date.now() + (1000 * 60 * 3), // 3 minute lease
      isSelfHosting: hostId === this.identity.deviceId
    };

    this.activeLocks.set(serverId, newLock);
    this.emit('lock-changed', { serverId, lock: newLock });
    return { success: true, currentLock: newLock };
  }

  startHeartbeat(serverId: string, hostAddress?: string): void {
    this.claimLock(serverId, this.identity.deviceId, this.identity.deviceName, hostAddress);

    const existing = this.heartbeatTimers.get(serverId);
    if (existing) clearInterval(existing);

    const timer = setInterval(() => {
      this.claimLock(serverId, this.identity.deviceId, this.identity.deviceName, hostAddress);
    }, 20000); // Heartbeat every 20s

    this.heartbeatTimers.set(serverId, timer);
  }

  stopHeartbeat(serverId: string): void {
    const timer = this.heartbeatTimers.get(serverId);
    if (timer) {
      clearInterval(timer);
      this.heartbeatTimers.delete(serverId);
    }
    this.releaseLock(serverId);
  }

  releaseLock(serverId: string): void {
    const lock: HostLockState = {
      serverId,
      isLocked: false,
      isSelfHosting: false
    };
    this.activeLocks.set(serverId, lock);
    this.emit('lock-changed', { serverId, lock });
  }

  // --- Network Helpers ---

  private fetchJson(urlStr: string): Promise<any> {
    return new Promise((resolve, reject) => {
      http.get(urlStr, { timeout: 8000 }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject).on('timeout', () => reject(new Error('Timeout')));
    });
  }

  private downloadFile(urlStr: string, destPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(destPath);
      http.get(urlStr, { timeout: 15000 }, (res) => {
        if (res.statusCode !== 200) {
          file.close();
          fs.unlink(destPath, () => {});
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }).on('error', (err) => {
        file.close();
        fs.unlink(destPath, () => {});
        reject(err);
      });
    });
  }
}
