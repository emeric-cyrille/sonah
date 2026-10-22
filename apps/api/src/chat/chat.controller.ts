import { Body, Controller, HttpCode, Logger, Post } from '@nestjs/common';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { rethrowAsUnavailable } from '../common/unavailable';
import { chatRequestSchema, type ChatRequest, type ChatResponse } from './chat.schemas';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chatService: ChatService) {}

  /** Envoie un message à Sonah. */
  @Post()
  @HttpCode(200)
  async chat(
    @Body(new ZodValidationPipe(chatRequestSchema)) body: ChatRequest,
  ): Promise<ChatResponse> {
    try {
      return await this.chatService.reply(body.message, body.conversationId);
    } catch (error) {
      return rethrowAsUnavailable(error, this.logger, 'réponse de Sonah');
    }
  }
}
