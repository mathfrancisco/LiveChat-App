import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Client } from '@stomp/stompjs';

export interface ChatMessage {
  user: string;
  content: string;
  time?: string;
  type?: string;
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
      brokerURL: `ws://${window.location.host}/livechat-websocket`,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = (frame) => {
      console.log('Connected: ' + frame);
      this.connectionStatusSubject.next({ connected: true });
      this.client.subscribe('/topics/livechat', message => {
        const chatMessage: ChatMessage = JSON.parse(message.body);
        const currentMessages = this.messagesSubject.value;
        this.messagesSubject.next([...currentMessages, chatMessage]);
      });
    };

    this.client.onDisconnect = () => {
      console.log('Disconnected');
      this.connectionStatusSubject.next({ connected: false });
    };

    this.client.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      this.connectionStatusSubject.next({ connected: false, error: 'STOMP error' });
    };
  }

  connect(): Observable<void> {
    return new Observable<void>(observer => {
      this.client.activate();
      observer.next();
      observer.complete();
    });
  }

  disconnect(): void {
    this.client.deactivate();
    this.messagesSubject.next([]);
  }

  sendMessage(user: string, message: string): void {
    if (this.client.connected) {
      const chatMessage: ChatMessage = { user, content: message };
      this.client.publish({
        destination: '/app/new-message',
        body: JSON.stringify(chatMessage)
      });
    } else {
      console.error("STOMP client is not connected. Message not sent.");
    }
  }

  joinChat(username: string): void {
    console.log(`User ${username} is joining the chat.`);
    // You can implement additional logic here if needed
  }

  get messages$(): Observable<ChatMessage[]> {
    return this.messagesSubject.asObservable();
  }

  get connectionStatus$(): Observable<ConnectionStatus> {
    return this.connectionStatusSubject.asObservable();
  }
}
