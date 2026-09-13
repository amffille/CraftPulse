import { exec, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

export interface JavaInstallation {
  path: string;
  version: string;
  majorVersion: number;
  isDefault: boolean;
}

export class JavaDiscoveryService {
  /**
   * Scan system for Java installations (Windows Registry, PATH, standard directories)
   */
  static async findJavaInstallations(): Promise<JavaInstallation[]> {
    const candidates = new Set<string>();
    const isWindows = process.platform === 'win32';

    // 1. Check JAVA_HOME environment variable
    if (process.env.JAVA_HOME) {
      const binJava = path.join(process.env.JAVA_HOME, 'bin', isWindows ? 'java.exe' : 'java');
      if (fs.existsSync(binJava)) candidates.add(binJava);
    }

    // 2. Check PATH
    try {
      const whichCmd = isWindows ? 'where java' : 'which java';
      const stdout = execSync(whichCmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
      stdout.split(/\r?\n/).forEach(p => {
        const trimmed = p.trim();
        if (trimmed && fs.existsSync(trimmed)) candidates.add(trimmed);
      });
    } catch {
      // Ignore if not in PATH
    }

    // 3. Check standard Windows Program Files directories
    if (isWindows) {
      const standardRoots = [
        'C:\\Program Files\\Java',
        'C:\\Program Files\\Eclipse Adoptium',
        'C:\\Program Files\\BellSoft',
        'C:\\Program Files\\Amazon Corretto',
        'C:\\Program Files\\Zulu',
        'C:\\Program Files (x86)\\Java'
      ];

      for (const root of standardRoots) {
        if (fs.existsSync(root)) {
          try {
            const entries = fs.readdirSync(root);
            for (const entry of entries) {
              const exe = path.join(root, entry, 'bin', 'java.exe');
              if (fs.existsSync(exe)) candidates.add(exe);
            }
          } catch {
            // Ignore permission errors
          }
        }
      }
    } else {
      // Linux/macOS standard paths
      const linuxPaths = [
        '/usr/bin/java',
        '/usr/lib/jvm/default-java/bin/java',
        '/usr/lib/jvm/java-17-openjdk-amd64/bin/java',
        '/usr/lib/jvm/java-21-openjdk-amd64/bin/java'
      ];
      for (const p of linuxPaths) {
        if (fs.existsSync(p)) candidates.add(p);
      }
    }

    // Always include bare 'java' as a candidate
    candidates.add('java');

    const results: JavaInstallation[] = [];
    for (const javaPath of candidates) {
      try {
        const info = await this.getJavaVersion(javaPath);
        if (info) {
          results.push({
            path: javaPath,
            version: info.version,
            majorVersion: info.majorVersion,
            isDefault: javaPath === 'java' || (process.env.JAVA_HOME ? javaPath.includes(process.env.JAVA_HOME) : false)
          });
        }
      } catch {
        // Not a valid executable
      }
    }

    return results;
  }

  /**
   * Run java -version and extract version string and major version number
   */
  static getJavaVersion(javaPath: string): Promise<{ version: string; majorVersion: number } | null> {
    return new Promise((resolve) => {
      exec(`"${javaPath}" -version`, { timeout: 3000 }, (_err, _stdout, stderr) => {
        const output = stderr || _stdout;
        if (!output) return resolve(null);

        // e.g. openjdk version "21.0.2" 2024-01-16
        // or java version "1.8.0_311"
        const match = output.match(/version "(.*?)"/);
        if (match && match[1]) {
          const verStr = match[1];
          let major = 0;
          if (verStr.startsWith('1.')) {
            major = parseInt(verStr.split('.')[1], 10);
          } else {
            major = parseInt(verStr.split('.')[0], 10);
          }
          return resolve({ version: verStr, majorVersion: isNaN(major) ? 0 : major });
        }
        resolve(null);
      });
    });
  }

  static getRequiredJavaMajorVersion(mcVersion: string): number {
    const parts = mcVersion.split('.').map(p => parseInt(p, 10));
    const minor = parts[1] || 0;
    const patch = parts[2] || 0;

    if (minor >= 21 || (minor === 20 && patch >= 5)) {
      return 21;
    }
    if (minor >= 18) {
      return 17;
    }
    if (minor === 17) {
      return 16;
    }
    return 8;
  }

  static async resolveBestJava(mcVersion: string, preferredJavaPath?: string): Promise<{
    path: string;
    majorVersion: number;
    meetsRequirement: boolean;
    requiredVersion: number;
  }> {
    const required = this.getRequiredJavaMajorVersion(mcVersion);
    const installations = await this.findJavaInstallations();

    // 1. If preferred custom path provided
    if (preferredJavaPath) {
      const info = await this.getJavaVersion(preferredJavaPath);
      if (info) {
        return {
          path: preferredJavaPath,
          majorVersion: info.majorVersion,
          meetsRequirement: info.majorVersion >= required,
          requiredVersion: required
        };
      }
    }

    // 2. Find any installed Java that meets requirements (e.g. Java 17, 21)
    const compatible = installations
      .filter(i => i.majorVersion >= required)
      .sort((a, b) => b.majorVersion - a.majorVersion);

    if (compatible.length > 0) {
      return {
        path: compatible[0].path,
        majorVersion: compatible[0].majorVersion,
        meetsRequirement: true,
        requiredVersion: required
      };
    }

    // 3. Fallback to default 'java'
    const defaultInfo = await this.getJavaVersion('java');
    const defaultMajor = defaultInfo?.majorVersion || 0;
    return {
      path: 'java',
      majorVersion: defaultMajor,
      meetsRequirement: defaultMajor >= required,
      requiredVersion: required
    };
  }
}
