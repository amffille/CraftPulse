import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { ServerInstance } from '../types/server';
import { 
  Send, 
  Trash2, 
  Terminal as TerminalIcon,
  HelpCircle,
  Play
} from 'lucide-react';

interface TerminalConsoleProps {
  server: ServerInstance;
}

export const TerminalConsole: React.FC<TerminalConsoleProps> = ({ server }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermInstance = useRef<XTerm | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const [commandInput, setCommandInput] = useState('');

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm
    const term = new XTerm({
      theme: {
        background: '#0d0f14',
        foreground: '#e2e8f0',
        cursor: '#10b981',
        selectionBackground: '#10b98144',
        black: '#1e293b',
        red: '#ef4444',
        green: '#10b981',
        yellow: '#f59e0b',
        blue: '#3b82f6',
        magenta: '#d946ef',
        cyan: '#06b6d4',
        white: '#f8fafc'
      },
      fontFamily: 'Consolas, Monaco, "Courier New", monospace',
      fontSize: 13,
      lineHeight: 1.25,
      cursorBlink: true,
      convertEol: true
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(terminalRef.current);
    fit.fit();

    xtermInstance.current = term;
    fitAddon.current = fit;

    term.writeln('\x1b[32m[CraftPulse]\x1b[0m Windows Terminal Console initialized.');
    term.writeln(`\x1b[90mConnected to ${server.name} (${server.loader} ${server.mcVersion})\x1b[0m\r\n`);

    // Listen for live logs from Electron process manager
    let cleanup: (() => void) | undefined;
    if (window.craftPulseAPI) {
      cleanup = window.craftPulseAPI.onConsoleLog((event) => {
        if (event.serverId === server.id) {
          term.write(event.data);
        }
      });
    }

    const handleResize = () => fit.fit();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (cleanup) cleanup();
      term.dispose();
    };
  }, [server.id]);

  const handleSendCommand = async (cmdToSend?: string) => {
    const cmd = cmdToSend !== undefined ? cmdToSend : commandInput;
    if (!cmd.trim()) return;

    if (xtermInstance.current) {
      xtermInstance.current.writeln(`\x1b[36m> ${cmd}\x1b[0m`);
    }

    if (window.craftPulseAPI) {
      await window.craftPulseAPI.sendCommand(server.id, cmd);
    }

    if (cmdToSend === undefined) {
      setCommandInput('');
    }
  };

  const handleClear = () => {
    xtermInstance.current?.clear();
  };

  const quickCommands = [
    { label: 'Save World', cmd: 'save-all' },
    { label: 'Daytime', cmd: 'time set day' },
    { label: 'Clear Weather', cmd: 'weather clear' },
    { label: 'List Players', cmd: 'list' },
    { label: 'Stop Server', cmd: 'stop' }
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col h-[calc(100vh-2rem)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#242a38] flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <TerminalIcon size={20} className="text-emerald-400" />
            Live Terminal Console
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Interactive stdio pipe to Minecraft server <span className="font-mono text-emerald-400">java.exe</span>
          </p>
        </div>

        <button
          onClick={handleClear}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1f2c] hover:bg-[#232a3b] text-slate-300 text-xs font-semibold rounded-lg border border-white/5 transition-colors cursor-pointer"
        >
          <Trash2 size={13} />
          <span>Clear Logs</span>
        </button>
      </div>

      {/* Terminal Viewport */}
      <div className="flex-1 bg-[#0d0f14] rounded-2xl p-4 border border-[#262c3b] shadow-2xl overflow-hidden flex flex-col min-h-0">
        <div ref={terminalRef} className="flex-1 w-full h-full overflow-hidden" />
      </div>

      {/* Quick Commands bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-shrink-0">
        <span className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">Quick:</span>
        {quickCommands.map(qc => (
          <button
            key={qc.cmd}
            onClick={() => handleSendCommand(qc.cmd)}
            className="px-2.5 py-1 bg-[#161a23] hover:bg-[#202736] text-slate-300 hover:text-white rounded-lg text-xs font-mono border border-white/5 transition-colors flex items-center gap-1 cursor-pointer flex-shrink-0"
          >
            <Play size={10} className="text-emerald-400" />
            <span>/{qc.cmd}</span>
          </button>
        ))}
      </div>

      {/* Command Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendCommand();
        }}
        className="flex gap-2 flex-shrink-0"
      >
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400 font-mono font-bold text-sm">
            &gt;
          </span>
          <input
            type="text"
            placeholder="Type a server command (e.g. op PlayerName, whitelist add, gamemode creative)..."
            value={commandInput}
            onChange={e => setCommandInput(e.target.value)}
            className="w-full bg-[#161a23] border border-[#272e3d] pl-8 pr-4 py-3 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
        <button
          type="submit"
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
        >
          <Send size={15} />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
};
