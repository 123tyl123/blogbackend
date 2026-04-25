import { IsString, IsOptional, IsArray, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateBlogDto {
  @IsString()
  @MaxLength(255)
  title: string;

  @IsString()
  excerpt: string;

  @IsString()
  @IsOptional()
  cover?: string;

  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }: { value: string | string[] }): string[] => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value.split(',').map((s: string) => s.trim());
      }
    }
    return value;
  })
  tags: string[];
}
