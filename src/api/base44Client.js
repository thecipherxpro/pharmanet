import { createClient } from '@base44/sdk';

export const base44 = createClient({
  projectId: import.meta.env.VITE_BASE44_PROJECT_ID,
  envKey: import.meta.env.VITE_BASE44_ENVIRONMENT_KEY,
  apiUrl: import.meta.env.VITE_BASE44_API_ROOT || "https://api.base44.com",
  requiresAuth: true
});
