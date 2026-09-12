import React, { useState, useEffect } from 'react';
import { ServerInstance, ModItem, ModrinthSearchResult } from '../types/server';
import { 
  Package, 
  Search, 
  Download, 
  Trash2, 
  RotateCw, 
  Check, 
  AlertCircle, 
  ExternalLink,
  Layers,
  Power
} from 'lucide-react';

interface ModHubProps {
  server: ServerInstance;
}

export const ModHub: React.FC<ModHubProps> = ({ server }) => {
  const [tab, setTab] = useState<'installed' | 'browse'>('installed');
  const [installedMods, setInstalledMods] = useState<ModItem[]>([]);
  const [loadingInstalled, setLoadingInstalled] = useState(false);
  const [installedSearch, setInstalledSearch] = useState('');

  // Modrinth search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ModrinthSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [installingIds, setInstallingIds] = useState<Set<string>>(new Set());
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    loadInstalledMods();
  }, [server.id]);

  const loadInstalledMods = async () => {
    setLoadingInstalled(true);
    if (window.craftPulseAPI) {
      try {
        const mods = await window.craftPulseAPI.getInstalledMods(server.id);
        setInstalledMods(mods);
      } catch (err) {
        console.error('Failed to load installed mods:', err);
      }
    } else {
      // Demo mock
      setInstalledMods([
        { id: '1', title: 'Lithium', filename: 'lithium-fabric-0.12.1.jar', isEnabled: true },
        { id: '2', title: 'FerriteCore', filename: 'ferritecore-fabric-6.0.3.jar', isEnabled: true },
        { id: '3', title: 'VoiceChat', filename: 'simple-voice-chat-fabric.jar.disabled', isEnabled: false },
      ]);
    }
    setLoadingInstalled(false);
  };

  const handleToggleMod = async (mod: ModItem) => {
    if (window.craftPulseAPI) {
      const res = await window.craftPulseAPI.toggleMod(server.id, mod.filename);
      if (res.success && res.newFilename) {
        setInstalledMods(prev => prev.map(m => {
          if (m.filename === mod.filename) {
            return {
              ...m,
              filename: res.newFilename!,
              isEnabled: !m.isEnabled
            };
          }
          return m;
        }));
      }
    } else {
      // Mock toggle
      setInstalledMods(prev => prev.map(m => m.id === mod.id ? { ...m, isEnabled: !m.isEnabled } : m));
    }
  };

  const handleDeleteMod = async (filename: string) => {
    if (window.craftPulseAPI) {
      const success = await window.craftPulseAPI.deleteMod(server.id, filename);
      if (success) {
        setInstalledMods(prev => prev.filter(m => m.filename !== filename));
      }
    } else {
      setInstalledMods(prev => prev.filter(m => m.filename !== filename));
    }
  };

  const handleSearchModrinth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    if (window.craftPulseAPI) {
      try {
        const results = await window.craftPulseAPI.searchModrinth(searchQuery, server.loader, server.mcVersion);
        setSearchResults(results);
      } catch (err) {
        console.error('Modrinth search error:', err);
      }
    } else {
      // Demo mock
      setSearchResults([
        {
          project_id: 'AANobbMI',
          title: 'Sodium',
          slug: 'sodium',
          description: 'A modern rendering engine for Minecraft that greatly improves frame rates and performance.',
          icon_url: 'https://cdn.modrinth.com/data/AANobbMI/icon.png',
          author: 'jellysquid3',
          downloads: 24500000,
          categories: ['fabric', 'optimization'],
          versions: [server.mcVersion]
        },
        {
          project_id: 'gvQqBUqZ',
          title: 'Lithium',
          slug: 'lithium',
          description: 'A general-purpose physics and chunk optimization mod for Minecraft.',
          icon_url: 'https://cdn.modrinth.com/data/gvQqBUqZ/icon.png',
          author: 'jellysquid3',
          downloads: 18200000,
          categories: ['fabric', 'optimization'],
          versions: [server.mcVersion]
        }
      ]);
    }
    setSearching(false);
  };

  const handleInstallMod = async (mod: ModrinthSearchResult) => {
    setInstallingIds(prev => new Set(prev).add(mod.project_id));
    setStatusMessage(`Installing ${mod.title}...`);

    if (window.craftPulseAPI) {
      const res = await window.craftPulseAPI.installMod(server.id, mod.project_id, server.loader, server.mcVersion);
      if (res.success) {
        setStatusMessage(`Successfully installed ${mod.title}!`);
        loadInstalledMods();
      } else {
        setStatusMessage(`Failed: ${res.error || 'Unknown error'}`);
      }
    } else {
      setTimeout(() => {
        setStatusMessage(`Installed ${mod.title}!`);
        loadInstalledMods();
      }, 1000);
    }

    setInstallingIds(prev => {
      const next = new Set(prev);
      next.delete(mod.project_id);
      return next;
    });

    setTimeout(() => setStatusMessage(null), 4000);
  };

  const filteredInstalled = installedMods.filter(m => 
    m.title.toLowerCase().includes(installedSearch.toLowerCase()) ||
    m.filename.toLowerCase().includes(installedSearch.toLowerCase())
  );

  const enabledCount = installedMods.filter(m => m.isEnabled).length;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#242a38]">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Mod & Plugin Hub</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your <span className="font-mono text-emerald-400">/mods</span> directory and search Modrinth for compatible mods
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-[#161a23] p-1 rounded-xl border border-[#272e3d]">
          <button
            onClick={() => setTab('installed')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              tab === 'installed'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers size={14} /> Installed Mods ({enabledCount}/{installedMods.length})
          </button>
          <button
            onClick={() => setTab('browse')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              tab === 'browse'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Search size={14} /> Browse Modrinth
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="bg-[#1a2130] border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <Check size={16} />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Tab: Installed Mods */}
      {tab === 'installed' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter installed mods..."
                value={installedSearch}
                onChange={e => setInstalledSearch(e.target.value)}
                className="w-full bg-[#161a23] border border-[#272e3d] pl-10 pr-4 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              onClick={loadInstalledMods}
              className="px-4 py-2.5 bg-[#1e2433] hover:bg-[#283042] text-slate-200 text-xs font-semibold rounded-xl border border-white/5 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <RotateCw size={14} className={loadingInstalled ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          {filteredInstalled.length === 0 ? (
            <div className="bg-[#161a23] rounded-2xl p-12 text-center border border-[#262c3b] space-y-3">
              <Package size={40} className="mx-auto text-slate-600" />
              <h3 className="text-white font-semibold">No mods found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No mods are currently in the server's <code className="bg-[#111317] px-1.5 py-0.5 rounded text-emerald-400 font-mono">mods/</code> folder. Use the "Browse Modrinth" tab to install mods with one click.
              </p>
              <button
                onClick={() => setTab('browse')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs shadow-md cursor-pointer inline-flex items-center gap-2"
              >
                <Search size={14} /> Browse Modrinth
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredInstalled.map(mod => (
                <div
                  key={mod.filename}
                  className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                    mod.isEnabled
                      ? 'bg-[#161a23] border-[#293040]'
                      : 'bg-[#12141a]/60 border-[#20242e] opacity-75'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className={`p-2.5 rounded-xl ${mod.isEnabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500'}`}>
                      <Package size={20} />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm truncate">{mod.title}</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${mod.isEnabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                          {mod.isEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono truncate mt-0.5">{mod.filename}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Toggle Switch */}
                    <button
                      onClick={() => handleToggleMod(mod)}
                      title={mod.isEnabled ? 'Disable mod (renames to .disabled)' : 'Enable mod'}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        mod.isEnabled
                          ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                      }`}
                    >
                      <Power size={13} />
                      <span>{mod.isEnabled ? 'Active' : 'Disabled'}</span>
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteMod(mod.filename)}
                      title="Delete mod file"
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Browse Modrinth */}
      {tab === 'browse' && (
        <div className="space-y-4">
          <form onSubmit={handleSearchModrinth} className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={`Search Modrinth for ${server.loader} mods compatible with ${server.mcVersion}...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#161a23] border border-[#272e3d] pl-10 pr-4 py-3 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              {searching ? <RotateCw size={16} className="animate-spin" /> : <Search size={16} />}
              <span>Search</span>
            </button>
          </form>

          {/* Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {searchResults.map(mod => {
              const isInstalling = installingIds.has(mod.project_id);
              return (
                <div
                  key={mod.project_id}
                  className="bg-[#161a23] p-5 rounded-2xl border border-[#262c3b] flex flex-col justify-between hover:border-[#333b4e] transition-all"
                >
                  <div>
                    <div className="flex items-start gap-3">
                      {mod.icon_url ? (
                        <img src={mod.icon_url} alt={mod.title} className="w-12 h-12 rounded-xl object-cover border border-white/5 flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-emerald-600/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
                          <Package size={24} />
                        </div>
                      )}
                      <div className="flex-1 truncate">
                        <h4 className="font-bold text-white text-base truncate">{mod.title}</h4>
                        <span className="text-xs text-slate-400">by {mod.author}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 mt-3 line-clamp-2 leading-relaxed">
                      {mod.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#222735]">
                    <span className="text-xs text-slate-400 font-mono">
                      📥 {(mod.downloads || 0).toLocaleString()} downloads
                    </span>

                    <button
                      onClick={() => handleInstallMod(mod)}
                      disabled={isInstalling}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      {isInstalling ? <RotateCw size={14} className="animate-spin" /> : <Download size={14} />}
                      <span>{isInstalling ? 'Installing...' : '1-Click Install'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
