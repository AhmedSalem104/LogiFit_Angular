import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// ==================== Chat Interfaces ====================

export interface ConversationDto {
  id: string;
  coachId: string;
  coachName: string;
  clientId: string;
  clientName: string;
  lastMessageAt: string;
  lastMessagePreview: string;
  unreadCount: number;
}

export interface ChatMessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface SendMessageCommand {
  conversationId?: string;
  recipientId?: string;
  content: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * Get all conversations for the current user
   */
  getConversations(): Observable<ConversationDto[]> {
    return this.http.get<ConversationDto[]>(`${this.apiUrl}/chat/conversations`);
  }

  /**
   * Get messages for a specific conversation
   */
  getMessages(conversationId: string): Observable<ChatMessageDto[]> {
    return this.http.get<ChatMessageDto[]>(`${this.apiUrl}/chat/conversations/${conversationId}/messages`);
  }

  /**
   * Send a new message. Use conversationId for existing conversations,
   * or recipientId for first message (system creates conversation automatically).
   */
  sendMessage(command: SendMessageCommand): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/chat/messages`, command);
  }

  /**
   * Mark all messages in a conversation as read
   */
  markAsRead(conversationId: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/chat/conversations/${conversationId}/read`, {});
  }
}
