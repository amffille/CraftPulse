import os from 'os';
import http from 'http';

export interface NetworkAddresses {
  lanIpv4: string;
  globalIpv6: string | null;
  publicIpv4: string | null;
}

export class NetworkDiscoveryService {
  /**
   * Detect local LAN IP and global public IPv6 addresses
   */
  static getLocalAddresses(): { lanIpv4: string; globalIpv6: string | null } {
    const interfaces = os.networkInterfaces();
    let lanIpv4 = '127.0.0.1';
    let globalIpv6: string | null = null;

    for (const name of Object.keys(interfaces)) {
      const addrs = interfaces[name];
      if (!addrs) continue;

      for (const addr of addrs) {
        // Find Local LAN IPv4 (not 127.0.0.1)
        if (addr.family === 'IPv4' && !addr.internal) {
          if (addr.address.startsWith('192.168.') || addr.address.startsWith('10.') || addr.address.startsWith('172.')) {
            lanIpv4 = addr.address;
          }
        }

        // Find globally routable IPv6 (not internal, not link-local fe80::, not unique-local fc/fd)
        if (addr.family === 'IPv6' && !addr.internal) {
          const lower = addr.address.toLowerCase();
          if (!lower.startsWith('fe80:') && !lower.startsWith('::1') && !lower.startsWith('fc') && !lower.startsWith('fd')) {
            if (lower.startsWith('2') || lower.startsWith('3')) {
              globalIpv6 = addr.address;
            } else if (!globalIpv6) {
              globalIpv6 = addr.address;
            }
          }
        }
      }
    }

    return { lanIpv4, globalIpv6 };
  }

  /**
   * Fetch public IPv4 address if available
   */
  static async getPublicIpv4(): Promise<string | null> {
    return new Promise((resolve) => {
      const req = http.get('http://api.ipify.org', { timeout: 3000 }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data.trim() || null));
      });
      req.on('error', () => resolve(null));
      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });
    });
  }

  /**
   * Get all detected network addresses
   */
  static async getAllAddresses(): Promise<NetworkAddresses> {
    const { lanIpv4, globalIpv6 } = this.getLocalAddresses();
    const publicIpv4 = await this.getPublicIpv4();

    return {
      lanIpv4,
      globalIpv6,
      publicIpv4
    };
  }
}
