import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface ChatSession {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatSessionCreate {
  user_id: string;
  title?: string;
}

export interface ChatMessage {
  id: number;
  sender: string;
  content: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = 'https://edullm-backend.onrender.com';
  // private apiUrl = 'https://homogenous-preobvious-bell.ngrok-free.dev/api';

  constructor(private http: HttpClient) { }

  getChatSessions(userId: string): Observable<ChatSession[]> {
    return this.http.get<ChatSession[]>(
      `${this.apiUrl}/api/chat/sessions`,
      { params: { user_id: userId } }
    ).pipe(
      catchError(error => {
        // If it's a 404 (no sessions yet), return empty array
        if (error.status === 404) {
          return of([]);
        }
        // For other errors, re-throw
        return throwError(() => error);
      })
    );
  }

  createChatSession(userId: string, title: string = 'New Chat'): Observable<ChatSession> {
    const sessionData: ChatSessionCreate = {
      user_id: userId,
      title: title
    };

    return this.http.post<ChatSession>(
      `${this.apiUrl}/api/chat/sessions`,
      sessionData
    ).pipe(
      catchError(error => {
        console.error('Error creating chat session:', error);
        return throwError(() => error);
      })
    );
  }

  getChatMessages(sessionId: number): Observable<ChatMessage[]> {
    const userId = localStorage.getItem('username') || 'User';
    return this.http.get<ChatMessage[]>(
      `${this.apiUrl}/api/chat/${sessionId}/messages`,
      { params: { user_id: userId } }
    ).pipe(
      catchError(error => {
        // If no messages yet, return empty array
        if (error.status === 404) {
          return of([]);
        }
        return throwError(() => error);
      })
    );
  }
}
