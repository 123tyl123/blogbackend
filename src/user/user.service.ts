import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterUserDto): Promise<{
    code: number;
    message: string;
    data: { id: string; username: string } | null;
  }> {
    const existing = await this.prisma.users.findUnique({
      where: { username: dto.username },
    });

    if (existing) {
      return { code: 400, message: '用户名已存在', data: null };
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const id = uuidv4();

    const user = await this.prisma.users.create({
      data: {
        id,
        username: dto.username,
        password: hashedPassword,
        email: dto.email,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${dto.username}`,
      },
    });

    return {
      code: 200,
      message: '注册成功',
      data: { id: user.id, username: user.username },
    };
  }

  async login(dto: LoginUserDto): Promise<{
    code: number;
    message: string;
    data: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
      user: {
        id: string;
        username: string;
        email: string | null;
        avatar: string;
      };
    } | null;
  }> {
    const user = await this.prisma.users.findUnique({
      where: { username: dto.username },
    });

    if (!user) {
      return { code: 401, message: '用户名或密码错误', data: null };
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      return { code: 401, message: '用户名或密码错误', data: null };
    }

    if (user.status === 0) {
      return { code: 403, message: '账号已被禁用', data: null };
    }

    const accessToken = this.jwtService.sign(
      { user_id: user.id, type: 'access' },
      { expiresIn: '15m' },
    );
    const refreshToken = this.jwtService.sign(
      { user_id: user.id, type: 'refresh' },
      { expiresIn: '7d' },
    );

    const accessExpiresAt = new Date();
    accessExpiresAt.setMinutes(accessExpiresAt.getMinutes() + 15);
    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7);

    await this.prisma.userTokens.create({
      data: {
        id: uuidv4(),
        userId: user.id,
        token: accessToken,
        tokenType: 'access',
        expiresAt: accessExpiresAt,
      },
    });

    await this.prisma.userTokens.create({
      data: {
        id: uuidv4(),
        userId: user.id,
        token: refreshToken,
        tokenType: 'refresh',
        expiresAt: refreshExpiresAt,
      },
    });

    await this.prisma.users.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return {
      code: 200,
      message: '登录成功',
      data: {
        accessToken,
        refreshToken,
        expiresIn: 900,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
        },
      },
    };
  }

  async refresh(refreshToken: string): Promise<{
    code: number;
    message: string;
    data: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    } | null;
  }> {
    const tokenRecord = await this.prisma.userTokens.findFirst({
      where: {
        token: refreshToken,
        tokenType: 'refresh',
      },
    });

    if (!tokenRecord) {
      return { code: 401, message: '刷新令牌无效', data: null };
    }

    if (tokenRecord.expiresAt < new Date()) {
      await this.prisma.userTokens.delete({ where: { id: tokenRecord.id } });
      return { code: 401, message: '刷新令牌已过期', data: null };
    }

    await this.prisma.userTokens.delete({ where: { id: tokenRecord.id } });

    const accessToken = this.jwtService.sign(
      { user_id: tokenRecord.userId, type: 'access' },
      { expiresIn: '15m' },
    );
    const newRefreshToken = this.jwtService.sign(
      { user_id: tokenRecord.userId, type: 'refresh' },
      { expiresIn: '7d' },
    );

    const accessExpiresAt = new Date();
    accessExpiresAt.setMinutes(accessExpiresAt.getMinutes() + 15);
    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7);

    await this.prisma.userTokens.create({
      data: {
        id: uuidv4(),
        userId: tokenRecord.userId,
        token: accessToken,
        tokenType: 'access',
        expiresAt: accessExpiresAt,
      },
    });

    await this.prisma.userTokens.create({
      data: {
        id: uuidv4(),
        userId: tokenRecord.userId,
        token: newRefreshToken,
        tokenType: 'refresh',
        expiresAt: refreshExpiresAt,
      },
    });

    return {
      code: 200,
      message: '刷新成功',
      data: {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: 900,
      },
    };
  }
}
