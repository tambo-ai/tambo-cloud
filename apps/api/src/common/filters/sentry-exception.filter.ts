import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import * as Sentry from "@sentry/nestjs";
import { Request } from "express";

@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SentryExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();

    // Determine the status code
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Extract error details
    const errorResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: "Internal server error" };

    const errorMessage =
      typeof errorResponse === "string"
        ? errorResponse
        : (errorResponse as any).message ||
          exception.message ||
          "Unknown error";

    // Capture exception in Sentry with additional context
    if (status >= 500 || !exception.statusCode) {
      // Only send server errors and unhandled exceptions to Sentry
      Sentry.withScope((scope) => {
        // Add request context
        scope.setContext("request", {
          method: request.method,
          url: request.url,
          headers: request.headers,
          query: request.query,
          params: request.params,
          body: request.body,
        });

        // Add fingerprint for better grouping
        scope.setFingerprint([
          request.method,
          request.route?.path || request.url,
          exception.name || "UnknownError",
        ]);

        // Capture the exception
        Sentry.captureException(exception);
      });
    }

    // Log locally as well
    this.logger.error(
      `[${request.method}] ${request.url} - Status: ${status} - ${errorMessage}`,
      exception.stack,
    );

    // Send response (let the HttpExceptionFilter handle the actual response formatting)
    // This filter is just for Sentry reporting
    throw exception;
  }
}
