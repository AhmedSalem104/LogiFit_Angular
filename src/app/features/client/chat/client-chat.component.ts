import { Component, signal, computed, inject, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ConversationDto, ChatMessageDto, SendMessageCommand } from '../../../core/services/chat.service';
import { ClientService, MyCoachInfo } from '../services/client.service';
import { AuthService } from '../../../core/auth/services/auth.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-client-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-container" [class.show-messages]="selectedConversation()">
      <!-- Conversations Sidebar -->
      <div class="conversations-panel" [class.hidden-mobile]="selectedConversation()">
        <div class="panel-header">
          <h2><i class="pi pi-comments"></i> المحادثات</h2>
        </div>

        <!-- Conversations List -->
        <div class="conversations-list">
          @if (conversationsLoading()) {
            <div class="loading-state">
              <i class="pi pi-spin pi-spinner"></i>
              <span>جاري تحميل المحادثات...</span>
            </div>
          }
          @for (conv of conversations(); track conv.id) {
            <div
              class="conversation-item"
              [class.active]="selectedConversation()?.id === conv.id"
              [class.unread]="conv.unreadCount > 0"
              (click)="selectConversation(conv)"
            >
              <div class="avatar">{{ getInitials(conv.coachName) }}</div>
              <div class="conv-info">
                <div class="conv-header">
                  <span class="conv-name">{{ conv.coachName }}</span>
                  <span class="conv-time">{{ formatTime(conv.lastMessageAt) }}</span>
                </div>
                <div class="conv-preview">
                  <span class="preview-text">{{ conv.lastMessagePreview }}</span>
                  @if (conv.unreadCount > 0) {
                    <span class="unread-badge">{{ conv.unreadCount }}</span>
                  }
                </div>
              </div>
            </div>
          }

          <!-- No Conversations + Start Chat -->
          @if (!conversationsLoading() && conversations().length === 0) {
            <div class="empty-state">
              <i class="pi pi-inbox"></i>
              <p>لا توجد محادثات</p>
              @if (coachInfo()) {
                <button class="btn-start-chat" (click)="startChatWithCoach()">
                  <i class="pi pi-send"></i>
                  ابدأ محادثة مع مدربك
                </button>
              } @else if (!coachLoading()) {
                <span class="no-coach-text">لم يتم تعيين مدرب لك بعد</span>
              }
            </div>
          }
        </div>
      </div>

      <!-- Messages Area -->
      <div class="messages-panel" [class.hidden-mobile]="!selectedConversation()">
        @if (selectedConversation()) {
          <!-- Messages Header -->
          <div class="messages-header">
            <button class="btn-back" (click)="selectedConversation.set(null)">
              <i class="pi pi-arrow-right"></i>
            </button>
            <div class="avatar">{{ getInitials(selectedConversation()!.coachName) }}</div>
            <div class="header-info">
              <span class="header-name">{{ selectedConversation()!.coachName }}</span>
              <span class="header-role">المدرب</span>
            </div>
          </div>

          <!-- Messages List -->
          <div class="messages-list" #messagesList>
            @if (messagesLoading()) {
              <div class="loading-state">
                <i class="pi pi-spin pi-spinner"></i>
                <span>جاري تحميل الرسائل...</span>
              </div>
            }
            @for (msg of messages(); track msg.id) {
              <div class="message-bubble" [class.sent]="msg.senderId === currentUserId()" [class.received]="msg.senderId !== currentUserId()">
                <div class="bubble-content">
                  <p>{{ msg.content }}</p>
                  <span class="message-time">
                    {{ formatMessageTime(msg.createdAt) }}
                    @if (msg.senderId === currentUserId()) {
                      <i class="pi" [class.pi-check]="!msg.isRead" [class.pi-check-circle]="msg.isRead"></i>
                    }
                  </span>
                </div>
              </div>
            }
          </div>

          <!-- Message Input -->
          <div class="message-input-area">
            <input
              type="text"
              class="message-input"
              placeholder="اكتب رسالتك..."
              [(ngModel)]="newMessage"
              (keydown.enter)="sendMessage()"
              [disabled]="sending()"
            />
            <button class="btn-send" (click)="sendMessage()" [disabled]="!newMessage.trim() || sending()">
              <i class="pi" [class.pi-send]="!sending()" [class.pi-spin]="sending()" [class.pi-spinner]="sending()"></i>
            </button>
          </div>
        } @else {
          <!-- Empty State -->
          <div class="empty-chat-state">
            <div class="empty-icon">
              <i class="pi pi-comments"></i>
            </div>
            @if (conversations().length > 0) {
              <h3>اختر محادثة</h3>
              <p>اختر محادثة من القائمة للبدء</p>
            } @else if (coachInfo()) {
              <h3>ابدأ محادثة مع مدربك</h3>
              <p>تواصل مع مدربك {{ coachInfo()!.fullName }} لطرح أسئلتك واستفساراتك</p>
              <button class="btn-start-chat large" (click)="startChatWithCoach()">
                <i class="pi pi-send"></i>
                ابدأ محادثة مع مدربك
              </button>
            } @else {
              <h3>المحادثات</h3>
              <p>لم يتم تعيين مدرب لك بعد. تواصل مع إدارة الصالة لتعيين مدرب.</p>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: calc(100vh - 70px);
    }

    .chat-container {
      display: flex;
      height: 100%;
      background: var(--bg-primary);
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid var(--border-color);
    }

    /* ==================== Conversations Panel ==================== */

    .conversations-panel {
      width: 340px;
      min-width: 340px;
      border-left: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      background: var(--bg-secondary);
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1rem;
      border-bottom: 1px solid var(--border-color);
    }

    .panel-header h2 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .panel-header h2 i {
      background: var(--gradient-primary);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    /* Conversations List */

    .conversations-list {
      flex: 1;
      overflow-y: auto;
    }

    .conversation-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.85rem 1rem;
      cursor: pointer;
      transition: background 0.15s;
      border-bottom: 1px solid var(--border-color);
    }

    .conversation-item:hover {
      background: var(--bg-tertiary);
    }

    .conversation-item.active {
      background: var(--bg-tertiary);
      border-right: 3px solid #6366f1;
    }

    .conversation-item.unread {
      background: rgba(99, 102, 241, 0.05);
    }

    .conv-info {
      flex: 1;
      min-width: 0;
    }

    .conv-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.25rem;
    }

    .conv-name {
      font-weight: 600;
      font-size: 0.9rem;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .conv-time {
      font-size: 0.7rem;
      color: var(--text-muted);
      white-space: nowrap;
    }

    .conv-preview {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .preview-text {
      font-size: 0.8rem;
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }

    .unread-badge {
      background: var(--gradient-primary);
      color: white;
      font-size: 0.7rem;
      font-weight: 700;
      min-width: 20px;
      height: 20px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 5px;
      flex-shrink: 0;
    }

    /* Avatar */

    .avatar {
      width: 42px;
      height: 42px;
      min-width: 42px;
      border-radius: 12px;
      background: var(--gradient-primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.85rem;
    }

    /* ==================== Messages Panel ==================== */

    .messages-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: var(--bg-primary);
      min-width: 0;
    }

    .messages-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--border-color);
      background: var(--bg-secondary);
    }

    .messages-header .avatar {
      width: 38px;
      height: 38px;
      min-width: 38px;
      font-size: 0.8rem;
    }

    .btn-back {
      display: none;
      background: none;
      border: none;
      color: var(--text-primary);
      cursor: pointer;
      padding: 6px;
      font-size: 1.1rem;
    }

    .header-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .header-name {
      font-weight: 700;
      font-size: 1rem;
      color: var(--text-primary);
    }

    .header-role {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    /* Messages List */

    .messages-list {
      flex: 1;
      overflow-y: auto;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .message-bubble {
      display: flex;
      max-width: 75%;
    }

    .message-bubble.sent {
      align-self: flex-start;
    }

    .message-bubble.received {
      align-self: flex-end;
    }

    .bubble-content {
      padding: 0.7rem 1rem;
      border-radius: 16px;
      max-width: 100%;
      word-wrap: break-word;
    }

    .message-bubble.sent .bubble-content {
      background: var(--gradient-primary);
      color: white;
      border-bottom-right-radius: 16px;
      border-bottom-left-radius: 4px;
    }

    .message-bubble.received .bubble-content {
      background: var(--bg-tertiary);
      color: var(--text-primary);
      border-bottom-left-radius: 16px;
      border-bottom-right-radius: 4px;
    }

    .bubble-content p {
      margin: 0;
      font-size: 0.9rem;
      line-height: 1.5;
    }

    .message-time {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.65rem;
      margin-top: 0.35rem;
      opacity: 0.7;
    }

    .message-bubble.sent .message-time {
      color: rgba(255, 255, 255, 0.8);
    }

    .message-bubble.received .message-time {
      color: var(--text-muted);
    }

    .message-time i {
      font-size: 0.65rem;
    }

    /* Message Input */

    .message-input-area {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      border-top: 1px solid var(--border-color);
      background: var(--bg-secondary);
    }

    .message-input {
      flex: 1;
      padding: 0.75rem 1rem;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      background: var(--bg-primary);
      color: var(--text-primary);
      font-size: 0.9rem;
      outline: none;
      transition: border-color 0.2s;
    }

    .message-input:focus {
      border-color: #6366f1;
    }

    .btn-send {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      border: none;
      background: var(--gradient-primary);
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .btn-send:hover:not(:disabled) {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }

    .btn-send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-send .pi-send {
      transform: rotate(180deg);
    }

    /* Empty States */

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1.5rem;
      text-align: center;
      color: var(--text-muted);
    }

    .empty-state i {
      font-size: 2.5rem;
      margin-bottom: 1rem;
      opacity: 0.3;
    }

    .empty-state p {
      font-weight: 600;
      color: var(--text-secondary);
      margin: 0 0 1rem;
    }

    .no-coach-text {
      font-size: 0.85rem;
    }

    .btn-start-chat {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.7rem 1.5rem;
      border: none;
      border-radius: 12px;
      background: var(--gradient-primary);
      color: white;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .btn-start-chat:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(99, 102, 241, 0.3);
    }

    .btn-start-chat.large {
      margin-top: 1.5rem;
      padding: 0.85rem 2rem;
      font-size: 1rem;
    }

    .btn-start-chat .pi-send {
      transform: rotate(180deg);
    }

    .empty-chat-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1.5rem;
      text-align: center;
    }

    .empty-icon {
      width: 80px;
      height: 80px;
      border-radius: 20px;
      background: var(--bg-tertiary);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.5rem;
    }

    .empty-icon i {
      font-size: 2rem;
      background: var(--gradient-primary);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .empty-chat-state h3 {
      margin: 0 0 0.5rem;
      color: var(--text-primary);
      font-size: 1.2rem;
    }

    .empty-chat-state p {
      margin: 0;
      font-size: 0.9rem;
      color: var(--text-muted);
      max-width: 350px;
    }

    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 2rem;
      color: var(--text-muted);
      font-size: 0.9rem;
    }

    .loading-state i {
      font-size: 1.2rem;
    }

    /* ==================== Mobile Responsive ==================== */

    @media (max-width: 768px) {
      .chat-container {
        border-radius: 0;
        border: none;
      }

      .conversations-panel {
        width: 100%;
        min-width: 100%;
        border-left: none;
      }

      .conversations-panel.hidden-mobile {
        display: none;
      }

      .messages-panel.hidden-mobile {
        display: none;
      }

      .messages-panel {
        width: 100%;
      }

      .btn-back {
        display: flex;
      }

      .message-bubble {
        max-width: 85%;
      }
    }
  `]
})
export class ClientChatComponent implements OnInit, OnDestroy {
  @ViewChild('messagesList') messagesListEl!: ElementRef;

  private chatService = inject(ChatService);
  private clientService = inject(ClientService);
  private authService = inject(AuthService);

  // State
  conversations = signal<ConversationDto[]>([]);
  messages = signal<ChatMessageDto[]>([]);
  selectedConversation = signal<ConversationDto | null>(null);
  conversationsLoading = signal(false);
  messagesLoading = signal(false);
  sending = signal(false);
  coachInfo = signal<MyCoachInfo | null>(null);
  coachLoading = signal(false);

  // Form
  newMessage = '';

  // Polling
  private pollInterval: any;

  currentUserId = computed(() => this.authService.user()?.id || '');

  ngOnInit(): void {
    this.loadConversations();
    this.loadCoachInfo();
    // Poll for new messages every 10 seconds
    this.pollInterval = setInterval(() => {
      this.loadConversations();
      if (this.selectedConversation()) {
        this.loadMessages(this.selectedConversation()!.id, false);
      }
    }, 10000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  loadConversations(): void {
    if (!this.conversationsLoading() || this.conversations().length > 0) {
      if (this.conversations().length === 0) {
        this.conversationsLoading.set(true);
      }
      this.chatService.getConversations().subscribe({
        next: (convs) => {
          this.conversations.set(convs);
          this.conversationsLoading.set(false);
          // Update selected conversation
          const selected = this.selectedConversation();
          if (selected) {
            const updated = convs.find(c => c.id === selected.id);
            if (updated) {
              this.selectedConversation.set(updated);
            }
          }
        },
        error: () => this.conversationsLoading.set(false)
      });
    }
  }

  loadCoachInfo(): void {
    this.coachLoading.set(true);
    this.clientService.getMyCoach().subscribe({
      next: (coach) => {
        this.coachInfo.set(coach);
        this.coachLoading.set(false);
      },
      error: () => this.coachLoading.set(false)
    });
  }

  selectConversation(conv: ConversationDto): void {
    this.selectedConversation.set(conv);
    this.loadMessages(conv.id, true);
    // Mark as read
    if (conv.unreadCount > 0) {
      this.chatService.markAsRead(conv.id).subscribe(() => {
        const updated = { ...conv, unreadCount: 0 };
        this.selectedConversation.set(updated);
        this.conversations.update(list =>
          list.map(c => c.id === conv.id ? updated : c)
        );
      });
    }
  }

  loadMessages(conversationId: string, showLoading: boolean): void {
    if (showLoading) {
      this.messagesLoading.set(true);
    }
    this.chatService.getMessages(conversationId).subscribe({
      next: (msgs) => {
        this.messages.set(msgs);
        this.messagesLoading.set(false);
        setTimeout(() => this.scrollToBottom(), 50);
      },
      error: () => this.messagesLoading.set(false)
    });
  }

  sendMessage(): void {
    const content = this.newMessage.trim();
    if (!content || this.sending()) return;

    const conv = this.selectedConversation();
    if (!conv) return;

    this.sending.set(true);
    const command: SendMessageCommand = {
      conversationId: conv.id,
      content
    };

    this.chatService.sendMessage(command).subscribe({
      next: () => {
        this.newMessage = '';
        this.sending.set(false);
        this.loadMessages(conv.id, false);
        this.loadConversations();
      },
      error: () => this.sending.set(false)
    });
  }

  startChatWithCoach(): void {
    const coach = this.coachInfo();
    if (!coach) return;

    this.sending.set(true);
    const command: SendMessageCommand = {
      recipientId: coach.id,
      content: 'مرحبا مدرب!'
    };

    this.chatService.sendMessage(command).subscribe({
      next: () => {
        this.sending.set(false);
        this.loadConversations();
      },
      error: () => this.sending.set(false)
    });
  }

  scrollToBottom(): void {
    try {
      if (this.messagesListEl) {
        const el = this.messagesListEl.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    } catch (_) {}
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return parts[0].substring(0, 2);
  }

  formatTime(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} د`;
    if (diffHours < 24) return `منذ ${diffHours} س`;
    if (diffDays < 7) return `منذ ${diffDays} ي`;
    return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
  }

  formatMessageTime(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const time = date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    if (isToday) return time;

    const dayStr = date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
    return `${dayStr} ${time}`;
  }
}
