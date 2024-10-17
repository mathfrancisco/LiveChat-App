import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

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
  private socket: WebSocket | null = null;
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  private connectionStatusSubject = new BehaviorSubject<ConnectionStatus>({ connected: false });

  constructor() {}

  connect(): Observable<void> {
    return new Observable<void>(observer => {
      this.socket = new WebSocket(`ws://${window.location.host}/livechat-websocket`);

      this.socket.onopen = () => {
        console.log("WebSocket is open now.");
        this.connectionStatusSubject.next({ connected: true });
        observer.next();
        observer.complete();
      };

      this.socket.onmessage = (event) => {
        const chatMessage: ChatMessage = JSON.parse(event.data);
        const currentMessages = this.messagesSubject.value;
        this.messagesSubject.next([...currentMessages, chatMessage]);
      };

      this.socket.onclose = () => {
        console.log("WebSocket is closed now.");
        this.connectionStatusSubject.next({ connected: false });
      };

      this.socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        this.connectionStatusSubject.next({ connected: false, error: 'WebSocket connection failed' });
        observer.error(error);
      };
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.connectionStatusSubject.next({ connected: false });
      this.messagesSubject.next([]);
    }
  }

  sendMessage(user: string, message: string): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const chatMessage: ChatMessage = { user, content: message };
      this.socket.send(JSON.stringify(chatMessage));
    } else {
      console.error("WebSocket is not open. Message not sent.");
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
