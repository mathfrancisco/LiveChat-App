import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app.component';
import { ChatRoomComponent } from './chat-room/chat-room.component';
import { WebSocketService } from './services/web-socket.service';

@NgModule({
  declarations: [AppComponent, ChatRoomComponent],
  imports: [BrowserModule, FormsModule, HttpClientModule],
  providers: [WebSocketService],
  bootstrap: [AppComponent]
})
export class AppModule { }
