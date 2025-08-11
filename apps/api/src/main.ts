import { INestApplication, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule } from "@nestjs/swagger";
import * as Sentry from "@sentry/nestjs";
import { json, urlencoded } from "express";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { SentryExceptionFilter } from "./common/filters/sentry-exception.filter";
import { generateOpenAPIConfig } from "./common/openapi";
import { initializeSentry } from "./sentry";
import { initializeOpenTelemetry, shutdownOpenTelemetry } from "./telemetry";

async function bootstrap() {
  // Initialize Sentry FIRST, before anything else
  initializeSentry();

  // Initialize OpenTelemetry (works alongside Sentry)
  const sdk = initializeOpenTelemetry();

  const app = await NestFactory.create(AppModule, { cors: true });

  // Add Sentry error handler (must be before other exception filters)
  app.useGlobalFilters(new HttpExceptionFilter(), new SentryExceptionFilter());

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  configureSwagger(app);
  app.use(json({ limit: "1mb" }));
  app.use(urlencoded({ extended: true, limit: "1mb" }));

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    if (process.env.NODE_ENV === "production") {
      console.log("SIGTERM received, shutting down...");

      // Flush Sentry before shutdown
      await Sentry.close(2000);

      await shutdownOpenTelemetry(sdk);
    }
  });

  // Add unhandled rejection handler
  process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    Sentry.captureException(reason);
  });

  process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
    Sentry.captureException(error);
    // Give Sentry time to send the error before crashing
    Sentry.close(2000).then(() => process.exit(1));
  });

  console.log("Starting server on port", process.env.PORT || 3000);
  await app.listen(process.env.PORT || 3000);
}

function configureSwagger(app: INestApplication) {
  const document = generateOpenAPIConfig(app);
  SwaggerModule.setup("api", app, document);
}
bootstrap();
