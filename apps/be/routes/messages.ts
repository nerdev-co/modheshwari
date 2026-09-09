/**
 * Messages Module - Legacy Re-export
 * 
 * This file has been refactored into smaller modules:
 * - auth.ts - Authentication helpers
 * - conversations.ts - Conversation management
 * - handlers.ts - Message CRUD operations
 * - search.ts - User search functionality
 * 
 * All exports are maintained for backward compatibility.
 */

export {
  handleGetConversations,
  handleCreateConversation,
  handleGetMessages,
  handleSendMessage,
  handleMarkMessagesRead,
  handleSearchUsersForChat,
} from "./messages/";
