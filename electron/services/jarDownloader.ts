import fs from 'fs';
import path from 'path';
import https from 'https';

export class JarDownloaderService {
  /**
   * Ensure a valid server JAR exists. If missing or invalid (< 1MB), download it.
   */
  static async ensureJar(
    serverDir: string,
    loader: string,
    mcVersion: string,
    onProgress?: (msg: string) => void
  ): Promise<{ success: boolean; jarPath: string; error?: string }> {
    const jarPath = path.join(serverDir, 'server.jar');

    // If file exists and is larger than 5MB, consider it already downloaded
    if (fs.existsSync(jarPath)) {
      const stats = fs.statSync(jarPath);
      if (stats.size > 5 * 1024 * 1024) {
        return { success: true, jarPath };
      }
    }

    onProgress?.(`[CraftPulse] No valid server.jar found. Preparing to download ${loader} for Minecraft ${mcVersion}...\r\n`);

    try {
      let downloadUrl = '';

      if (loader === 'paper' || loader === 'purpur') {
        const project = loader === 'purpur' ? 'purpur' : 'paper';
        onProgress?.(`[CraftPulse] Fetching latest build info from ${project.toUpperCase()} API...\r\n`);
        
        const versionUrl = `https://api.papermc.io/v2/projects/${project}/versions/${mcVersion}`;
        const versionData = await this.fetchJson(versionUrl);

        if (!versionData || !versionData.builds || versionData.builds.length === 0) {
          throw new Error(`No builds found for ${project} ${mcVersion}`);
        }

        const latestBuild = versionData.builds[versionData.builds.length - 1];
        const buildUrl = `https://api.papermc.io/v2/projects/${project}/versions/${mcVersion}/builds/${latestBuild}`;
        const buildData = await this.fetchJson(buildUrl);

        const fileName = buildData?.downloads?.application?.name;
        if (!fileName) {
          throw new Error('Failed to resolve download file name from PaperMC API');
        }

        downloadUrl = `https://api.papermc.io/v2/projects/${project}/versions/${mcVersion}/builds/${latestBuild}/downloads/${fileName}`;
      } else if (loader === 'fabric') {
        onProgress?.(`[CraftPulse] Resolving latest Fabric server launcher for Minecraft ${mcVersion}...\r\n`);
        let loaderVer = '0.16.9';
        let installerVer = '1.0.1';
        try {
          const loaderMeta = await this.fetchJson(`https://meta.fabricmc.net/v2/versions/loader/${mcVersion}`);
          if (Array.isArray(loaderMeta) && loaderMeta.length > 0) {
            loaderVer = loaderMeta[0]?.loader?.version || loaderVer;
          }
        } catch {
          // Use default latest fallback
        }
        downloadUrl = `https://meta.fabricmc.net/v2/versions/loader/${mcVersion}/${loaderVer}/${installerVer}/server/jar`;
      } else {
        // Vanilla fallback via Mojang manifest
        onProgress?.(`[CraftPulse] Resolving Vanilla Minecraft server from Mojang...\r\n`);
        const manifest = await this.fetchJson('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json');
        const verObj = manifest?.versions?.find((v: any) => v.id === mcVersion);
        if (verObj && verObj.url) {
          const verData = await this.fetchJson(verObj.url);
          downloadUrl = verData?.downloads?.server?.url;
        }
      }

      if (!downloadUrl) {
        throw new Error(`Could not resolve download URL for ${loader} ${mcVersion}`);
      }

      onProgress?.(`[CraftPulse] Downloading server JAR from: ${downloadUrl}\r\n`);
      onProgress?.(`[CraftPulse] Please wait, this may take 15-45 seconds (approx. 40-50 MB)...\r\n`);

      await this.downloadFile(downloadUrl, jarPath, (percent) => {
        if (percent % 25 === 0) {
          onProgress?.(`[CraftPulse] Download progress: ${percent}%\r\n`);
        }
      });

      onProgress?.(`[CraftPulse] Successfully downloaded and verified server.jar!\r\n`);
      return { success: true, jarPath };
    } catch (err: any) {
      onProgress?.(`[CraftPulse] Failed to download server JAR: ${err.message}\r\n`);
      return { success: false, jarPath, error: err.message };
    }
  }

  private static fetchJson(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      https.get(url, { headers: { 'User-Agent': 'CraftPulse-Minecraft-Manager/1.0' } }, (res) => {
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
      }).on('error', reject);
    });
  }

  private static downloadFile(url: string, destPath: string, onProgress?: (percent: number) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      https.get(url, { headers: { 'User-Agent': 'CraftPulse-Minecraft-Manager/1.0' } }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return resolve(this.downloadFile(res.headers.location, destPath, onProgress));
        }

        if (res.statusCode !== 200) {
          return reject(new Error(`Server responded with HTTP ${res.statusCode}`));
        }

        const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
        let receivedBytes = 0;
        let lastReportedPercent = -1;

        const file = fs.createWriteStream(destPath);
        res.on('data', (chunk) => {
          receivedBytes += chunk.length;
          if (totalBytes > 0 && onProgress) {
            const percent = Math.floor((receivedBytes / totalBytes) * 100);
            if (percent !== lastReportedPercent) {
              lastReportedPercent = percent;
              onProgress(percent);
            }
          }
        });

        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }).on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    });
  }
}
