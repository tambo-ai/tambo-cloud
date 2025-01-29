import { IsNotEmpty } from 'class-validator';

export class ProjectResponse2 {
  name?: string;
  @IsNotEmpty()
  userId?: string;
}
