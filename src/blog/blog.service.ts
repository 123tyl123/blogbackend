import { Injectable, OnModuleInit } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  cover: string | null;
  author: {
    name: string;
    avatar: string | null;
  };
  tags: string[];
  createdAt: string;
  likes: number;
  comments: number;
}

interface BlogPostRecord {
  id: string;
  title: string;
  excerpt: string;
  cover: string | null;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  tags: string;
  likes: number;
  comments: number;
  createdAt: Date;
}

interface BlogCommentRecord {
  id: string;
  blogId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  content: string;
  createdAt: Date;
}

@Injectable()
export class BlogService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const count = await this.prisma.blogPost.count();
    if (count === 0) {
      await this.seedData();
    }
  }

  private async seedData() {
    const seedUserId = 'aa2c60a8-1799-4ff2-845f-5effcc212907';
    const posts = [
      {
        id: uuidv4(),
        title: '春日限定｜和闺蜜的治愈下午茶',
        excerpt:
          '阳光洒在窗边，一杯温热的拿铁，几块精致的小蛋糕，这就是春天最好的模样呀～',
        cover:
          'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop',
        authorId: seedUserId,
        authorName: '小甜豆',
        authorAvatar: '',
        tags: JSON.stringify(['下午茶', '闺蜜', '治愈系']),
        likes: 128,
        comments: 23,
        createdAt: new Date('2026-04-20'),
      },
      {
        id: uuidv4(),
        title: '学习打卡｜自律让我更自由',
        excerpt: '每天早起一点点，记录我的学习日常。慢慢来，比较快～',
        cover:
          'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop',
        authorId: seedUserId,
        authorName: '努力少女',
        authorAvatar: '',
        tags: JSON.stringify(['学习', '自律', '日常']),
        likes: 256,
        comments: 45,
        createdAt: new Date('2026-04-19'),
      },
      {
        id: uuidv4(),
        title: '穿搭日记｜温柔系春日穿搭',
        excerpt: '春天就要穿得甜甜的！分享几套我的日常穿搭，希望你们喜欢呀～',
        cover:
          'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=300&fit=crop',
        authorId: seedUserId,
        authorName: '时尚喵',
        authorAvatar: '',
        tags: JSON.stringify(['穿搭', '春日', '风格']),
        likes: 512,
        comments: 89,
        createdAt: new Date('2026-04-18'),
      },
      {
        id: uuidv4(),
        title: '日常碎片｜一个人的小确幸',
        excerpt:
          '有时候一个人的时光也很好呀。读书、听歌、发呆，都是幸福的样子～',
        cover:
          'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=400&h=300&fit=crop',
        authorId: seedUserId,
        authorName: '独处时光',
        authorAvatar: '',
        tags: JSON.stringify(['日常', '治愈', '生活']),
        likes: 89,
        comments: 12,
        createdAt: new Date('2026-04-17'),
      },
    ];

    await this.prisma.blogPost.createMany({ data: posts });
  }

  private formatPost(post: BlogPostRecord): BlogPost {
    return {
      id: post.id,
      title: post.title,
      excerpt: post.excerpt,
      cover: post.cover,
      author: {
        name: post.authorName,
        avatar: post.authorAvatar || null,
      },
      tags: JSON.parse(post.tags) as string[],
      createdAt: post.createdAt.toISOString().split('T')[0],
      likes: post.likes,
      comments: post.comments,
    };
  }

  private formatComment(comment: BlogCommentRecord) {
    return {
      id: comment.id,
      blogId: comment.blogId,
      content: comment.content,
      author: {
        name: comment.authorName,
        avatar: comment.authorAvatar || null,
      },
      createdAt: comment.createdAt.toISOString().split('T')[0],
    };
  }

  async findAll(): Promise<{
    code: number;
    message: string;
    data: BlogPost[];
  }> {
    const posts = await this.prisma.blogPost.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return {
      code: 200,
      message: 'success',
      data: posts.map((post) => this.formatPost(post)),
    };
  }

  async findMyPosts(userId: string): Promise<{
    code: number;
    message: string;
    data: BlogPost[];
  }> {
    const posts = await this.prisma.blogPost.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      code: 200,
      message: 'success',
      data: posts.map((post) => this.formatPost(post)),
    };
  }

  async create(
    userId: string,
    userName: string,
    userAvatar: string | null,
    dto: CreateBlogDto,
    coverUrl?: string,
  ): Promise<{
    code: number;
    message: string;
    data: BlogPost;
  }> {
    const post = await this.prisma.blogPost.create({
      data: {
        id: uuidv4(),
        title: dto.title,
        excerpt: dto.excerpt,
        cover: coverUrl || dto.cover || null,
        authorName: userName,
        authorAvatar: userAvatar || null,
        tags: JSON.stringify(dto.tags),
        likes: 0,
        comments: 0,
        authorId: userId,
      },
    });

    return {
      code: 200,
      message: 'success',
      data: this.formatPost(post),
    };
  }

  async delete(
    userId: string,
    postId: string,
  ): Promise<{
    code: number;
    message: string;
    data: null;
  }> {
    const post = await this.prisma.blogPost.findFirst({
      where: { id: postId, authorId: userId },
    });

    if (!post) {
      return { code: 404, message: '文章不存在或无权删除', data: null };
    }

    await this.prisma.blogPost.delete({ where: { id: postId } });

    return { code: 200, message: 'success', data: null };
  }

  async like(
    userId: string,
    blogId: string,
  ): Promise<{ code: number; message: string }> {
    const blog = await this.prisma.blogPost.findUnique({
      where: { id: blogId },
    });
    if (!blog) {
      return { code: 404, message: '文章不存在' };
    }

    const existing = await this.prisma.blogLike.findFirst({
      where: { blogId, userId },
    });

    if (existing) {
      return { code: 200, message: 'success' };
    }

    await this.prisma.blogLike.create({
      data: { id: uuidv4(), blogId, userId },
    });

    await this.prisma.blogPost.update({
      where: { id: blogId },
      data: { likes: { increment: 1 } },
    });

    return { code: 200, message: 'success' };
  }

  async unlike(
    userId: string,
    blogId: string,
  ): Promise<{ code: number; message: string }> {
    const existingUnlike = await this.prisma.blogLike.findFirst({
      where: { blogId, userId },
    });

    if (!existingUnlike) {
      return { code: 200, message: 'success' };
    }

    await this.prisma.blogLike.delete({ where: { id: existingUnlike.id } });

    await this.prisma.blogPost.update({
      where: { id: blogId },
      data: { likes: { decrement: 1 } },
    });

    return { code: 200, message: 'success' };
  }

  async getComments(blogId: string): Promise<{
    code: number;
    data: ReturnType<typeof this.formatComment>[];
  }> {
    const comments = await this.prisma.blogComment.findMany({
      where: { blogId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      code: 200,
      data: comments.map((c) => this.formatComment(c)),
    };
  }

  async addComment(
    userId: string,
    userName: string,
    userAvatar: string | null,
    blogId: string,
    dto: CreateCommentDto,
  ): Promise<{
    code: number;
    data: ReturnType<typeof this.formatComment>;
  }> {
    const blog = await this.prisma.blogPost.findUnique({
      where: { id: blogId },
    });
    if (!blog) {
      return {
        code: 404,
        data: null,
      };
    }

    const comment = await this.prisma.blogComment.create({
      data: {
        id: uuidv4(),
        blogId,
        authorId: userId,
        authorName: userName,
        authorAvatar: userAvatar || null,
        content: dto.content,
      },
    });

    await this.prisma.blogPost.update({
      where: { id: blogId },
      data: { comments: { increment: 1 } },
    });

    return { code: 200, data: this.formatComment(comment) };
  }

  async deleteComment(
    userId: string,
    blogId: string,
    commentId: string,
  ): Promise<{ code: number; message: string }> {
    const comment = await this.prisma.blogComment.findFirst({
      where: { id: commentId, authorId: userId },
    });

    if (!comment) {
      return { code: 404, message: '评论不存在或无权删除' };
    }

    await this.prisma.blogComment.delete({ where: { id: commentId } });

    await this.prisma.blogPost.update({
      where: { id: blogId },
      data: { comments: { decrement: 1 } },
    });

    return { code: 200, message: 'success' };
  }
}
