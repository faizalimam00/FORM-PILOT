import project from '../../../package.json';
const username = import.meta.env.PUBLIC_GITHUB_USERNAME || 'faizalimam00';
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
  creator: project.author.name,
  origin: https(import.meta.env.PUBLIC_SITE_URL),
  github: https(`https://github.com/${username}`),
  repository: https(import.meta.env.PUBLIC_REPOSITORY_URL || project.homepage),
  username,
};
