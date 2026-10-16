export function localPath(value: string) { return import.meta.env.BASE_URL.replace(/\/$/, '') + '/' + value.replace(/^\//, ''); }
export function assetPath(value: string) { return /^(https?:|data:)/.test(value) ? value : localPath(value); }
