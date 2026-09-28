"use client";

import { Client, type IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type { MessageDto } from "@/features/chat/types/chat.types";
import { isTokenExpired } from "@/features/auth/services/auth-service";

const SOCKET_URL = process.env.NEXT_PUBLIC_CHAT_SOCKET_URL ?? "http://localhost:8080/ws-chat";

type RealtimeHandlers = {
  onMessage: (message: MessageDto) => void;
  onConnected?: () => void;
  onError?: (message: string) => void;
};

export class ChatRealtimeService {
  private client: Client | null = null;

  async connect(token: string, handlers: RealtimeHandlers) {
    if (isTokenExpired(token)) {
      handlers.onError?.("Your session has expired. Please sign in again.");
      return;
    }

    // STOMP deactivation is asynchronous. Waiting here prevents an old client
    // with an expired token from overlapping the fresh connection after login.
    await this.disconnect();

    const client = new Client({
      webSocketFactory: () => new SockJS(SOCKET_URL),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5_000,
      heartbeatIncoming: 10_000,
      heartbeatOutgoing: 10_000,
      onConnect: () => {
        client.subscribe("/user/queue/messages", (frame: IMessage) => {
          try {
            handlers.onMessage(JSON.parse(frame.body) as MessageDto);
          } catch {
            handlers.onError?.("Received an invalid message from the chat server.");
          }
        });
        handlers.onConnected?.();
      },
      onStompError: (frame) => handlers.onError?.(frame.headers.message ?? "Chat connection was rejected."),
      onWebSocketError: () => handlers.onError?.("Unable to connect to the chat server."),
    });

    this.client = client;
    client.activate();
  }

  send(message: MessageDto) {
    if (!this.client?.connected) {
      return false;
    }

    this.client.publish({ destination: "/app/send", body: JSON.stringify(message) });
    return true;
  }

  async disconnect() {
    const client = this.client;
    this.client = null;

    if (client) {
      await client.deactivate();
    }
  }
}
