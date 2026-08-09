const lastBotResponseAt = new Map<string, number>();

export function recordBotResponse(groupJid: string): void {
  lastBotResponseAt.set(groupJid, Date.now());
}

export function secondsSinceLastResponse(groupJid: string): number {
  const t = lastBotResponseAt.get(groupJid);
  if (!t) return Number.POSITIVE_INFINITY;
  return (Date.now() - t) / 1000;
}
