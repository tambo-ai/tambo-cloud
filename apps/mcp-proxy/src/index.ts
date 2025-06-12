#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
} from "@modelcontextprotocol/sdk/types.js";

// Constants
const NWS_API_BASE = "https://api.weather.gov";
const USER_AGENT = "weather-app/1.0";

// Server instance
const server = new Server(
  {
    name: "weather-server",
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
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Weather MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
