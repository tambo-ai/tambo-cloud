// Project Types
export interface ProjectResponseDto {
    id: string;
    name: {
        projectName: string;
    }
    userId: string;
}

export interface ProjectDto {
    name: string;
    userId: string;
}

export interface Project {
    id: string;
    name: string;
    userId: string;
    apiKeys: APIKeyResponseDto[];
    providerKeys: ProviderKeyResponseDto[];
}

// API Key Types
export interface APIKeyResponseDto {
    id: string;
    name: string;
    partiallyHiddenKey: string;
    lastUsed: Date;
    created: Date;
    createdByUserId: string;
}

export interface ProviderKeyResponseDto {
    id: string;
    providerName: string;
    providerKeyEncrypted: string;
}

export interface CreateProjectRequest {
    name: string;
}

export interface CreateApiKeyRequest {
    name: string;
}
