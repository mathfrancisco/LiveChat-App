import { Component, OnInit } from '@angular/core';
import { WebSocketService } from '../services/web-socket.service';

@Component({
  selector: 'app-chat-room',
  templateUrl: './chat-room.component.html',
  styleUrls: ['./chat-room.component.css']
})
export class ChatRoomComponent implements OnInit {
  privateChats = new Map<string, any[]>();
  publicChats: any[] = [];
  tab = 'CHATROOM';
  userData = {
    username: '',
    receivername: '',
    connected: false,
    message: ''
  };

  constructor(private webSocketService: WebSocketService) {}

  ngOnInit() {
    this.webSocketService.publicMessages$.subscribe(message => {
      if (message) {
        this.handleMessage(message);
      }
    });

    this.webSocketService.privateMessages$.subscribe(message => {
      if (message) {
        this.handlePrivateMessage(message);
      }
    });
  }

  connect() {
    this.webSocketService.connect(this.userData.username);
    this.userData.connected = true;
  }

  handleMessage(payloadData: any) {
    switch(payloadData.status) {
      case "JOIN":
        if(!this.privateChats.get(payloadData.senderName)) {
          this.privateChats.set(payloadData.senderName, []);
        }
        break;
      case "MESSAGE":
        this.publicChats = [...this.publicChats, payloadData];
        break;
    }
  }

  handlePrivateMessage(payloadData: any) {
    if(this.privateChats.get(payloadData.senderName)) {
      const existingChats = this.privateChats.get(payloadData.senderName) || [];
      this.privateChats.set(payloadData.senderName, [...existingChats, payloadData]);
    } else {
      this.privateChats.set(payloadData.senderName, [payloadData]);
    }
    this.privateChats = new Map(this.privateChats);
  }

  sendMessage() {
    if (this.userData.connected) {
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
    if (this.userData.connected) {
      const chatMessage = {
        senderName: this.userData.username,
        receiverName: this.tab,
        message: this.userData.message,
        status: "MESSAGE"
      };

      if(this.userData.username !== this.tab) {
        const existingChats = this.privateChats.get(this.tab) || [];
        this.privateChats.set(this.tab, [...existingChats, chatMessage]);
      }
      this.webSocketService.sendPrivateMessage(chatMessage);
      this.userData.message = '';
    }
  }

  setActiveTab(tab: string) {
    this.tab = tab;
  }
}
