/**
 * OG MUSIC — Universal Cloud Relay
 * 
 * Provides zero-config, low-latency, cross-network real-time transport
 * across different devices, networks, cities, and mobile browsers.
 * Seamlessly pairs with Firebase Firestore as an active real-time accelerator
 * and offline/unconfigured fallback.
 */

const RELAY_BASE_HTTP = 'https://ntfy.sh';
const RELAY_BASE_WS = 'wss://ntfy.sh';

export interface RelayEnvelope {
  id: string;
  time: number;
  event: string;
  topic: string;
  message?: string;
}

/**
 * Publish a message to a global real-time topic
 */
export async function publishRelayMessage(topic: string, data: unknown): Promise<boolean> {
  const cleanTopic = sanitizeTopic(topic);
  try {
    const response = await fetch(`${RELAY_BASE_HTTP}/${cleanTopic}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.ok;
  } catch (err) {
    console.warn(`[CloudRelay] Publish to ${cleanTopic} failed:`, err);
    return false;
  }
}

/**
 * Poll recent messages for a topic
 */
export async function pollRelayMessages<T = unknown>(topic: string): Promise<T[]> {
  const cleanTopic = sanitizeTopic(topic);
  try {
    const res = await fetch(`${RELAY_BASE_HTTP}/${cleanTopic}/json?poll=1`);
    if (!res.ok) return [];
    const text = await res.text();
    if (!text.trim()) return [];

    const lines = text.trim().split('\n');
    const items: T[] = [];
    for (const line of lines) {
      try {
        const envelope: RelayEnvelope = JSON.parse(line);
        if (envelope.event === 'message' && envelope.message) {
          const payload = JSON.parse(envelope.message);
          items.push(payload as T);
        }
      } catch {
        // Ignore unparseable lines
      }
    }
    return items;
  } catch (err) {
    console.warn(`[CloudRelay] Poll ${cleanTopic} failed:`, err);
    return [];
  }
}

/**
 * Real-time subscription to a topic with automatic reconnect
 */
export function subscribeRelayTopic<T = unknown>(
  topic: string,
  onMessage: (data: T) => void
): () => void {
  const cleanTopic = sanitizeTopic(topic);
  let isClosed = false;
  let ws: WebSocket | null = null;
  let reconnectTimer: any = null;

  // 1. Initial poll for any messages waiting in queue
  pollRelayMessages<T>(cleanTopic).then((recent) => {
    if (isClosed) return;
    for (const msg of recent) {
      try {
        onMessage(msg);
      } catch (err) {
        console.warn('[CloudRelay] Error processing polled message:', err);
      }
    }
  });

  // 2. Open real-time WebSocket connection
  const connect = () => {
    if (isClosed) return;

    try {
      if (typeof WebSocket === 'undefined') return;
      ws = new WebSocket(`${RELAY_BASE_WS}/${cleanTopic}/ws`);

      ws.onmessage = (event) => {
        if (isClosed) return;
        try {
          const envelope: RelayEnvelope = JSON.parse(event.data);
          if (envelope.event === 'message' && envelope.message) {
            const payload = JSON.parse(envelope.message);
            onMessage(payload as T);
          }
        } catch {
          // Ignore malformed payloads
        }
      };

      ws.onerror = () => {
        // Handled by onclose
      };

      ws.onclose = () => {
        if (!isClosed) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      };
    } catch (err) {
      console.warn('[CloudRelay] WebSocket connection error:', err);
      if (!isClosed) {
        reconnectTimer = setTimeout(connect, 5000);
      }
    }
  };

  connect();

  return () => {
    isClosed = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (ws) {
      try {
        ws.close();
      } catch {}
    }
  };
}

function sanitizeTopic(topic: string): string {
  // Topics must only contain valid URL-safe characters
  return topic.replace(/[^a-zA-Z0-9_-]/g, '_');
}
