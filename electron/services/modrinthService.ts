import fs from 'fs';
import path from 'path';
import https from 'https';
import { ModItem, ModrinthSearchResult } from '../../src/types/server';

export class ModrinthService {
  /**
   * Search Modrinth for mods or plugins matching query, loader, and version
   */
  static async searchMods(
    query: string,
    loader: string,
    mcVersion: string,
    limit: number = 20
  ): Promise<ModrinthSearchResult[]> {
    const facets: string[][] = [
      [`categories:${loader}`],
      [`versions:${mcVersion}`],
      ['project_type:mod']
    ];

    const encodedFacets = encodeURIComponent(JSON.stringify(facets));
    const url = `https://api.modrinth.com/v2/search?query=${encodeURIComponent(query)}&facets=${encodedFacets}&limit=${limit}`;

    try {
      const response = await this.fetchJson(url);
      if (!response || !response.hits) return [];

      return response.hits.map((hit: any) => ({
        project_id: hit.project_id,
        title: hit.title,
        slug: hit.slug,
        description: hit.description,
        icon_url: hit.icon_url,
        author: hit.author,
        downloads: hit.downloads,
        categories: hit.categories,
        versions: hit.versions
      }));
    } catch (err) {
      console.error('Modrinth search failed:', err);
      return [];
    }
  }

  /**
   * Read all installed mods in the server's mods directory
   */
  static listInstalledMods(serverDir: string): ModItem[] {
    const modsDir = path.join(serverDir, 'mods');
    if (!fs.existsSync(modsDir)) {
      fs.mkdirSync(modsDir, { recursive: true });
      return [];
    }

    const files = fs.readdirSync(modsDir);
    const mods: ModItem[] = [];

    for (const file of files) {
      const isJar = file.endsWith('.jar');
      const isDisabled = file.endsWith('.jar.disabled');

      if (isJar || isDisabled) {
        const cleanName = file.replace('.jar.disabled', '').replace('.jar', '');
        mods.push({
          id: file,
          title: cleanName,
          filename: file,
          isEnabled: isJar
        });
      }
    }

    return mods;
  }

  /**
   * Toggle a mod enabled or disabled by renaming it
   */
  static toggleMod(serverDir: string, filename: string): { success: boolean; newFilename?: string; error?: string } {
    const modsDir = path.join(serverDir, 'mods');
    const oldPath = path.join(modsDir, filename);

    if (!fs.existsSync(oldPath)) {
      return { success: false, error: 'File not found' };
    }

    let newFilename = '';
    if (filename.endsWith('.jar')) {
      newFilename = `${filename}.disabled`;
    } else if (filename.endsWith('.jar.disabled')) {
      newFilename = filename.replace('.jar.disabled', '.jar');
    } else {
      return { success: false, error: 'Invalid file type' };
    }

    const newPath = path.join(modsDir, newFilename);
    try {
      fs.renameSync(oldPath, newPath);
      return { success: true, newFilename };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Delete an installed mod file
   */
  static deleteMod(serverDir: string, filename: string): boolean {
    const filePath = path.join(serverDir, 'mods', filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        return true;
      } catch (err) {
        console.error('Failed to delete mod:', err);
        return false;
      }
    }
    return false;
  }

  /**
   * Install a mod from Modrinth by fetching its compatible version file
   */
  static async installMod(
    serverDir: string,
    projectId: string,
    loader: string,
    mcVersion: string
  ): Promise<{ success: boolean; filename?: string; error?: string }> {
    try {
      const url = `https://api.modrinth.com/v2/project/${projectId}/version?loaders=["${loader}"]&game_versions=["${mcVersion}"]`;
      const versions = await this.fetchJson(url);

      if (!Array.isArray(versions) || versions.length === 0) {
        return { success: false, error: `No compatible version found for ${loader} ${mcVersion}` };
      }

      const latest = versions[0];
      const primaryFile = latest.files.find((f: any) => f.primary) || latest.files[0];
      if (!primaryFile || !primaryFile.url) {
        return { success: false, error: 'No downloadable file in project version' };
      }

      const modsDir = path.join(serverDir, 'mods');
      fs.mkdirSync(modsDir, { recursive: true });

      const destPath = path.join(modsDir, primaryFile.filename);
      await this.downloadFile(primaryFile.url, destPath);

      return { success: true, filename: primaryFile.filename };
    } catch (err: any) {
      return { success: false, error: err.message };
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

  private static downloadFile(url: string, destPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(destPath);
      https.get(url, { headers: { 'User-Agent': 'CraftPulse-Minecraft-Manager/1.0' } }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          file.close();
          fs.unlinkSync(destPath);
          return resolve(this.downloadFile(res.headers.location, destPath));
        }
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
