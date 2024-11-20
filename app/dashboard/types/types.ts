// Project Types
export interface ProjectResponseDto {
    id: string;
    name: string;
    userId: string;
}

export interface ProjectDto {
    name: string;
    userId: string;
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

// API Response Types
export interface ApiResponse<T> {
    data: T;
    message?: string;
    status: number;
}

// Error Types
export interface ApiError {
    message: string;
    status: number;
    errors?: Record<string, string[]>;
}

// Request Types
export interface CreateProjectRequest {
    name: string;
}

export interface CreateApiKeyRequest {
    name: string;
}

// Pagination Types (if needed)
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}