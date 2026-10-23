import { Body, Controller, HttpCode, Logger, Post } from '@nestjs/common';
import { RATE_LIMITS, RateLimit } from '../common/rate-limit.guard';
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
  @RateLimit(RATE_LIMITS.chat)
  async chat(
    @Body(new ZodValidationPipe(chatRequestSchema)) body: ChatRequest,
  ): Promise<ChatResponse> {
    try {
      return await this.chatService.reply(body.message, body.conversationId, body.language);
    } catch (error) {
      return rethrowAsUnavailable(error, this.logger, 'réponse de Sonah');
    }
  }
}
