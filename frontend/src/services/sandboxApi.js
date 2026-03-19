import { api } from './api';

/**
 * Sandbox API Service
 * Handles all API calls related to sandbox management using authenticatedRequest
 */
class SandboxApi {
    /**
     * Get all available sandbox scenarios
     */
    async getScenarios() {
        try {
            return await api.sandboxRequest('/api/sandbox/scenarios');
        } catch (error) {
            console.error('Failed to fetch scenarios:', error);
            throw error;
        }
    }

    /**
     * Get details of a specific scenario
     */
    async getScenarioDetails(scenarioId) {
        try {
            return await api.sandboxRequest(`/api/sandbox/scenarios/${scenarioId}`);
        } catch (error) {
            console.error(`Failed to fetch scenario ${scenarioId}:`, error);
            throw error;
        }
    }

    /**
     * Launch a new sandbox environment
     */
    async startSandbox(userId, scenarioId) {
        try {
            return await api.sandboxRequest('/api/sandbox/launch', {
                method: 'POST',
                body: JSON.stringify({
                    user_id: userId,
                    scenario_id: scenarioId
                })
            });
        } catch (error) {
            console.error('Failed to start sandbox:', error);
            throw error;
        }
    }

    /**
     * Stop a running sandbox
     */
    async stopSandbox(containerName) {
        try {
            return await api.sandboxRequest(`/api/sandbox/stop/${containerName}`, {
                method: 'POST'
            });
        } catch (error) {
            console.error(`Failed to stop sandbox ${containerName}:`, error);
            throw error;
        }
    }

    /**
     * Get status of a sandbox container
     */
    async getSandboxStatus(containerName) {
        try {
            return await api.sandboxRequest(`/api/sandbox/status/${containerName}`);
        } catch (error) {
            console.error(`Failed to get status for ${containerName}:`, error);
            throw error;
        }
    }

    /**
     * Get all active sandboxes for a user
     */
    async getUserSandboxes(userId) {
        try {
            return await api.sandboxRequest(`/api/sandbox/user/${userId}`);
        } catch (error) {
            console.error(`Failed to get sandboxes for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Extend sandbox time
     */
    async extendSandboxTime(containerName, hours = 2) {
        try {
            return await api.sandboxRequest(`/api/sandbox/extend/${containerName}`, {
                method: 'POST',
                body: JSON.stringify({ hours })
            });
        } catch (error) {
            console.error(`Failed to extend time for ${containerName}:`, error);
            throw error;
        }
    }

    /**
     * Check if sandbox service is healthy
     */
    async checkHealth() {
        try {
            return await api.sandboxRequest('/api/sandbox/health');
        } catch (error) {
            console.error('Sandbox health check failed:', error);
            return { status: 'unhealthy', docker: 'unavailable' };
        }
    }
}

// Export singleton instance
export const sandboxApi = new SandboxApi();

// Also export the class for testing
export default SandboxApi;
