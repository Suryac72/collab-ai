import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { GroqService } from './groq.service';
import { DocumentService } from './document.service';

// ─── Payload Types ────────────────────────────────────────────────────────────

interface JoinDocumentPayload {
  docId: string;
}

interface ContentUpdatePayload {
  docId: string;
  content: string;
}

interface AIRewritePayload {
  docId: string;
  selectedText: string;
  selectionStart: number;
  selectionEnd: number;
}

interface CursorPayload {
  docId: string;
  position: number;
}

interface AuthenticatedSocket extends Socket {
  user?: { id: string; email: string; displayName: string; avatar: string };
}

// ─── Gateway ──────────────────────────────────────────────────────────────────

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/editor',
})
export class DocumentGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(DocumentGateway.name);

  private socketMeta = new Map<
    string,
    { user: AuthenticatedSocket['user']; docId: string; color: string }
  >();

  private readonly userColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD',
    '#00D2D3', '#FF9F43',
  ];

  constructor(
    private jwtService: JwtService,
    private groqService: GroqService,
    private documentService: DocumentService,
  ) {}

  // ── Connection: validate JWT from handshake ────────────────────────────────

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake?.auth?.token ||
        client.handshake?.headers?.authorization?.replace('Bearer ', '');

      if (!token) throw new Error('No token');

      const payload = this.jwtService.verify(token);
      client.user = {
        id:          payload.sub,
        email:       payload.email,
        displayName: payload.displayName,
        avatar:      payload.avatar,
      };

      this.logger.log(`✓ Authenticated: ${client.user.displayName} (${client.id})`);
      client.emit('connected', { socketId: client.id, user: client.user });
    } catch {
      this.logger.warn(`✗ Rejected unauthenticated socket: ${client.id}`);
      client.emit('auth:error', { message: 'Invalid or missing JWT. Please log in.' });
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const meta = this.socketMeta.get(client.id);
    if (meta) {
      this.server.to(meta.docId).emit('user:left', {
        socketId:    client.id,
        displayName: meta.user?.displayName,
      });
      this.socketMeta.delete(client.id);
      this.broadcastActiveUsers(meta.docId);
      this.logger.log(`${meta.user?.displayName} disconnected`);
    }
  }

  // ── Join Document ──────────────────────────────────────────────────────────

  @SubscribeMessage('document:join')
  async handleJoinDocument(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: JoinDocumentPayload,
  ) {
    if (!client.user) { client.emit('auth:error', { message: 'Unauthenticated' }); return; }

    const { docId } = payload;
    const color = this.userColors[Math.floor(Math.random() * this.userColors.length)];

    client.rooms.forEach((room) => { if (room !== client.id) client.leave(room); });
    client.join(docId);

    this.socketMeta.set(client.id, { user: client.user, docId, color });

    const doc = await this.documentService.getDocument(docId);
    client.emit('document:init', { document: doc, color, user: client.user });

    client.to(docId).emit('user:joined', {
      socketId:    client.id,
      displayName: client.user.displayName,
      avatar:      client.user.avatar,
      color,
    });

    this.broadcastActiveUsers(docId);
    this.logger.log(`${client.user.displayName} joined ${docId}`);
  }

  // ── Content Update ─────────────────────────────────────────────────────────

  @SubscribeMessage('document:update')
  async handleDocumentUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: ContentUpdatePayload,
  ) {
    if (!client.user) return;
    const { docId, content } = payload;
    const doc = await this.documentService.updateDocument(docId, content, client.user.displayName);
    client.to(docId).emit('document:updated', { document: doc, updatedBy: client.user.displayName });
  }

  // ── AI Rewrite ─────────────────────────────────────────────────────────────

  @SubscribeMessage('ai:rewrite')
  async handleAIRewrite(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: AIRewritePayload,
  ) {
    if (!client.user) return;
    const { docId, selectedText, selectionStart, selectionEnd } = payload;

    if (!selectedText?.trim()) {
      client.emit('ai:error', { message: 'No text selected for rewriting.' });
      return;
    }

    this.server.to(docId).emit('ai:processing', {
      displayName: client.user.displayName,
      selectionStart,
      selectionEnd,
      originalText: selectedText,
    });

    try {
      const rewrittenText = await this.groqService.rewriteProfessional(selectedText);

      const updatedDoc = await this.documentService.replaceText(
        docId, selectedText, rewrittenText, client.user.displayName,
      );

      if (!updatedDoc) {
        client.emit('ai:rewrite:result', {
          success: false,
          message: 'The selected text was modified concurrently. Rewrite not applied.',
          originalText: selectedText,
          rewrittenText,
          applied: false,
        });
        this.server.to(docId).emit('ai:processing:cancelled', { displayName: client.user.displayName });
        return;
      }

      this.server.to(docId).emit('document:ai:updated', {
        document:    updatedDoc,
        originalText: selectedText,
        rewrittenText,
        rewrittenBy:  client.user.displayName,
        selectionStart,
        selectionEnd,
      });
    } catch (err: any) {
      this.logger.error(`AI rewrite failed: ${err.message}`);
      client.emit('ai:error', { message: err.message || 'AI rewrite failed.' });
      this.server.to(docId).emit('ai:processing:cancelled', { displayName: client.user.displayName });
    }
  }

  // ── History Request ────────────────────────────────────────────────────────

  @SubscribeMessage('document:history')
  async handleHistoryRequest(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { docId: string },
  ) {
    if (!client.user) return;
    const history = await this.documentService.getHistory(payload.docId);
    client.emit('document:history:data', { history });
  }

  // ── Restore Version ────────────────────────────────────────────────────────

  @SubscribeMessage('document:restore')
  async handleRestoreVersion(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { docId: string; historyIndex: number },
  ) {
    if (!client.user) return;
    const doc = await this.documentService.restoreVersion(
      payload.docId, payload.historyIndex, client.user.displayName,
    );
    if (doc) {
      this.server.to(payload.docId).emit('document:restored', {
        document:    doc,
        restoredBy:  client.user.displayName,
        historyIndex: payload.historyIndex,
      });
    }
  }

  // ── Cursor ─────────────────────────────────────────────────────────────────

  @SubscribeMessage('cursor:move')
  handleCursorMove(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: CursorPayload,
  ) {
    const meta = this.socketMeta.get(client.id);
    client.to(payload.docId).emit('cursor:moved', {
      socketId:    client.id,
      displayName: client.user?.displayName,
      position:    payload.position,
      color:       meta?.color,
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private broadcastActiveUsers(docId: string) {
    const users: Array<{
      socketId: string; displayName: string; avatar: string; color: string;
    }> = [];

    this.socketMeta.forEach((meta, socketId) => {
      if (meta.docId === docId) {
        users.push({
          socketId,
          displayName: meta.user?.displayName ?? 'Unknown',
          avatar:      meta.user?.avatar ?? '',
          color:       meta.color,
        });
      }
    });

    this.server.to(docId).emit('users:list', { users });
  }
}