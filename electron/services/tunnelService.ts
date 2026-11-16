import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

export class TunnelService extends EventEmitter {
  private activeProcesses = new Map<string, ChildProcess>();
  private activeAddresses = new Map<string, string>();

  /**
   * Start a 1-click zero-config tunnel (via built-in OpenSSH)
   */
  startTunnel(serverId: string, localPort: number = 25565): Promise<{ address: string }> {
    return new Promise((resolve) => {
      // Stop existing if any
      this.stopTunnel(serverId);

      const sshArgs = [
        '-o', 'StrictHostKeyChecking=no',
        '-o', 'ServerAliveInterval=30',
        '-p', '443',
        `-R0:localhost:${localPort}`,
        'tcp@a.pinggy.io'
      ];

      try {
        const child = spawn('ssh', sshArgs, {
          stdio: ['pipe', 'pipe', 'pipe'],
          shell: false
        });

        this.activeProcesses.set(serverId, child);

        let resolved = false;
        let buffer = '';

        const checkOutput = (data: Buffer) => {
          const text = data.toString();
          buffer += text;
          this.emit('tunnel-log', { serverId, data: text });

          // Regex to extract assigned TCP address
          // Matches e.g. "tcp://xxxx.run.pinggy-free.link:12345" or "a.pinggy.io:12345"
          const match = buffer.match(/tcp:\/\/([a-zA-Z0-9\.\-_]+:[0-9]+)/i) ||
                        buffer.match(/([a-zA-Z0-9\.\-_]+\.pinggy[a-zA-Z0-9\.\-_]*:[0-9]+)/i);

          if (match && !resolved) {
            resolved = true;
            const address = match[1];
            this.activeAddresses.set(serverId, address);
            this.emit('tunnel-started', { serverId, address });
            resolve({ address });
          }
        };

        child.stdout?.on('data', checkOutput);
        child.stderr?.on('data', checkOutput);

        child.on('close', (code) => {
          this.activeProcesses.delete(serverId);
          this.activeAddresses.delete(serverId);
          this.emit('tunnel-stopped', { serverId, code });
          if (!resolved) {
            resolve({ address: 'Tunnel disconnected' });
          }
        });

        child.on('error', (err) => {
          console.error('[TunnelService] SSH error:', err);
          if (!resolved) {
            resolve({ address: 'Failed to start tunnel: ' + err.message });
          }
        });

        // Fallback timeout after 10s if no address parsed
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            const fallback = this.activeAddresses.get(serverId) || 'Connecting...';
            resolve({ address: fallback });
          }
        }, 10000);

      } catch (err: any) {
        resolve({ address: 'Tunnel error: ' + err.message });
      }
    });
  }

  stopTunnel(serverId: string): boolean {
    const child = this.activeProcesses.get(serverId);
    if (child) {
      try {
        child.kill();
      } catch (e) {}
      this.activeProcesses.delete(serverId);
    }
    this.activeAddresses.delete(serverId);
    this.emit('tunnel-stopped', { serverId });
    return true;
  }

  getTunnelAddress(serverId: string): string | null {
    return this.activeAddresses.get(serverId) || null;
  }
}
