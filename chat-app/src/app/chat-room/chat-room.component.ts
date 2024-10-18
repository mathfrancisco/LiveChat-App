import { Component, OnInit, OnDestroy } from '@angular/core';
import { WebSocketService } from '../services/web-socket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat-room',
  templateUrl: './chat-room.component.html',
  styleUrls: ['./chat-room.component.css']
})
export class ChatRoomComponent implements OnInit, OnDestroy {
  privateChats: Map<string, any[]> = new Map<string, any[]>();
  publicChats: any[] = [];
  connectedUsers: string[] = [];
  tab = 'CHATROOM';
  userData = {
    username: '',
    receivername: '',
    connected: false,
    message: ''
  };

  private subscriptions: Subscription[] = [];

  constructor(private webSocketService: WebSocketService) {}

  ngOnInit() {
    this.subscriptions.push(
      this.webSocketService.publicMessages$.subscribe(message => {
        if (message) {
          this.handleMessage(message);
        }
      }),
      this.webSocketService.privateMessages$.subscribe(message => {
        if (message) {
          this.handlePrivateMessage(message);
        }
      }),
      this.webSocketService.connectedUsers$.subscribe(users => {
        this.connectedUsers = users;
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.userData.connected) {
      this.webSocketService.disconnect(this.userData.username);
    }
  }

  connect() {
    this.webSocketService.connect(this.userData.username);
    this.userData.connected = true;
  }

  handleMessage(payloadData: any) {
    switch(payloadData.status) {
      case "JOIN":
      case "LEAVE":
        // Connected users are now handled by the WebSocketService
        break;
      case "MESSAGE":
        this.publicChats = [...this.publicChats, payloadData];
        break;
    }
  }

  handlePrivateMessage(payloadData: any) {
    const chatPartner = payloadData.senderName === this.userData.username ? payloadData.receiverName : payloadData.senderName;
    if(this.privateChats.has(chatPartner)) {
      const existingChats = this.privateChats.get(chatPartner) || [];
      this.privateChats.set(chatPartner, [...existingChats, payloadData]);
    } else {
      this.privateChats.set(chatPartner, [payloadData]);
    }
    this.privateChats = new Map(this.privateChats);
  }

  sendMessage() {
    if (this.userData.connected && this.userData.message.trim() !== '') {
      const chatMessage = {
        senderName: this.userData.username,
        message: this.userData.message,
        status: "MESSAGE"
      };
      this.webSocketService.sendPublicMessage(chatMessage);
      this.userData.message = '';
    }
  }

  sendPrivateMessage() {
    if (this.userData.connected && this.userData.message.trim() !== '' && this.tab !== 'CHATROOM') {
      const chatMessage = {
        senderName: this.userData.username,
        receiverName: this.tab,
        message: this.userData.message,
        status: "MESSAGE"
      };

      this.webSocketService.sendPrivateMessage(chatMessage);
      this.handlePrivateMessage(chatMessage);
      this.userData.message = '';
    }
  }

  setActiveTab(tab: string) {
    this.tab = tab;
  }

  get privateChatKeys(): string[] {
    return Array.from(this.privateChats.keys());
  }
}
