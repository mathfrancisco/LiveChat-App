import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ChatService, ChatMessage } from './service/chat.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {
  @ViewChild('chatMessages') private messagesContainer!: ElementRef;
  @ViewChild('messageForm') private messageForm!: NgForm;

  connected = false;
  connecting = false;
  connectionError = '';
  username = '';
  message = '';
  messages: ChatMessage[] = [];

  constructor(private chatService: ChatService) {}

  ngOnInit() {
    this.chatService.messages$.subscribe(messages => {
      this.messages = messages;
      this.scrollToBottom();
    });
  }

  connect() {
    if (!this.username.trim() || this.connecting) {
      return;
    }
    this.connecting = true;
    this.connectionError = '';
    this.chatService.connect();
    this.connected = true;
    this.connecting = false;
    // Add error handling here if needed
  }

  disconnect() {
    this.chatService.disconnect();
    this.connected = false;
    this.messages = [];
  }

  sendMessage() {
    if (this.message.trim() && this.connected) {
      this.chatService.sendMessage(this.username, this.message);
      this.message = '';
    }
  }

  handleKeyPress(event: KeyboardEvent, form: NgForm) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (form.valid) {
        if (form === this.messageForm) {
          this.sendMessage();
        } else {
          this.connect();
        }
      }
    }
  }

  isOwnMessage(message: ChatMessage): boolean {
    return message.user === this.username;
  }

  formatTime(time: string): string {
    return new Date(time).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    });
  }
}
