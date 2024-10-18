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
  private connectedUsersSubject = new BehaviorSubject<string[]>([]);

  publicMessages$ = this.publicMessagesSubject.asObservable();
  privateMessages$ = this.privateMessagesSubject.asObservable();
  connectedUsers$ = this.connectedUsersSubject.asObservable();

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
        const payload = JSON.parse(message.body);
        this.publicMessagesSubject.next(payload);

        // Update connected users list when a user joins or leaves
        if (payload.status === 'JOIN' || payload.status === 'LEAVE') {
          this.updateConnectedUsers(payload);
        }
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

  disconnect(username: string) {
    this.sendPublicMessage({
      senderName: username,
      status: "LEAVE"
    });
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

  private updateConnectedUsers(payload: any) {
    const currentUsers = this.connectedUsersSubject.value;
    if (payload.status === 'JOIN' && !currentUsers.includes(payload.senderName)) {
      this.connectedUsersSubject.next([...currentUsers, payload.senderName]);
    } else if (payload.status === 'LEAVE') {
      this.connectedUsersSubject.next(currentUsers.filter(user => user !== payload.senderName));
    }
  }
}
