import React, { useState } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Users, 
  Sliders, 
  Package, 
  Terminal, 
  Globe, 
  Play, 
  CheckCircle2, 
  ChevronRight, 
  ArrowRight, 
  Gamepad2, 
  Info,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';

interface UserGuideProps {
  onOpenCreateModal: () => void;
  onOpenSharedModal: () => void;
  onNavigateTab: (tab: string) => void;
  hasActiveServer: boolean;
}

export const UserGuide: React.FC<UserGuideProps> = ({
  onOpenCreateModal,
  onOpenSharedModal,
  onNavigateTab,
  hasActiveServer
}) => {
  const [activeSection, setActiveSection] = useState<string>('intro');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(key);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const sections = [
    { id: 'intro', label: 'What is CraftPulse?', icon: Sparkles },
    { id: 'quickstart', label: '1. Quick Start Guide', icon: Play },
    { id: 'ipv6', label: '2. Playing with Friends (No Port Forwarding)', icon: ShieldCheck },
    { id: 'coop', label: '3. Co-op Multi-Host Sync (Share Worlds)', icon: Users },
    { id: 'toggles', label: '4. Visual Settings & Rules', icon: Sliders },
    { id: 'mods', label: '5. Mods & Plugins Hub', icon: Package },
    { id: 'console', label: '6. Live Console & OP Powers', icon: Terminal },
    { id: 'troubleshooting', label: '7. Troubleshooting & Java', icon: Info },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#171c26] via-[#1a2130] to-[#121620] p-8 rounded-3xl border border-[#273043] shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <BookOpen size={14} />
              <span>CraftPulse User Guide & Feature Tour</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Host Minecraft on Windows, <span className="text-emerald-400">Zero Hassle</span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              No router port-forwarding, no confusing server files, and no monthly fees. Learn what CraftPulse does and how you and your friends can start playing together in minutes.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 flex-shrink-0">
            <button
              onClick={onOpenCreateModal}
              className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/40 text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Play size={16} />
              <span>Create a Server</span>
            </button>
            <button
              onClick={onOpenSharedModal}
              className="px-5 py-3 bg-[#1e2536] hover:bg-[#283248] text-slate-200 font-semibold rounded-xl border border-white/5 text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Users size={16} className="text-blue-400" />
              <span>Join Friend's Co-op</span>
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {sections.map((s) => {
          const Icon = s.icon;
          const isActive = activeSection === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                  : 'bg-[#141822] text-slate-400 hover:text-slate-200 hover:bg-[#1a202d] border border-white/5'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-white' : 'text-slate-400'} />
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* CONTENT SECTIONS */}

      {/* 0. What is CraftPulse */}
      {activeSection === 'intro' && (
        <div className="space-y-6">
          <div className="bg-[#141822] rounded-2xl p-6 border border-[#232938] shadow-lg space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <Sparkles className="text-emerald-400" size={22} />
              What is CraftPulse?
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              CraftPulse is a <strong>native Windows desktop app</strong> designed to make running a Minecraft server as simple as clicking a button. In the past, setting up a Minecraft server meant downloading JAR files, writing script files, opening complicated router settings, and editing messy text files. CraftPulse eliminates all of that by handling everything directly on your computer through a friendly visual dashboard.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3">
              <div className="p-4 rounded-xl bg-[#0e1118] border border-white/5 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                  1
                </div>
                <h3 className="font-semibold text-white text-sm">100% Free & Self-Hosted</h3>
                <p className="text-xs text-slate-400">
                  Runs directly on your computer's hardware. No monthly subscription fees or third-party web hosts required.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0e1118] border border-white/5 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                  2
                </div>
                <h3 className="font-semibold text-white text-sm">No Port Forwarding</h3>
                <p className="text-xs text-slate-400">
                  Built-in direct IPv6 allows friends to join directly over the internet without touching your router settings.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0e1118] border border-white/5 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                  3
                </div>
                <h3 className="font-semibold text-white text-sm">Co-op Multi-Host Sync</h3>
                <p className="text-xs text-slate-400">
                  Share your server with friends so anyone can host when you are offline. World saves sync automatically without accounts.
                </p>
              </div>
            </div>
          </div>

          {/* Core Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#141822] p-5 rounded-2xl border border-[#232938] space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                  <Sliders size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Visual Config Toggles</h4>
                  <p className="text-xs text-slate-400">Never edit server.properties manually</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Toggle PVP, gamemodes, hardcore mode, difficulty, and spawn rules with instant on/off switches. Customize your MOTD with live Minecraft color code preview.
              </p>
              <button
                onClick={() => setActiveSection('toggles')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Read how to use toggles</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="bg-[#141822] p-5 rounded-2xl border border-[#232938] space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Package size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Mod & Plugin Hub</h4>
                  <p className="text-xs text-slate-400">Integrated Modrinth search & toggles</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Search thousands of popular mods and plugins directly inside CraftPulse. Install them in 1-click and toggle them on/off without deleting your files.
              </p>
              <button
                onClick={() => setActiveSection('mods')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Read how to manage mods</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Quick Start Guide */}
      {activeSection === 'quickstart' && (
        <div className="bg-[#141822] rounded-2xl p-6 border border-[#232938] shadow-lg space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <Play className="text-emerald-400" size={22} />
              Quick Start: Create & Run Your First Server
            </h2>
            <p className="text-slate-300 text-sm mt-1">
              Follow these simple 4 steps to get a Minecraft server up and running on your PC in less than two minutes.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4 p-4 rounded-xl bg-[#0e1118] border border-white/5 items-start">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                1
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-white text-sm">Click "+ New Server"</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  In the left sidebar, click the <strong className="text-emerald-400">+</strong> button next to "Servers". A friendly creation wizard will pop up.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 rounded-xl bg-[#0e1118] border border-white/5 items-start">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                2
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-white text-sm">Choose Your Server Type & Version</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Pick a name (e.g. <em>"Survival with Friends"</em>) and choose your server software:
                </p>
                <ul className="text-xs text-slate-400 list-disc list-inside space-y-1 pt-1 pl-1">
                  <li><strong className="text-slate-200">PaperMC (Recommended)</strong>: Ultra-fast performance, bug-fixes, and supports Spigot/Paper plugins.</li>
                  <li><strong className="text-slate-200">Fabric</strong>: Lightweight and perfect if you want client/server gameplay mods.</li>
                  <li><strong className="text-slate-200">Vanilla</strong>: The official Mojang server experience.</li>
                </ul>
                <p className="text-xs text-emerald-400/90 pt-1">
                  💡 CraftPulse automatically pulls live version updates (including 1.21.x+) directly from the developers, so you're always up to date.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 rounded-xl bg-[#0e1118] border border-white/5 items-start">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                3
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-white text-sm">Auto-Download & Setup</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Click <strong>"Create Server"</strong>. CraftPulse automatically downloads the official server JAR file for you and sets up your world folder. You don't have to download anything manually.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 rounded-xl bg-[#0e1118] border border-white/5 items-start">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                4
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-white text-sm">Hit "Start Server" & Play!</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Click the green <strong>"Start Server"</strong> button on your dashboard. When the status turns green (<span className="text-emerald-400 font-semibold">Running</span>), launch Minecraft and join using your local IP or direct IPv6 address!
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={onOpenCreateModal}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-950/40"
            >
              <span>Ready? Click Here to Create Server</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* 2. Direct IPv6 (No Port Forwarding) */}
      {activeSection === 'ipv6' && (
        <div className="bg-[#141822] rounded-2xl p-6 border border-[#232938] shadow-lg space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <ShieldCheck className="text-emerald-400" size={22} />
              Playing with Friends (Direct IPv6 — No Port Forwarding)
            </h2>
            <p className="text-slate-300 text-sm mt-1">
              How your friends connect to your server from their own homes without needing router configurations or third-party accounts.
            </p>
          </div>

          <div className="bg-[#0e1118] p-4 rounded-xl border border-emerald-500/20 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
              <Zap size={16} />
              <span>Why Direct IPv6 is Better</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Traditional Minecraft hosting required logging into your Wi-Fi router to set up <em>Port Forwarding</em>. Most modern internet service providers use "Carrier-Grade NAT" (CGNAT), which blocks traditional port forwarding completely.
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              CraftPulse solves this by binding to your computer's <strong>Direct IPv6 address</strong>. IPv6 allows devices to talk directly to each other peer-to-peer across the internet without any port forwarding or middlemen relays.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-white text-base">Step-by-Step: How to Invite Friends</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#0e1118] border border-white/5 space-y-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Step 1: On Your PC (Host)</span>
                <ol className="text-xs text-slate-300 list-decimal list-inside space-y-2">
                  <li>Click <strong>Start Server</strong> in CraftPulse.</li>
                  <li>In the <strong>Direct IPv6 Hosting</strong> section on the Overview page, click the green <strong>"Copy Direct IPv6 Address"</strong> button.</li>
                  <li>Paste and send that address to your friends over Discord, WhatsApp, or chat.</li>
                </ol>
              </div>

              <div className="p-4 rounded-xl bg-[#0e1118] border border-white/5 space-y-2">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wide">Step 2: On Your Friend's PC</span>
                <ol className="text-xs text-slate-300 list-decimal list-inside space-y-2">
                  <li>Open Minecraft on their PC.</li>
                  <li>Click <strong>Multiplayer</strong> &rarr; <strong>Direct Connection</strong> (or Add Server).</li>
                  <li>Paste the exact copied address (including the square brackets <code className="text-emerald-400 font-mono">[...]</code>).</li>
                  <li>Click <strong>Join Server</strong>!</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#10141f] border border-white/5 space-y-3">
            <h4 className="font-semibold text-white text-sm flex items-center gap-2">
              <Info size={16} className="text-amber-400" />
              What about friends on the same Wi-Fi or with IPv4-only internet?
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
              <div className="p-3 bg-[#0a0d13] rounded-lg border border-white/5">
                <strong className="text-slate-100 block mb-1">🏠 Playing on the same Home Wi-Fi / LAN:</strong>
                Use the <strong>Local LAN IP</strong> shown in the secondary box on your dashboard (e.g. <code className="text-blue-400 font-mono">192.168.1.x:25565</code>). Anyone in your house can connect directly with zero lag.
              </div>
              <div className="p-3 bg-[#0a0d13] rounded-lg border border-white/5">
                <strong className="text-slate-100 block mb-1">🌐 Friend's ISP doesn't support IPv6 yet:</strong>
                Flip the <strong>"Optional Tunnel"</strong> switch on your Overview page. CraftPulse provides a backup tunnel link (e.g. <code className="text-amber-400 font-mono">joinmc.link</code>) for IPv4-only connections.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Co-op Multi-Host Sync (Option B) */}
      {activeSection === 'coop' && (
        <div className="bg-[#141822] rounded-2xl p-6 border border-[#232938] shadow-lg space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <Users className="text-blue-400" size={22} />
              Co-op Multi-Host Sync (Option B Shared World System)
            </h2>
            <p className="text-slate-300 text-sm mt-1">
              Play together on the same world even when the original creator is away or offline, with zero third-party accounts.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/30 to-[#0e1118] border border-blue-500/20 space-y-2">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <span>The Problem with Traditional Hosting:</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Normally, if you host a world on your PC, your friends can only play when <em>your</em> computer is on. If you go to sleep or study, your friends are locked out unless you manually zip up the world folder and email it to them.
            </p>
            <h3 className="font-bold text-blue-400 text-sm pt-1">
              How CraftPulse Option B Solves This:
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              CraftPulse turns your server into a <strong>shared peer-to-peer co-op world</strong>. Anyone in your friend group with CraftPulse can host the server. Whenever someone finishes playing, CraftPulse syncs the latest world saves peer-to-peer across everyone's computers!
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-white text-base">How to Use Shared Co-op in 3 Steps:</h3>

            <div className="space-y-3">
              <div className="flex gap-4 p-4 rounded-xl bg-[#0e1118] border border-white/5 items-start">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  1
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-white text-sm">Generate an Invite Code</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Click the <strong>Share</strong> button on your server dashboard (or the <Users size={12} className="inline text-blue-400" /> icon in the sidebar). CraftPulse will generate a secure invite code that starts with <code className="text-emerald-400 font-mono">CP-SYNC-...</code>. Click "Copy Invite Code".
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-xl bg-[#0e1118] border border-white/5 items-start">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  2
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-white text-sm">Your Friend Joins</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Your friend opens CraftPulse on their PC, clicks the <Users size={12} className="inline text-blue-400" /> icon, selects the <strong>"Join Friend's Server"</strong> tab, pastes your code, and clicks <strong>"Join & Sync World"</strong>. CraftPulse connects PC-to-PC and automatically downloads the world files.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-xl bg-[#0e1118] border border-white/5 items-start">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  3
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-white text-sm">Taking Turns Hosting (Host Lock)</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    To make sure two people don't host at the same time (which would mess up world saves), CraftPulse uses an automatic <strong>Host Lock</strong>:
                  </p>
                  <ul className="text-xs text-slate-400 list-disc list-inside space-y-1 pt-1 pl-1">
                    <li>When you start the server, your friends' CraftPulse dashboards will show: <em>"🟢 Hosted by [Your Name]"</em> with your join address.</li>
                    <li>When you stop the server, it becomes <em>"⚪ Idle"</em>.</li>
                    <li>Your friend can simply click <strong>"Take Over Hosting"</strong> or <strong>"Start Server"</strong> on their PC to pick up exactly where your group left off!</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={onOpenSharedModal}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-950/40"
            >
              <span>Open Co-op Multi-Host Window</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* 4. Visual Config Toggles */}
      {activeSection === 'toggles' && (
        <div className="bg-[#141822] rounded-2xl p-6 border border-[#232938] shadow-lg space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <Sliders className="text-purple-400" size={22} />
              Visual Settings & Gameplay Rules
            </h2>
            <p className="text-slate-300 text-sm mt-1">
              Customize your server without editing confusing text files. Everything is controlled by visual toggles and sliders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#0e1118] border border-white/5 space-y-2">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                ⚔️ Gameplay & Combat Toggles
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Flip switches for <strong>PVP</strong> (Player vs Player damage), <strong>Hardcore Mode</strong> (one life only), <strong>Spawn Monsters</strong>, <strong>Spawn Animals</strong>, and <strong>Command Blocks</strong>.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0e1118] border border-white/5 space-y-2">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                🌍 World & Gamemode Rules
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Switch default gamemodes between <strong>Survival</strong>, <strong>Creative</strong>, <strong>Adventure</strong>, and <strong>Spectator</strong> with a single dropdown. Choose difficulty from Peaceful to Hard.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0e1118] border border-white/5 space-y-2">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                🔒 Security & Whitelist
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Turn on <strong>Whitelist</strong> to only allow trusted friends into the server. Online-mode verifies official Minecraft accounts.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0e1118] border border-white/5 space-y-2">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                🎨 Live MOTD Color Codes
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Type your server message and use Minecraft color codes like <code className="text-emerald-400 font-mono">&a</code> for green, <code className="text-red-400 font-mono">&c</code> for red, or <code className="text-amber-400 font-mono">&e</code> for yellow. A live preview shows exactly how it appears in the multiplayer server list!
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#10141f] border border-white/5 space-y-2">
            <h4 className="font-semibold text-white text-sm">💡 Important Tip:</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              After changing switches in <strong>Config Toggles</strong>, click the green <strong>"Save Properties"</strong> button at the bottom. If your server is currently running, restart it to apply the new rules.
            </p>
          </div>

          {hasActiveServer && (
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => onNavigateTab('toggles')}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-sm flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-purple-950/40"
              >
                <span>Go to Config Toggles for Active Server</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* 5. Mods & Plugins Hub */}
      {activeSection === 'mods' && (
        <div className="bg-[#141822] rounded-2xl p-6 border border-[#232938] shadow-lg space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <Package className="text-emerald-400" size={22} />
              Mod & Plugin Hub (Modrinth Integration)
            </h2>
            <p className="text-slate-300 text-sm mt-1">
              Search, download, and manage server mods and plugins with 1-click ease.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#0e1118] border border-white/5 space-y-2">
              <h3 className="font-bold text-white text-sm">How to Install Mods & Plugins:</h3>
              <ol className="text-xs text-slate-300 list-decimal list-inside space-y-2">
                <li>Select your server and click <strong>Mod & Plugin Hub</strong> in the left sidebar.</li>
                <li>In the search bar, type the name of any mod or plugin (e.g. <em>"Lithium"</em>, <em>"FerriteCore"</em>, <em>"Essentials"</em>, <em>"Chunky"</em>).</li>
                <li>CraftPulse queries the official <strong>Modrinth</strong> library and filters only files that match your server's exact loader (Fabric/Paper) and Minecraft version.</li>
                <li>Click <strong>Install</strong>. The JAR file is downloaded and placed into your server's <code className="text-emerald-400 font-mono">mods</code> or <code className="text-emerald-400 font-mono">plugins</code> folder instantly.</li>
              </ol>
            </div>

            <div className="p-4 rounded-xl bg-[#0e1118] border border-white/5 space-y-2">
              <h3 className="font-bold text-white text-sm">The 1-Click Toggle Switch (Safe Testing):</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Ever installed a mod that caused lag or crashed your server? Usually, you'd have to find the file and delete it. In CraftPulse, every installed mod has a green on/off switch:
              </p>
              <ul className="text-xs text-slate-400 list-disc list-inside space-y-1 pt-1 pl-1">
                <li>Flip the switch <strong>OFF</strong>: CraftPulse renames it to <code className="text-slate-300 font-mono">.disabled</code> so Minecraft ignores it, but your configurations and files are preserved.</li>
                <li>Flip the switch <strong>ON</strong>: Re-enables the mod instantly without redownloading.</li>
              </ul>
            </div>
          </div>

          {hasActiveServer && (
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => onNavigateTab('mods')}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-950/40"
              >
                <span>Open Mod Hub for Active Server</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* 6. Live Console & In-Game Commands */}
      {activeSection === 'console' && (
        <div className="bg-[#141822] rounded-2xl p-6 border border-[#232938] shadow-lg space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <Terminal className="text-emerald-400" size={22} />
              Live Console & Admin Commands
            </h2>
            <p className="text-slate-300 text-sm mt-1">
              Give yourself admin powers, manage players, and watch your server's real-time events.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#0e1118] border border-white/5 space-y-2">
              <h3 className="font-bold text-white text-sm">How to Make Yourself an Admin (OP):</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                When you first start a server, you don't have creative powers or permission to use commands like <code className="text-slate-300 font-mono">/teleport</code>. To grant yourself permissions:
              </p>
              <div className="p-3 bg-[#080a0f] rounded-lg border border-white/5 flex items-center justify-between">
                <code className="text-emerald-400 font-mono text-sm">op YourMinecraftPlayerName</code>
                <button
                  onClick={() => handleCopy('op', 'op YourPlayerName')}
                  className="px-3 py-1 bg-[#1e2536] hover:bg-[#283248] text-xs text-slate-300 rounded transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {copiedText === 'op' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedText === 'op' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                (Type this directly into the <strong>Live Console</strong> input box and press Enter. You do not need to include the forward slash <code>/</code> in the console.)
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0e1118] border border-white/5 space-y-3">
              <h3 className="font-bold text-white text-sm">Helpful Console Commands Cheat Sheet:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-[#0a0d13] rounded border border-white/5 flex flex-col justify-between">
                  <code className="text-emerald-400 font-mono font-semibold">gamemode creative [player]</code>
                  <span className="text-slate-400 text-[11px] mt-1">Switch player to Creative flight mode</span>
                </div>
                <div className="p-2.5 bg-[#0a0d13] rounded border border-white/5 flex flex-col justify-between">
                  <code className="text-emerald-400 font-mono font-semibold">time set day</code>
                  <span className="text-slate-400 text-[11px] mt-1">Sets game time to morning</span>
                </div>
                <div className="p-2.5 bg-[#0a0d13] rounded border border-white/5 flex flex-col justify-between">
                  <code className="text-emerald-400 font-mono font-semibold">weather clear</code>
                  <span className="text-slate-400 text-[11px] mt-1">Stops rain and thunderstorms</span>
                </div>
                <div className="p-2.5 bg-[#0a0d13] rounded border border-white/5 flex flex-col justify-between">
                  <code className="text-emerald-400 font-mono font-semibold">whitelist add [player]</code>
                  <span className="text-slate-400 text-[11px] mt-1">Adds a player to your private whitelist</span>
                </div>
              </div>
            </div>
          </div>

          {hasActiveServer && (
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => onNavigateTab('console')}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-950/40"
              >
                <span>Open Live Console for Active Server</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* 7. Troubleshooting & Java */}
      {activeSection === 'troubleshooting' && (
        <div className="bg-[#141822] rounded-2xl p-6 border border-[#232938] shadow-lg space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <Info className="text-amber-400" size={22} />
              Troubleshooting & Java Version Guide
            </h2>
            <p className="text-slate-300 text-sm mt-1">
              Quick answers to the two most common Minecraft hosting questions on Windows.
            </p>
          </div>

          <div className="space-y-4">
            {/* Issue 1: Windows Firewall */}
            <div className="p-4 rounded-xl bg-[#0e1118] border border-white/5 space-y-2">
              <h3 className="font-bold text-amber-400 text-sm flex items-center gap-2">
                🛡️ Windows Defender Firewall Prompt
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                The very first time you click <strong>"Start Server"</strong>, Windows Defender Firewall will show a popup asking: <em>"Windows Defender Firewall has blocked some features of this app (Java Platform SE binary)"</em>.
              </p>
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-200">
                <strong>What to do:</strong> Check the box for <strong>"Private networks"</strong> AND check the box for <strong>"Public networks"</strong>, then click <strong>"Allow access"</strong>. This permits incoming connections so your friends can join.
              </div>
            </div>

            {/* Issue 2: Java Requirements */}
            <div className="p-4 rounded-xl bg-[#0e1118] border border-white/5 space-y-2">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                ☕ Which Java version do I need?
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Modern Minecraft versions require newer Java runtime versions. If you have an old Java 8 installed, newer servers will fail to boot:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                <div className="p-3 bg-[#080a0f] rounded-lg border border-white/5">
                  <span className="font-bold text-emerald-400 block mb-0.5">Minecraft 1.20.5 and 1.21+</span>
                  <span className="text-slate-300">Requires <strong>Java 21</strong></span>
                </div>
                <div className="p-3 bg-[#080a0f] rounded-lg border border-white/5">
                  <span className="font-bold text-blue-400 block mb-0.5">Minecraft 1.18 to 1.20.4</span>
                  <span className="text-slate-300">Requires <strong>Java 17</strong></span>
                </div>
              </div>
              <p className="text-xs text-slate-400 pt-2 leading-relaxed">
                CraftPulse automatically scans your Windows Registry and PATH to pick the best Java installed. If you need to install Java, download <strong>Eclipse Temurin (Adoptium)</strong> — it is free, open source, and officially recommended for Minecraft.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
