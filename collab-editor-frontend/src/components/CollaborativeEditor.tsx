import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCollabEditor, HistoryEntry } from '../hooks/useCollabEditor';
import './CollaborativeEditor.css';

interface SelectionInfo { text: string; start: number; end: number; }

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name, avatar, color }: { name: string; avatar?: string; color: string }) {
  return avatar ? (
    <img className="avatar" src={avatar} alt={name} title={name}
         style={{ border: `2px solid ${color}` }} />
  ) : (
    <div className="avatar avatar-text" style={{ background: color }} title={name}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

// ── History Panel ─────────────────────────────────────────────────────────────
function HistoryPanel({
  entries, onRestore, onClose,
}: { entries: HistoryEntry[]; onRestore: (i: number) => void; onClose: () => void }) {
  return (
    <aside className="history-panel">
      <div className="history-header">
        <span className="history-icon">📜</span>
        <span>Version History</span>
        <button className="diff-close" onClick={onClose}>✕</button>
      </div>
      <div className="history-body">
        {entries.length === 0 && (
          <p className="history-empty">No history yet. Start editing!</p>
        )}
        {[...entries].reverse().map((e, ri) => {
          const i = entries.length - 1 - ri;
          return (
            <div key={i} className={`history-entry ${e.type}`}>
              <div className="history-meta">
                <span className="history-type-badge">
                  {e.type === 'ai-rewrite' ? '✦ AI' : e.type === 'auto' ? '⌨ Auto' : '💾 Manual'}
                </span>
                <span className="history-who">{e.savedBy}</span>
                <span className="history-when">
                  {new Date(e.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {e.type === 'ai-rewrite' && e.aiOriginal && (
                <div className="history-ai-preview">
                  <span className="before">"{e.aiOriginal.slice(0, 40)}…"</span>
                  <span className="arrow">→</span>
                  <span className="after">"{e.aiRewritten?.slice(0, 40)}…"</span>
                </div>
              )}
              <button className="restore-btn" onClick={() => onRestore(i)}>
                Restore
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
interface Props { serverUrl?: string; docId?: string; }

export default function CollaborativeEditor({
  serverUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001',
  docId     = 'doc-001',
}: Props) {
  const { user, token, logout } = useAuth();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [selection,       setSelection]       = useState<SelectionInfo | null>(null);
  const [tooltipVisible,  setTooltipVisible]  = useState(false);
  const [showDiff,        setShowDiff]        = useState(false);
  const [showHistory,     setShowHistory]     = useState(false);
  const [userMenuOpen,    setUserMenuOpen]    = useState(false);

  const {
    isConnected, document: doc, activeUsers, myColor,
    aiProcessing, lastRewrite, aiError, notification,
    history, authError,
    updateContent, requestAIRewrite, requestHistory, restoreVersion, moveCursor,
  } = useCollabEditor({
    serverUrl,
    docId,
    token:       token!,
    displayName: user?.displayName ?? 'User',
  });

  useEffect(() => {
    if (lastRewrite) {
      setShowDiff(true);
      const t = setTimeout(() => setShowDiff(false), 9000);
      return () => clearTimeout(t);
    }
  }, [lastRewrite]);

  const handleSelect = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const text  = ta.value.slice(start, end).trim();
    if (text.length > 3) { setSelection({ text, start, end }); setTooltipVisible(true); }
    else { setTooltipVisible(false); setSelection(null); }
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateContent(e.target.value);
    setTooltipVisible(false);
    setSelection(null);
  }, [updateContent]);

  const triggerAIRewrite = useCallback(() => {
    if (!selection || aiProcessing) return;
    requestAIRewrite(selection.text, selection.start, selection.end);
    setTooltipVisible(false);
  }, [selection, aiProcessing, requestAIRewrite]);

  const openHistory = () => {
    setShowHistory(true);
    setShowDiff(false);
    requestHistory();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        if (selection && !aiProcessing) triggerAIRewrite();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selection, aiProcessing, triggerAIRewrite]);

  const content    = doc?.content ?? '';
  const wordCount  = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount  = content.length;
  const rightPanel = showHistory ? 'history' : showDiff && lastRewrite ? 'diff' : null;

  return (
    <div className="editor-shell">
      {/* ── Top Bar ── */}
      <header className="topbar">
        <div className="topbar-left">
          <div className="logo">
            <span className="logo-icon">⟁</span>
            <span className="logo-text">Collab<em>AI</em></span>
          </div>
          <div className="doc-info">
            <span className="doc-id">{docId}</span>
            <span className={`status-dot ${isConnected ? 'online' : 'offline'}`} />
            <span className="conn-label">{isConnected ? 'Live' : 'Connecting…'}</span>
          </div>
        </div>

        <div className="topbar-right">
          {/* Collaborator avatars */}
          <div className="avatars">
            {activeUsers.map((u) => (
              <Avatar key={u.socketId} name={u.displayName} avatar={u.avatar} color={u.color} />
            ))}
          </div>

          {/* History button */}
          <button className="toolbar-icon-btn" onClick={openHistory} title="Version History">
            📜
          </button>

          {/* User menu */}
          <div className="user-menu-wrap">
            <button
              className="user-badge"
              style={{ borderColor: myColor }}
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              {user?.avatar
                ? <img src={user.avatar} alt="" className="user-avatar-sm" />
                : <span className="user-dot" style={{ background: myColor }} />}
              {user?.displayName}
              <span className="chevron">{userMenuOpen ? '▲' : '▼'}</span>
            </button>

            {userMenuOpen && (
              <div className="user-dropdown">
                <div className="user-dropdown-name">{user?.email}</div>
                <button className="user-dropdown-logout" onClick={logout}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Toolbar ── */}
      <div className="toolbar">
        <div className="toolbar-left">
          <span className="toolbar-hint">
            <kbd>Select text</kbd> then <kbd>Rewrite with AI</kbd>&nbsp;·&nbsp;<kbd>⌘⇧A</kbd>
          </span>
        </div>
        <div className="toolbar-right">
          <span className="doc-stats">{wordCount} words · {charCount} chars · v{doc?.version ?? 1}</span>
          {doc?.lastUpdatedBy && doc.lastUpdatedBy !== 'system' && (
            <span className="last-edit">Saved by <strong>{doc.lastUpdatedBy}</strong></span>
          )}
        </div>
      </div>

      {/* ── Banners ── */}
      {notification && <div className="notification">{notification}</div>}
      {aiError      && <div className="ai-error">⚠ {aiError}</div>}
      {authError    && <div className="ai-error">🔒 {authError} — Please refresh and log in.</div>}

      {aiProcessing && (
        <div className="ai-processing-banner">
          <span className="spinner" />
          <span><strong>{aiProcessing.displayName}</strong> is rewriting with AI…</span>
          <span className="processing-preview">
            "{aiProcessing.originalText.slice(0, 55)}{aiProcessing.originalText.length > 55 ? '…' : ''}"
          </span>
        </div>
      )}

      {/* ── Main Editor Area ── */}
      <main className="editor-area">
        <div className="editor-container">
          {/* Selection Tooltip */}
          {tooltipVisible && selection && !aiProcessing && (
            <div className="selection-tooltip">
              <span className="selection-count">{selection.text.length} chars selected</span>
              <button className="ai-rewrite-btn" onClick={triggerAIRewrite}>
                <span className="btn-icon">✦</span>
                Rewrite with AI
              </button>
            </div>
          )}

          <textarea
            ref={textareaRef}
            className="editor-textarea"
            value={content}
            onChange={handleChange}
            onSelect={handleSelect}
            onMouseUp={handleSelect}
            onKeyUp={(e) => {
              handleSelect();
              moveCursor((e.target as HTMLTextAreaElement).selectionStart);
            }}
            spellCheck
            placeholder="Start typing your document here…"
            disabled={!!aiProcessing}
          />
        </div>

        {/* ── Right Panel: Diff or History ── */}
        {rightPanel === 'diff' && lastRewrite && (
          <aside className="diff-panel">
            <div className="diff-header">
              <span className="diff-icon">✦</span>
              <span>AI Rewrite by <strong>{lastRewrite.rewrittenBy}</strong></span>
              <button className="diff-close" onClick={() => setShowDiff(false)}>✕</button>
            </div>
            <div className="diff-body">
              <div className="diff-section diff-before">
                <span className="diff-label">Before</span>
                <p>{lastRewrite.originalText}</p>
              </div>
              <div className="diff-arrow">→</div>
              <div className="diff-section diff-after">
                <span className="diff-label">After</span>
                <p>{lastRewrite.rewrittenText}</p>
              </div>
            </div>
          </aside>
        )}

        {rightPanel === 'history' && (
          <HistoryPanel
            entries={history}
            onRestore={(i) => { restoreVersion(i); setShowHistory(false); }}
            onClose={() => setShowHistory(false)}
          />
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="editor-footer">
        <div className="footer-users">
          {activeUsers.map((u) => (
            <span key={u.socketId} className="footer-user">
              <span className="footer-user-dot" style={{ background: u.color }} />
              {u.displayName}
              {u.displayName === user?.displayName && ' (you)'}
            </span>
          ))}
        </div>
        <div className="footer-right">
          <span className="groq-badge">⚡ Groq · Llama 3.3 · MongoDB Atlas</span>
        </div>
      </footer>
    </div>
  );
}