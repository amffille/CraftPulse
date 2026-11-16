import React from 'react';
import { ServerInstance } from '../types/server';
import { 
  LayoutDashboard, 
  Sliders, 
  Package, 
  Terminal, 
  Plus, 
  Server, 
  Radio,
  Users,
  BookOpen
} from 'lucide-react';

interface SidebarProps {
  servers: ServerInstance[];
  activeServer: ServerInstance | null;
  activeTab: string;
  onSelectServer: (server: ServerInstance) => void;
  onSelectTab: (tab: string) => void;
  onOpenCreateModal: () => void;
  onOpenSharedModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  servers,
  activeServer,
  activeTab,
  onSelectServer,
  onSelectTab,
  onOpenCreateModal,
  onOpenSharedModal
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'toggles', label: 'Config Toggles', icon: Sliders },
    { id: 'mods', label: 'Mod & Plugin Hub', icon: Package },
    { id: 'console', label: 'Live Console', icon: Terminal },
    { id: 'guide', label: 'Guide & Features', icon: BookOpen },
  ];

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'RUNNING': return 'bg-emerald-500 shadow-emerald-500/50';
      case 'STARTING': return 'bg-amber-400 animate-pulse shadow-amber-400/50';
      case 'STOPPING': return 'bg-orange-500 animate-pulse';
      case 'CRASHED': return 'bg-red-500 shadow-red-500/50';
      default: return 'bg-slate-600';
    }
  };

  return (
    <aside className="w-64 bg-[#14171e] border-r border-[#222733] flex flex-col justify-between select-none">
      <div>
        {/* Branding */}
        <div className="p-4 border-b border-[#222733] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-900/30">
              ⛏️
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                CraftPulse
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">Windows Server Host</p>
            </div>
          </div>
        </div>

        {/* Server Selector Section */}
        <div className="p-3">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">
            <span>Servers</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={onOpenSharedModal}
                title="Shared Multi-Host Sync (P2P Co-op)"
                className="p-1 rounded bg-[#1e232e] hover:bg-emerald-600 hover:text-white text-slate-300 transition-colors cursor-pointer"
              >
                <Users size={14} />
              </button>
              <button
                onClick={onOpenCreateModal}
                title="Add New Server"
                className="p-1 rounded bg-[#1e232e] hover:bg-emerald-600 hover:text-white text-slate-300 transition-colors cursor-pointer"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="space-y-1">
            {servers.map(server => {
              const isSelected = activeServer?.id === server.id;
              return (
                <button
                  key={server.id}
                  onClick={() => onSelectServer(server)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-sm transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#222838] text-emerald-400 font-medium border border-emerald-500/30 shadow-md shadow-black/20'
                      : 'text-slate-300 hover:bg-[#1b202a]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Server size={16} className={isSelected ? 'text-emerald-400' : 'text-slate-400'} />
                    <span className="truncate">{server.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {server.isShared && (
                      <span title="Shared Co-op Server" className="text-[10px] font-mono px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-0.5">
                        <Users size={10} />
                        Sync
                      </span>
                    )}
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#111317] text-slate-400 border border-white/5">
                      {server.loader}
                    </span>
                    <span className={`w-2 h-2 rounded-full shadow-sm ${getStatusColor(server.status)}`} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="px-3 pt-4 border-t border-[#222733] space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">
            Navigation
          </div>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive
                    ? 'bg-emerald-600/15 text-emerald-400 font-medium border border-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a1f29]'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-emerald-400' : 'text-slate-400'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-[#222733] text-xs text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Radio size={12} className="text-emerald-500" />
          <span>Windows Host Active</span>
        </div>
        <span className="font-mono text-[10px] bg-[#1a1f29] px-1.5 py-0.5 rounded border border-white/5">
          v1.0
        </span>
      </div>
    </aside>
  );
};
