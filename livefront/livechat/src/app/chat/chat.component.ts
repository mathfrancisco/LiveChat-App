import { Component, OnInit } from '@angular/core';
import { ChatService } from './chat.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {
  connected = false;
  user = '';
  message = '';
  chatMessages: string[] = [];

  constructor(private chatService: ChatService) {}

  ngOnInit() {
    this.chatService.messages$.subscribe(message => {
      this.chatMessages.push(message);
    });
  }

  connect() {
    this.chatService.connect();
    this.connected = true;
  }

  disconnect() {
    this.chatService.disconnect();
    this.connected = false;
  }

  sendMessage() {
    if (this.user && this.message) {
      this.chatService.sendMessage(this.user, this.message);
      this.message = '';
    }
  }
}
