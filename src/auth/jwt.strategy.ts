import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

interface JwtPayload {
  user_id: string;
  type: string;
  iat?: number;
  exp?: number;
}

interface UserInfo {
  userId: string;
  username: string;
  avatar: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  async validate(payload: JwtPayload): Promise<UserInfo> {
    const user = await this.prisma.users.findUnique({
      where: { id: payload.user_id },
      select: { id: true, username: true, avatar: true },
    });
    if (!user) {
      return { userId: payload.user_id, username: '', avatar: null };
    }
    return { userId: user.id, username: user.username, avatar: user.avatar };
  }
}
