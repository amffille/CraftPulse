import https from 'https';
import { ServerLoader } from '../../src/types/server';

const FALLBACK_VERSIONS: Record<string, string[]> = {
  common: [
    '1.21.4', '1.21.3', '1.21.2', '1.21.1', '1.21',
    '1.20.6', '1.20.5', '1.20.4', '1.20.2', '1.20.1',
    '1.19.4', '1.19.2', '1.18.2', '1.17.1', '1.16.5',
    '1.12.2', '1.8.9'
  ]
};

export class VersionService {
  private static cache = new Map<string, { versions: string[]; timestamp: number }>();
  private static CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes cache

  /**
   * Fetch all live released Minecraft versions for a specific loader
   */
  static async getVersions(loader: ServerLoader): Promise<string[]> {
    const cached = this.cache.get(loader);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.versions;
    }

    try {
      let versions: string[] = [];

      if (loader === 'paper') {
        const data = await this.fetchJson('https://api.papermc.io/v2/projects/paper');
        if (data && Array.isArray(data.versions)) {
          versions = [...data.versions].reverse();
        }
      } else if (loader === 'fabric') {
        const data = await this.fetchJson('https://meta.fabricmc.net/v2/versions/game');
        if (Array.isArray(data)) {
          versions = data.filter((v: any) => v.stable).map((v: any) => v.version);
        }
      } else {
        // Vanilla / Forge / NeoForge fallback to official Mojang release manifest
        const data = await this.fetchJson('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json');
        if (data && Array.isArray(data.versions)) {
          versions = data.filter((v: any) => v.type === 'release').map((v: any) => v.id);
        }
      }

      if (versions.length > 0) {
        this.cache.set(loader, { versions, timestamp: Date.now() });
        return versions;
      }
    } catch (err) {
      console.warn(`[VersionService] Failed to fetch live versions for ${loader}:`, err);
    }

    return FALLBACK_VERSIONS.common;
  }

  private static fetchJson(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      https.get(url, { headers: { 'User-Agent': 'CraftPulse-Minecraft-Manager/1.0' }, timeout: 5000 }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return resolve(this.fetchJson(res.headers.location));
        }
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject).on('timeout', () => reject(new Error('Request timed out')));
    });
  }
}
