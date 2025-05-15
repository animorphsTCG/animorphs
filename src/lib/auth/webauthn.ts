
/**
 * WebAuthn Authentication Library for biometric authentication
 */

export interface WebAuthnCredential {
  id: string;
  publicKey: string;
  counter: number;
}

export interface RegistrationOptions {
  userId: string;
  username: string;
  deviceName?: string;
  authenticatorType?: 'platform' | 'cross-platform';
  userVerification?: 'required' | 'preferred' | 'discouraged';
}

export interface AuthenticationOptions {
  userId?: string;
  userVerification?: 'required' | 'preferred' | 'discouraged';
}

/**
 * Start WebAuthn Registration process
 */
export async function startRegistration(options: RegistrationOptions): Promise<PublicKeyCredentialCreationOptions> {
  const { userId, username, authenticatorType = 'platform', userVerification = 'required' } = options;
  
  // Generate a random challenge
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);
  
  const publicKeyOptions: PublicKeyCredentialCreationOptions = {
    challenge,
    rp: {
      name: 'Animorphs Admin',
      id: window.location.hostname
    },
    user: {
      id: Uint8Array.from(userId, c => c.charCodeAt(0)),
      name: username,
      displayName: username
    },
    pubKeyCredParams: [
      { type: 'public-key', alg: -7 }, // ES256
      { type: 'public-key', alg: -257 } // RS256
    ],
    timeout: 60000,
    attestation: 'none',
    authenticatorSelection: {
      authenticatorAttachment: authenticatorType,
      userVerification,
      requireResidentKey: false
    }
  };
  
  return publicKeyOptions;
}

/**
 * Finish WebAuthn Registration process
 */
export async function finishRegistration(credential: PublicKeyCredential): Promise<WebAuthnCredential> {
  // Get attestation response
  const response = credential.response as AuthenticatorAttestationResponse;
  
  // Extract client data JSON
  const clientDataJSON = JSON.parse(new TextDecoder().decode(response.clientDataJSON));
  
  // Extract credential ID and public key from attestation
  const attestationObj = response.attestationObject;
  const decoder = new TextDecoder('utf-8');
  
  // In a real implementation, we would:
  // 1. Parse the CBOR attestation object
  // 2. Verify the signature
  // 3. Extract the credential ID and public key
  
  // For simplicity, we're just returning the credential ID
  return {
    id: credential.id,
    publicKey: btoa(String.fromCharCode(...new Uint8Array(attestationObj))), // Base64 encode the attestation
    counter: 0
  };
}

/**
 * Start WebAuthn Authentication process
 */
export async function startAuthentication(options: AuthenticationOptions = {}): Promise<PublicKeyCredentialRequestOptions> {
  const { userVerification = 'required' } = options;
  
  // Generate a random challenge
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);
  
  const publicKeyOptions: PublicKeyCredentialRequestOptions = {
    challenge,
    timeout: 60000,
    rpId: window.location.hostname,
    userVerification
  };
  
  // If userId is provided, we would typically fetch their credentials
  // and add them to allowCredentials
  
  return publicKeyOptions;
}

/**
 * Finish WebAuthn Authentication process
 */
export async function finishAuthentication(
  credential: PublicKeyCredential,
  expectedChallenge: ArrayBuffer
): Promise<boolean> {
  const response = credential.response as AuthenticatorAssertionResponse;
  
  // Extract client data JSON
  const clientDataJSON = JSON.parse(new TextDecoder().decode(response.clientDataJSON));
  
  // Verify challenge
  const receivedChallenge = clientDataJSON.challenge;
  const expectedChallengeB64 = btoa(String.fromCharCode(...new Uint8Array(expectedChallenge)));
  
  if (receivedChallenge !== expectedChallengeB64) {
    throw new Error('Challenge verification failed');
  }
  
  // In a real implementation, we would:
  // 1. Verify the signature using the stored public key
  // 2. Update the credential counter
  // 3. Return success or failure
  
  return true;
}

/**
 * Check if WebAuthn is supported by the browser
 */
export function isWebAuthnSupported(): boolean {
  return window && 
         window.PublicKeyCredential !== undefined && 
         typeof window.PublicKeyCredential === 'function';
}

/**
 * Check if platform authenticator is available (e.g., fingerprint)
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) {
    return false;
  }
  
  return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
}
