import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { WebSocketService } from './web-socket.service';
import { MatSnackBar } from '@angular/material/snack-bar';

interface DisplayMediaStreamConstraints {
  video?: boolean | {
    cursor?: 'always' | 'motion' | 'never';
    displaySurface?: 'browser' | 'monitor' | 'window';
    logicalSurface?: boolean;
    suppressLocalAudioPlayback?: boolean;
  };
  audio?: boolean | {
    echoCancellation?: boolean;
    noiseSuppression?: boolean;
    autoGainControl?: boolean;
  };
}

interface ScreenShareMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'screen-share-stop';
  from: string;
  to?: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidate;
}

@Injectable({
  providedIn: 'root'
})
export class ScreenShareService {
  private mediaStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private remoteStreams: Map<string, MediaStream> = new Map();

  private screenShareStatusSubject = new BehaviorSubject<boolean>(false);
  screenShareStatus$ = this.screenShareStatusSubject.asObservable();

  // Configuration for WebRTC
  private readonly rtcConfiguration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' }
    ],
    iceCandidatePoolSize: 10,
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require'
  };

  constructor(
    private webSocketService: WebSocketService,
    private snackBar: MatSnackBar
  ) {
    this.setupWebSocketListeners();
    this.logBrowserSupport();
  }

  private logBrowserSupport(): void {
    console.log('Screen Sharing Support Check:', {
      isSecureContext: window.isSecureContext,
      hasMediaDevices: !!navigator.mediaDevices,
      hasGetDisplayMedia: (navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices),
      protocol: window.location.protocol,
      isLocalhost: window.location.hostname === 'localhost',
    });
  }

  private setupWebSocketListeners(): void {
    this.webSocketService.screenShareMessages$.subscribe(async (message: ScreenShareMessage) => {
      if (!message) return;

      try {
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
          default:
            console.warn('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
        this.showError(`Error in screen sharing: error`);
      }
    });
  }

  private isScreenSharingSupported(): boolean {
    const isSecureOrLocal = window.isSecureContext ||
      window.location.hostname === 'localhost' ||
      this.isInsecureOriginAllowed();

    const hasRequiredAPIs = navigator.mediaDevices &&
      'getDisplayMedia' in navigator.mediaDevices;

    return isSecureOrLocal && hasRequiredAPIs;
  }

  private isInsecureOriginAllowed(): boolean {
    try {
      // Chrome specific checks for allowing screen share in HTTP
      return !!(window as any).chrome &&
        (!!(window as any).chrome.webstore || !!(window as any).chrome.runtime);
    } catch {
      return false;
    }
  }

  async startScreenShare(): Promise<void> {
    try {
      if (!this.isScreenSharingSupported()) {
        throw new Error(
          window.location.protocol === 'http:'
            ? 'Screen sharing requires HTTPS. Please use HTTPS or contact your administrator.'
            : 'Screen sharing is not supported in this browser'
        );
      }

      const constraints: DisplayMediaStreamConstraints = {
        video: {
          cursor: 'always',
          displaySurface: 'monitor',
          logicalSurface: true,
          suppressLocalAudioPlayback: true
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      try {
        this.mediaStream = await navigator.mediaDevices.getDisplayMedia(constraints);
      } catch (error: any) {
        const errorMessage = this.getDisplayMediaErrorMessage(error);
        throw new Error(errorMessage);
      }

      this.setupMediaStreamListeners();
      await this.createPeerConnectionsForUsers();
      this.screenShareStatusSubject.next(true);

    } catch (error: any) {
      console.error('Screen sharing error:', error);
      this.showError(error.message);
      throw error;
    }
  }

  private setupMediaStreamListeners(): void {
    if (!this.mediaStream) return;

    const videoTrack = this.mediaStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.onended = () => {
        console.log('Video track ended');
        this.stopScreenShare();
      };

      videoTrack.onmute = () => {
        console.log('Video track muted');
        this.showNotification('Screen share was muted');
      };

      videoTrack.onunmute = () => {
        console.log('Video track unmuted');
        this.showNotification('Screen share was unmuted');
      };
    }
  }

  private async createPeerConnectionsForUsers(): Promise<void> {
    const connectedUsers = this.webSocketService.getConnectedUsers();
    const currentUser = this.webSocketService.getCurrentUser();

    for (const userId of connectedUsers) {
      if (userId !== currentUser) {
        try {
          const peerConnection = await this.createPeerConnection(userId);
          await this.createAndSendOffer(userId, peerConnection);
        } catch (error) {
          console.error(`Error creating peer connection for user ${userId}:`, error);
          this.showError(`Failed to connect with user ${userId}`);
        }
      }
    }
  }

  private getDisplayMediaErrorMessage(error: any): string {
    switch (error.name) {
      case 'NotAllowedError':
        return 'Screen sharing permission denied by user';
      case 'NotReadableError':
        return 'The screen contents could not be captured';
      case 'NotFoundError':
        return 'No screen sharing source was found';
      case 'NotSupportedError':
        return 'Screen sharing is not supported in this browser or configuration';
      case 'InvalidStateError':
        return 'Screen sharing is already in progress';
      default:
        return `Failed to start screen sharing: ${error.message}`;
    }
  }

  stopScreenShare(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped track: ${track.kind}`);
      });
      this.mediaStream = null;
    }

    // Close all peer connections
    this.peerConnections.forEach((connection, userId) => {
      console.log(`Closing connection with user: ${userId}`);
      connection.close();
    });
    this.peerConnections.clear();
    this.remoteStreams.clear();

    this.screenShareStatusSubject.next(false);

    // Notify other users
    this.webSocketService.sendScreenShareMessage({
      type: 'screen-share-stop',
      from: this.webSocketService.getCurrentUser()
    });
  }

  private async createPeerConnection(userId: string): Promise<RTCPeerConnection> {
    const peerConnection = new RTCPeerConnection(this.rtcConfiguration);

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.mediaStream!);
      });
    }

    this.setupPeerConnectionListeners(peerConnection, userId);
    this.peerConnections.set(userId, peerConnection);

    return peerConnection;
  }

  private setupPeerConnectionListeners(peerConnection: RTCPeerConnection, userId: string): void {
    peerConnection.ontrack = (event) => {
      console.log(`Received track from user ${userId}:`, event.track.kind);
      const stream = event.streams[0];
      this.remoteStreams.set(userId, stream);
    };

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

    peerConnection.oniceconnectionstatechange = () => {
      console.log(`ICE Connection State (${userId}):`, peerConnection.iceConnectionState);
      if (peerConnection.iceConnectionState === 'failed') {
        this.handleConnectionFailure(userId);
      }
    };

    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection State (${userId}):`, peerConnection.connectionState);
    };

    peerConnection.onnegotiationneeded = async () => {
      try {
        await this.createAndSendOffer(userId, peerConnection);
      } catch (error) {
        console.error('Error during negotiation:', error);
      }
    };
  }

  private async handleConnectionFailure(userId: string): Promise<void> {
    console.log(`Attempting to recover connection with user ${userId}`);
    const peerConnection = this.peerConnections.get(userId);

    if (peerConnection) {
      try {
        await this.createAndSendOffer(userId, peerConnection);
      } catch (error) {
        console.error('Failed to recover connection:', error);
        this.showError(`Connection with user ${userId} was lost`);
      }
    }
  }

  private async createAndSendOffer(userId: string, peerConnection: RTCPeerConnection): Promise<void> {
    try {
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });

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

  private async handleOffer(message: ScreenShareMessage): Promise<void> {
    try {
      const peerConnection = await this.createPeerConnection(message.from);
      await peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer!));

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
      this.showError('Failed to establish connection');
    }
  }

  private async handleAnswer(message: ScreenShareMessage): Promise<void> {
    try {
      const peerConnection = this.peerConnections.get(message.from);
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(message.answer!));
      }
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }

  private async handleIceCandidate(message: ScreenShareMessage): Promise<void> {
    try {
      const peerConnection = this.peerConnections.get(message.from);
      if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate!));
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }

  private handleRemoteScreenShareStop(userId: string): void {
    console.log(`Remote screen share stopped for user: ${userId}`);
    const peerConnection = this.peerConnections.get(userId);
    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(userId);
    }
    this.remoteStreams.delete(userId);
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private showNotification(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000
    });
  }

  // Public methods for external access
  getLocalStream(): MediaStream | null {
    return this.mediaStream;
  }

  getRemoteStream(userId: string): MediaStream | null {
    return this.remoteStreams.get(userId) || null;
  }

  isScreenSharing(): boolean {
    return this.screenShareStatusSubject.value;
  }
}
