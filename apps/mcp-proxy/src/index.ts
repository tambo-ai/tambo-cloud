#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
} from "@modelcontextprotocol/sdk/types.js";
import { Command } from "commander";
import express, { Request, Response } from "express";
import { createServer } from "http";

// see https://github.com/modelcontextprotocol/servers/blob/main/src/everything/streamableHttp.ts
// for a more complete example of how to use the StreamableHTTPServerTransport, and still have sessions, etc

const app = express();

// Constants
const NWS_API_BASE = "https://api.weather.gov";
const USER_AGENT = "weather-app/1.0";

// Parse command line arguments
const program = new Command();
program
  .name("tambo-mcp-proxy")
  .description(
    "A proxy for Tambo that connects to all known MCP servers for a given project",
  )
  .version("0.1.0")
  .option("-p, --port <number>", "port to listen on", (value: string) =>
    parseInt(value, 10),
  )
  .parse(process.argv);

const options = program.opts();

// Determine the port to use
function getDesiredPort(): number {
  // Priority: CLI flag > environment variable > default (3003)
  if (options.port) {
    return options.port;
  }
  if (process.env.PORT) {
    return parseInt(process.env.PORT, 10);
  }
  return 3003;
}

// Function to check if a port is available
async function isPortAvailable(port: number): Promise<boolean> {
  return await new Promise((resolve) => {
    const server = createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

// Function to find an available port starting from the desired port
async function findAvailablePort(startPort: number): Promise<number> {
  let port = startPort;
  const maxAttempts = 100; // Prevent infinite loop
  let attempts = 0;

  while (attempts < maxAttempts) {
    if (await isPortAvailable(port)) {
      return port;
    }
    port++;
    attempts++;
  }

  throw new Error(
    `Could not find an available port after ${maxAttempts} attempts starting from ${startPort}`,
  );
}

// Server instance
const server = new Server(
  {
    name: "tambo-mcp-proxy",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Helper function to make NWS API requests
async function makeNWSRequest(url: string): Promise<any> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/geo+json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error making NWS request to ${url}:`, error);
    return null;
  }
}

// Helper function to format alert
function formatAlert(feature: any): string {
  const props = feature.properties;
  return `
Event: ${props.event || "Unknown"}
Area: ${props.areaDesc || "Unknown"}
Severity: ${props.severity || "Unknown"}
Description: ${props.description || "No description available"}
Instructions: ${props.instruction || "No specific instructions provided"}
`;
}

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get-alerts",
        description: "Get weather alerts for a US state",
        inputSchema: {
          type: "object",
          properties: {
            state: {
              type: "string",
              description: "Two-letter US state code (e.g. CA, NY)",
            },
          },
          required: ["state"],
        },
      },
      {
        name: "get-forecast",
        description: "Get weather forecast for a location",
        inputSchema: {
          type: "object",
          properties: {
            latitude: {
              type: "number",
              description: "Latitude of the location",
            },
            longitude: {
              type: "number",
              description: "Longitude of the location",
            },
          },
          required: ["latitude", "longitude"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(
  CallToolRequestSchema,
  async (request: CallToolRequest) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "get-alerts":
        try {
          const { state } = args as { state: string };
          const url = `${NWS_API_BASE}/alerts/active/area/${state}`;
          const data = await makeNWSRequest(url);

          if (!data || !data.features) {
            return {
              content: [
                {
                  type: "text",
                  text: "Unable to fetch alerts or no alerts found.",
                },
              ],
            };
          }

          if (data.features.length === 0) {
            return {
              content: [
                { type: "text", text: "No active alerts for this state." },
              ],
            };
          }

          const alerts = data.features.map(formatAlert);
          return {
            content: [{ type: "text", text: alerts.join("\n---\n") }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error getting alerts: ${error}` }],
            isError: true,
          };
        }

      case "get-forecast":
        try {
          const { latitude, longitude } = args as {
            latitude: number;
            longitude: number;
          };

          // First get the forecast grid endpoint
          const pointsUrl = `${NWS_API_BASE}/points/${latitude},${longitude}`;
          const pointsData = await makeNWSRequest(pointsUrl);

          if (!pointsData) {
            return {
              content: [
                {
                  type: "text",
                  text: "Unable to fetch forecast data for this location.",
                },
              ],
            };
          }

          // Get the forecast URL from the points response
          const forecastUrl = pointsData.properties.forecast;
          const forecastData = await makeNWSRequest(forecastUrl);

          if (!forecastData) {
            return {
              content: [
                { type: "text", text: "Unable to fetch detailed forecast." },
              ],
            };
          }

          // Format the periods into a readable forecast
          const periods = forecastData.properties.periods.slice(0, 5); // Only show next 5 periods
          const forecasts = periods.map((period: any) => {
            return `
${period.name}:
Temperature: ${period.temperature}°${period.temperatureUnit}
Wind: ${period.windSpeed} ${period.windDirection}
Forecast: ${period.detailedForecast}
`;
          });

          return {
            content: [{ type: "text", text: forecasts.join("\n---\n") }],
          };
        } catch (error) {
          return {
            content: [
              { type: "text", text: `Error getting forecast: ${error}` },
            ],
            isError: true,
          };
        }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  },
);

// Start the server
async function main() {
  try {
    const desiredPort = getDesiredPort();
    const port = await findAvailablePort(desiredPort);

    const transport = new StreamableHTTPServerTransport({
      // creates stateless sessions
      sessionIdGenerator: undefined,
    });

    app.post("/mcp", (req: Request, res: Response) => {
      transport.handleRequest(req, res);
    });

    await server.connect(transport);

    app.listen(port, () => {
      console.error(
        `Tambo MCP proxy server running on http://localhost:${port}/mcp`,
      );
      if (port !== desiredPort) {
        console.error(
          `Note: Started on port ${port} instead of requested port ${desiredPort} (port was not available)`,
        );
      }
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
