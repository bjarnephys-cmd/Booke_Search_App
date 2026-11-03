import React, { useState, useEffect } from 'react';
import { appLogger, LogEntry } from '../services/logger.ts';
import { Terminal, X, Trash2, Copy, Check, ChevronUp, ChevronDown } from 'lucide-react';

export const LiveLogDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubscribe = appLogger.subscribe((newLogs) => {
      setLogs(newLogs);
    });
    return unsubscribe;
  }, []);

  const handleCopy = () => {
    const text = logs
      .map((l) => `[${l.time}] [${l.type.toUpperCase()}] ${l.message} ${l.details || ''}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const latestLog = logs[0];

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-stone-900 text-stone-100 rounded-xl shadow-lg border border-stone-700 hover:bg-stone-800 transition-all text-xs font-mono-data"
        >
          <Terminal className="w-3.5 h-3.5 text-amber-400" />
          <span>Live Konsol ({logs.length})</span>
          {latestLog && (
            <span
              className={`w-2 h-2 rounded-full ${
                latestLog.type === 'error'
                  ? 'bg-red-500 animate-pulse'
                  : latestLog.type === 'success'
                  ? 'bg-emerald-400'
                  : 'bg-amber-400'
              }`}
            />
          )}
          <ChevronUp className="w-3.5 h-3.5 text-stone-400 ml-1" />
        </button>
      )}

      {/* Expanded Console Window */}
      {isOpen && (
        <div className="w-[92vw] sm:w-[560px] max-h-[380px] bg-stone-950 text-stone-200 rounded-2xl shadow-2xl border border-stone-800 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
          {/* Header */}
          <div className="px-4 py-2.5 bg-stone-900/90 border-b border-stone-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-mono-data">
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-white">Live Frontend Konsol & Netværk</span>
              <span className="text-[10px] text-stone-400">({logs.length} logs)</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopy}
                title="Kopier alle logs"
                className="p-1.5 text-stone-400 hover:text-white rounded hover:bg-stone-800 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => appLogger.clear()}
                title="Ryd logs"
                className="p-1.5 text-stone-400 hover:text-white rounded hover:bg-stone-800 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-stone-400 hover:text-white rounded hover:bg-stone-800 transition-colors ml-1"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Log list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 font-mono-data text-xs max-h-[290px]">
            {logs.length === 0 ? (
              <p className="text-stone-500 py-6 text-center text-xs">
                Ingen logs endnu. Søg efter en bog eller opret en bruger for at se live aktivitet.
              </p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-2 rounded-lg border text-[11px] leading-relaxed ${
                    log.type === 'error'
                      ? 'bg-red-950/40 border-red-900/60 text-red-200'
                      : log.type === 'success'
                      ? 'bg-emerald-950/30 border-emerald-900/60 text-emerald-200'
                      : 'bg-stone-900/60 border-stone-800/80 text-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-stone-500 mb-0.5">
                    <span>{log.time}</span>
                    {log.duration !== undefined && (
                      <span className="text-amber-400 font-bold">{log.duration} ms</span>
                    )}
                  </div>
                  <div className="font-medium">{log.message}</div>
                  {log.details && (
                    <div className="text-[10px] text-stone-400 truncate mt-0.5 select-all">
                      {log.details}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
