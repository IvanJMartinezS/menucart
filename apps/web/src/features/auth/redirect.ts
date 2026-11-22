const HOME = '/menus'

/**
 * Where to go after signing in: the page the user wanted, given in `?redirect=`. Only paths of
 * this app are accepted, never another website (`//evil.example` or `/\evil.example` would be
 * read by the browser as another host), and never the sign-in pages themselves.
 */
export function safeRedirect(target: string | null) {
  if (
    !target ||
    !target.startsWith('/') ||
    target.startsWith('//') ||
    target.startsWith('/\\') ||
    target.startsWith('/login') ||
    target.startsWith('/register')
  ) {
    return HOME
  }
  return target
}
