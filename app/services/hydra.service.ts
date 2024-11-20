import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.usehydra.ai';

let token: string | null = null;

export const setToken = (newToken: string) => {
    token = newToken;
};

const getHeaders = () => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
});

export const createProject = async (projectName: string) => {
    const response = await axios.post(
        `${API_BASE_URL}/projects`,
        { projectName },
        { headers: getHeaders() }
    );
    return response.data;
};

export const getUserProjects = async () => {
    const response = await axios.get(`${API_BASE_URL}/projects/user`, {
        headers: getHeaders(),
    });
    return response.data;
};

export const getProject = async (id: string) => {
    const response = await axios.get(`${API_BASE_URL}/projects/${id}`, {
        headers: getHeaders(),
    });
    return response.data;
};

export const generateApiKey = async (projectId: string, name: string) => {
    const response = await axios.put(
        `${API_BASE_URL}/projects/${projectId}/api-key/${name}`,
        {},
        { headers: getHeaders() }
    );
    return response.data;
};

export const getApiKeys = async (projectId: string) => {
    const response = await axios.get(
        `${API_BASE_URL}/projects/${projectId}/api-keys`,
        { headers: getHeaders() }
    );
    return response.data;
};

export const removeApiKey = async (projectId: string, apiKeyId: string) => {
    const response = await axios.delete(
        `${API_BASE_URL}/projects/${projectId}/api-key/${apiKeyId}`,
        { headers: getHeaders() }
    );
    return response.data;
};

export const addProviderKey = async (projectId: string, providerName: string, providerKey: string) => {
    const response = await axios.put(
        `${API_BASE_URL}/projects/${projectId}/provider-key`,
        { providerName, providerKey },
        { headers: getHeaders() }
    );
    return response.data;
};

export const removeProviderKey = async (projectId: string, providerKeyId: string) => {
    const response = await axios.delete(
        `${API_BASE_URL}/projects/${projectId}/provider-key/${providerKeyId}`,
        { headers: getHeaders() }
    );
    return response.data;
}; 