import { match } from "@modheshwari/utils/match";

import * as handlers from "./handlers";

export interface ParameterizedRoute {
  pattern: string;
  method: string;
  handler: (r: Request, params: Record<string, string>) => Response | Promise<Response>;
}

export const parameterizedRoutes: ParameterizedRoute[] = [
  // Family invites
  {
    pattern: "/api/families/:familyId/invites",
    method: "GET",
    handler: (r, params) => handlers.handleListInvites(r, params.familyId!),
  },
  {
    pattern: "/api/families/:familyId/invites/:inviteId",
    method: "PATCH",
    handler: (r, params) => handlers.handleReviewInvite(r, params.familyId!, params.inviteId!, params.action || ""),
  },
  {
    pattern: "/api/families/:familyId/members",
    method: "POST",
    handler: (r, params) => handlers.handleAddMember(r, params.familyId!),
  },

  // Family tree relations
  {
    pattern: "/api/family/tree/relations/:id",
    method: "DELETE",
    handler: (r, params) => handlers.handleDeleteRelationship(r, params.id!),
  },

  // Resource requests
  {
    pattern: "/api/resource-requests/:id",
    method: "GET",
    handler: (r, params) => handlers.handleGetResourceRequest(r, params.id!),
  },
  {
    pattern: "/api/resource-requests/:id",
    method: "PATCH",
    handler: (r, params) => handlers.handleReviewResourceRequest(r, params.id!),
  },

  // Admin user management
  {
    pattern: "/api/admin/users/:id/role",
    method: "PATCH",
    handler: (r, params) => handlers.handleChangeUserRole(r, params.id!),
  },
  {
    pattern: "/api/admin/users/:id",
    method: "GET",
    handler: (r, params) => handlers.handleGetUserDetails(r, params.id!),
  },

  // Notifications
  {
    pattern: "/api/notifications/:id",
    method: "PATCH",
    handler: (r, params) => handlers.handleMarkAsRead(r, params.id!),
  },
  {
    pattern: "/api/notifications/:id/delivery-status",
    method: "GET",
    handler: (r, params) => handlers.handleGetDeliveryStatus(r, params.id!),
  },

  // Messages
  {
    pattern: "/api/messages/:conversationId",
    method: "GET",
    handler: (r, params) => handlers.handleGetMessages(r, params.conversationId!),
  },

  // Status updates
  {
    pattern: "/api/status-update-requests/:id",
    method: "PATCH",
    handler: (r, params) => handlers.handleReviewStatusUpdateRequest(r, params.id!),
  },

  // Events
  {
    pattern: "/api/events/:id",
    method: "GET",
    handler: (r, params) => handlers.handleGetEvent(r, params.id!),
  },
  {
    pattern: "/api/events/:id/register",
    method: "POST",
    handler: (r, params) => handlers.handleRegisterForEvent(r, params.id!),
  },
  {
    pattern: "/api/events/:id/register",
    method: "DELETE",
    handler: (r, params) => handlers.handleUnregisterFromEvent(r, params.id!),
  },
  {
    pattern: "/api/events/:id/registrations",
    method: "GET",
    handler: (r, params) => handlers.handleGetEventRegistrations(r, params.id!),
  },
  {
    pattern: "/api/events/:id/approve",
    method: "POST",
    handler: (r, params) => handlers.handleApproveEvent(r, params.id!),
  },
  {
    pattern: "/api/events/:id/status",
    method: "PATCH",
    handler: (r, params) => handlers.handleUpdateEventStatus(r, params.id!),
  },

  // Gotras
  {
    pattern: "/api/gotras/:gotraName/families",
    method: "GET",
    handler: (r, params) => handlers.handleGetGotraFamilies(r, params.gotraName!),
  },
];

/**
 * Match a request against parameterized routes
 */
export function matchParameterizedRoute(
  pathname: string,
  method: string,
): { route: ParameterizedRoute; params: Record<string, string> } | null {
  for (const route of parameterizedRoutes) {
    if (route.method !== method) continue;
    
    const params = match(pathname, route.pattern);
    if (params) {
      return { route, params };
    }
  }
  return null;
}
