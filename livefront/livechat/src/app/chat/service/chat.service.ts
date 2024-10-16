import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Client, IStompSocket } from '@stomp/stompjs';
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
  private messagesSubject = new BehaviorSubject<ChatMessage>({} as ChatMessage);
  messages$ = this.messagesSubject.asObservable();

  constructor() {
    this.client = new Client({
      webSocketFactory: () => {
        return new SockJS('/livechat-websocket') as IStompSocket;
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
      this.client.subscribe('/topic/public', message => {
        const chatMessage: ChatMessage = JSON.parse(message.body);
        this.messagesSubject.next(chatMessage);
      });
    };

    this.client.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };
  }

  connect() {
    this.client.activate();
  }

  disconnect() {
    this.client.deactivate();
  }

  sendMessage(user: string, message: string) {
    this.client.publish({
      destination: "/app/chat.sendMessage",
      body: JSON.stringify({ user, message })
    });
  }

  joinChat(username: string) {
    this.client.publish({
      destination: "/app/chat.addUser",
      body: JSON.stringify({ user: username, message: null })
    });
  }
}
