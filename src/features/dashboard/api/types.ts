/** Shapes verified against the Spring Boot DTOs (UserResponse, ConversationResponse, MessageResponse, ChatResponse). */
export interface CurrentUser {
  id: number
  email: string
  createdAt: string
}

export interface Conversation {
  id: number
  title: string | null
  createdAt: string
  updatedAt: string
}

export interface ChatMessage {
  id: number
  role: 'USER' | 'ASSISTANT' | string
  content: string
  createdAt: string
}

export interface ChatReply {
  conversationId: number
  response: string
}
