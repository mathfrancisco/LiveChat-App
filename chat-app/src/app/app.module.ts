import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { AppComponent } from './app.component';
import { ChatRoomComponent } from './chat-room/chat-room.component';
import { WebSocketService } from './services/web-socket.service';
import { ThemeService } from './services/theme.service';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import {VideoSrcObjectDirective} from "./directives/video-src-object.directive";

@NgModule({
  declarations: [
    AppComponent,
    ChatRoomComponent,
    VideoSrcObjectDirective
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,  // Required for Angular Material
    FormsModule,
    HttpClientModule,
    PickerModule,
    MatSnackBarModule  // Add this import for SnackBar
  ],
  providers: [
    WebSocketService,
    ThemeService
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
