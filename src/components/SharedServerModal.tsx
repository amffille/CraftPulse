import React, { useState, useEffect } from 'react';
import { ServerInstance } from '../types/server';
import { X, Users, Copy, Check, Sparkles, Download, ShieldCheck, RefreshCw } from 'lucide-react';

interface SharedServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeServer: ServerInstance | null;
  onServerJoined: (server: ServerInstance) => void;
}

export const SharedServerModal: React.FC<SharedServerModalProps> = ({
  isOpen,
  onClose,
  activeServer,
  onServerJoined
}) => {
  const [tab, setTab] = useState<'share' | 'join'>('share');
  const [inviteCode, setInviteCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joining, setJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [myIdentity, setMyIdentity] = useState<{ deviceId: string; deviceName: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      if (window.craftPulseAPI?.getDeviceIdentity) {
        window.craftPulseAPI.getDeviceIdentity().then(setMyIdentity);
      }
      if (activeServer) {
        generateCode();
      } else {
        setTab('join');
      }
    }
  }, [isOpen, activeServer?.id]);

  const generateCode = async () => {
    if (!activeServer) return;
    try {
      if (window.craftPulseAPI?.createShareCode) {
        const res = await window.craftPulseAPI.createShareCode(activeServer.id, '');
        setInviteCode(res.inviteCode);
      } else {
        setInviteCode('CP-SYNC-demo-mock-token-12345');
      }
    } catch (e: any) {
      setErrorMsg(e.message);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;

    setJoining(true);
    setErrorMsg(null);

    try {
      if (window.craftPulseAPI?.joinSharedServer) {
        const newServer = await window.craftPulseAPI.joinSharedServer(joinCodeInput.trim());
        onServerJoined(newServer);
        onClose();
      } else {
        setErrorMsg('P2P API not available');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to join shared server');
    }

    setJoining(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#161a23] border border-[#272e3d] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-[#232835] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Users size={18} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Shared Multi-Host Sync</h3>
              <p className="text-[11px] text-slate-400">Peer-to-peer co-op hosting with zero external accounts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#202533] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-[#232835] bg-[#12141a]">
          {activeServer && (
            <button
              onClick={() => setTab('share')}
              className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-all ${
                tab === 'share'
                  ? 'border-emerald-500 text-emerald-400 bg-white/5'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Share "{activeServer.name}"
            </button>
          )}
          <button
            onClick={() => setTab('join')}
            className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-all ${
              tab === 'join'
                ? 'border-emerald-500 text-emerald-400 bg-white/5'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Join Friend's Server
          </button>
        </div>

        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* TAB 1: SHARE SERVER */}
          {tab === 'share' && activeServer && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#111319] border border-white/5 space-y-2">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  Your Cryptographic Device ID
                </span>
                <p className="font-mono text-xs text-slate-300 bg-[#0b0d12] px-3 py-1.5 rounded border border-white/5">
                  {myIdentity?.deviceName || 'Local Device'} ({myIdentity?.deviceId || '...' })
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                  1-Click Share Code
                </label>
                <p className="text-xs text-slate-400 mb-2 leading-relaxed">
                  Send this code to your friends on Discord or WhatsApp. It authorizes them to sync world files directly from your PC and take turns hosting!
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={inviteCode}
                    className="flex-1 bg-[#111319] border border-[#272e3d] px-3 py-2.5 rounded-xl text-xs font-mono text-slate-200 select-all"
                  />
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-semibold rounded-xl transition-all shadow-md flex-shrink-0 cursor-pointer"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>
              </div>

              <div className="p-3.5 bg-[#12161f] rounded-xl border border-white/5 text-xs text-slate-300 space-y-1">
                <span className="font-semibold text-slate-200">How Co-op Hosting Works:</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  When you stop hosting, your friends' CraftPulse apps automatically sync the latest world changes. Any of your friends can then click "Start Server" from their PC, and CraftPulse will broadcast their new IP to everyone!
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: JOIN SHARED SERVER */}
          {tab === 'join' && (
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                  Friend's Share Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="Paste code starting with CP-SYNC-..."
                  value={joinCodeInput}
                  onChange={e => setJoinCodeInput(e.target.value)}
                  className="w-full bg-[#111319] border border-[#272e3d] px-4 py-3 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3.5 bg-[#12161f] rounded-xl border border-white/5 text-xs text-slate-300 space-y-1">
                <span className="font-semibold text-slate-200">Zero-Account Direct Sync:</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  CraftPulse will connect directly to your friend's computer over the local P2P layer, download the server's world and mods, and register it in your server list.
                </p>
              </div>

              <button
                type="submit"
                disabled={joining || !joinCodeInput.trim()}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {joining ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                <span>{joining ? 'Connecting & Syncing...' : 'Join & Sync Server'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
