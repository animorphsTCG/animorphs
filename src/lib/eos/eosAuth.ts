/**
 * Epic Online Services (EOS) Authentication Client
 * Handles token-based authentication with Epic's OAuth service
 */

const EOS_BASE_URL = 'https://api.epicgames.dev';
const EOS_AUTH_URL = 'https://www.epicgames.com/id/api/redirect';

// Environment-based configuration
interface EOSConfig {
  clientId: string;
  clientSecret: string;
  environmentId: string;
  isProduction: boolean;
  redirectUrl: string;
}

// Get EOS configuration from environment variables
export const getEOSConfig = (): EOSConfig => {
  const clientId = import.meta.env.EOS_CLIENT_ID || 'xyza78914XQON5yBeLZvdyhqLtZUKriu';
  const clientSecret = import.meta.env.EOS_CLIENT_SECRET || 'Kxrh2Tmag20JFML8uFgBWxBRyvfWe0352B3jOCDKSjs';
  // Check if we're in production environment
  const isProduction = import.meta.env.EOS_ENVIRONMENT === 'Release';
  
  // Use the appropriate environment ID based on the environment
  const environmentId = isProduction 
    ? import.meta.env.EOS_ENV_RELEASE_ID || 'c3b2637442224a31b5408418bdfbe9a6'  
    : import.meta.env.EOS_ENV_LIVE_SANDBOX_ID || '90eb223664704cb6ab8da2529a62d052';
    
  // Redirect URL for OAuth flows
  const redirectUrl = `${window.location.origin}/auth/callback`;
  
  return {
    clientId,
    clientSecret,
    environmentId,
    isProduction,
    redirectUrl
  };
};

// Authentication response from EOS
export interface EOSAuthResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  refresh_token?: string;
  refresh_expires_in?: number;
  account_id?: string;
  client_id?: string;
  application_id?: string;
  expires_at?: number;
  refresh_expires_at?: number;
}

// User profile from EOS
export interface EOSUserProfile {
  id: string;
  displayName: string;
  preferredLanguage?: string;
  email?: string;
  country?: string;
  avatarUrl?: string;
}

// Auth error
export class EOSAuthError extends Error {
  code: string;
  
  constructor(message: string, code: string = 'auth/unknown') {
    super(message);
    this.code = code;
    this.name = 'EOSAuthError';
  }
}

/**
 * Get authentication tokens from EOS using client credentials
 */
