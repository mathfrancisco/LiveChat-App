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
    // Subscribe to messages from the chat service
    this.chatService.messages$
      .pipe(takeUntil(this.destroy$))
      .subscribe(messages => {
        this.messages = messages;
        this.scrollToBottom();
      });

    // Subscribe to connection status
    this.chatService.connectionStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        this.connected = status.connected;
        this.connectionError = status.error || '';
        this.connecting = false; // Reset connecting state on status change
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnect(); // Ensure disconnection on component destruction
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
    return message.user === this.username; // Check if the message is sent by the user
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
        element.scrollTop = element.scrollHeight; // Scroll to the bottom of chat messages
      }
    });
  }

  connect() {
    if (!this.username.trim() || this.connecting) {
      return; // Prevent connecting if username is empty or already connecting
    }

    this.connecting = true;
    this.connectionError = '';

    // Attempt to connect using chat service
    this.chatService.connect().subscribe({
      next: () => {
        this.connected = true; // Update connection state
        this.chatService.joinChat(this.username); // Notify chat service of new user
      },
      error: (error) => {
        this.connecting = false;
        this.connectionError = 'Failed to connect. Please try again.';
        console.error('Connection error:', error);
      }
    });
  }

  disconnect() {
    this.chatService.disconnect(); // Disconnect from chat service
    this.message = ''; // Clear message input
    this.connected = false; // Update connection state
  }

  sendMessage() {
    if (!this.message.trim()) {
      return; // Prevent sending empty messages
    }

    // Send message through chat service
    this.chatService.sendMessage(this.username, this.message);
    this.message = ''; // Clear message input after sending
  }
}
