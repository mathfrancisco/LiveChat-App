import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface ChatMessage {
  user: string;
  content: string;
  time: string;
  type: string;
}

export interface ConnectionStatus {
  connected: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private client: Client;
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  private connectionStatusSubject = new BehaviorSubject<ConnectionStatus>({ connected: false });

  constructor() {
  this.client = new Client({
    webSocketFactory: () => new SockJS('/livechat-websocket'), // Modificado aqui
    debug: (str) => {
      console.log(str);
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
  });
  this.initializeClientHandlers();
}

  private initializeClientHandlers(): void {
    this.client.onConnect = (frame) => {
      console.log('Connected: ' + frame);
      this.connectionStatusSubject.next({ connected: true, error: undefined }); // Clear any previous error

      // Subscribe to the live chat topic
      this.client.subscribe('/topic/public', message => {
        try {
          const chatMessage: ChatMessage = JSON.parse(message.body);
          const currentMessages = this.messagesSubject.value;
          this.messagesSubject.next([...currentMessages, chatMessage]);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });
    };

    this.client.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
      this.connectionStatusSubject.next({
        connected: false,
        error: 'Connection failed: ' + frame.headers['message']
      });
    };

    this.client.onWebSocketError = (error) => {
      console.error('WebSocket error:', error);
      this.connectionStatusSubject.next({
        connected: false,
        error: 'WebSocket connection failed'
      });
    };
  }

  connect(): Observable<void> {
    return new Observable(subscriber => {
      if (this.client.connected) {
        subscriber.next();
        subscriber.complete();
        return;
      }

      this.client.activate();
      subscriber.next();
      subscriber.complete();
    });
  }

  disconnect(): void {
    if (this.client.connected) {
      this.client.deactivate();
      this.connectionStatusSubject.next({ connected: false });
      this.messagesSubject.next([]);
    }
  }

  sendMessage(user: string, message: string): void {
    if (this.client.connected) {
      this.client.publish({
        destination: "/app/new-message",
        body: JSON.stringify({ user, message })
      });
    }
  }

  joinChat(username: string): void {
    if (this.client.connected) {
      console.log(`User ${username} is joining the chat.`);
      this.client.publish({
        destination: "/app/chat.addUser",
        body: JSON.stringify({ user: username, message: null })
      });
    } else {
      console.error('Cannot join chat, not connected.');
    }
  }

  get messages$(): Observable<ChatMessage[]> {
    return this.messagesSubject.asObservable();
  }

  get connectionStatus$(): Observable<ConnectionStatus> {
    return this.connectionStatusSubject.asObservable();
  }
}
