import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private client: Client;
  private publicMessagesSubject = new BehaviorSubject<any>(null);
  private privateMessagesSubject = new BehaviorSubject<any>(null);

  publicMessages$ = this.publicMessagesSubject.asObservable();
  privateMessages$ = this.privateMessagesSubject.asObservable();

  constructor() {
    this.client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      onConnect: () => {
        console.log('Connected');
      },
      onDisconnect: () => {
        console.log('Disconnected');
      }
    });
  }

  connect(username: string) {
    this.client.activate();

    this.client.onConnect = () => {
      this.client.subscribe('/chatroom/public', message => {
        this.publicMessagesSubject.next(JSON.parse(message.body));
      });

      this.client.subscribe(`/user/${username}/private`, message => {
        this.privateMessagesSubject.next(JSON.parse(message.body));
      });

      this.sendPublicMessage({
        senderName: username,
        status: "JOIN"
      });
    };
  }

  disconnect() {
    this.client.deactivate();
  }

  sendPublicMessage(message: any) {
    this.client.publish({
      destination: '/app/message',
      body: JSON.stringify(message)
    });
  }

  sendPrivateMessage(message: any) {
    this.client.publish({
      destination: '/app/private-message',
      body: JSON.stringify(message)
    });
  }
}
