
export interface Session {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  user: User;
}

export interface User {
  id: string;
  email?: string;
  displayName?: string;
}

export interface WebAuthnCredential {
  id: string;
  publicKey: string;
  algorithm: string;
}
