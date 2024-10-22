import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { WebSocketService } from '../services/web-socket.service';
import { ThemeService } from '../services/theme.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { EmojiEvent } from '@ctrl/ngx-emoji-mart/ngx-emoji';

@Component({
  selector: 'app-chat-room',
  templateUrl: './chat-room.component.html',
  styleUrls: ['./chat-room.component.css']
})
export class ChatRoomComponent implements OnInit, OnDestroy {
  // Observable do tema
  isDarkMode$ = this.themeService.darkMode$;

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
  showEmojiPicker = false;

  @ViewChild('messageInput', { static: false }) messageInput!: ElementRef;
  private destroy$ = new Subject<void>();

  constructor(
    private webSocketService: WebSocketService,
    private themeService: ThemeService
  ) {}

  ngOnInit() {
    this.subscribeToWebSockets();
    const isDark = this.themeService.isDarkMode();
    document.documentElement.classList.toggle('dark-mode', isDark);
    document.body.classList.toggle('dark-mode', isDark);
  }

  private subscribeToWebSockets(): void {
    this.webSocketService.publicMessages$
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        if (message) {
          this.handleMessage(message);
        }
      });

    this.webSocketService.privateMessages$
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        if (message) {
          this.handlePrivateMessage(message);
        }
      });

    this.webSocketService.connectedUsers$
      .pipe(takeUntil(this.destroy$))
      .subscribe(users => {
        this.connectedUsers = users;
      });
  }

  // Métodos do tema
  toggleDarkMode(): void {
    this.themeService.toggleTheme();
  }

  // Métodos do Emoji
  toggleEmojiPicker(): void {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  addEmoji(event: EmojiEvent): void {
    const inputElement = this.messageInput.nativeElement;
    const emoji = event.emoji?.native;

    if (!emoji) return;

    const start = inputElement.selectionStart;
    const end = inputElement.selectionEnd;
    const text = this.userData.message;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);

    this.userData.message = before + emoji + after;
    inputElement.setSelectionRange(start + emoji.length, start + emoji.length);
    this.showEmojiPicker = false;
    inputElement.focus();
  }

  // Métodos do Chat
  connect() {
    this.webSocketService.connect(this.userData.username);
    this.userData.connected = true;
  }

  handleMessage(payloadData: any) {
    if (payloadData.status === "MESSAGE") {
      this.publicChats = [...this.publicChats, payloadData];
    }
  }

  handlePrivateMessage(payloadData: any) {
    const chatPartner = payloadData.senderName === this.userData.username
      ? payloadData.receiverName
      : payloadData.senderName;

    if (this.privateChats.has(chatPartner)) {
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

  disconnect() {
    if (this.userData.connected) {
      this.webSocketService.disconnect(this.userData.username);
      this.userData.connected = false;
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.userData.connected) {
      this.webSocketService.disconnect(this.userData.username);
    }
  }
}
