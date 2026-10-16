/** An extension page can itself be a tab. Trust its browser-supplied URL, not absence of sender.tab. */
export function trustedSender(
  sender: { id?: string; url?: string; frameId?: number },
  extensionId: string,
  baseUrl: string,
  paths: readonly string[],
): boolean {
  if (
    sender.id !== extensionId ||
    !sender.url ||
    (sender.frameId !== undefined && sender.frameId !== 0)
  )
    return false;
  try {
    const url = new URL(sender.url);
    url.search = '';
    url.hash = '';
    return paths.some((path) => url.href === new URL(path, baseUrl).href);
  } catch {
    return false;
  }
}
