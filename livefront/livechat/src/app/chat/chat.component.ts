import { Component, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ChatService, ChatMessage } from './service/chat.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('chatMessages') private messagesContainer!: ElementRef;
  @ViewChild('messageForm') private messageForm!: NgForm;

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
        this.scrollToBottom();
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
