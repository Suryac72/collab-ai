import {
  Controller,
  Get,
  Req,
  Res,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  // ── Step 1: redirect to Google ─────────────────────────────────────────────
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {
    // Passport handles the redirect automatically
  }

  // ── Step 2: Google calls back here ────────────────────────────────────────
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleCallback(@Req() req: Request, @Res() res: Response) {
    const { accessToken, user } = this.authService.login(req.user as any);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    // Redirect to frontend with token in query param — frontend stores in memory
    res.redirect(
      `${frontendUrl}/auth/callback?token=${accessToken}&user=${encodeURIComponent(JSON.stringify(user))}`,
    );
  }

  // ── Current user (validate token) ─────────────────────────────────────────
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  getMe(@Req() req: Request) {
    const u = req.user as any;
    return {
      id:          u._id.toString(),
      email:       u.email,
      displayName: u.displayName,
      avatar:      u.avatar,
    };
  }

  // ── Health check ───────────────────────────────────────────────────────────
  @Get('health')
  health() {
    return { status: 'ok' };
  }
}