/** PKCE (RFC 7636) fait à la main via l'API Web Crypto — pas besoin d'une
 * librairie OIDC complète pour un flux Authorization Code + PKCE aussi
 * simple, dans l'esprit du reste du codebase (services fetch maison plutôt
 * que des dépendances lourdes). */

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function generateRandomString(byteLength = 32): string {
  const array = new Uint8Array(byteLength);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}
