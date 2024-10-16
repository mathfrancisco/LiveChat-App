import { Component, OnDestroy, OnInit } from '@angular/core';
import { ChatService, ChatMessage } from './service/chat.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy{
  connected = false;
  username = '';
  message = '';
  messages: ChatMessage[] = [];

  constructor(private chatService: ChatService) { }

  ngOnInit() {
    this.chatService.messages$.subscribe(message => {
      this.messages.push(message);
    });
  }

  ngOnDestroy() {
    this.disconnect();
  }

  connect() {
    if (this.username) {
      this.chatService.connect();
      this.connected = true;
      this.chatService.joinChat(this.username);
    }
  }

  disconnect() {
    this.chatService.disconnect();
    this.connected = false;
    this.messages = [];
  }

  sendMessage() {
    if (this.message) {
      this.chatService.sendMessage(this.username, this.message);
      this.message = '';
    }
  }
} {

}
