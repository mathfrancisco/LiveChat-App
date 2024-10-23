import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { WebSocketService } from './web-socket.service';

@Injectable({
  providedIn: 'root'
})
export class ScreenShareService {
  private mediaStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private remoteStreams: Map<string, MediaStream> = new Map();

  private screenShareStatusSubject = new BehaviorSubject<boolean>(false);
  screenShareStatus$ = this.screenShareStatusSubject.asObservable();

  constructor(private webSocketService: WebSocketService) {
    this.setupWebSocketListeners();
  }

  private setupWebSocketListeners() {
    this.webSocketService.screenShareMessages$.subscribe(async (message) => {
      if (!message) return;

      switch (message.type) {
        case 'offer':
          await this.handleOffer(message);
          break;
        case 'answer':
          await this.handleAnswer(message);
          break;
        case 'ice-candidate':
          await this.handleIceCandidate(message);
          break;
        case 'screen-share-stop':
          this.handleRemoteScreenShareStop(message.from);
          break;
      }
    });
  }

  async startScreenShare(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });

      this.screenShareStatusSubject.next(true);

      // Create peer connections for all connected users
      const connectedUsers = this.webSocketService.getConnectedUsers();
      for (const userId of connectedUsers) {
        if (userId !== this.webSocketService.getCurrentUser()) {
          const peerConnection = await this.createPeerConnection(userId);
          await this.createAndSendOffer(userId, peerConnection);
        }
      }

      // Handle stream end
      this.mediaStream.getVideoTracks()[0].onended = () => {
        this.stopScreenShare();
      };
    } catch (error) {
      console.error('Error starting screen share:', error);
      throw error;
    }
  }

  stopScreenShare() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    // Close all peer connections
    this.peerConnections.forEach(connection => connection.close());
    this.peerConnections.clear();

    this.screenShareStatusSubject.next(false);

    // Notify other users
    this.webSocketService.sendScreenShareMessage({
      type: 'screen-share-stop',
      from: this.webSocketService.getCurrentUser()
    });
  }

  // Get local media stream directly
  getLocalStream(): MediaStream | null {
    return this.mediaStream;
  }

  private async createPeerConnection(userId: string): Promise<RTCPeerConnection> {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    // Add tracks to peer connection
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.mediaStream!);
      });
    }

    // Handle remote tracks
    peerConnection.ontrack = (event) => {
      const stream = event.streams[0];
      this.remoteStreams.set(userId, stream);
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.webSocketService.sendScreenShareMessage({
          type: 'ice-candidate',
          candidate: event.candidate,
          to: userId,
          from: this.webSocketService.getCurrentUser()
        });
      }
    };

    // Store peer connection
    this.peerConnections.set(userId, peerConnection);
    return peerConnection;
  }

  private async createAndSendOffer(userId: string, peerConnection: RTCPeerConnection) {
    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      this.webSocketService.sendScreenShareMessage({
        type: 'offer',
        offer: offer,
        to: userId,
        from: this.webSocketService.getCurrentUser()
      });
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
  }

  private async handleOffer(message: any) {
    try {
      const peerConnection = await this.createPeerConnection(message.from);
      await peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      this.webSocketService.sendScreenShareMessage({
        type: 'answer',
        answer: answer,
        to: message.from,
        from: this.webSocketService.getCurrentUser()
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }

  private async handleAnswer(message: any) {
    try {
      const peerConnection = this.peerConnections.get(message.from);
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(message.answer));
      }
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }

  private async handleIceCandidate(message: any) {
    try {
      const peerConnection = this.peerConnections.get(message.from);
      if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate));
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }

  private handleRemoteScreenShareStop(userId: string) {
    const peerConnection = this.peerConnections.get(userId);
    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(userId);
    }
    this.remoteStreams.delete(userId);
  }

  getRemoteStream(userId: string): MediaStream | null {
    return this.remoteStreams.get(userId) || null;
  }
}
