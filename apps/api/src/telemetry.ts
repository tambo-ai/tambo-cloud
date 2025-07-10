import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { ExpressInstrumentation } from "@opentelemetry/instrumentation-express";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { NestInstrumentation } from "@opentelemetry/instrumentation-nestjs-core";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK, NodeSDKConfiguration } from "@opentelemetry/sdk-node";

// Langfuse configuration
function createLangfuseConfig() {
  const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
  const secretKey = process.env.LANGFUSE_SECRET_KEY;
  const baseUrl = process.env.LANGFUSE_HOST || "https://cloud.langfuse.com";

  if (!publicKey || !secretKey) {
    console.log(
      "Langfuse credentials not found, OpenTelemetry will not export to Langfuse",
    );
    return null;
  }

  // Create Basic Auth header
  const authString = Buffer.from(`${publicKey}:${secretKey}`).toString(
    "base64",
  );

  return {
    url: `${baseUrl}/api/public/otel`,
    headers: {
      Authorization: `Basic ${authString}`,
    },
  };
}

// Initialize OpenTelemetry
export function initializeOpenTelemetry() {
  const langfuseConfig = createLangfuseConfig();

  // Create resource with service information
  const resource = resourceFromAttributes({
    "service.name": "tambo-ai-api",
    "service.version": "1.0.0",
    "deployment.environment": process.env.NODE_ENV || "development",
  });

  // Configure instrumentations
  const instrumentations = [
    new HttpInstrumentation({
      // Don't trace health checks and other noise
      ignoreIncomingRequestHook: (req) => {
        const url = req.url || "";
        return url.includes("/health") || url.includes("/metrics");
      },
    }),
    new ExpressInstrumentation(),
    new NestInstrumentation(),
    ...getNodeAutoInstrumentations(),
  ];

  // Create SDK configuration
  const sdkConfig: Partial<NodeSDKConfiguration> = {
    resource,
    instrumentations,
  };

  // Add Langfuse exporter if configured
  if (langfuseConfig) {
    sdkConfig.traceExporter = new OTLPTraceExporter(langfuseConfig);
    console.log("OpenTelemetry configured with Langfuse exporter");
  } else {
    console.log("OpenTelemetry configured without external exporter");
  }

  // Initialize the SDK
  const sdk = new NodeSDK(sdkConfig);

  // Start the SDK
  sdk.start();

  console.log("OpenTelemetry initialized successfully");

  return sdk;
}

// Graceful shutdown
export async function shutdownOpenTelemetry(sdk: NodeSDK) {
  return await sdk.shutdown();
}
