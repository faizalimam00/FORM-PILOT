const username = import.meta.env.PUBLIC_GITHUB_USERNAME || 'YOUR_NEW_GITHUB_USERNAME';
function https(value: string | undefined): string | undefined {
  try {
    if (!value) return;
    const url = new URL(value);
    if (url.protocol === 'https:') return url.href;
  } catch {
    /* Unconfigured links are not rendered. */
  }
  return undefined;
}
export const site = {
  name: 'FormPilot',
  creator: 'Faizal Imam',
  origin: https(import.meta.env.PUBLIC_SITE_URL),
  github:
    username === 'YOUR_NEW_GITHUB_USERNAME' ? undefined : https(`https://github.com/${username}`),
  repository: https(import.meta.env.PUBLIC_REPOSITORY_URL),
  username,
};
