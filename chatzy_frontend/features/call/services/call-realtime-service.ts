import { Client, type IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type { CallResponse } from "@/features/call/services/call-service";

const SOCKET_URL = process.env.NEXT_PUBLIC_CHAT_SOCKET_URL ?? "http://localhost:8080/ws-chat";
export type CallSignal = { callId: string; type: "offer" | "answer" | "ice-candidate"; sdp?: string; candidate?: string; sdpMid?: string | null; sdpMLineIndex?: number | null };
export class CallRealtimeService {
  private client: Client | null = null;
  async connect(token: string, handlers: { onCall: (call: CallResponse) => void; onSignal: (signal: CallSignal) => void; onError?: (message: string) => void }) {
    await this.disconnect();
    await new Promise<void>((resolve, reject) => {
      const client = new Client({ webSocketFactory: () => new SockJS(SOCKET_URL), connectHeaders: { Authorization: `Bearer ${token}` }, reconnectDelay: 5_000,
        onConnect: () => { client.subscribe("/user/queue/calls", (frame: IMessage) => handlers.onCall(JSON.parse(frame.body) as CallResponse)); client.subscribe("/user/queue/webrtc", (frame: IMessage) => handlers.onSignal(JSON.parse(frame.body) as CallSignal)); resolve(); },
        onStompError: (frame) => { const message = frame.headers.message ?? "Call socket was rejected."; handlers.onError?.(message); reject(new Error(message)); }, onWebSocketError: () => { const message = "Unable to connect to call updates."; handlers.onError?.(message); reject(new Error(message)); }, });
      this.client = client; client.activate();
    });
  }
  signal(signal: CallSignal) { if (!this.client?.connected) return false; this.client.publish({ destination: "/app/call/signal", body: JSON.stringify(signal) }); return true; }
  async disconnect() { const client = this.client; this.client = null; if (client) await client.deactivate(); }
}
