import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.usehydra.ai';

export class HydraService {
    private static instance: HydraService;
    private token: string | null = null;

    private constructor() { }

    static getInstance(): HydraService {
        if (!HydraService.instance) {
            HydraService.instance = new HydraService();
        }
        return HydraService.instance;
    }

    setToken(token: string) {
        this.token = token;
    }

    private getHeaders() {
        return {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
        };
    }

    async createProject(projectName: string) {
        const response = await axios.post(
            `${API_BASE_URL}/projects`,
            { projectName },
            { headers: this.getHeaders() }
        );
        return response.data;
    }

    async getUserProjects() {
        const response = await axios.get(`${API_BASE_URL}/projects/user`, {
            headers: this.getHeaders(),
        });
        return response.data;
    }

    async getProject(id: string) {
        const response = await axios.get(`${API_BASE_URL}/projects/${id}`, {
            headers: this.getHeaders(),
        });
        return response.data;
    }

    async generateApiKey(projectId: string, name: string) {
        const response = await axios.put(
            `${API_BASE_URL}/projects/${projectId}/api-key/${name}`,
            {},
            { headers: this.getHeaders() }
        );
        return response.data;
    }

    async getApiKeys(projectId: string) {
        const response = await axios.get(
            `${API_BASE_URL}/projects/${projectId}/api-keys`,
            { headers: this.getHeaders() }
        );
        return response.data;
    }

    async removeApiKey(projectId: string, apiKeyId: string) {
        const response = await axios.delete(
            `${API_BASE_URL}/projects/${projectId}/api-key/${apiKeyId}`,
            { headers: this.getHeaders() }
        );
        return response.data;
    }

    async addProviderKey(projectId: string, providerName: string, providerKey: string) {
        const response = await axios.put(
            `${API_BASE_URL}/projects/${projectId}/provider-key`,
            { providerName, providerKey },
            { headers: this.getHeaders() }
        );
        return response.data;
    }

    async removeProviderKey(projectId: string, providerKeyId: string) {
        const response = await axios.delete(
            `${API_BASE_URL}/projects/${projectId}/provider-key/${providerKeyId}`,
            { headers: this.getHeaders() }
        );
        return response.data;
    }
}

export const hydraService = HydraService.getInstance(); 