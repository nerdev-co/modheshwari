import type { Route } from "./types";
import * as handlers from "./handlers";
import { metricsHandler } from "../lib/metrics";

export const staticRoutes: Route[] = [
  // Health check
  {
    path: "/api/health",
    method: "GET",
    handler: () => Response.json({ status: "ok" }, { status: 200 }),
  },

  // Metrics endpoint for Prometheus (protected)
  {
    path: "/metrics",
    method: "GET",
    handler: (req: Request) => {
      const key = req.headers.get("x-metrics-token");
      if (key !== process.env.METRICS_SECRET) {
        return new Response("Forbidden", { status: 403 });
      }
      return metricsHandler();
    },
  },

  // Families
  {
    path: "/api/families",
    method: "POST",
    handler: (r: Request) => handlers.handleCreateFamily(r),
  },
  {
    path: "/api/family/tree",
    method: "GET",
    handler: (r: Request) => handlers.handleGetFamilyTree(r),
  },
  {
    path: "/api/family/tree/relations",
    method: "POST",
    handler: (r: Request) => handlers.handleCreateRelationship(r),
  },

  // Profile
  {
    path: "/api/me",
    method: "GET",
    handler: (r: Request) => handlers.handleGetMe(r),
  },
  {
    path: "/api/me",
    method: "PUT",
    handler: (r: Request) => handlers.handleUpdateMe(r),
  },
  {
    path: "/api/users/nearby",
    method: "GET",
    handler: (r: Request) => handlers.handleGetNearbyUsers(r),
  },
  {
    path: "/api/family/members",
    method: "GET",
    handler: (r: Request) => handlers.handleGetFamilyMembers(r),
  },

  // Search
  {
    path: "/api/search",
    method: "GET",
    handler: (r: Request) => handlers.handleSearch(r),
  },

  // Resource Requests
  {
    path: "/api/resource-requests",
    method: "POST",
    handler: (r: Request) => handlers.handleCreateResourceRequest(r),
  },
  {
    path: "/api/resource-requests",
    method: "GET",
    handler: (r: Request) => handlers.handleListResourceRequests(r),
  },

  // Admin
  {
    path: "/api/admin/requests",
    method: "GET",
    handler: (r: Request) => handlers.handleListAllRequests(r),
  },
  {
    path: "/api/admin/users",
    method: "GET",
    handler: (r: Request) => handlers.handleListUsers(r),
  },
  {
    path: "/api/admin/role-change-permissions",
    method: "GET",
    handler: (r: Request) => handlers.handleGetRoleChangePermissions(r),
  },

  // Notifications
  {
    path: "/api/notifications",
    method: "POST",
    handler: (r: Request) => handlers.handleCreateNotification(r),
  },
  {
    path: "/api/notifications",
    method: "GET",
    handler: (r: Request) => handlers.handleListNotifications(r),
  },
  {
    path: "/api/notifications/read-multiple",
    method: "POST",
    handler: (r: Request) => handlers.handleMarkMultipleAsRead(r),
  },
  {
    path: "/api/notifications/read-all",
    method: "POST",
    handler: (r: Request) => handlers.handleMarkAllAsRead(r),
  },

  // Chat & Messages
  {
    path: "/api/chat",
    method: "GET",
    handler: (r: Request) => handlers.handleGetChat(r),
  },
  {
    path: "/api/messages/conversations",
    method: "GET",
    handler: (r: Request) => handlers.handleGetConversations(r),
  },
  {
    path: "/api/messages/conversations",
    method: "POST",
    handler: (r: Request) => handlers.handleCreateConversation(r),
  },
  {
    path: "/api/messages",
    method: "POST",
    handler: (r: Request) => handlers.handleSendMessage(r),
  },
  {
    path: "/api/messages/read",
    method: "PUT",
    handler: (r: Request) => handlers.handleMarkMessagesRead(r),
  },
  {
    path: "/api/messages/users/search",
    method: "GET",
    handler: (r: Request) => handlers.handleSearchUsersForChat(r),
  },

  // Status Updates
  {
    path: "/api/status-update-requests",
    method: "POST",
    handler: (r: Request) => handlers.handleCreateStatusUpdateRequest(r),
  },
  {
    path: "/api/status-update-requests",
    method: "GET",
    handler: (r: Request) => handlers.handleListStatusUpdateRequests(r),
  },

  // Medical
  {
    path: "/api/profile/medical",
    method: "PUT",
    handler: (r: Request) => handlers.handleUpdateMedical(r),
  },
  {
    path: "/api/family/transfer",
    method: "POST",
    handler: (r: Request) => handlers.handleFamilyTransferRequest(r),
  },
  {
    path: "/api/medical/search",
    method: "GET",
    handler: (r: Request) => handlers.handleSearchByBloodGroup(r),
  },

  // Events
  {
    path: "/api/events",
    method: "POST",
    handler: (r: Request) => handlers.handleCreateEvent(r),
  },
  {
    path: "/api/events",
    method: "GET",
    handler: (r: Request) => handlers.handleListEvents(r),
  },

  // Gotras
  {
    path: "/api/gotras",
    method: "GET",
    handler: (r: Request) => handlers.handleListGotras(r),
  },
];
