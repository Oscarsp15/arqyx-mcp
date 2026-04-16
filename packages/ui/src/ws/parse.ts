import { ServerToClientMessage } from '@arqyx/shared';

export function parseServerMessage(raw: string): ServerToClientMessage | null {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return null;
  }
  const result = ServerToClientMessage.safeParse(json);
  if (!result.success) {
    console.warn('[ws] failed to parse server message', result.error.issues, json);
  }
  return result.success ? result.data : null;
}
