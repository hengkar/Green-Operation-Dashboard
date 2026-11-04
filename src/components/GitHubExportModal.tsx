import React, { useState } from 'react';
import {
  Github,
  Download,
  ExternalLink,
  Copy,
  Check,
  X,
  FileCode,
  Globe,
  ArrowRight,
  Terminal,
} from 'lucide-react';

interface GitHubExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubExportModal: React.FC<GitHubExportModalProps> = ({ isOpen, onClose }) => {
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const gitCommands = `git init
git add index.html
git commit -m "feat: Add Green Ops Dashboard landing page"
git branch -M main
git remote add origin https://github.com/<your-username>/green-ops-dashboard.git
git push -u origin main`;

  const handleCopyCommands = () => {
    navigator.clipboard.writeText(gitCommands);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleDownloadStandalone = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch('/standalone.html');
      const htmlText = await response.text();
      const blob = new Blob([htmlText], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'index.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download standalone HTML', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md">
              <Github className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Deploy to GitHub Pages</h3>
              <p className="text-xs text-slate-500">Standalone HTML5 Landing Page with Zero Server Dependencies</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-5 space-y-5 text-xs text-slate-600">
          
          {/* Highlight Badge */}
          <div className="bg-emerald-50 border border-emerald-200/80 p-4 rounded-xl flex items-start gap-3 text-emerald-950">
            <Globe className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm text-emerald-900 mb-0.5">100% Self-Contained HTML5 Bundle</div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Your Green Ops Dashboard is converted into a single, standalone <code className="font-mono font-semibold bg-emerald-100/80 px-1 py-0.5 rounded">index.html</code> file with embedded client-side energy heuristics, SVG charts, and sample data. No node server or build pipeline required!
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleDownloadStandalone}
              disabled={isDownloading}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl shadow-md shadow-emerald-700/20 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloading ? 'Downloading...' : 'Download index.html File'}</span>
            </button>

            <a
              href="/standalone.html"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl border border-slate-200 transition cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-slate-600" />
              <span>Preview HTML5 Standalone</span>
            </a>
          </div>

          {/* Quick Step Guide */}
          <div className="space-y-4 pt-2">
            
            {/* Step 1 */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <div className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] flex items-center justify-center">1</span>
                Create GitHub Repository & Push
              </div>
              <p className="text-slate-600 mb-2">
                Save the downloaded <code className="font-mono text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">index.html</code> to your project folder and run:
              </p>
              
              <div className="relative">
                <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-[11px] overflow-x-auto leading-relaxed">
                  {gitCommands}
                </pre>
                <button
                  onClick={handleCopyCommands}
                  className="absolute top-2 right-2 flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded text-[10px] transition"
                >
                  {copiedCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCmd ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Step 2 */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <div className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] flex items-center justify-center">2</span>
                Enable GitHub Pages in Settings
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-600 pl-1">
                <li>Open your GitHub repository in your browser.</li>
                <li>Click <strong>Settings</strong> &gt; <strong>Pages</strong> (in left menu).</li>
                <li>Under <strong>Source</strong>, select <strong>Deploy from a branch</strong>.</li>
                <li>Select branch: <code className="font-mono bg-white px-1 py-0.5 rounded border">main</code> and folder: <code className="font-mono bg-white px-1 py-0.5 rounded border">/ (root)</code>.</li>
                <li>Click <strong>Save</strong>. In ~30 seconds, your site is published!</li>
              </ol>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">Location: /standalone/index.html</span>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
