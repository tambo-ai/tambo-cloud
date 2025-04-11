// This is a temporary mock file to make the build pass
// It will be replaced with the actual implementation later

export type ComposioClient = {
  request: (options: any) => Promise<any>;
  apps: {
    list: () => Promise<any[]>;
  };
};

export function createComposioClient(): ComposioClient {
  return {
    request: async () => {
      return { data: "mocked response" };
    },
    apps: {
      list: async () => {
        return [];
      },
    },
  };
}

export function getComposio(): ComposioClient {
  return createComposioClient();
}
