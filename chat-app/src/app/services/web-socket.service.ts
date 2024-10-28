import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private client!: Client;
  private publicMessagesSubject = new BehaviorSubject<any>(null);
  private privateMessagesSubject = new BehaviorSubject<any>(null);
  private connectedUsersSubject = new BehaviorSubject<string[]>([]);
  private screenShareMessagesSubject = new BehaviorSubject<any>(null);
  private currentUser: string = '';
  private isConnected: boolean = false;

  screenShareMessages$ = this.screenShareMessagesSubject.asObservable();
  publicMessages$ = this.publicMessagesSubject.asObservable();
  privateMessages$ = this.privateMessagesSubject.asObservable();
  connectedUsers$ = this.connectedUsersSubject.asObservable();

  constructor() {
    this.initializeWebSocketClient();
  }

  private initializeWebSocketClient(): void {
    // Determine o protocolo com base no ambiente atual
    const isSecure = window.location.protocol === 'https:';
    const wsProtocol = isSecure ? 'wss:' : 'ws:';

    // Se estiver em desenvolvimento, use a URL do environment
    const wsUrl = environment.production
      ? `${window.location.protocol}//${window.location.host}/ws`
      : environment.wsUrl;

    this.client = new Client({
      webSocketFactory: () => new SockJS(wsUrl, null, {
        transports: ['websocket', 'xhr-streaming', 'xhr-polling'],
        timeout: 10000,
      }),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('WebSocket Connected');
        this.isConnected = true;
      },
      onDisconnect: () => {
        console.log('WebSocket Disconnected');
        this.isConnected = false;
      },
      onStompError: (frame) => {
        console.error('Stomp error', frame);
      }
    });
  }

  connect(username: string) {
    if (this.isConnected) {
      return;
    }

    this.currentUser = username;

    if (!this.client.active) {
      this.client.activate();
    }

    this.client.onConnect = () => {
      // Subscribe to public channel
      this.client.subscribe('/chatroom/public', message => {
        try {
          const payload = JSON.parse(message.body);
          this.publicMessagesSubject.next(payload);

          if (payload.status === 'JOIN' || payload.status === 'LEAVE') {
            this.updateConnectedUsers(payload);
          }
        } catch (error) {
          console.error('Error processing public message:', error);
        }
      });

      // Subscribe to private channel
      this.client.subscribe(`/user/${username}/private`, message => {
        try {
          const payload = JSON.parse(message.body);
          this.privateMessagesSubject.next(payload);
        } catch (error) {
          console.error('Error processing private message:', error);
        }
      });

      // Subscribe to screen share channel
      this.client.subscribe(`/user/${username}/screen-share`, message => {
        try {
          const payload = JSON.parse(message.body);
          this.screenShareMessagesSubject.next(payload);
        } catch (error) {
          console.error('Error processing screen share message:', error);
        }
      });

      // Send join message
      this.sendPublicMessage({
        senderName: username,
        status: "JOIN"
      });
    };
  }

  disconnect(username: string) {
    if (username) {
      this.sendPublicMessage({
        senderName: username,
        status: "LEAVE"
      });
    }

    if (this.client && this.client.active) {
      this.client.deactivate();
    }

    this.currentUser = '';
    this.isConnected = false;

    // Reset subjects
    this.publicMessagesSubject.next(null);
    this.privateMessagesSubject.next(null);
    this.connectedUsersSubject.next([]);
    this.screenShareMessagesSubject.next(null);
  }

  sendPublicMessage(message: any) {
    if (this.client && this.client.active) {
      try {
        this.client.publish({
          destination: '/app/message',
          body: JSON.stringify(message)
        });
      } catch (error) {
        console.error('Error sending public message:', error);
      }
    }
  }

  sendPrivateMessage(message: any) {
    if (this.client && this.client.active) {
      try {
        this.client.publish({
          destination: '/app/private-message',
          body: JSON.stringify(message)
        });
      } catch (error) {
        console.error('Error sending private message:', error);
      }
    }
  }

  sendScreenShareMessage(message: any) {
    if (this.client && this.client.active) {
      try {
        this.client.publish({
          destination: '/app/screen-share',
          body: JSON.stringify(message)
        });
      } catch (error) {
        console.error('Error sending screen share message:', error);
      }
    }
  }

  private updateConnectedUsers(payload: any) {
    const currentUsers = this.connectedUsersSubject.value;
    if (payload.status === 'JOIN' && !currentUsers.includes(payload.senderName)) {
      this.connectedUsersSubject.next([...currentUsers, payload.senderName]);
    } else if (payload.status === 'LEAVE') {
      this.connectedUsersSubject.next(
        currentUsers.filter(user => user !== payload.senderName)
      );
    }
  }

  isUserConnected(): boolean {
    return this.isConnected;
  }

  getCurrentUser(): string {
    return this.currentUser;
  }

  getConnectedUsers(): string[] {
    return this.connectedUsersSubject.value;
  }
}
