import { createClient } from '@base44/sdk';

export const base44 = createClient({
  projectId: import.meta.env.VITE_BASE44_PROJECT_ID,
  envKey: import.meta.env.VITE_BASE44_ENVIRONMENT_KEY,
  apiUrl: import.meta.env.VITE_BASE44_API_ROOT || "https://api.base44.com",
  requiresAuth: true
});

  // Get user from Authorization header (if frontend sends it)
  const authHeader = req.headers.authorization;
  if (authHeader) {
    base44.setToken(authHeader.replace('Bearer ', ''));
  }

  // Now you can use Base44 auth
  try {
    const user = await base44.auth.me();
    res.json({ user });
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
