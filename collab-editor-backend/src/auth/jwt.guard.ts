import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

// WebSocket version — extracts token from socket handshake auth
@Injectable()
export class WsJwtGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const client = context.switchToWs().getClient();
    const token  = client.handshake?.auth?.token
                || client.handshake?.headers?.authorization?.replace('Bearer ', '');

    // Shim into a request-like object that passport-jwt can consume
    return { headers: { authorization: `Bearer ${token}` } };
  }
}