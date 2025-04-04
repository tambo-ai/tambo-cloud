declare module "tambo-ai" {
  // Preserving the HydraClient name as it's the actual class name used by the library
  export class HydraClient {
    constructor(options: {
      hydraApiKey?: string;
      hydraApiUrl?: string;
      tamboApiKey?: string;
      tamboApiUrl?: string;
    });

    generateComponent(
      input: string,
      callback: (message: string) => void,
      threadId?: string,
    ): Promise<{
      threadId?: string;
      message: string;
      component?: React.ReactNode;
      suggestedActions?: Array<{
        label: string;
        actionText: string;
      }>;
    }>;

    registerComponent(options: {
      component: React.ComponentType<any>;
      name: string;
      description: string;
      propsDefinition: Record<string, string>;
      contextTools: any[];
    }): void;
  }
}
