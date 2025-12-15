// lightweight JWT helpers
// decodeJwt: returns payload object or null
export function decodeJwt(token) {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    // base64url -> base64
    let b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    // pad with '=' to make length a multiple of 4
    while (b64.length % 4) b64 += '=';
    const json = atob(b64);
    return JSON.parse(json);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to decode JWT', e);
    return null;
  }
}

export function getFullNameFromToken(token) {
  const payload = decodeJwt(token);
  if (!payload) return null;
  // common claim names: full_name, name, given_name
  return payload.full_name || payload.name || payload.given_name || null;
}