export const getClientCredentialsToken = async (): Promise<EOSAuthResponse> => {
  const config = getEOSConfig();
  const encodedCredentials = btoa(`${config.clientId}:${config.clientSecret}`);
  
  try {
    const response = await fetch(`${EOS_BASE_URL}/auth/v1/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${encodedCredentials}`
      },
      body: new URLSearchParams({
        'grant_type': 'client_credentials',
        'deployment_id': config.environmentId
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new EOSAuthError(
        error.message || 'Failed to obtain client credentials token',
        error.errorCode || 'auth/client-credentials-failed'
      );
    }
    
    const data = await response.json();
    
    // Add expiration timestamps for easier management
    const now = Date.now();
    data.expires_at = now + (data.expires_in * 1000);
    if (data.refresh_token && data.refresh_expires_in) {
      data.refresh_expires_at = now + (data.refresh_expires_in * 1000);
    }
    
    return data;
  } catch (error) {
    if (error instanceof EOSAuthError) {
      throw error;
    }
    throw new EOSAuthError(`Failed to obtain EOS token: ${error.message}`, 'auth/network-error');
  }
};

/**
 * Exchange username/password for auth tokens
 */
export const signInWithPassword = async (email: string, password: string): Promise<EOSAuthResponse> => {
  const config = getEOSConfig();
  const encodedCredentials = btoa(`${config.clientId}:${config.clientSecret}`);
  
  try {
    const response = await fetch(`${EOS_BASE_URL}/auth/v1/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${encodedCredentials}`
      },
      body: new URLSearchParams({
        'grant_type': 'password',
        'username': email,
        'password': password,
        'deployment_id': config.environmentId
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new EOSAuthError(
        error.message || 'Invalid login credentials',
        error.errorCode || 'auth/invalid-login'
      );
    }
    
    const data = await response.json();
    
    // Add expiration timestamps for easier management
    const now = Date.now();
    data.expires_at = now + (data.expires_in * 1000);
    if (data.refresh_token && data.refresh_expires_in) {
      data.refresh_expires_at = now + (data.refresh_expires_in * 1000);
    }
    
    return data;
  } catch (error) {
    if (error instanceof EOSAuthError) {
      throw error;
    }
    throw new EOSAuthError(`Login failed: ${error.message}`, 'auth/login-failed');
  }
};

/**
 * Refresh an existing authentication token
 */
export const refreshAuthToken = async (refreshToken: string): Promise<EOSAuthResponse> => {
  const config = getEOSConfig();
  const encodedCredentials = btoa(`${config.clientId}:${config.clientSecret}`);
  
  try {
    const response = await fetch(`${EOS_BASE_URL}/auth/v1/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${encodedCredentials}`
      },
      body: new URLSearchParams({
        'grant_type': 'refresh_token',
        'refresh_token': refreshToken,
        'deployment_id': config.environmentId
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new EOSAuthError(
        error.message || 'Failed to refresh token',
        error.errorCode || 'auth/refresh-failed'
      );
    }
    
    const data = await response.json();
    
    // Add expiration timestamps for easier management
    const now = Date.now();
    data.expires_at = now + (data.expires_in * 1000);
    if (data.refresh_token && data.refresh_expires_in) {
      data.refresh_expires_at = now + (data.refresh_expires_in * 1000);
    }
    
    return data;
  } catch (error) {
    if (error instanceof EOSAuthError) {
      throw error;
    }
    throw new EOSAuthError(`Token refresh failed: ${error.message}`, 'auth/refresh-failed');
  }
};

/**
 * Generate OAuth URL for Epic Games account login
 */
export const getEpicGamesOAuthURL = (): string => {
  const config = getEOSConfig();
  
  // Create the state parameter with a random value for security
  const state = Math.random().toString(36).substring(2, 15);
  
  // Store the state in localStorage to verify when the user returns
  localStorage.setItem('eos_oauth_state', state);
  
  // Build the OAuth URL using Epic Games' official authorization endpoint
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUrl,
    response_type: 'code',
    scope: 'basic_profile openid',
    state: state,
    deployment_id: config.environmentId
  });
  
  return `${EOS_AUTH_URL}?${params.toString()}`;
};

/**
 * Exchange OAuth code for auth tokens
 */
export const exchangeCodeForToken = async (code: string): Promise<EOSAuthResponse> => {
  const config = getEOSConfig();
  const encodedCredentials = btoa(`${config.clientId}:${config.clientSecret}`);
  
  try {
    const response = await fetch(`${EOS_BASE_URL}/auth/v1/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${encodedCredentials}`
      },
      body: new URLSearchParams({
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': config.redirectUrl,
        'deployment_id': config.environmentId
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new EOSAuthError(
        error.message || 'Failed to exchange code for token',
        error.errorCode || 'auth/code-exchange-failed'
      );
    }
    
    const data = await response.json();
    
    // Add expiration timestamps for easier management
    const now = Date.now();
    data.expires_at = now + (data.expires_in * 1000);
    if (data.refresh_token && data.refresh_expires_in) {
      data.refresh_expires_at = now + (data.refresh_expires_in * 1000);
    }
    
    return data;
  } catch (error) {
    if (error instanceof EOSAuthError) {
      throw error;
    }
    throw new EOSAuthError(`Failed to exchange code: ${error.message}`, 'auth/code-exchange-failed');
  }
};

/**
 * Sign up a new user
 */
export const signUp = async (
  email: string, 
  password: string, 
  displayName: string, 
  metadata?: Record<string, any>
): Promise<EOSAuthResponse> => {
  // First, get a client credentials token
  const clientToken = await getClientCredentialsToken();
  
  const config = getEOSConfig();
  
  try {
    // 1. Create the account
    const createAccountResponse = await fetch(`${EOS_BASE_URL}/account/v1/public/accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${clientToken.access_token}`
      },
      body: JSON.stringify({
        email,
        password,
        displayName,
        country: metadata?.country || 'ZA', // Default to South Africa
        preferredLanguage: metadata?.preferredLanguage || 'en',
        termsAccepted: true,
        displayNameConfirmed: true,
        dateOfBirth: metadata?.dateOfBirth || '1990-01-01'
      })
    });
    
    if (!createAccountResponse.ok) {
      const error = await createAccountResponse.json();
      throw new EOSAuthError(
        error.message || 'Account creation failed',
        error.errorCode || 'auth/signup-failed'
      );
    }
    
    // 2. Now log in with the created account to get auth tokens
    return await signInWithPassword(email, password);
    
  } catch (error) {
    if (error instanceof EOSAuthError) {
      throw error;
    }
    throw new EOSAuthError(`Sign up failed: ${error.message}`, 'auth/signup-failed');
  }
};

