/**
 * Messages Module
 * 
 * Handles private messaging between users including:
 * - Conversation management
 * - Message sending and retrieval
 * - Read receipts
 * - User search for chat
 * 
 * This module was refactored from a monolithic file into smaller,
 * focused modules for better maintainability and testability.
 */

export { handleGetConversations, handleCreateConversation } from "./conversations";
export { handleGetMessages, handleSendMessage, handleMarkMessagesRead } from "./handlers";
export { handleSearchUsersForChat } from "./search";
