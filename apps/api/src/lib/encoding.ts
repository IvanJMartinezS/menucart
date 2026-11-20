/** Encodes bytes as base64url: safe in cookies and URLs, and without `$`, used as a separator. */
export function toBase64Url(bytes: Uint8Array) {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

/** Decodes base64url. Returns null when the text is not valid base64url. */
export function fromBase64Url(text: string) {
  if (!/^[\w-]*$/.test(text)) {
    return null
  }

  const base64 = text.replaceAll('-', '+').replaceAll('_', '/')

  try {
    return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))
  } catch {
    return null
  }
}

/** Encodes bytes as lowercase hexadecimal. */
export function toHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Compares two byte arrays in constant time: it always looks at every byte, so the time it
 * takes does not tell an attacker how many bytes were right.
 */
export function timingSafeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) {
    return false
  }

  let difference = 0
  for (let index = 0; index < a.length; index++) {
    difference |= a[index]! ^ b[index]!
  }
  return difference === 0
}
