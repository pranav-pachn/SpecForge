export function getRandomKey(envVar: string | undefined): string {
  if (!envVar) return '';
  const keys = envVar.split(',').map(k => k.trim()).filter(k => k);
  return keys[Math.floor(Math.random() * keys.length)] || '';
}
