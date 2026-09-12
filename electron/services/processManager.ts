import { spawn, ChildProcess, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { ServerStatus } from '../../src/types/server';

export interface ProcessLogEvent {
  serverId: string;
  data: string;
  type: 'stdout' | 'stderr' | 'system';
}

export class ServerProcessManager extends EventEmitter {
  private activeProcesses = new Map<string, ChildProcess>();
  private serverStatuses = new Map<string, ServerStatus>();

  getStatus(serverId: string): ServerStatus {
    return this.serverStatuses.get(serverId) || 'STOPPED';
  }

  /**
   * Start a Minecraft server instance
   */
  startServer(
    serverId: string,
    serverDir: string,
    jarFileName: string,
    minRamGb: number,
    maxRamGb: number,
    javaPath: string = 'java'
  ): boolean {
    if (this.activeProcesses.has(serverId)) {
      return false;
    }

    // Auto-accept EULA
    const eulaPath = path.join(serverDir, 'eula.txt');
    try {
      fs.writeFileSync(eulaPath, 'eula=true\n', 'utf-8');
    } catch (err) {
      console.error('Failed to write eula.txt:', err);
    }

    const jarPath = path.join(serverDir, jarFileName);
    if (!fs.existsSync(jarPath)) {
      this.emit('log', {
        serverId,
        type: 'system',
        data: `[CraftPulse] Error: Server JAR not found at ${jarPath}\r\n`
      } as ProcessLogEvent);
      return false;
    }

    const args = [
      `-Xms${minRamGb}G`,
      `-Xmx${maxRamGb}G`,
      '-XX:+UseG1GC',
      '-Djava.net.preferIPv4Stack=false',
      '-Djava.net.preferIPv6Addresses=system',
      '-jar',
      jarFileName,
      'nogui'
    ];

    this.serverStatuses.set(serverId, 'STARTING');
    this.emit('status-change', { serverId, status: 'STARTING' });

    this.emit('log', {
      serverId,
      type: 'system',
      data: `[CraftPulse] Starting Minecraft server: ${javaPath} ${args.join(' ')}\r\n`
    } as ProcessLogEvent);

    try {
      const child = spawn(javaPath, args, {
        cwd: serverDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: false
      });

      this.activeProcesses.set(serverId, child);

      child.stdout?.on('data', (data) => {
        const text = data.toString();
        this.emit('log', { serverId, type: 'stdout', data: text } as ProcessLogEvent);

        // Detect when server is fully loaded
        if (text.includes('Done (') && text.includes('s)! For help, type "help"')) {
          this.serverStatuses.set(serverId, 'RUNNING');
          this.emit('status-change', { serverId, status: 'RUNNING' });
        }
      });

      child.stderr?.on('data', (data) => {
        const text = data.toString();
        this.emit('log', { serverId, type: 'stderr', data: text } as ProcessLogEvent);
      });

      child.on('close', (code) => {
        this.activeProcesses.delete(serverId);
        const finalStatus = code === 0 || code === 130 ? 'STOPPED' : 'CRASHED';
        this.serverStatuses.set(serverId, finalStatus);
        this.emit('status-change', { serverId, status: finalStatus, exitCode: code });
        this.emit('log', {
          serverId,
          type: 'system',
          data: `[CraftPulse] Server process stopped with exit code ${code}\r\n`
        } as ProcessLogEvent);
      });

      child.on('error', (err: any) => {
        if (err.code === 'ENOENT') {
          this.emit('log', {
            serverId,
            type: 'system',
            data: `[CraftPulse] ERROR: Java runtime not found! Java is not installed or not in your system PATH.\r\n[CraftPulse] Please download & install Java (JDK 17 or 21) from https://adoptium.net and restart CraftPulse.\r\n`
          } as ProcessLogEvent);
        } else {
          this.emit('log', {
            serverId,
            type: 'system',
            data: `[CraftPulse] Process launch error: ${err.message}\r\n`
          } as ProcessLogEvent);
        }
        this.serverStatuses.set(serverId, 'CRASHED');
        this.emit('status-change', { serverId, status: 'CRASHED' });
      });

      return true;
    } catch (err: any) {
      this.serverStatuses.set(serverId, 'CRASHED');
      this.emit('status-change', { serverId, status: 'CRASHED' });
      this.emit('log', {
        serverId,
        type: 'system',
        data: `[CraftPulse] Failed to spawn process: ${err.message}\r\n`
      } as ProcessLogEvent);
      return false;
    }
  }

  /**
   * Send console command to the running server stdin
   */
  sendCommand(serverId: string, command: string): boolean {
    const child = this.activeProcesses.get(serverId);
    if (!child || !child.stdin || child.killed) return false;

    child.stdin.write(command.trim() + '\n');
    return true;
  }

  /**
   * Graceful stop or force kill
   */
  async stopServer(serverId: string, force: boolean = false): Promise<boolean> {
    const child = this.activeProcesses.get(serverId);
    if (!child) return false;

    this.serverStatuses.set(serverId, 'STOPPING');
    this.emit('status-change', { serverId, status: 'STOPPING' });

    if (!force && child.stdin && !child.killed) {
      this.emit('log', {
        serverId,
        type: 'system',
        data: `[CraftPulse] Sending "stop" command to server...\r\n`
      } as ProcessLogEvent);
      child.stdin.write('stop\n');

      // Allow 15 seconds to gracefully save and quit
      setTimeout(() => {
        if (this.activeProcesses.has(serverId)) {
          this.killProcessTree(child.pid);
        }
      }, 15000);
      return true;
    }

    // Force kill
    this.killProcessTree(child.pid);
    return true;
  }

  private killProcessTree(pid?: number) {
    if (!pid) return;
    if (process.platform === 'win32') {
      exec(`taskkill /pid ${pid} /T /F`, (err) => {
        if (err) console.error('taskkill error:', err);
      });
    } else {
      try {
        process.kill(pid, 'SIGKILL');
      } catch (e) {
        console.error('kill error:', e);
      }
    }
  }
}
