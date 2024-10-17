import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Client } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';

export interface ChatMessage {
  user: string;
  content: string;
  time: string;
  type: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private client: Client;
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  private serverUrl = 'http://localhost:5000/ws'; // Updated WebSocket endpoint

  constructor() {
    this.client = new Client({
      webSocketFactory: () => {
        return new SockJS(this.serverUrl);
      },
      debug: (str) => {
        console.log('STOMP Debug:', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('Connected to WebSocket!');
        this.subscribeToPublicMessages();
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
      }
    });
  }

  private subscribeToPublicMessages(): void {
    this.client.subscribe('/topic/public', message => {
      try {
        const chatMessage: ChatMessage = JSON.parse(message.body);
        const currentMessages = this.messagesSubject.value;
        this.messagesSubject.next([...currentMessages, chatMessage]);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });
  }

  connect(): void {
    try {
      console.log('Attempting to connect to:', this.serverUrl);
      this.client.activate();
    } catch (error) {
      console.error('Connection error:', error);
    }
  }

  disconnect(): void {
    this.client.deactivate();
  }

  sendMessage(user: string, message: string): void {
    if (this.client.connected) {
      this.client.publish({
        destination: "/app/new-message",
        body: JSON.stringify({ user, message })
      });
    } else {
      console.error('Not connected to WebSocket');
    }
  }

  get messages$(): Observable<ChatMessage[]> {
    return this.messagesSubject.asObservable();
  }
}
