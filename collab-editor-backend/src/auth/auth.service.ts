import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserDocument } from '../database/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  login(user: UserDocument): { accessToken: string; user: object } {
    const payload = {
      sub:         (user as any)._id.toString(),
      email:       user.email,
      displayName: user.displayName,
      avatar:      user.avatar,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id:          payload.sub,
        email:       user.email,
        displayName: user.displayName,
        avatar:      user.avatar,
      },
    };
  }

  verifyToken(token: string) {
    return this.jwtService.verify(token);
  }
}