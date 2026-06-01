import { IsOptional, IsString } from 'class-validator';

export class GetQueueDto {
  @IsOptional()
  @IsString()
  deck?: string;
}
