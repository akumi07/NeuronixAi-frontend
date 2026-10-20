import type { AuthedRequest } from '../../auth/context/AuthContext'
import type { ChatMessage, ChatReply, Conversation, CurrentUser } from './types'

const CHAT_TIMEOUT_MS = 90_000

/**
 * Endpoints verified in the backend controllers:
 *   GET    /api/v1/users/me                                   -> UserResponse
 *   GET    /api/v1/conversations                              -> ConversationResponse[] (current user only)
 *   GET    /api/v1/conversations/{id}/messages                -> MessageResponse[]
 *   POST   /api/v1/chat {conversationId?, message}            -> ChatResponse
 *   DELETE /api/v1/conversations/{id}/deleteConversation      -> plain string
 * Ownership is enforced server-side (findByIdAndUser); the browser never sends a user id.
 */
export function createWorkspaceApi(request: AuthedRequest) {
  return {
    me: (signal?: AbortSignal) => request<CurrentUser>('GET', '/api/v1/users/me', { signal }),
    conversations: (signal?: AbortSignal) => request<Conversation[]>('GET', '/api/v1/conversations', { signal }),
    messages: (conversationId: number, signal?: AbortSignal) =>
      request<ChatMessage[]>('GET', `/api/v1/conversations/${conversationId}/messages`, { signal }),
    chat: (message: string, conversationId: number | null, signal?: AbortSignal) =>
      request<ChatReply>('POST', '/api/v1/chat', {
        body: conversationId === null ? { message } : { conversationId, message },
        timeoutMs: CHAT_TIMEOUT_MS,
        signal,
      }),
    deleteConversation: (conversationId: number) =>
      request<string>('DELETE', `/api/v1/conversations/${conversationId}/deleteConversation`),
  }
}
