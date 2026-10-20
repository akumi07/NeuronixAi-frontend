import { z } from 'zod'
import { callEndpoint } from '../../../api/call'
import { ENDPOINTS } from '../../../api/endpoints'
import type { AuthedRequest } from '../../auth/context/AuthContext'
import type { ChatMessage, ChatReply, Conversation, CurrentUser } from './types'

/**
 * Typed client for the implemented endpoints (see src/api/endpoints.ts). Responses are validated, so a malformed
 * payload becomes a handled error instead of a crash. Ownership is enforced server-side; the browser never sends a user id.
 */
const userSchema = z.object({ id: z.number(), email: z.string(), createdAt: z.string() })
const conversationSchema = z.object({ id: z.number(), title: z.string().nullish().transform((t) => t ?? null), createdAt: z.string(), updatedAt: z.string() })
const messageSchema = z.object({ id: z.number(), role: z.string(), content: z.string().nullish().transform((c) => c ?? ''), createdAt: z.string() })
const chatReplySchema = z.object({ conversationId: z.number(), response: z.string().nullish().transform((r) => r ?? '') })

export function createWorkspaceApi(request: AuthedRequest) {
  const req = request as never
  return {
    me: (signal?: AbortSignal): Promise<CurrentUser> => callEndpoint(req, ENDPOINTS.users.me, { signal, schema: userSchema }),
    conversations: (signal?: AbortSignal): Promise<Conversation[]> => callEndpoint(req, ENDPOINTS.conversations.list, { signal, schema: z.array(conversationSchema) }),
    messages: (conversationId: number, signal?: AbortSignal): Promise<ChatMessage[]> =>
      callEndpoint(req, ENDPOINTS.conversations.messages, { params: conversationId, signal, schema: z.array(messageSchema) }),
    chat: (message: string, conversationId: number | null, signal?: AbortSignal): Promise<ChatReply> =>
      callEndpoint(req, ENDPOINTS.chat.send, { body: conversationId === null ? { message } : { conversationId, message }, signal, schema: chatReplySchema }),
    deleteConversation: (conversationId: number): Promise<unknown> => callEndpoint(req, ENDPOINTS.conversations.remove, { params: conversationId }),
  }
}
