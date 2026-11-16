import React, { useState, useEffect } from 'react';
import { ServerInstance, HostLockState } from '../types/server';
import { 
  Play, 
  Square, 
  RotateCw, 
  Copy, 
  Check, 
  Globe, 
  Cpu, 
  HardDrive, 
  ArrowRight,
  Sliders,
  Package,
  Terminal,
  Zap,
  Home,
  ShieldCheck,
  Users,
  Share2,
  RefreshCw,
  AlertCircle,
  BookOpen
} from 'lucide-react';

interface DashboardProps {
  server: ServerInstance;
  onStart: () => void;
  onStop: () => void;
  onNavigateTab: (tab: string) => void;
  onToggleTunnel: (enabled: boolean) => void;
  onOpenSharedModal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  server,
  onStart,
  onStop,
  onNavigateTab,
  onToggleTunnel,
  onOpenSharedModal
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [networkAddrs, setNetworkAddrs] = useState<{
    lanIpv4: string;
    globalIpv6: string | null;
    publicIpv4: string | null;
  } | null>(null);
  const [hostLock, setHostLock] = useState<HostLockState | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (window.craftPulseAPI) {
      window.craftPulseAPI.getNetworkAddresses().then(setNetworkAddrs);
    } else {
      setNetworkAddrs({
        lanIpv4: '192.168.1.105',
        globalIpv6: '2401:4900:1c68:840f:215a:a140:3d58:4a12',
        publicIpv4: '49.37.117.3'
      });
    }
  }, []);

  useEffect(() => {
    if (server.isShared && window.craftPulseAPI?.getSharedLockState) {
      window.craftPulseAPI.getSharedLockState(server.id)
        .then(setHostLock)
        .catch(console.error);

      const unsub = window.craftPulseAPI.onLockChange((data) => {
        if (data.serverId === server.id) {
          setHostLock(data.lock);
        }
      });
      return () => unsub();
    } else {
      setHostLock(null);
    }
  }, [server.id, server.isShared]);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleTakeover = async () => {
    if (!window.craftPulseAPI?.takeoverHost) return;
    try {
      setIsSyncing(true);
      setSyncFeedback('Transferring host lease & synchronizing latest world state...');
      const res = await window.craftPulseAPI.takeoverHost(server.id);
      setHostLock(res.currentLock);
      setSyncFeedback(res.success ? 'Hosting rights transferred to you!' : 'Takeover could not be completed');
      setTimeout(() => setSyncFeedback(null), 3500);
    } catch (err: any) {
      setSyncFeedback(`Takeover error: ${err.message}`);
      setTimeout(() => setSyncFeedback(null), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncWorld = async () => {
    if (!window.craftPulseAPI?.syncSharedServer) return;
    try {
      setIsSyncing(true);
      setSyncFeedback('Checking peers for delta world updates...');
      const res = await window.craftPulseAPI.syncSharedServer(server.id);
      setSyncFeedback(`Sync complete! ${res.updatedFiles} files updated.`);
      setTimeout(() => setSyncFeedback(null), 3500);
    } catch (err: any) {
      setSyncFeedback(`Sync failed: ${err.message}`);
      setTimeout(() => setSyncFeedback(null), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  const isRunning = server.status === 'RUNNING';
  const isStarting = server.status === 'STARTING';
  const isStopping = server.status === 'STOPPING';
  const isPeerHosting = Boolean(server.isShared && hostLock?.isLocked && !hostLock?.isSelfHosting);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#171b24] via-[#1a1f2c] to-[#171b24] p-6 rounded-2xl border border-[#272e3f] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h2 className="text-2xl font-bold text-white tracking-tight">{server.name}</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
              {server.loader} {server.mcVersion}
            </span>
            {server.isShared && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                <Users size={12} />
                Multi-Host Co-op
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400">
            Path: <span className="font-mono text-xs text-slate-300 bg-[#12141a] px-2 py-1 rounded border border-white/5">{server.path}</span>
          </p>
        </div>

        {/* Start / Stop / Co-op Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={onOpenSharedModal}
            title="Share Server or Invite Friends"
            className="flex items-center gap-2 px-4 py-3 bg-[#1e2433] hover:bg-[#283042] text-slate-200 text-sm font-semibold rounded-xl border border-white/5 transition-all cursor-pointer shadow-md"
          >
            <Share2 size={16} className="text-emerald-400" />
            <span>Share</span>
          </button>

          {isPeerHosting ? (
            <button
              onClick={handleTakeover}
              disabled={isSyncing}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 active:scale-95 text-white font-semibold rounded-xl shadow-lg shadow-amber-900/30 transition-all cursor-pointer"
            >
              {isSyncing ? <RotateCw className="animate-spin" size={18} /> : <RefreshCw size={18} />}
              <span>Take Over Hosting</span>
            </button>
          ) : isRunning ? (
            <button
              onClick={onStop}
              disabled={isStopping}
              className="flex items-center gap-2 px-6 py-3 bg-red-600/90 hover:bg-red-600 active:scale-95 text-white font-semibold rounded-xl shadow-lg shadow-red-900/30 transition-all cursor-pointer"
            >
              {isStopping ? <RotateCw className="animate-spin" size={18} /> : <Square size={18} />}
              <span>{isStopping ? 'Stopping...' : 'Stop Server'}</span>
            </button>
          ) : (
            <button
              onClick={onStart}
              disabled={isStarting}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 active:scale-95 text-white font-semibold rounded-xl shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
            >
              {isStarting ? <RotateCw className="animate-spin" size={18} /> : <Play size={18} />}
              <span>{isStarting ? 'Starting Up...' : 'Start Server'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Sync Feedback Alert */}
      {syncFeedback && (
        <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            <span>{syncFeedback}</span>
          </div>
        </div>
      )}

      {/* Shared Co-op Multi-Host Status Panel (Option B) */}
      {server.isShared && (
        <div className="bg-[#141824] rounded-2xl p-5 border border-blue-500/20 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <Users size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  Multi-Host Co-op System
                  <span className="text-[10px] font-mono bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">
                    Option B P2P
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Shared folder synced with friends — anyone in your group can host and world saves stay updated
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSyncWorld}
                disabled={isSyncing || isRunning}
                className="px-3.5 py-2 bg-[#1b2233] hover:bg-[#252f47] disabled:opacity-50 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-white/5 flex items-center gap-2 transition-all cursor-pointer"
              >
                <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
                <span>Sync World Now</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Host State Card */}
            <div className="p-4 rounded-xl bg-[#0d1017] border border-white/5 space-y-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                Current Host Status
              </span>
              {hostLock?.isLocked ? (
                hostLock.isSelfHosting ? (
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>You are currently hosting this server</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                      <span>Hosted by: {hostLock.activeHostName || 'Friend Device'}</span>
                    </div>
                    {hostLock.hostAddress && (
                      <p className="text-xs text-slate-400">
                        Friend Address: <code className="text-emerald-400 font-mono select-all">{hostLock.hostAddress}</code>
                      </p>
                    )}
                  </div>
                )
              ) : (
                <div className="flex items-center gap-2 text-slate-300 font-medium text-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                  <span>Server Idle — Ready for anyone to host</span>
                </div>
              )}
              <p className="text-[11px] text-slate-500">
                Automatic 3-minute lease lock prevents world save conflicts between friends.
              </p>
            </div>

            {/* Quick Friend Join Info */}
            <div className="p-4 rounded-xl bg-[#0d1017] border border-white/5 flex flex-col justify-between space-y-2">
              <div>
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                  How Co-op Works
                </span>
                <p className="text-xs text-slate-300 mt-1">
                  When the host stops the server or goes offline, world changes are hashed into a manifest. Whoever starts next automatically syncs before booting.
                </p>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">Zero external accounts needed</span>
                <button
                  onClick={onOpenSharedModal}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>Invite Friends</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multiplayer Network Hub */}
      <div className="bg-[#161a23] rounded-2xl p-6 border border-[#262c3b] shadow-lg space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/5">
          <div>
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <ShieldCheck className="text-emerald-400" size={22} />
              Direct IPv6 Hosting (Zero Third-Party Services)
            </h3>
            <p className="text-xs text-slate-400">
              Host directly from your computer without any third-party websites, accounts, or cloud relays
            </p>
          </div>
          <span className="text-[11px] font-semibold font-mono bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 w-fit">
            100% Direct P2P
          </span>
        </div>

        {/* Hero Card: Direct IPv6 Address */}
        <div className="bg-gradient-to-br from-[#131b26] to-[#0f141d] p-5 rounded-xl border border-emerald-500/30 shadow-md space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 uppercase tracking-wide">
                <Zap size={14} className="text-emerald-400" /> Minecraft Server Join Address
              </span>
              <p className="text-xs text-slate-400">
                Share this address with your friends. IPv6 naturally bypasses CGNAT and port forwarding restrictions.
              </p>
            </div>

            {networkAddrs?.globalIpv6 && (
              <button
                onClick={() => handleCopy('ipv6', `[${networkAddrs.globalIpv6}]:25565`)}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-950/40 cursor-pointer flex-shrink-0"
              >
                {copiedKey === 'ipv6' ? <Check size={15} /> : <Copy size={15} />}
                <span>{copiedKey === 'ipv6' ? 'Copied to Clipboard!' : 'Copy Direct IPv6 Address'}</span>
              </button>
            )}
          </div>

          <div className="bg-[#0b0e14] p-4 rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="truncate">
              <span className="text-[10px] font-mono text-slate-500 uppercase block mb-0.5">Direct Connect Format:</span>
              <span className="font-mono text-sm sm:text-base font-bold text-emerald-400 truncate block select-all">
                {networkAddrs?.globalIpv6 
                  ? `[${networkAddrs.globalIpv6}]:25565` 
                  : 'Detecting network IPv6 address...'}
              </span>
            </div>

            {!networkAddrs?.globalIpv6 && (
              <span className="text-xs text-amber-400 bg-amber-500/10 px-3 py-1 rounded border border-amber-500/20 flex-shrink-0">
                IPv6 not found on adapter
              </span>
            )}
          </div>

          {/* Direct Connection Quick Help */}
          <div className="bg-[#12161f] p-3.5 rounded-lg border border-white/5 text-xs text-slate-300 space-y-1.5">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <span>💡 How your friends join:</span>
            </div>
            <ul className="list-disc list-inside text-slate-400 space-y-1 pl-1">
              <li>In Minecraft, click <strong className="text-slate-300">Multiplayer</strong> &rarr; <strong className="text-slate-300">Direct Connection</strong> &rarr; paste the address above (the square brackets <code className="text-emerald-400 font-mono">[...]</code> are required).</li>
              <li>Ensure your <strong className="text-slate-300">Windows Defender Firewall</strong> has an inbound rule allowing Java / Port 25565 (TCP).</li>
            </ul>
          </div>
        </div>

        {/* Secondary Options Grid: Local LAN & Optional Backup Tunnel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Local LAN IP */}
          <div className="p-4 rounded-xl border bg-[#111319] border-[#222736] flex flex-col justify-between space-y-2">
            <div>
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Home size={14} className="text-blue-400" /> Same Wi-Fi / Local LAN
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                For devices connected to your same home router.
              </p>
            </div>
            <div className="flex items-center justify-between gap-2 bg-[#0c0e12] p-2.5 rounded-lg border border-white/5">
              <span className="font-mono text-xs font-semibold text-slate-200 truncate">
                {networkAddrs?.lanIpv4 || '127.0.0.1'}:25565
              </span>
              <button
                onClick={() => handleCopy('lan', `${networkAddrs?.lanIpv4 || '127.0.0.1'}:25565`)}
                className="px-2.5 py-1 bg-[#1e2533] hover:bg-[#2a3142] text-slate-300 text-xs rounded transition-colors flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'lan' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copiedKey === 'lan' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Backup 1-Click Internet Tunnel */}
          <div className="p-4 rounded-xl border bg-[#111319] border-[#222736] flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Globe size={14} className="text-amber-400" /> Optional Tunnel (For IPv4-Only Friends)
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={server.tunnelEnabled}
                  onChange={(e) => onToggleTunnel(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between gap-2 bg-[#0c0e12] p-2.5 rounded-lg border border-white/5">
              <span className="font-mono text-xs font-semibold text-slate-400 truncate">
                {server.tunnelEnabled 
                  ? (server.tunnelAddress || 'Connecting tunnel...') 
                  : 'Disabled'}
              </span>
              {server.tunnelEnabled && server.tunnelAddress && (
                <button
                  onClick={() => handleCopy('tunnel', server.tunnelAddress!)}
                  className="px-2.5 py-1 bg-[#1e2533] hover:bg-[#2a3142] text-slate-300 text-xs rounded transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'tunnel' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedKey === 'tunnel' ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics & Telemetry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#161a23] p-5 rounded-2xl border border-[#262c3b] shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">RAM Allocation</span>
            <HardDrive size={18} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {server.minRamGb} GB - {server.maxRamGb} GB
          </div>
          <p className="text-xs text-slate-400 mt-1">Configured JVM Heap Size</p>
        </div>

        <div className="bg-[#161a23] p-5 rounded-2xl border border-[#262c3b] shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Server Status</span>
            <div className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-slate-600'}`} />
          </div>
          <div className="text-2xl font-bold text-white capitalize">
            {server.status.toLowerCase()}
          </div>
          <p className="text-xs text-slate-400 mt-1">Auto-restart enabled</p>
        </div>

        <div className="bg-[#161a23] p-5 rounded-2xl border border-[#262c3b] shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Default Port</span>
            <Cpu size={18} className="text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            25565
          </div>
          <p className="text-xs text-slate-400 mt-1">TCP Protocol</p>
        </div>
      </div>

      {/* Quick Access Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        <button
          onClick={() => onNavigateTab('toggles')}
          className="p-4 bg-[#161a23] hover:bg-[#1c212c] border border-[#262c3b] hover:border-emerald-500/30 rounded-xl text-left transition-all flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Sliders size={20} className="text-emerald-400" />
            <div>
              <div className="font-semibold text-white text-sm">Configure Toggles</div>
              <div className="text-xs text-slate-400">PVP, Gamemode, Seed</div>
            </div>
          </div>
          <ArrowRight size={16} className="text-slate-500 group-hover:text-emerald-400 transition-transform group-hover:translate-x-1" />
        </button>

        <button
          onClick={() => onNavigateTab('mods')}
          className="p-4 bg-[#161a23] hover:bg-[#1c212c] border border-[#262c3b] hover:border-emerald-500/30 rounded-xl text-left transition-all flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Package size={20} className="text-emerald-400" />
            <div>
              <div className="font-semibold text-white text-sm">Manage Mods</div>
              <div className="text-xs text-slate-400">Install & Toggle Mods</div>
            </div>
          </div>
          <ArrowRight size={16} className="text-slate-500 group-hover:text-emerald-400 transition-transform group-hover:translate-x-1" />
        </button>

        <button
          onClick={() => onNavigateTab('console')}
          className="p-4 bg-[#161a23] hover:bg-[#1c212c] border border-[#262c3b] hover:border-emerald-500/30 rounded-xl text-left transition-all flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Terminal size={20} className="text-emerald-400" />
            <div>
              <div className="font-semibold text-white text-sm">Live Terminal</div>
              <div className="text-xs text-slate-400">Run OP commands & logs</div>
            </div>
          </div>
          <ArrowRight size={16} className="text-slate-500 group-hover:text-emerald-400 transition-transform group-hover:translate-x-1" />
        </button>

        <button
          onClick={() => onNavigateTab('guide')}
          className="p-4 bg-[#161a23] hover:bg-[#1c212c] border border-[#262c3b] hover:border-blue-500/30 rounded-xl text-left transition-all flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <BookOpen size={20} className="text-blue-400" />
            <div>
              <div className="font-semibold text-white text-sm">App Guide</div>
              <div className="text-xs text-slate-400">Features & How-to</div>
            </div>
          </div>
          <ArrowRight size={16} className="text-slate-500 group-hover:text-blue-400 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
};
