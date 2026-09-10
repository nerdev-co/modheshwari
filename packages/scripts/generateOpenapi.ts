import { writeFileSync } from "fs";
import { join } from "path";
import { Project, SyntaxKind, VariableDeclaration } from "ts-morph";

const ROOT = process.cwd();

interface RouteDefinition {
  path: string;
  method: string;
  handler: string;
  summary?: string;
  description?: string;
  requestBody?: Record<string, unknown>;
  responses?: Record<string, unknown>;
  security?: boolean;
}

const project = new Project({
  tsConfigFilePath: join(ROOT, "tsconfig.json"),
});

// Parse index.ts to extract routes
const indexFile = project.addSourceFileAtPath("apps/be/index.ts");
const routes: RouteDefinition[] = [];

// Extract route tables
const authTable = indexFile.getVariableDeclaration("authRouteTable");
const staticTable = indexFile.getVariableDeclaration("staticRouteTable");

/**
 * Performs extract routes from table operation.
 * @param {any} tableDecl - Description of tableDecl
 * @param {boolean} requireAuth - Description of requireAuth
 * @returns {void} Description of return value
 */
function extractRoutesFromTable(tableDecl: VariableDeclaration, requireAuth = true) {
  const initializer = tableDecl?.getInitializer();
  if (!initializer || initializer.getKind() !== SyntaxKind.ArrayLiteralExpression) {
    return;
  }

  const elements = initializer.getElements();
  for (const element of elements) {
    if (element.getKind() !== SyntaxKind.ObjectLiteralExpression) continue;

    const obj = element.asKindOrThrow(SyntaxKind.ObjectLiteralExpression);
    const pathProp = obj.getProperty("path");
    const methodProp = obj.getProperty("method");
    const handlerProp = obj.getProperty("handler");

    if (!pathProp || !methodProp || !handlerProp) continue;

    const path = pathProp
      .getLastChildByKind(SyntaxKind.StringLiteral)
      ?.getLiteralValue();
    const method = methodProp
      .getLastChildByKind(SyntaxKind.StringLiteral)
      ?.getLiteralValue();

    if (!path || !method) continue;

    // Extract handler name
    const handlerText = handlerProp.getText();
    const handlerMatch = handlerText.match(/handle\w+/);
    const handler = handlerMatch ? handlerMatch[0] : "";

    routes.push({
      path,
      method,
      handler,
      security: requireAuth,
    });
  }
}

if (authTable) extractRoutesFromTable(authTable, false);
if (staticTable) extractRoutesFromTable(staticTable, true);

// Add dynamic routes manually (since they use match())
const dynamicRoutes: RouteDefinition[] = [
  {
    path: "/api/families/{familyId}/members",
    method: "POST",
    handler: "handleAddMember",
    security: true,
  },
  {
    path: "/api/families/{familyId}/invites",
    method: "PATCH",
    handler: "handleListInvites",
    security: true,
  },
  {
    path: "/api/families/{familyId}/invites/{inviteId}",
    method: "PATCH",
    handler: "handleReviewInvite",
    security: true,
  },
  {
    path: "/api/family/tree/relations/{id}",
    method: "DELETE",
    handler: "handleDeleteRelationship",
    security: true,
  },
  {
    path: "/api/resource-requests/{id}",
    method: "GET",
    handler: "handleGetResourceRequest",
    security: true,
  },
  {
    path: "/api/resource-requests/{id}/review",
    method: "POST",
    handler: "handleReviewResourceRequest",
    security: true,
  },
  {
    path: "/api/admin/event/{id}/status",
    method: "POST",
    handler: "handleUpdateEventStatus",
    security: true,
  },
  {
    path: "/api/admin/users/{id}",
    method: "GET",
    handler: "handleGetUserDetails",
    security: true,
  },
  {
    path: "/api/admin/users/{id}/role",
    method: "PATCH",
    handler: "handleChangeUserRole",
    security: true,
  },
  {
    path: "/api/notifications/{id}/read",
    method: "POST",
    handler: "handleMarkAsRead",
    security: true,
  },
  {
    path: "/api/notifications/{id}/delivery-status",
    method: "GET",
    handler: "handleGetDeliveryStatus",
    security: true,
  },
  {
    path: "/api/messages/conversations/{conversationId}/messages",
    method: "GET",
    handler: "handleGetMessages",
    security: true,
  },
  {
    path: "/api/status-update-requests/{id}/review",
    method: "POST",
    handler: "handleReviewStatusUpdateRequest",
    security: true,
  },
  {
    path: "/api/events/{id}",
    method: "GET",
    handler: "handleGetEvent",
    security: true,
  },
  {
    path: "/api/events/{id}/register",
    method: "POST",
    handler: "handleRegisterForEvent",
    security: true,
  },
  {
    path: "/api/events/{id}/register",
    method: "DELETE",
    handler: "handleUnregisterFromEvent",
    security: true,
  },
  {
    path: "/api/events/{id}/registrations",
    method: "GET",
    handler: "handleGetEventRegistrations",
    security: true,
  },
  {
    path: "/api/events/{id}/approve",
    method: "POST",
    handler: "handleApproveEvent",
    security: true,
  },
];

