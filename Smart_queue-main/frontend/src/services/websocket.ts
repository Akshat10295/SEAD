import type { WSMessage } from '../types';

type MessageHandler = (msg: WSMessage) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = true;
  private reconnectDelay = 2000;
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  connect() {
    this.shouldReconnect = true;
    this._connect();
  }

  private _connect() {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const host = window.location.host;
      this.ws = new WebSocket(`${protocol}://${host}/ws/queue`);

      this.ws.onopen = () => {
        console.log('[WS] Connected');
        this.reconnectDelay = 2000;
        this._startPing();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as WSMessage;
          this.handlers.forEach((h) => {
            try { h(msg); } catch (err) { console.error('[WS] Handler error', err); }
          });
        } catch {
          // ignore malformed messages
        }
      };

      this.ws.onclose = () => {
        console.log('[WS] Disconnected');
        this._stopPing();
        if (this.shouldReconnect) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30000);
            this._connect();
          }, this.reconnectDelay);
        }
      };

      this.ws.onerror = (err) => {
        console.error('[WS] Error', err);
        this.ws?.close();
      };
    } catch (err) {
      console.error('[WS] Failed to connect', err);
    }
  }

  private _startPing() {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send('ping');
      }
    }, 25000);
  }

  private _stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this._stopPing();
    this.ws?.close();
    this.ws = null;
  }

  subscribe(handler: MessageHandler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }
}

export const wsService = new WebSocketService();
