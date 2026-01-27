import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../services/chat.service';
import { WebSocketService } from '../services/websocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  providers: [ChatService, WebSocketService]
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewChecked {
  username = localStorage.getItem('username') || 'User';
  sidebarOpen = true;

  messages: Array<{ sender: string, text: string }> = [];
  currentSessionId: number | null = null;
  chatHistory: Array<{ id: number, title: string }> = [];
  isLoading = false;
  isWebSocketConnected = false;
  isTyping = false;

  @ViewChild('chatWindow') private chatWindow!: ElementRef;

  private subscriptions: Subscription[] = [];
  private lastMessageCount = 0;

  // Quick prompt suggestions
  promptSuggestions = [
    "Explain quantum computing basics",
    "Help me with calculus derivatives",
    "Write a Python program for fibonacci sequence",
    "What is machine learning?",
    "How does photosynthesis work?",
    "Explain the theory of relativity",
    "Help me write an essay outline"
  ];

  constructor(
    private chatService: ChatService,
    private wsService: WebSocketService
  ) { }

  ngOnInit() {
    // Initialize with welcome state
    this.loadChatSessions();

    // Subscribe to WebSocket connection status
    const wsStatusSub = this.wsService.getConnectionStatus().subscribe(
      (connected) => {
        this.isWebSocketConnected = connected;
        console.log('WebSocket connection status:', connected);
      }
    );
    this.subscriptions.push(wsStatusSub);
  }

  ngAfterViewChecked() {
    // Auto-scroll to bottom when new messages arrive
    if (this.messages.length !== this.lastMessageCount) {
      this.scrollToBottom();
      this.lastMessageCount = this.messages.length;
    }
  }

  ngOnDestroy() {
    this.wsService.disconnect();
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadChatSessions() {
    this.isLoading = true;
    const userId = this.getUserId();

    const sub = this.chatService.getChatSessions(userId).subscribe({
      next: (sessions) => {
        this.chatHistory = sessions;
        this.isLoading = false;
        console.log('Loaded chat sessions:', sessions);

        // If no sessions exist, create a default one
        if (sessions.length === 0) {
          this.createDefaultSession();
        }
      },
      error: (error) => {
        console.error('Failed to load chat sessions:', error);
        this.isLoading = false;
      }
    });

    this.subscriptions.push(sub);
  }

  createDefaultSession() {
    const userId = this.getUserId();
    this.chatService.createChatSession(userId, 'Welcome Chat').subscribe({
      next: (session) => {
        this.currentSessionId = session.id;
        this.loadChatSessions();
        this.connectWebSocket(session.id);
      },
      error: (error) => {
        console.error('Failed to create default session:', error);
      }
    });
  }

  loadChat(sessionId: number) {
    // Don't load if already viewing this chat
    if (sessionId === this.currentSessionId) {
      return;
    }

    // Set the selected session ID
    this.selectedSessionId = sessionId;

    this.isLoading = true;
    const sub = this.chatService.getChatMessages(sessionId).subscribe({
      next: (messages) => {
        this.currentSessionId = sessionId;
        this.messages = messages.map(msg => ({
          sender: msg.sender,
          text: msg.content
        }));

        // Connect WebSocket for this session
        this.connectWebSocket(sessionId);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load chat:', error);
        this.isLoading = false;
      }
    });

    this.subscriptions.push(sub);
  }

  // Add this method to clear highlights when creating new chat
  newChat() {
    const userId = this.getUserId();
    this.chatService.createChatSession(userId, 'New Chat').subscribe({
      next: (session) => {
        // Clear selection and set new session
        this.selectedSessionId = null;
        this.currentSessionId = session.id;
        this.messages = [];

        // Connect WebSocket for new session
        this.connectWebSocket(session.id);
        this.loadChatSessions();
      },
      error: (error) => {
        console.error('Failed to create new chat:', error);
      }
    });
  }

  // Add this helper method
  isChatSelected(chatId: number): boolean {
    // A chat is selected if it's either:
    // 1. The current session ID (active chat), OR
    // 2. The clicked session ID (selected but not yet loaded)
    return chatId === this.currentSessionId || chatId === this.selectedSessionId;
  }
  connectWebSocket(sessionId: number) {
    this.wsService.connect(sessionId, this.getUserId(), (message: any) => {
      if (message.type === 'chunk') {
        this.isTyping = true;
        this.handleBotMessageChunk(message.content);
      } else if (message.type === 'complete') {
        this.isTyping = false;
      } else if (message.type === 'error') {
        this.showError(message.content);
      } else if (message.type === 'connected') {
        console.log('WebSocket connected successfully');
      }
    });
  }

  handleBotMessageChunk(chunk: string) {
    // Remove the "..." placeholder if it exists
    if (this.messages.length > 0 && this.messages[this.messages.length - 1].text === '...') {
      this.messages.pop();
    }

    // Append to last message if it's from bot
    if (this.messages.length > 0 &&
      this.messages[this.messages.length - 1].sender === 'bot') {
      this.messages[this.messages.length - 1].text += chunk;
    } else {
      this.messages.push({ sender: 'bot', text: chunk });
    }
  }
  // Add this method for better Enter key handling
  // Alternative handler method
  handleKeyDown(event: Event, input: HTMLInputElement) {
    // Cast to KeyboardEvent
    const keyboardEvent = event as KeyboardEvent;

    if (keyboardEvent.key === 'Enter' && !keyboardEvent.shiftKey) {
      keyboardEvent.preventDefault();
      this.sendMessage(input);
    }
  }

  // Update your sendMessage method to be more robust
  sendMessage(input: HTMLInputElement) {
    // Get the value safely
    const message = input?.value?.trim() || '';

    if (!message || this.isTyping || !this.isWebSocketConnected) {
      return;
    }

    console.log('Sending message:', message);

    // Add user message immediately
    this.messages.push({ sender: 'user', text: message });

    // Clear input field
    if (input) {
      input.value = '';
      // Force focus back to input
      setTimeout(() => {
        if (input) {
          input.focus();
        }
      }, 50);
    }

    // Handle session logic
    if (!this.currentSessionId) {
      this.createNewSessionWithMessage(message);
    } else {
      // Send via WebSocket
      this.wsService.sendMessage({ message: message });

      // Add typing indicator
      this.messages.push({ sender: 'bot', text: '...' });
      this.isTyping = true;
    }
  }

  sendSuggestion(suggestion: string) {
    const fakeInput = { value: suggestion } as HTMLInputElement;
    this.sendMessage(fakeInput);
  }

  createNewSessionWithMessage(message: string) {
    const userId = this.getUserId();
    const title = message.length > 30 ? message.substring(0, 30) + '...' : message;

    this.chatService.createChatSession(userId, title).subscribe({
      next: (session) => {
        this.currentSessionId = session.id;
        this.connectWebSocket(session.id);

        // Send message after connection is established
        setTimeout(() => {
          this.wsService.sendMessage({ message: message });
          this.messages.push({ sender: 'bot', text: '...' });
          this.isTyping = true;
        }, 500);

        this.loadChatSessions();
      },
      error: (error) => {
        console.error('Failed to create new chat:', error);
        this.showError('Failed to create chat session. Please try again.');
      }
    });
  }



  clearAllChats() {
    if (confirm('Are you sure you want to clear all chat history? This action cannot be undone.')) {
      // Implement clear all functionality here
      console.log('Clearing all chats');
      this.chatHistory = [];
      this.messages = [];
      this.currentSessionId = null;
    }
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;

    // Close sidebar on mobile when clicking outside
    if (window.innerWidth <= 1024) {
      // Add/remove body class to prevent scrolling
      if (this.sidebarOpen) {
        document.body.classList.add('sidebar-open');
      } else {
        document.body.classList.remove('sidebar-open');
      }
    }
  }

  getCurrentTime(): string {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  showError(message: string) {
    console.error('Error:', message);
    this.messages.push({ sender: 'bot', text: `Error: ${message}` });
  }

  scrollToBottom(): void {
    try {
      this.chatWindow.nativeElement.scrollTop = this.chatWindow.nativeElement.scrollHeight;
    } catch (err) {
      console.error('Scroll error:', err);
    }
  }

  private getUserId(): string {
    return localStorage.getItem('username') || 'User';
  }
  // Add these properties to your component class
  showConnectionWarning = false;
  reconnectAttempts = 0;
  selectedSessionId: number | null = null;



  // Helper method to update highlighting
  updateChatHistoryHighlight() {
    // This method ensures only one chat is highlighted
    // The active class in template handles the rest
  }

  // Update the sendMessage method to handle connection

}