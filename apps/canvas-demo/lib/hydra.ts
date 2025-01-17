import { HydraClient } from "hydra-ai";
import { ChatMessage } from "hydra-ai/dist/hydra-ai/model/chat-message";
import { CanvasComponent } from "@/components/CanvasComponent";
import { CanvasComponentPropsSchema } from "@/lib/schema";
import { searchFredSeries } from "@/lib/fred";
import type { ComponentContextTool } from "hydra-ai/dist/hydra-ai/model/component-metadata";
import { zodToJsonSchema } from "zod-to-json-schema";

interface HydraStatus {
  status: string;
  progress?: number;
}

const hydraApiKey = process.env.NEXT_PUBLIC_HYDRA_API_KEY;

export const hydraClient = new HydraClient({
  hydraApiKey: hydraApiKey || "",
});

const fredSearchTool: ComponentContextTool = {
  definition: {
    name: "searchFredSeries",
    description: "Search for FRED economic data series by keywords",
    parameters: [
      // Doesn't support array of strings
      {
        name: "searchText",
        type: "string",
        description:
          "Keywords to search for in FRED series. Can be a single string.",
        isRequired: true,
      },
    ],
  },
  getComponentContext: async (searchText: string) => {
    try {
      const results = await searchFredSeries(searchText);
      return results;
    } catch (error) {
      console.error("Error searching FRED series:", error);
      throw error;
    }
  },
};

// Register the CanvasComponent with Hydra
hydraClient.registerComponent({
  name: "FredChart",
  description:
    "A component for displaying FRED economic data charts. When generating components:\n" +
    "1. Always specify explicit series_id values based on the user's needs\n" +
    "2. Choose appropriate frequency and units based on the data being displayed\n" +
    "3. For each input, provide both the selected value and alternative options:\n" +
    "   - For series_id: Provide the main series and related alternatives\n" +
    "   - For frequency: Only use frequencies supported by the series (q, sa, a)\n" +
    "   - For units: Choose the best unit type but provide alternatives that make sense\n" +
    "4. Consider using multiSeries: true for comparing related indicators\n" +
    "5. The inputs must match the schema defined in schema.ts\n" +
    "6. Required fields:\n" +
    "   - id: string\n" +
    "   - title: string\n" +
    "   - fredParams: { series_id, frequency, units }\n" +
    "   - inputs: array of input configurations",
  component: CanvasComponent,
  contextTools: [fredSearchTool],
  propsDefinition: {
    schema: zodToJsonSchema(CanvasComponentPropsSchema),
  },
  // @ts-expect-error - Hydra's types don't include onStatusUpdate yet
  onStatusUpdate: (status: HydraStatus) => {
    console.warn("Generation status:", status);
    window.dispatchEvent(
      new CustomEvent("hydra-status-update", {
        detail: { status },
      })
    );
  },
});

export type { ChatMessage };
