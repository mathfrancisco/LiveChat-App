import { Component, OnDestroy, OnInit } from '@angular/core';
import { ChatService, ChatMessage } from './service/chat.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  connected = false;
  connecting = false;
  connectionError = '';
  username = '';
  message = '';
  messages: ChatMessage[] = [];

  constructor(private chatService: ChatService) {}

  ngOnInit() {
    this.chatService.messages$
      .pipe(takeUntil(this.destroy$))
      .subscribe(messages => {
        this.messages = messages;
      });

    this.chatService.connectionStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        this.connected = status.connected;
        this.connectionError = status.error || '';
        this.connecting = false;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnect();
  }

  connect() {
    if (!this.username.trim() || this.connecting) {
      return;
    }

    this.connecting = true;
    this.connectionError = '';

    this.chatService.connect().subscribe({
      next: () => {
        this.chatService.joinChat(this.username);
      },
      error: (error) => {
        this.connecting = false;
        this.connectionError = 'Failed to connect. Please try again.';
        console.error('Connection error:', error);
      }
    });
  }

  disconnect() {
    this.chatService.disconnect();
    this.message = '';
    this.connected = false;
  }

  sendMessage() {
    if (!this.message.trim()) {
      return;
    }
    
    this.chatService.sendMessage(this.username, this.message);
    this.message = '';
  }
}
