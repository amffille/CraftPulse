import React, { useState, useEffect } from 'react';
import { ServerInstance, ServerProperties } from '../types/server';
import { 
  Save, 
  Check, 
  Dices, 
  ShieldAlert, 
  Eye, 
  Gamepad2, 
  Globe2, 
  SlidersHorizontal,
  Info
} from 'lucide-react';

interface ConfigTogglesProps {
  server: ServerInstance;
}

export const ConfigToggles: React.FC<ConfigTogglesProps> = ({ server }) => {
  const [properties, setProperties] = useState<ServerProperties | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'gameplay' | 'world' | 'security' | 'motd'>('gameplay');

  useEffect(() => {
    loadProperties();
  }, [server.id]);

  const loadProperties = async () => {
    if (window.craftPulseAPI) {
      try {
        const props = await window.craftPulseAPI.getProperties(server.id);
        setProperties(props);
      } catch (err) {
        console.error('Failed to load server properties:', err);
      }
    } else {
      // Browser fallback/demo
      setProperties({
        difficulty: 'normal',
        gamemode: 'survival',
        hardcore: false,
        pvp: true,
        'white-list': false,
        'online-mode': true,
        'enable-command-block': true,
        'spawn-monsters': true,
        'spawn-animals': true,
        'spawn-npcs': true,
        'allow-nether': true,
        'generate-structures': true,
        'spawn-protection': 16,
        'max-players': 20,
        'view-distance': 10,
        'simulation-distance': 10,
        'server-port': 25565,
        motd: '§aWelcome to §bCraftPulse §eServer!',
        'level-seed': '',
        'level-name': 'world',
        'enforce-whitelist': false
      });
    }
  };

  const handleToggle = (key: string, val: boolean) => {
    if (!properties) return;
    setProperties({ ...properties, [key]: val });
  };

  const handleValueChange = (key: string, val: any) => {
    if (!properties) return;
    setProperties({ ...properties, [key]: val });
  };

  const handleSave = async () => {
    if (!properties) return;
    setSaving(true);
    if (window.craftPulseAPI) {
      await window.craftPulseAPI.saveProperties(server.id, properties);
    }
    setSaving(false);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  const randomizeSeed = () => {
    const randomSeed = Math.floor(Math.random() * 9007199254740991).toString();
    handleValueChange('level-seed', randomSeed);
  };

  if (!properties) {
    return <div className="p-8 text-center text-slate-400">Loading server configuration...</div>;
  }

  // Format Minecraft MOTD with basic color codes (§ or &)
  const renderMotdPreview = (raw: string) => {
    const parts = raw.split(/(§[0-9a-fk-or]|&[0-9a-fk-or])/i);
    const colorMap: Record<string, string> = {
      '0': '#000000', '1': '#0000AA', '2': '#00AA00', '3': '#00AAAA',
      '4': '#AA0000', '5': '#AA00AA', '6': '#FFAA00', '7': '#AAAAAA',
      '8': '#555555', '9': '#5555FF', 'a': '#55FF55', 'b': '#55FFFF',
      'c': '#FF5555', 'd': '#FF55FF', 'e': '#FFFF55', 'f': '#FFFFFF'
    };

    let currentColor = '#FFFFFF';
    return (
      <div className="bg-[#101216] border border-[#232733] p-3 rounded-lg font-mono text-sm tracking-wide flex items-center min-h-[44px]">
        {parts.map((segment, i) => {
          if (segment.startsWith('§') || segment.startsWith('&')) {
            const code = segment[1].toLowerCase();
            currentColor = colorMap[code] || '#FFFFFF';
            return null;
          }
          return (
            <span key={i} style={{ color: currentColor }}>
              {segment}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#242a38]">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Configuration & Toggles</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Modify <span className="font-mono text-emerald-400">server.properties</span> visually without editing raw text files
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedToast && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
              <Check size={14} /> Saved! Restart server to apply
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold rounded-xl text-sm shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
          >
            <Save size={16} />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 border-b border-[#242a38] pb-1">
        <button
          onClick={() => setActiveCategory('gameplay')}
          className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-all ${
            activeCategory === 'gameplay'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Gamepad2 size={16} /> Gameplay & Rules
        </button>
        <button
          onClick={() => setActiveCategory('world')}
          className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-all ${
            activeCategory === 'world'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe2 size={16} /> World & Performance
        </button>
        <button
          onClick={() => setActiveCategory('security')}
          className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-all ${
            activeCategory === 'security'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert size={16} /> Security & Access
        </button>
        <button
          onClick={() => setActiveCategory('motd')}
          className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-all ${
            activeCategory === 'motd'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <SlidersHorizontal size={16} /> Appearance & MOTD
        </button>
      </div>

      {/* Gameplay Category */}
      {activeCategory === 'gameplay' && (
        <div className="space-y-6">
          {/* Gamemode Selector */}
          <div className="bg-[#161a23] p-6 rounded-2xl border border-[#262c3b] space-y-3">
            <label className="text-sm font-semibold text-white block">Default Gamemode</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(['survival', 'creative', 'adventure', 'spectator'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleValueChange('gamemode', mode)}
                  className={`py-3 px-4 rounded-xl text-sm font-semibold capitalize border transition-all ${
                    properties.gamemode === mode
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-900/40'
                      : 'bg-[#1b202c] text-slate-300 border-[#2b3344] hover:bg-[#222837]'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Selector */}
          <div className="bg-[#161a23] p-6 rounded-2xl border border-[#262c3b] space-y-3">
            <label className="text-sm font-semibold text-white block">World Difficulty</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(['peaceful', 'easy', 'normal', 'hard'] as const).map(diff => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => handleValueChange('difficulty', diff)}
                  className={`py-3 px-4 rounded-xl text-sm font-semibold capitalize border transition-all ${
                    properties.difficulty === diff
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-900/40'
                      : 'bg-[#1b202c] text-slate-300 border-[#2b3344] hover:bg-[#222837]'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Gameplay Switch Toggles Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ToggleCard
              title="Player vs Player (PvP)"
              description="Allow players to fight and deal damage to each other"
              checked={properties.pvp}
              onChange={val => handleToggle('pvp', val)}
            />
            <ToggleCard
              title="Hardcore Mode"
              description="Locks difficulty to Hard and permanently bans players on death"
              checked={properties.hardcore}
              onChange={val => handleToggle('hardcore', val)}
            />
            <ToggleCard
              title="Command Blocks"
              description="Enable executing commands via redstone command blocks"
              checked={properties['enable-command-block']}
              onChange={val => handleToggle('enable-command-block', val)}
            />
            <ToggleCard
              title="Spawn Monsters"
              description="Allow hostile mobs (creepers, skeletons, zombies) to spawn"
              checked={properties['spawn-monsters']}
              onChange={val => handleToggle('spawn-monsters', val)}
            />
            <ToggleCard
              title="Spawn Animals"
              description="Allow cows, sheep, pigs, and other friendly mobs to spawn"
              checked={properties['spawn-animals']}
              onChange={val => handleToggle('spawn-animals', val)}
            />
            <ToggleCard
              title="Spawn Villagers & NPCs"
              description="Allow non-player characters to spawn in villages"
              checked={properties['spawn-npcs']}
              onChange={val => handleToggle('spawn-npcs', val)}
            />
          </div>
        </div>
      )}

      {/* World & Performance Category */}
      {activeCategory === 'world' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ToggleCard
              title="Allow Nether"
              description="Allow portal teleportation to the Nether dimension"
              checked={properties['allow-nether']}
              onChange={val => handleToggle('allow-nether', val)}
            />
            <ToggleCard
              title="Generate Structures"
              description="Generate villages, temples, mineshafts, and dungeons"
              checked={properties['generate-structures']}
              onChange={val => handleToggle('generate-structures', val)}
            />
          </div>

          {/* View Distance Slider */}
          <div className="bg-[#161a23] p-6 rounded-2xl border border-[#262c3b] space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <label className="text-sm font-semibold text-white">View Distance</label>
                <p className="text-xs text-slate-400">Server chunk rendering radius sent to clients</p>
              </div>
              <span className="font-mono text-emerald-400 font-bold text-base px-3 py-1 bg-[#101217] rounded-lg border border-white/5">
                {properties['view-distance']} chunks
              </span>
            </div>
            <input
              type="range"
              min={3}
              max={32}
              value={properties['view-distance'] || 10}
              onChange={e => handleValueChange('view-distance', Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Simulation Distance Slider */}
          <div className="bg-[#161a23] p-6 rounded-2xl border border-[#262c3b] space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <label className="text-sm font-semibold text-white">Simulation Distance</label>
                <p className="text-xs text-slate-400">Distance around players where ticks (mobs, crops) are calculated</p>
              </div>
              <span className="font-mono text-emerald-400 font-bold text-base px-3 py-1 bg-[#101217] rounded-lg border border-white/5">
                {properties['simulation-distance']} chunks
              </span>
            </div>
            <input
              type="range"
              min={3}
              max={32}
              value={properties['simulation-distance'] || 10}
              onChange={e => handleValueChange('simulation-distance', Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* World Seed Input */}
          <div className="bg-[#161a23] p-6 rounded-2xl border border-[#262c3b] space-y-3">
            <label className="text-sm font-semibold text-white">World Generation Seed</label>
            <p className="text-xs text-slate-400">Leave blank for a random world seed, or enter a custom number</p>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={properties['level-seed'] || ''}
                onChange={e => handleValueChange('level-seed', e.target.value)}
                placeholder="Leave blank for random or enter seed..."
                className="flex-1 bg-[#111319] border border-[#262c3b] px-4 py-2.5 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={randomizeSeed}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#1e2433] hover:bg-[#283042] text-slate-200 text-xs font-semibold rounded-xl border border-white/5 transition-colors cursor-pointer"
              >
                <Dices size={16} className="text-emerald-400" /> Randomize
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security & Access Category */}
      {activeCategory === 'security' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ToggleCard
              title="Whitelist Protection"
              description="Only players added to whitelist.json can connect"
              checked={properties['white-list']}
              onChange={val => handleToggle('white-list', val)}
            />
            <ToggleCard
              title="Online Mode (Mojang Auth)"
              description="Verify player accounts against Mojang servers. Turn off for offline/LAN play"
              checked={properties['online-mode']}
              onChange={val => handleToggle('online-mode', val)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#161a23] p-5 rounded-2xl border border-[#262c3b] space-y-2">
              <label className="text-sm font-semibold text-white">Max Players</label>
              <p className="text-xs text-slate-400">Maximum simultaneous players allowed</p>
              <input
                type="number"
                min={1}
                max={500}
                value={properties['max-players'] || 20}
                onChange={e => handleValueChange('max-players', Number(e.target.value))}
                className="w-full bg-[#111319] border border-[#262c3b] px-4 py-2.5 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="bg-[#161a23] p-5 rounded-2xl border border-[#262c3b] space-y-2">
              <label className="text-sm font-semibold text-white">Server Port</label>
              <p className="text-xs text-slate-400">Default Minecraft port is 25565</p>
              <input
                type="number"
                min={1024}
                max={65535}
                value={properties['server-port'] || 25565}
                onChange={e => handleValueChange('server-port', Number(e.target.value))}
                className="w-full bg-[#111319] border border-[#262c3b] px-4 py-2.5 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Appearance & MOTD Category */}
      {activeCategory === 'motd' && (
        <div className="space-y-6">
          <div className="bg-[#161a23] p-6 rounded-2xl border border-[#262c3b] space-y-4">
            <label className="text-sm font-semibold text-white block">Server MOTD (Message of the Day)</label>
            <p className="text-xs text-slate-400">
              Displayed in the Minecraft multiplayer server list. Supports Minecraft formatting codes like <code className="bg-[#101217] px-1.5 py-0.5 rounded text-emerald-400 font-mono">§a</code> for green, <code className="bg-[#101217] px-1.5 py-0.5 rounded text-yellow-400 font-mono">§e</code> for yellow, etc.
            </p>
            <input
              type="text"
              value={properties.motd || ''}
              onChange={e => handleValueChange('motd', e.target.value)}
              className="w-full bg-[#111319] border border-[#262c3b] px-4 py-3 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
            />
            
            <div className="pt-2">
              <span className="text-xs text-slate-400 font-medium block mb-2">Live In-Game Preview:</span>
              {renderMotdPreview(properties.motd || 'A Minecraft Server')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface ToggleCardProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const ToggleCard: React.FC<ToggleCardProps> = ({ title, description, checked, onChange }) => {
  return (
    <div className="bg-[#161a23] p-5 rounded-2xl border border-[#262c3b] flex items-center justify-between gap-4 transition-colors hover:border-[#30384a]">
      <div className="space-y-1">
        <h4 className="text-sm font-semibold text-white">{title}</h4>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
      </label>
    </div>
  );
};