routes.push(...dynamicRoutes);

// Generate OpenAPI paths
const paths: Record<string, Record<string, Record<string, unknown>>> = {};

for (const route of routes) {
  const { path, method, handler, security } = route;
  
  if (!paths[path]) {
    paths[path] = {};
  }

  const operationId = handler;
  const tag = path.split("/")[2] || "General"; // Extract tag from path
  const summary = handler
    .replace(/^handle/, "")
    .replace(/([A-Z])/g, " $1")
    .trim();

  paths[path][method.toLowerCase()] = {
    tags: [tag.charAt(0).toUpperCase() + tag.slice(1)],
    summary,
    operationId,
    ...(security && { security: [{ BearerAuth: [] }] }),
    responses: {
      "200": {
        description: "Success",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "success" },
                message: { type: "string" },
                data: { type: "object" },
              },
            },
          },
        },
      },
      "400": { $ref: "#/components/responses/BadRequest" },
      "401": { $ref: "#/components/responses/Unauthorized" },
      "500": { $ref: "#/components/responses/InternalError" },
    },
  };

  // Add path parameters
  const pathParams = path.match(/\{(\w+)\}/g);
  if (pathParams) {
    paths[path][method.toLowerCase()].parameters = pathParams.map((param) => ({
      name: param.slice(1, -1),
      in: "path",
      required: true,
      schema: { type: "string" },
    }));
  }

  // Add request body for POST/PATCH/PUT
  if (["POST", "PATCH", "PUT"].includes(method)) {
    paths[path][method.toLowerCase()].requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: { type: "object" },
        },
      },
    };
  }
}

// Read existing spec template or create minimal one
const specTemplate = {
  openapi: "3.0.0",
  info: {
    title: "Modheshwari Backend API",
    description: "Community management system API",
    version: "1.0.0",
  },
  servers: [
    {
      url: "https://api.modheshwari.com",
      description: "Production server",
    },
    {
      url: "http://localhost:3001",
      description: "Development server",
    },
  ],
  security: [{ BearerAuth: [] }],
  paths,
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    responses: {
      BadRequest: {
        description: "Bad request",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: { type: "string" },
                message: { type: "string" },
              },
            },
          },
        },
      },
      Unauthorized: {
        description: "Unauthorized",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: { type: "string", example: "Unauthorized" },
              },
            },
          },
        },
      },
      InternalError: {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: { type: "string", example: "Internal server error" },
              },
            },
          },
        },
      },
    },
  },
};

// Write updated spec
import yaml from "js-yaml";
const specYaml = yaml.dump(specTemplate, { lineWidth: 120 });
writeFileSync(join(ROOT, "openapi.yaml"), specYaml, "utf-8");

console.info(`✓ Generated OpenAPI spec with ${routes.length} routes`);
console.info(`  Written to: openapi.yaml`);
