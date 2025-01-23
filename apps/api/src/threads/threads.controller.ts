import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { SupabaseAuthGuard } from 'nest-supabase-guard/dist/supabase-auth.guard';
import { ProjectAccessOwnGuard } from '../projects/guards/project-access-own.guard';
import { MessageDto } from './dto/message.dto';
import { ThreadDto } from './dto/thread.dto';
import { ThreadsService } from './threads.service';

@ApiBearerAuth()
@ApiSecurity('x-api-key')
@UseGuards(SupabaseAuthGuard)
@Controller('threads')
export class ThreadsController {
  constructor(private readonly threadsService: ThreadsService) {}

  @UseGuards(ProjectAccessOwnGuard)
  @Post()
  create(@Body() createThreadDto: ThreadDto) {
    return this.threadsService.create(createThreadDto);
  }

  @UseGuards(ProjectAccessOwnGuard)
  @Get('project/:projectId')
  findAllForProject(
    @Param('projectId') projectId: string,
    @Query('contextKey') contextKey?: string,
  ) {
    return this.threadsService.findAllForProject(projectId, { contextKey });
  }

  @UseGuards(ProjectAccessOwnGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.threadsService.findOne(id);
  }

  @UseGuards(ProjectAccessOwnGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() updateThreadDto: ThreadDto) {
    return this.threadsService.update(id, updateThreadDto);
  }

  @UseGuards(ProjectAccessOwnGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.threadsService.remove(id);
  }

  @UseGuards(ProjectAccessOwnGuard)
  @Post(':threadId/messages')
  addMessage(
    @Param('threadId') threadId: string,
    @Body() messageDto: MessageDto,
  ) {
    return this.threadsService.addMessage(threadId, messageDto);
  }

  @UseGuards(ProjectAccessOwnGuard)
  @Get(':threadId/messages')
  getMessages(@Param('threadId') threadId: string) {
    return this.threadsService.getMessages(threadId);
  }

  @UseGuards(ProjectAccessOwnGuard)
  @Delete(':threadId/messages/:messageId')
  deleteMessage(
    @Param('threadId') threadId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.threadsService.deleteMessage(messageId);
  }
}
