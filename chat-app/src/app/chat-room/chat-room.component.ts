import {Component, OnInit, OnDestroy, ViewChild, ElementRef, Renderer2, NgZone} from '@angular/core';
import { WebSocketService } from '../services/web-socket.service';
import {Observable, Subscription,Observer} from 'rxjs';
import { EmojiEvent } from '@ctrl/ngx-emoji-mart/ngx-emoji';

@Component({
  selector: 'app-chat-room',
  templateUrl: './chat-room.component.html',
  styleUrls: ['./chat-room.component.css']
})
export class ChatRoomComponent implements OnInit, OnDestroy {
  isDarkMode = false;
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
  private themeChangeSubscription?: Subscription;
  private subscriptions: Subscription[] = [];

  constructor(
    private webSocketService: WebSocketService,
    private renderer: Renderer2,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.initializeTheme();
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.themeChangeSubscription = new Observable((observer: Observer<boolean>) => {
        // Usando o método correto para adicionar listener
        const handler = (e: MediaQueryListEvent) => observer.next(e.matches);
        mediaQuery.addEventListener('change', handler);
        // Emite o valor inicial
        observer.next(mediaQuery.matches);
        // Cleanup
        return () => mediaQuery.removeEventListener('change', handler);
      }).subscribe((isDarkMode: boolean) => {
        if (localStorage.getItem('darkMode') === null) {
          this.ngZone.run(() => {
            this.isDarkMode = isDarkMode;
            this.applyTheme();
          });
        }
      });
    }
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
      }),
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.userData.connected) {
      this.webSocketService.disconnect(this.userData.username);
    }
  }


  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    this.applyTheme();
    localStorage.setItem('darkMode', this.isDarkMode.toString());
  }

  private initializeTheme(): void {
    const savedTheme = localStorage.getItem('darkMode');

    if (savedTheme !== null) {
      this.isDarkMode = savedTheme === 'true';
    } else {
      this.isDarkMode = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    }

    this.applyTheme();
  }

  private applyTheme(): void {
    this.ngZone.run(() => {
      const body = document.body;
      if (this.isDarkMode) {
        this.renderer.addClass(body, 'dark-mode');
        this.renderer.setAttribute(body, 'data-theme', 'dark');
      } else {
        this.renderer.removeClass(body, 'dark-mode');
        this.renderer.setAttribute(body, 'data-theme', 'light');
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

  disconnect() {
    if (this.userData.connected) {
      this.webSocketService.disconnect(this.userData.username);
      this.userData.connected = false;
    }
  }

  toggleEmojiPicker(): void {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  addEmoji(event: EmojiEvent): void {
    const inputElement = this.messageInput.nativeElement;
    const emoji = event.emoji?.native;

    if (!emoji) {
      return; // Caso o emoji seja undefined, interrompe a execução do método.
    }
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

}
