import React, { useState, useEffect } from 'react';
import { ServerInstance } from './types/server';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ConfigToggles } from './components/ConfigToggles';
import { ModHub } from './components/ModHub';
import { TerminalConsole } from './components/TerminalConsole';
import { CreateServerModal } from './components/CreateServerModal';
import { SharedServerModal } from './components/SharedServerModal';
import { UserGuide } from './components/UserGuide';

export const App: React.FC = () => {
  const [servers, setServers] = useState<ServerInstance[]>([]);
  const [activeServer, setActiveServer] = useState<ServerInstance | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSharedModalOpen, setIsSharedModalOpen] = useState(false);

  useEffect(() => {
    loadServers();

    if (window.craftPulseAPI) {
      const unsubStatus = window.craftPulseAPI.onStatusChange((event) => {
        setServers(prev => prev.map(s => {
          if (s.id === event.serverId) {
            return { ...s, status: event.status };
          }
          return s;
        }));

        setActiveServer(curr => {
          if (curr && curr.id === event.serverId) {
            return { ...curr, status: event.status };
          }
          return curr;
        });
      });

      const unsubTunnel = window.craftPulseAPI.onTunnelUpdate((data) => {
        setServers(prev => prev.map(s => {
          if (s.id === data.serverId) {
            return { ...s, tunnelAddress: data.address || undefined };
          }
          return s;
        }));

        setActiveServer(curr => {
          if (curr && curr.id === data.serverId) {
            return { ...curr, tunnelAddress: data.address || undefined };
          }
          return curr;
        });
      });

      return () => {
        unsubStatus();
        unsubTunnel();
      };
    }
  }, []);

  const loadServers = async () => {
    if (window.craftPulseAPI) {
      try {
        const list = await window.craftPulseAPI.getServers();
        setServers(list);
        if (list.length > 0 && !activeServer) {
          setActiveServer(list[0]);
        }
      } catch (err) {
        console.error('Failed to get servers:', err);
      }
    } else {
      // Browser fallback/preview server
      const defaultServer: ServerInstance = {
        id: 'server-demo',
        name: 'Survival SMP',
        loader: 'paper',
        mcVersion: '1.20.4',
        path: 'C:\\Users\\Player\\AppData\\Roaming\\CraftPulse\\servers\\survival',
        minRamGb: 2,
        maxRamGb: 4,
        tunnelEnabled: true,
        tunnelAddress: 'craftpulse-friend.gl.joinmc.link',
        status: 'STOPPED',
        autoRestart: true,
        createdAt: new Date().toISOString()
      };
      setServers([defaultServer]);
      setActiveServer(defaultServer);
    }
  };

  const handleStartServer = async () => {
    if (!activeServer) return;
    if (window.craftPulseAPI) {
      await window.craftPulseAPI.startServer(activeServer.id);
    } else {
      // Simulate in browser
      setActiveServer(prev => prev ? { ...prev, status: 'RUNNING' } : null);
    }
  };

  const handleStopServer = async () => {
    if (!activeServer) return;
    if (window.craftPulseAPI) {
      await window.craftPulseAPI.stopServer(activeServer.id);
    } else {
      setActiveServer(prev => prev ? { ...prev, status: 'STOPPED' } : null);
    }
  };

  const handleToggleTunnel = async (enabled: boolean) => {
    if (!activeServer) return;
    if (window.craftPulseAPI) {
      const res = await window.craftPulseAPI.toggleTunnel(activeServer.id, enabled);
      setActiveServer(prev => prev ? { ...prev, tunnelEnabled: res.enabled, tunnelAddress: res.address } : null);
      setServers(prev => prev.map(s => s.id === activeServer.id ? { ...s, tunnelEnabled: res.enabled, tunnelAddress: res.address } : s));
    } else {
      setActiveServer(prev => prev ? { ...prev, tunnelEnabled: enabled, tunnelAddress: enabled ? 'craftpulse-demo.gl.joinmc.link' : undefined } : null);
    }
  };

  const handleCreateServer = async (data: any) => {
    if (window.craftPulseAPI) {
      const newServer = await window.craftPulseAPI.createServer(data);
      setServers(prev => [...prev, newServer]);
      setActiveServer(newServer);
      setActiveTab('dashboard');
    } else {
      const newServer: ServerInstance = {
        id: `server-${Date.now()}`,
        name: data.name,
        loader: data.loader,
        mcVersion: data.mcVersion,
        path: `C:\\Users\\Player\\AppData\\Roaming\\CraftPulse\\servers\\${data.name.toLowerCase().replace(/\s+/g, '-')}`,
        minRamGb: data.minRamGb,
        maxRamGb: data.maxRamGb,
        tunnelEnabled: false,
        status: 'STOPPED',
        autoRestart: true,
        createdAt: new Date().toISOString()
      };
      setServers(prev => [...prev, newServer]);
      setActiveServer(newServer);
      setActiveTab('dashboard');
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0d0f14]">
      {/* Sidebar */}
      <Sidebar
        servers={servers}
        activeServer={activeServer}
        activeTab={activeTab}
        onSelectServer={server => setActiveServer(server)}
        onSelectTab={tab => setActiveTab(tab)}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenSharedModal={() => setIsSharedModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto bg-[#0d0f14]">
        {activeTab === 'guide' ? (
          <UserGuide
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onOpenSharedModal={() => setIsSharedModalOpen(true)}
            onNavigateTab={tab => setActiveTab(tab)}
            hasActiveServer={Boolean(activeServer)}
          />
        ) : activeServer ? (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard
                server={activeServer}
                onStart={handleStartServer}
                onStop={handleStopServer}
                onNavigateTab={tab => setActiveTab(tab)}
                onToggleTunnel={handleToggleTunnel}
                onOpenSharedModal={() => setIsSharedModalOpen(true)}
              />
            )}
            {activeTab === 'toggles' && (
              <ConfigToggles server={activeServer} />
            )}
            {activeTab === 'mods' && (
              <ModHub server={activeServer} />
            )}
            {activeTab === 'console' && (
              <TerminalConsole server={activeServer} />
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-700/10 border border-emerald-500/20 flex items-center justify-center text-3xl mb-1 shadow-lg shadow-emerald-950/20">
              ⛏️
            </div>
            <h2 className="text-xl font-bold text-white">Welcome to CraftPulse</h2>
            <p className="text-sm text-slate-400 max-w-md">
              Create a new server, join a friend's co-op world, or browse our guide to see how everything works.
            </p>
            <div className="flex items-center gap-3 flex-wrap justify-center pt-2">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm cursor-pointer shadow-lg shadow-emerald-900/30"
              >
                + Create First Server
              </button>
              <button
                onClick={() => setIsSharedModalOpen(true)}
                className="px-5 py-2.5 bg-[#1f2533] hover:bg-[#283145] text-slate-200 font-semibold rounded-xl text-sm border border-white/5 cursor-pointer"
              >
                Join Friend's Server (Co-op)
              </button>
              <button
                onClick={() => setActiveTab('guide')}
                className="px-5 py-2.5 bg-[#161a23] hover:bg-[#202633] text-emerald-400 font-semibold rounded-xl text-sm border border-emerald-500/20 cursor-pointer"
              >
                📖 User Guide & Features
              </button>
            </div>
          </div>
        )}
      </main>

      {/* New Server Creation Wizard Modal */}
      <CreateServerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateServer}
      />

      {/* Shared Co-op Multi-Host Modal */}
      <SharedServerModal
        isOpen={isSharedModalOpen}
        onClose={() => setIsSharedModalOpen(false)}
        activeServer={activeServer}
        onServerJoined={(newServer) => {
          setServers(prev => {
            const exists = prev.some(s => s.id === newServer.id);
            return exists ? prev.map(s => s.id === newServer.id ? newServer : s) : [...prev, newServer];
          });
          setActiveServer(newServer);
          setActiveTab('dashboard');
        }}
      />
    </div>
  );
};
export default App;