/**
 * Get the current user's profile information
 */
export const getUserProfile = async (accessToken: string): Promise<EOSUserProfile> => {
  try {
    const response = await fetch(`${EOS_BASE_URL}/account/v1/public/account`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new EOSAuthError(
        error.message || 'Failed to get user profile',
        error.errorCode || 'auth/profile-fetch-failed'
      );
    }
    
    const data = await response.json();
    
    return {
      id: data.id,
      displayName: data.displayName,
      email: data.email,
      preferredLanguage: data.preferredLanguage,
      country: data.country,
      avatarUrl: data.avatarUrl
    };
  } catch (error) {
    if (error instanceof EOSAuthError) {
      throw error;
    }
    throw new EOSAuthError(`Failed to fetch profile: ${error.message}`, 'auth/profile-fetch-failed');
  }
};

/**
 * Sign out the current user
 * Note: For EOS, this is just clearing local tokens since there is no server-side logout
 */
export const signOut = async (): Promise<void> => {
  // For EOS, signout is client-side only as it's token-based
  // Just clear local storage and return
  localStorage.removeItem('eos_auth_user');
  localStorage.removeItem('eos_auth_token');
  localStorage.removeItem('eos_oauth_state');
  
  return Promise.resolve();
};

/**
 * Reset password for a user
 */
export const resetPassword = async (email: string): Promise<void> => {
  const clientToken = await getClientCredentialsToken();
  const config = getEOSConfig();
  
  try {
    const response = await fetch(`${EOS_BASE_URL}/account/v1/public/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${clientToken.access_token}`
      },
      body: JSON.stringify({
        email,
        deploymentId: config.environmentId
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new EOSAuthError(
        error.message || 'Password reset request failed',
        error.errorCode || 'auth/reset-failed'
      );
    }
    
    return;
  } catch (error) {
    if (error instanceof EOSAuthError) {
      throw error;
    }
    throw new EOSAuthError(`Password reset failed: ${error.message}`, 'auth/reset-failed');
  }
};

/**
 * Handle authentication callback from Epic Games OAuth
 */
export const handleAuthCallback = async (url: URL): Promise<EOSAuthResponse> => {
  // Extract the authorization code from the URL
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  
  // Verify the state parameter to prevent CSRF attacks
  const savedState = localStorage.getItem('eos_oauth_state');
  localStorage.removeItem('eos_oauth_state'); // Clean up state
  
  if (!state || state !== savedState) {
    throw new EOSAuthError('Invalid state parameter', 'auth/invalid-state');
  }
  
  if (!code) {
    throw new EOSAuthError('No authorization code found in callback URL', 'auth/missing-code');
  }
  
  // Exchange the code for tokens
  return await exchangeCodeForToken(code);
};
