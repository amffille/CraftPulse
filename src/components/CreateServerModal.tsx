import React, { useState, useEffect } from 'react';
import { ServerLoader } from '../types/server';
import { X, Server, Sparkles, ShieldCheck, RotateCw } from 'lucide-react';

interface CreateServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: {
    name: string;
    loader: ServerLoader;
    mcVersion: string;
    minRamGb: number;
    maxRamGb: number;
  }) => void;
}

export const CreateServerModal: React.FC<CreateServerModalProps> = ({
  isOpen,
  onClose,
  onCreate
}) => {
  const [name, setName] = useState('');
  const [loader, setLoader] = useState<ServerLoader>('paper');
  const [mcVersion, setMcVersion] = useState('1.21.4');
  const [ram, setRam] = useState(4);
  const [acceptEula, setAcceptEula] = useState(true);
  const [versionList, setVersionList] = useState<string[]>([
    '1.21.4', '1.21.3', '1.21.2', '1.21.1', '1.21',
    '1.20.6', '1.20.5', '1.20.4', '1.20.2', '1.20.1',
    '1.19.4', '1.19.2', '1.18.2', '1.17.1', '1.16.5',
    '1.12.2', '1.8.9'
  ]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadVersions(loader);
    }
  }, [isOpen, loader]);

  const loadVersions = async (targetLoader: ServerLoader) => {
    setLoadingVersions(true);
    try {
      if (window.craftPulseAPI?.getVersions) {
        const vers = await window.craftPulseAPI.getVersions(targetLoader);
        if (vers && vers.length > 0) {
          setVersionList(vers);
          if (!vers.includes(mcVersion)) {
            setMcVersion(vers[0]);
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch live versions, using cached list:', err);
    }
    setLoadingVersions(false);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({
      name: name.trim(),
      loader,
      mcVersion,
      minRamGb: Math.max(1, Math.floor(ram / 2)),
      maxRamGb: ram
    });
    setName('');
    onClose();
  };

  const loaders: { id: ServerLoader; title: string; desc: string }[] = [
    { id: 'paper', title: 'PaperMC', desc: 'High-performance & Bukkit plugins' },
    { id: 'fabric', title: 'Fabric', desc: 'Lightweight & modern modding' },
    { id: 'forge', title: 'Forge', desc: 'Traditional heavy modpacks' },
    { id: 'neoforge', title: 'NeoForge', desc: 'Modern fork of Forge' },
    { id: 'vanilla', title: 'Vanilla', desc: 'Official Mojang server' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#161a23] border border-[#272e3d] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-[#232835] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Server size={18} />
            </div>
            <h3 className="font-bold text-white text-lg">Create New Minecraft Server</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#202533] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Server Name */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
              Server Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Friends Survival SMP"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-[#111319] border border-[#272e3d] px-4 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Loader Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
              Server Engine / Loader
            </label>
            <div className="grid grid-cols-2 gap-2">
              {loaders.map(l => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLoader(l.id)}
                  className={`p-3 rounded-xl text-left border transition-all ${
                    loader === l.id
                      ? 'bg-emerald-600/15 border-emerald-500 text-white'
                      : 'bg-[#111319] border-[#222735] text-slate-400 hover:bg-[#151821]'
                  }`}
                >
                  <div className="font-semibold text-sm capitalize">{l.title}</div>
                  <div className="text-[11px] opacity-75 truncate">{l.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Minecraft Version */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase text-slate-400">
                Minecraft Version
              </label>
              <div className="flex items-center gap-1.5">
                {loadingVersions && (
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                    <RotateCw size={10} className="animate-spin" /> Checking updates...
                  </span>
                )}
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                  {versionList.length} Live Releases
                </span>
              </div>
            </div>
            <select
              value={mcVersion}
              onChange={e => setMcVersion(e.target.value)}
              className="w-full bg-[#111319] border border-[#272e3d] px-4 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
            >
              {versionList.map((ver, idx) => (
                <option key={ver} value={ver}>
                  {ver} {idx === 0 ? '✨ (Latest Release)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* RAM Allocation */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold uppercase text-slate-400">
                Allocated RAM
              </label>
              <span className="font-mono text-xs text-emerald-400 font-bold bg-[#111319] px-2 py-0.5 rounded border border-white/5">
                {ram} GB
              </span>
            </div>
            <input
              type="range"
              min={2}
              max={16}
              step={1}
              value={ram}
              onChange={e => setRam(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* EULA acceptance */}
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="eula-check"
              checked={acceptEula}
              onChange={e => setAcceptEula(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
            <label htmlFor="eula-check" className="text-xs text-slate-300 cursor-pointer">
              Automatically agree to Mojang's Minecraft End User License Agreement (<span className="text-emerald-400">eula=true</span>)
            </label>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!acceptEula}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm shadow-lg shadow-emerald-900/30 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles size={16} />
              <span>Create Server</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
