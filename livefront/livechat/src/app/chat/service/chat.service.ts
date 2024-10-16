import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Client, IStompSocket } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';

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
  private connectionStatusSubject = new BehaviorSubject<ConnectionStatus>({
    connected: false
  });

  messages$ = this.messagesSubject.asObservable();
  connectionStatus$ = this.connectionStatusSubject.asObservable();

  constructor() {
    this.client = new Client({
      webSocketFactory: () => {
        return new SockJS('http://localhost:8080/livechat-websocket') as IStompSocket;
      },
      debug: (str) => {
        console.log(str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = (frame) => {
      console.log('Connected: ' + frame);
      this.connectionStatusSubject.next({ connected: true });

      this.client.subscribe('/topic/public', message => {
        const chatMessage: ChatMessage = JSON.parse(message.body);
        const currentMessages = this.messagesSubject.value;
        this.messagesSubject.next([...currentMessages, chatMessage]);
      });
    };

    this.client.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
      this.connectionStatusSubject.next({
        connected: false,
        error: frame.headers['message']
      });
    };
  }

  connect(): Observable<void> {
    return new Observable(subscriber => {
      try {
        this.client.activate();
        subscriber.next();
        subscriber.complete();
      } catch (error) {
        subscriber.error(error);
      }
    });
  }

  disconnect() {
    if (this.client.connected) {
      this.client.deactivate();
      this.connectionStatusSubject.next({ connected: false });
      this.messagesSubject.next([]);
    }
  }

  sendMessage(user: string, message: string) {
    if (this.client.connected) {
      this.client.publish({
        destination: "/app/chat.sendMessage",
        body: JSON.stringify({ user, message })
      });
    }
  }

  joinChat(username: string) {
    if (this.client.connected) {
      this.client.publish({
        destination: "/app/chat.addUser",
        body: JSON.stringify({ user: username, message: null })
      });
    }
  }
}
