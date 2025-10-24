import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { MCPClient } from "@tambo-ai-cloud/core";
import Ajv from "ajv";
import { z } from "zod";

const ajv = new Ajv();

function zodFromJsonSchema(jsonSchema: object): z.ZodTypeAny {
  const validateFn = ajv.compile(jsonSchema);
  return z.custom((data) => validateFn(data));
}

export async function registerPromptHandlers(
  server: McpServer,
  mcpClients: { client: MCPClient; serverId: string; url: string }[],
) {
  const registrations = await Promise.allSettled(
    mcpClients.map(async ({ client, serverId, url }) => {
      const capabilities = await client.client.getServerCapabilities();
      console.log("Capabilities:", capabilities);
      try {
        const promptResponse = await client.client.listPrompts();
        console.log("Prompt response:", promptResponse);
        for (const prompt of promptResponse.prompts) {
          console.log("Registering prompt:", prompt);
          const argsSchema = Object.fromEntries(
            prompt.arguments?.map((arg) => {
              const argZod = zodFromJsonSchema({
                type: arg.type ?? "string",
              });
              const requiredArgZod = arg.required ? argZod : argZod.optional();
              return [arg.name, requiredArgZod] as const;
            }) ?? [],
          );
          console.log("as zod: ", argsSchema);
          const registration = server.registerPrompt(
            prompt.name,
            {
              title: prompt.title ?? prompt.name,
              description: prompt.description,

              argsSchema: argsSchema,
            },

            // TODO: prompts without parameters seem to just pass opts as the first arg, so there is no args
            async (argsOrOpts, opts) => {
              const realArgs = (opts as any) ? argsOrOpts : opts;
              console.log(
                "Getting prompt from:",
                serverId,
                url,
                prompt.name,
                "args:",
                argsOrOpts,
                "extra:",
                opts,
                "realArgs:",
                realArgs,
              );
              try {
                const promptResponse = await client.client.getPrompt({
                  name: prompt.name,
                  arguments: realArgs as any,
                });
                console.log("Prompt response:", promptResponse);
                return promptResponse;
              } catch (error) {
                console.error("Error getting prompt:", error);
                throw error;
              }
            },
          );
          console.log(
            "Registered prompt from:",
            serverId,
            url,
            prompt.name,
            registration.title,
            registration.description,
          );
        }
      } catch (error) {
        console.error(
          "Error listing prompts for MCP server",
          serverId,
          url,
          error,
        );
      }
      // TODO: handle prompt updates
      // something like this:
      // client.client.setRequestHandler(
      //   PromptListChangedNotificationSchema,
      //   async () => {
      //     const prompts = await client.client.listPrompts();
      //     // now update the prompts in the server
      //     return {};
      //   },
      // );
    }),
  );
  for (const [index, result] of enumerate(registrations)) {
    const { serverId, url } = mcpClients[index];
    if (result.status === "rejected") {
      console.error(
        "Error listing prompts for MCP server",
        serverId,
        url,
        result.reason,
      );
    } else {
      console.log("Registered prompts from:", serverId, url);
    }
  }

  // TODO: report errors upstream
}

function enumerate<T>(iterable: Iterable<T>): Array<[number, T]> {
  const result: [number, T][] = [];
  let index = 0;
  for (const value of iterable) {
    result.push([index++, value]);
  }
  return result;
}
