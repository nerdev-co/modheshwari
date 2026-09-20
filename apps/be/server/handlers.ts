// Auth
export { handleAdminLogin, handleAdminSignup } from "../routes/auth/admin";
export { handleFHLogin, handleFHSignup } from "../routes/auth/fh";
export { handleMemberLogin, handleMemberSignup } from "../routes/auth/fm";

// Profile
export { handleGetMe, handleUpdateMe } from "../routes/me";
export { handleGetNearbyUsers } from "../routes/nearby";

// Family
export {
  handleCreateFamily,
  handleAddMember,
  handleListInvites,
  handleReviewInvite,
} from "../routes/families";
export { handleGetFamilyMembers } from "../routes/familyMembers";
export { handleFamilyTransferRequest, handleFamilyTransferReview } from "../routes/familyTransfer";

// Gotras
export { handleListGotras, handleGetGotraFamilies } from "../routes/gotras";

// Family Tree
export {
  handleGetFamilyTree,
  handleCreateRelationship,
  handleDeleteRelationship,
} from "../routes/familyTree";

// Search
export { handleSearch } from "../routes/search";

// Resource Requests
export {
  handleCreateResourceRequest,
  handleListResourceRequests,
  handleGetResourceRequest,
  handleReviewResourceRequest,
} from "../routes/resourceReq";

// Notifications
export {
  handleCreateNotification,
  handleListNotifications,
} from "../routes/notifications";

// Notification Read Tracking
export {
  handleMarkAsRead,
  handleMarkMultipleAsRead,
  handleMarkAllAsRead,
  handleGetDeliveryStatus,
} from "../routes/notificationRead";

// Messages
export {
  handleGetConversations,
  handleCreateConversation,
  handleGetMessages,
  handleSearchUsersForChat,
  handleSendMessage,
  handleMarkMessagesRead,
} from "../routes/messages";
export { handleGetChat } from "../routes/chat";

// Admin
export { handleListAllRequests, handleUpdateEventStatus } from "../routes/admin";
export {
  handleChangeUserRole,
  handleListUsers,
  handleGetRoleChangePermissions,
  handleGetUserDetails,
} from "../routes/adminRoleChange";

// Status Update
export {
  handleCreateStatusUpdateRequest,
  handleListStatusUpdateRequests,
  handleReviewStatusUpdateRequest,
} from "../routes/statusUpdate";

// Medical
export {
  handleUpdateMedical,
  handleSearchByBloodGroup,
} from "../routes/medical";

// Events
export {
  handleCreateEvent,
  handleListEvents,
  handleGetEvent,
  handleRegisterForEvent,
  handleUnregisterFromEvent,
  handleGetEventRegistrations,
  handleApproveEvent,
} from "../routes/events";
