import {
  Controller,
  Post,
  Put,
  Get,
  Body,
  UseGuards,
  Request,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { UserService } from './user.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthenticatedUser {
  userId: string;
  username: string;
  avatar: string | null;
}

interface AuthenticatedRequest {
  user: AuthenticatedUser;
}

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async register(@Body() dto: RegisterUserDto) {
    return this.userService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginUserDto) {
    return this.userService.login(dto);
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.userService.refresh(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('info')
  async getInfo(@Request() req: AuthenticatedRequest) {
    return this.userService.getInfo(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (_req, file, callback) => {
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          callback(null, uniqueName);
        },
      }),
      fileFilter: (_req, file, callback) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedMimes.includes(file.mimetype)) {
          callback(
            new BadRequestException(
              '文件格式不正确，仅支持 JPG、PNG、WebP',
            ),
            false,
          );
          return;
        }
        callback(null, true);
      },
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    }),
  )
  async uploadAvatar(
    @Request() req: AuthenticatedRequest,
    @Req() rawReq: ExpressRequest,
    @UploadedFile() avatar: Express.Multer.File,
  ) {
    if (!avatar) {
      return { code: 400, message: '请选择图片文件' };
    }
    const baseUrl = `${rawReq.protocol}://${rawReq.get('host')}`;
    const avatarUrl = `${baseUrl}/uploads/avatars/${avatar.filename}`;
    return this.userService.updateAvatar(req.user.userId, avatarUrl);
  }

  @UseGuards(JwtAuthGuard)
  @Put('update')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (_req, file, callback) => {
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          callback(null, uniqueName);
        },
      }),
      fileFilter: (_req, file, callback) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedMimes.includes(file.mimetype)) {
          callback(
            new BadRequestException(
              '文件格式不正确，仅支持 JPG、PNG、WebP',
            ),
            false,
          );
          return;
        }
        callback(null, true);
      },
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    }),
  )
  async update(
    @Request() req: AuthenticatedRequest,
    @Req() rawReq: ExpressRequest,
    @UploadedFile() avatar: Express.Multer.File,
  ) {
    if (!avatar) {
      return { code: 400, message: '请选择图片文件' };
    }
    const baseUrl = `${rawReq.protocol}://${rawReq.get('host')}`;
    const avatarUrl = `${baseUrl}/uploads/avatars/${avatar.filename}`;
    return this.userService.updateAvatar(req.user.userId, avatarUrl);
  }
}
