import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: WebSocket | null = null;
  private messageCallback: ((message: any) => void) | null = null;
  private connectionStatus = new Subject<boolean>();
  private messageQueue: any[] = [];
  
  connect(sessionId: number, userId: string, messageCallback: (message: any) => void) {
    // Close existing connection if any
    this.disconnect();
    
    const wsUrl = `wss://edullm-backend.onrender.com/ws/chat/${sessionId}?user_id=${encodeURIComponent(userId)}`;
    // const wsUrl = `ws://localhost:8000/ws/chat/${sessionId}?user_id=${encodeURIComponent(userId)}`;
    // const wsUrl = `wss://homogenous-preobvious-bell.ngrok-free.dev/ws/chat/${sessionId}?user_id=${encodeURIComponent(userId)}`;
    console.log('Connecting to WebSocket:', wsUrl);
    this.socket = new WebSocket(wsUrl);
    this.messageCallback = messageCallback;
    
    this.socket.onopen = () => {
      console.log('✅ WebSocket connected to session:', sessionId);
      this.connectionStatus.next(true);
      
      // Send any queued messages
      while (this.messageQueue.length > 0) {
        const message = this.messageQueue.shift();
        this.sendMessage(message, false);
      }
      
      if (this.messageCallback) {
        this.messageCallback({ type: 'connected', content: `Connected to session ${sessionId}` });
      }
    };
    
    this.socket.onmessage = (event) => {
      console.log('WebSocket message received:', event.data);
      try {
        const message = JSON.parse(event.data);
        if (this.messageCallback) {
          this.messageCallback(message);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error, event.data);
      }
    };
    
    this.socket.onclose = (event) => {
      console.log('WebSocket disconnected. Code:', event.code, 'Reason:', event.reason);
      this.connectionStatus.next(false);
      if (this.messageCallback) {
        this.messageCallback({ type: 'disconnected', content: 'Connection closed' });
      }
    };
    
    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.connectionStatus.next(false);
      if (this.messageCallback) {
        this.messageCallback({ type: 'error', content: 'Connection error' });
      }
    };
  }
  
  sendMessage(data: any, queueIfNotReady = true) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('Sending WebSocket message:', data);
      this.socket.send(JSON.stringify(data));
    } else if (queueIfNotReady) {
      console.log('WebSocket not ready, queuing message. State:', this.socket?.readyState);
      this.messageQueue.push(data);
    } else {
      console.error('WebSocket is not connected. State:', this.socket?.readyState);
    }
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.close(1000, 'Client disconnected');
      this.socket = null;
    }
    this.messageCallback = null;
    this.messageQueue = [];
    this.connectionStatus.next(false);
  }
  
  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
  
  getConnectionStatus() {
    return this.connectionStatus.asObservable();
  }
}
