import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface DocumentState {
  id: string;
  docId: string;
  title: string;
  content: string;
  lastUpdatedBy: string;
  version: number;
  updatedAt: string;
}

export interface ActiveUser {
  socketId:    string;
  displayName: string;
  avatar:      string;
  color:       string;
}

export interface HistoryEntry {
  content:     string;
  savedBy:     string;
  savedAt:     string;
  type:        'manual' | 'ai-rewrite' | 'auto';
  aiOriginal?: string;
  aiRewritten?: string;
}

export interface RewriteResult {
  originalText:  string;
  rewrittenText: string;
  rewrittenBy:   string;
  selectionStart: number;
  selectionEnd:   number;
}

interface UseCollabEditorOptions {
  serverUrl:   string;
  docId:       string;
  token:       string;            // JWT
  displayName: string;
}

export function useCollabEditor({
  serverUrl,
  docId,
  token,
  displayName,
}: UseCollabEditorOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected,  setIsConnected]  = useState(false);
  const [document,     setDocument]     = useState<DocumentState | null>(null);
  const [activeUsers,  setActiveUsers]  = useState<ActiveUser[]>([]);
  const [myColor,      setMyColor]      = useState('#4ECDC4');
  const [aiProcessing, setAiProcessing] = useState<{ displayName: string; originalText: string } | null>(null);
  const [lastRewrite,  setLastRewrite]  = useState<RewriteResult | null>(null);
  const [aiError,      setAiError]      = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [history,      setHistory]      = useState<HistoryEntry[]>([]);
  const [authError,    setAuthError]    = useState<string | null>(null);

  const notify = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  }, []);

  useEffect(() => {
    if (!token) return;

    const socket = io(`${serverUrl}/editor`, {
      transports: ['websocket', 'polling'],
      auth: { token },                       // JWT sent in handshake
      reconnectionAttempts: 5,
      reconnectionDelay: 1500,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('document:join', { docId });
    });

    socket.on('disconnect', () => setIsConnected(false));

    socket.on('auth:error', ({ message }) => {
      setAuthError(message);
    });

    socket.on('document:init', ({ document: doc, color }) => {
      setDocument(doc);
      setMyColor(color);
    });

    socket.on('document:updated', ({ document: doc }) => {
      setDocument(doc);
    });

    socket.on('document:ai:updated', (payload: {
      document: DocumentState;
      originalText: string; rewrittenText: string;
      rewrittenBy: string; selectionStart: number; selectionEnd: number;
    }) => {
      setDocument(payload.document);
      setAiProcessing(null);
      setLastRewrite(payload);
      notify(
        payload.rewrittenBy === displayName
          ? '✨ AI rewrite applied & saved!'
          : `✨ ${payload.rewrittenBy} rewrote a section with AI`
      );
    });

    socket.on('document:restored', ({ document: doc, restoredBy, historyIndex }) => {
      setDocument(doc);
      notify(`📜 ${restoredBy} restored version #${historyIndex + 1}`);
    });

    socket.on('ai:processing', ({ displayName: who, originalText }) => {
      setAiProcessing({ displayName: who, originalText });
      setAiError(null);
    });

    socket.on('ai:processing:cancelled', () => setAiProcessing(null));

    socket.on('ai:error', ({ message }) => {
      setAiProcessing(null);
      setAiError(message);
      setTimeout(() => setAiError(null), 5000);
    });

    socket.on('ai:rewrite:result', (payload) => {
      if (!payload.applied) notify(`AI rewrote (not applied due to conflict): "${payload.rewrittenText.slice(0, 50)}…"`);
      setAiProcessing(null);
    });

    socket.on('users:list',  ({ users }) => setActiveUsers(users));
    socket.on('user:joined', ({ displayName: who }) => notify(`${who} joined`));
    socket.on('user:left',   ({ displayName: who }) => notify(`${who} left`));

    socket.on('document:history:data', ({ history: h }) => setHistory(h));

    return () => { socket.disconnect(); };
  }, [serverUrl, docId, token]);

  const updateContent = useCallback((content: string) => {
    setDocument((prev) => prev ? { ...prev, content } : prev);
    socketRef.current?.emit('document:update', { docId, content });
  }, [docId]);

  const requestAIRewrite = useCallback((
    selectedText: string, selectionStart: number, selectionEnd: number,
  ) => {
    if (!selectedText.trim()) return;
    setAiError(null);
    socketRef.current?.emit('ai:rewrite', { docId, selectedText, selectionStart, selectionEnd });
  }, [docId]);

  const requestHistory = useCallback(() => {
    socketRef.current?.emit('document:history', { docId });
  }, [docId]);

  const restoreVersion = useCallback((historyIndex: number) => {
    socketRef.current?.emit('document:restore', { docId, historyIndex });
  }, [docId]);

  const moveCursor = useCallback((position: number) => {
    socketRef.current?.emit('cursor:move', { docId, position });
  }, [docId]);

  return {
    isConnected, document, activeUsers, myColor,
    aiProcessing, lastRewrite, aiError, notification,
    history, authError,
    updateContent, requestAIRewrite, requestHistory, restoreVersion, moveCursor,
  };
}