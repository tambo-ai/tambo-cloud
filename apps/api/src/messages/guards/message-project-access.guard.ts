import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { operations } from '@use-hydra-ai/db';
import { CorrelationLoggerService } from '../../common/services/logger.service';

/**
 * Decorator key for specifying a custom message ID parameter name.
 * Use this decorator when the route parameter name is not 'messageId'.
 *
 * @example
 * // Using with a custom parameter name
 * @MessageIdParameterKey('customMessageId')
 * @Get(':customMessageId/details')
 * getMessageDetails(@Param('customMessageId') messageId: string) {}
 */
export const MessageIdParameterKey = Reflector.createDecorator<string>({});

/**
 * Guard that ensures the user has access to the project owning the message.
 * This guard performs the following security checks:
 * 1. Validates the message ID exists
 * 2. Verifies the message belongs to a valid thread and project
 * 3. Confirms the user is a member of the project
 *
 * The guard enriches the request object with:
 * - request.projectId: The ID of the project owning the message
 *
 * @security This guard should be used on all routes that access message data
 *
 * @example
 * // Basic usage with default parameter name
 * @UseGuards(MessageProjectAccessGuard)
 * @Get(':messageId')
 * getMessage(@Param('messageId') id: string) {}
 *
 * // Usage with custom parameter name
 * @UseGuards(MessageProjectAccessGuard)
 * @MessageIdParameterKey('customId')
 * @Get(':customId/content')
 * getMessageContent(@Param('customId') id: string) {}
 */
@Injectable()
export class MessageProjectAccessGuard implements CanActivate {
  constructor(
    private readonly logger: CorrelationLoggerService,
    private reflector: Reflector,
  ) {}

  /**
   * Validates the user's access to the requested message.
   *
   * @param context - The execution context containing the request
   * @returns true if access is granted, false otherwise
   *
   * @throws {Error} If there's an unexpected error during validation
   *
   * @security This method logs all access attempts for audit purposes
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const correlationId = request['correlationId'];
    const userId = request.userId;

    try {
      const messageId = this.getMessageId(request, context);
      if (!messageId) {
        this.logger.warn(`[${correlationId}] No message ID provided`);
        return false;
      }

      const { hasAccess, projectId } =
        await operations.checkMessageProjectAccess(
          request.db,
          messageId,
          userId,
        );

      if (!hasAccess) {
        this.logger.warn(
          `[${correlationId}] User ${userId} attempted to access message ${messageId} without permission`,
        );
        return false;
      }

      request.projectId = projectId;
      this.logger.log(
        `[${correlationId}] User ${userId} accessed message ${messageId} in project ${projectId}`,
      );
      return true;
    } catch (e) {
      this.logger.error(
        `[${correlationId}] Error verifying message access: ${e instanceof Error ? e.message : 'Unknown error'}`,
        e instanceof Error ? e.stack : undefined,
      );
      return false;
    }
  }

  /**
   * Retrieves the message ID from the request parameters.
   * Supports both default 'messageId' parameter and custom parameter names
   * specified using the MessageIdParameterKey decorator.
   *
   * @param request - The HTTP request object
   * @param context - The execution context
   * @returns The message ID from the request parameters
   *
   * @example
   * // Default parameter name
   * // Route: GET /messages/:messageId
   * // Returns: request.params.messageId
   *
   * // Custom parameter name
   * // @MessageIdParameterKey('customId')
   * // Route: GET /messages/:customId
   * // Returns: request.params.customId
   */
  private getMessageId(
    request: any,
    context: ExecutionContext,
  ): string | undefined {
    const messageIdParameterKey = this.reflector.get<string>(
      MessageIdParameterKey,
      context.getHandler(),
    );
    return messageIdParameterKey
      ? request.params[messageIdParameterKey]
      : request.params.messageId;
  }
}
