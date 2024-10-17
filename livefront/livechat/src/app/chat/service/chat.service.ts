import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Client, Message } from '@stomp/stompjs';
import { environment } from '../../../environments/environment';

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
  private messageHistory: ChatMessage[] = [];

  messages$ = this.messagesSubject.asObservable();
  connectionStatus$ = this.connectionStatusSubject.asObservable();

  constructor() {
    this.client = new Client({
      brokerURL: environment.production ? environment.wsEndpoint : 'ws://localhost:5000/livechat-websocket',
      connectHeaders: {
        login: 'guest',
        passcode: 'guest'
      },
      debug: function (str) {
        console.log('STOMP: ' + str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000
    });

    this.client.onConnect = (frame) => {
      console.log('Connected: ' + frame);
      this.connectionStatusSubject.next({ connected: true });

      this.client.subscribe('/topics/livechat', (message: Message) => {
        try {
          const chatMessage: ChatMessage = JSON.parse(message.body);
          this.messageHistory.push(chatMessage);
          this.messagesSubject.next([...this.messageHistory]);
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
        error: 'Failed to connect to chat server: ' + frame.headers['message']
      });
    };

    this.client.onWebSocketError = (event) => {
      console.error('WebSocket error:', event);
      this.connectionStatusSubject.next({
        connected: false,
        error: 'WebSocket connection error. Please try again later.'
      });
    };

    this.client.onDisconnect = () => {
      console.log('Disconnected from server');
      this.connectionStatusSubject.next({
        connected: false,
        error: 'Disconnected from chat server'
      });
    };
  }

  public connect(): Observable<void> {
    return new Observable(subscriber => {
      if (this.client.connected) {
        subscriber.next();
        subscriber.complete();
        return;
      }

      try {
        this.client.onConnect = (frame) => {
          console.log('Connected: ' + frame);
          this.connectionStatusSubject.next({ connected: true });

          this.client.subscribe('/topics/livechat', (message: Message) => {
            try {
              const chatMessage: ChatMessage = JSON.parse(message.body);
              this.messageHistory.push(chatMessage);
              this.messagesSubject.next([...this.messageHistory]);
            } catch (error) {
              console.error('Error parsing message:', error);
            }
          });

          subscriber.next();
          subscriber.complete();
        };

        this.client.onStompError = (frame) => {
          const error = 'Broker reported error: ' + frame.headers['message'];
          subscriber.error(error);
          this.connectionStatusSubject.next({
            connected: false,
            error: error
          });
        };

        this.client.activate();
      } catch (error) {
        subscriber.error(error);
        this.connectionStatusSubject.next({
          connected: false,
          error: 'Connection error: ' + error
        });
      }
    });
  }

  public joinChat(username: string) {
    if (this.client && this.client.connected) {
      const joinMessage = {
        user: username,
        content: 'joined the chat',
        type: 'JOIN',
        time: new Date().toISOString()
      };

      try {
        this.client.publish({
          destination: '/app/join',
          body: JSON.stringify(joinMessage)
        });
      } catch (error) {
        console.error('Error sending join message:', error);
        this.connectionStatusSubject.next({
          connected: false,
          error: 'Error joining chat. Please try reconnecting.'
        });
      }
    } else {
      console.warn('Client is not connected. Cannot join chat.');
      this.connectionStatusSubject.next({
        connected: false,
        error: 'Not connected to chat server'
      });
    }
  }

  public disconnect() {
    if (this.client) {
      this.client.deactivate();
    }
    this.messageHistory = [];
    this.messagesSubject.next([]);
    this.connectionStatusSubject.next({ connected: false });
  }

  public sendMessage(user: string, content: string) {
    if (this.client && this.client.connected) {
      const message = {
        user,
        content,
        type: 'MESSAGE',
        time: new Date().toISOString()
      };

      try {
        this.client.publish({
          destination: '/app/new-message',
          body: JSON.stringify(message)
        });
      } catch (error) {
        console.error('Error sending message:', error);
        this.connectionStatusSubject.next({
          connected: false,
          error: 'Error sending message. Please try reconnecting.'
        });
      }
    } else {
      console.warn('Client is not connected. Message not sent.');
      this.connectionStatusSubject.next({
        connected: false,
        error: 'Not connected to chat server'
      });
    }
  }

}
