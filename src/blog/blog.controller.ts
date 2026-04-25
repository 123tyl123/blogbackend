import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { BlogService } from './blog.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthenticatedUser {
  userId: string;
  username: string;
  avatar: string | null;
}

interface AuthenticatedRequest {
  user: AuthenticatedUser;
}

@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get('list')
  async findAll() {
    return this.blogService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  async findMyPosts(@Request() req: AuthenticatedRequest) {
    return this.blogService.findMyPosts(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('create')
  @UseInterceptors(
    FileInterceptor('cover', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, callback) => {
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          callback(null, uniqueName);
        },
      }),
    }),
  )
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateBlogDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let coverUrl: string | undefined;

    if (file) {
      coverUrl = `/uploads/${file.filename}`;
    } else if (dto.cover && dto.cover.startsWith('data:')) {
      coverUrl = this.saveBase64Image(dto.cover);
    }

    return this.blogService.create(
      req.user.userId,
      req.user.username,
      req.user.avatar,
      dto,
      coverUrl,
    );
  }

  private saveBase64Image(base64: string): string {
    const matches = base64.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      return base64;
    }

    const ext = this.getExtensionFromMime(matches[1]);
    const filename = `${uuidv4()}.${ext}`;
    const buffer = Buffer.from(matches[2], 'base64');

    if (!existsSync('./uploads')) {
      mkdirSync('./uploads', { recursive: true });
    }

    writeFileSync(`./uploads/${filename}`, buffer);
    return `/uploads/${filename}`;
  }

  private getExtensionFromMime(mime: string): string {
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
    };
    return map[mime] || 'jpg';
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete/:id')
  async delete(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.blogService.delete(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('like/:blogId')
  async like(
    @Request() req: AuthenticatedRequest,
    @Param('blogId') blogId: string,
  ) {
    return this.blogService.like(req.user.userId, blogId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('like/:blogId')
  async unlike(
    @Request() req: AuthenticatedRequest,
    @Param('blogId') blogId: string,
  ) {
    return this.blogService.unlike(req.user.userId, blogId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('comment/:blogId')
  async getComments(@Param('blogId') blogId: string) {
    return this.blogService.getComments(blogId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('comment/:blogId')
  async addComment(
    @Request() req: AuthenticatedRequest,
    @Param('blogId') blogId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.blogService.addComment(
      req.user.userId,
      req.user.username,
      req.user.avatar,
      blogId,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('comment/:blogId/:commentId')
  async deleteComment(
    @Request() req: AuthenticatedRequest,
    @Param('blogId') blogId: string,
    @Param('commentId') commentId: string,
  ) {
    return this.blogService.deleteComment(req.user.userId, blogId, commentId);
  }
}
