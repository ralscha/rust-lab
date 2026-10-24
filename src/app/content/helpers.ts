export const rust = String.raw;

export const section = (title: string, prose: string, code?: string) => ({
  title,
  body: prose.trim().split('\n\n'),
  ...(code ? { code } : {}),
});

export const reference = (label: string, url: string) => ({ label, url });
