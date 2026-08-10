/**
 * Family Tree Builders
 * Functions to build different views of the family tree
 */

import prisma from "@modheshwari/db";

import type { TreeNode } from "./types";

/**
 * Performs make node operation.
 * @param {{ id: string; name: string; email: string; role: string; }} user - Description of user
 * @returns {import("/Users/nalindalal/modheshwari/apps/be/routes/familyTree/types").TreeNode} Description of return value
 */
function makeNode(user: { id: string; name: string; email: string; role: string }): TreeNode {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

/**
 * Build ancestor tree (parents, grandparents, etc.) using BFS with bulk queries.
 */
export async function buildAncestorTree(
  userId: string,
  maxDepth: number,
): Promise<TreeNode | null> {
  const rootUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!rootUser) {
    return null;
  }

  const root = makeNode(rootUser);
  const nodeMap = new Map<string, TreeNode>([[userId, root]]);
  const visited = new Set<string>([userId]);

  let currentLevel = [userId];

  for (let level = 0; level < maxDepth; level++) {
    if (currentLevel.length === 0) {
      break;
    }

    const parentRelations = await prisma.userRelation.findMany({
      where: {
        toUserId: { in: currentLevel },
        type: "PARENT",
      },
      select: { fromUserId: true, toUserId: true },
    });

    const parentIds = [...new Set(parentRelations.map((r) => r.fromUserId))];
    const unvisitedParentIds = parentIds.filter((id) => !visited.has(id));

    if (unvisitedParentIds.length === 0 && parentRelations.length === 0) {
      break;
    }

    const parentUsers =
      unvisitedParentIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: unvisitedParentIds } },
            select: { id: true, name: true, email: true, role: true },
          })
        : [];

    const userMap = new Map(parentUsers.map((u) => [u.id, u]));

    const nextLevel: string[] = [];

    for (const rel of parentRelations) {
      let parentNode = nodeMap.get(rel.fromUserId);

      if (!parentNode) {
        const user = userMap.get(rel.fromUserId);
        if (!user) {
          continue;
        }
        parentNode = makeNode(user);
        nodeMap.set(rel.fromUserId, parentNode);
      }

      const childNode = nodeMap.get(rel.toUserId);
      if (childNode) {
        if (!childNode.parents) {
          childNode.parents = [];
        }
        if (!childNode.parents.includes(parentNode)) {
          childNode.parents.push(parentNode);
        }
      }

      if (!visited.has(rel.fromUserId)) {
        visited.add(rel.fromUserId);
        nextLevel.push(rel.fromUserId);
      }
    }

    const spouseRelations = await prisma.userRelation.findMany({
      where: {
        fromUserId: { in: currentLevel },
        type: "SPOUSE",
      },
      select: { fromUserId: true, toUserId: true },
    });

    const spouseIds = [...new Set(spouseRelations.map((r) => r.toUserId))];
    const unvisitedSpouseIds = spouseIds.filter((id) => !visited.has(id));

    if (unvisitedSpouseIds.length > 0) {
      const spouseUsers = await prisma.user.findMany({
        where: { id: { in: unvisitedSpouseIds } },
        select: { id: true, name: true, email: true, role: true },
      });

      const spouseUserMap = new Map(spouseUsers.map((u) => [u.id, u]));

      for (const rel of spouseRelations) {
        if (visited.has(rel.toUserId)) {
          continue;
        }
        visited.add(rel.toUserId);

        const spouseUser = spouseUserMap.get(rel.toUserId);
        if (!spouseUser) {
          continue;
        }

        const spouseNode: TreeNode = {
          id: spouseUser.id,
          name: spouseUser.name,
          email: spouseUser.email,
          role: spouseUser.role,
          relationshipToUser: "spouse",
        };

        const userNode = nodeMap.get(rel.fromUserId);
        if (userNode) {
          userNode.spouse = spouseNode;
        }
      }
    }

    currentLevel = nextLevel;
  }

  return root;
}

/**
 * Build descendant tree (children, grandchildren, etc.) using BFS with bulk queries.
 */
export async function buildDescendantTree(
  userId: string,
  maxDepth: number,
): Promise<TreeNode | null> {
  const rootUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!rootUser) {
    return null;
  }

  const root = makeNode(rootUser);
  const nodeMap = new Map<string, TreeNode>([[userId, root]]);
  const visited = new Set<string>([userId]);

  let currentLevel = [userId];

  for (let level = 0; level < maxDepth; level++) {
    if (currentLevel.length === 0) {
      break;
    }

    const childRelations = await prisma.userRelation.findMany({
      where: {
        fromUserId: { in: currentLevel },
        type: "CHILD",
      },
      select: { fromUserId: true, toUserId: true },
    });

    const childIds = [...new Set(childRelations.map((r) => r.toUserId))];
    const unvisitedChildIds = childIds.filter((id) => !visited.has(id));

    if (unvisitedChildIds.length === 0 && childRelations.length === 0) {
      break;
    }

    const childUsers =
      unvisitedChildIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: unvisitedChildIds } },
            select: { id: true, name: true, email: true, role: true },
          })
        : [];

    const userMap = new Map(childUsers.map((u) => [u.id, u]));

    const nextLevel: string[] = [];

    for (const rel of childRelations) {
      let childNode = nodeMap.get(rel.toUserId);

      if (!childNode) {
        const user = userMap.get(rel.toUserId);
        if (!user) {
          continue;
        }
        childNode = makeNode(user);
        nodeMap.set(rel.toUserId, childNode);
      }

      const parentNode = nodeMap.get(rel.fromUserId);
      if (parentNode) {
        if (!parentNode.children) {
          parentNode.children = [];
        }
        if (!parentNode.children.includes(childNode)) {
          parentNode.children.push(childNode);
        }
      }

      if (!visited.has(rel.toUserId)) {
        visited.add(rel.toUserId);
        nextLevel.push(rel.toUserId);
      }
    }

    const spouseRelations = await prisma.userRelation.findMany({
      where: {
        fromUserId: { in: currentLevel },
        type: "SPOUSE",
      },
      select: { fromUserId: true, toUserId: true },
    });

    const spouseIds = [...new Set(spouseRelations.map((r) => r.toUserId))];
    const unvisitedSpouseIds = spouseIds.filter((id) => !visited.has(id));

    if (unvisitedSpouseIds.length > 0) {
      const spouseUsers = await prisma.user.findMany({
        where: { id: { in: unvisitedSpouseIds } },
        select: { id: true, name: true, email: true, role: true },
      });

      const spouseUserMap = new Map(spouseUsers.map((u) => [u.id, u]));

      for (const rel of spouseRelations) {
        if (visited.has(rel.toUserId)) {
          continue;
        }
        visited.add(rel.toUserId);

        const spouseUser = spouseUserMap.get(rel.toUserId);
        if (!spouseUser) {
          continue;
        }

        const spouseNode: TreeNode = {
          id: spouseUser.id,
          name: spouseUser.name,
          email: spouseUser.email,
          role: spouseUser.role,
          relationshipToUser: "spouse",
        };

        const userNode = nodeMap.get(rel.fromUserId);
        if (userNode) {
          userNode.spouse = spouseNode;
        }
      }
    }

    currentLevel = nextLevel;
  }

  return root;
}

/**
 * Build full tree (both ancestors and descendants) using a single combined BFS pass.
 */
export async function buildFullTree(userId: string, maxDepth: number): Promise<TreeNode | null> {
  const rootUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!rootUser) {
    return null;
  }

  const root = makeNode(rootUser);
  const nodeMap = new Map<string, TreeNode>([[userId, root]]);
  const visited = new Set<string>([userId]);

  let currentLevel = [userId];

  for (let level = 0; level < maxDepth; level++) {
    if (currentLevel.length === 0) {
      break;
    }

    const parentRelations = await prisma.userRelation.findMany({
      where: {
        toUserId: { in: currentLevel },
        type: "PARENT",
      },
      select: { fromUserId: true, toUserId: true },
    });

    const childRelations = await prisma.userRelation.findMany({
      where: {
        fromUserId: { in: currentLevel },
        type: "CHILD",
      },
      select: { fromUserId: true, toUserId: true },
    });

    const parentIds = [...new Set(parentRelations.map((r) => r.fromUserId))];
    const childIds = [...new Set(childRelations.map((r) => r.toUserId))];

    const unvisitedParentIds = parentIds.filter((id) => !visited.has(id));
    const unvisitedChildIds = childIds.filter((id) => !visited.has(id));

    if (
      unvisitedParentIds.length === 0 &&
      unvisitedChildIds.length === 0 &&
      parentRelations.length === 0 &&
      childRelations.length === 0
    ) {
      break;
    }

    const allNewUserIds = [...unvisitedParentIds, ...unvisitedChildIds];

    const allNewUsers =
      allNewUserIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: allNewUserIds } },
            select: { id: true, name: true, email: true, role: true },
          })
        : [];

    const userMap = new Map(allNewUsers.map((u) => [u.id, u]));

    const nextLevel: string[] = [];

    for (const rel of parentRelations) {
      let parentNode = nodeMap.get(rel.fromUserId);

      if (!parentNode) {
        const user = userMap.get(rel.fromUserId);
        if (!user) {
          continue;
        }
        parentNode = makeNode(user);
        nodeMap.set(rel.fromUserId, parentNode);
      }

      const childNode = nodeMap.get(rel.toUserId);
      if (childNode) {
        if (!childNode.parents) {
          childNode.parents = [];
        }
        if (!childNode.parents.includes(parentNode)) {
          childNode.parents.push(parentNode);
        }
      }

      if (!visited.has(rel.fromUserId)) {
        visited.add(rel.fromUserId);
        nextLevel.push(rel.fromUserId);
      }
    }

    for (const rel of childRelations) {
      let childNode = nodeMap.get(rel.toUserId);

      if (!childNode) {
        const user = userMap.get(rel.toUserId);
        if (!user) {
          continue;
        }
        childNode = makeNode(user);
        nodeMap.set(rel.toUserId, childNode);
      }

      const parentNode = nodeMap.get(rel.fromUserId);
      if (parentNode) {
        if (!parentNode.children) {
          parentNode.children = [];
        }
        if (!parentNode.children.includes(childNode)) {
          parentNode.children.push(childNode);
        }
      }

      if (!visited.has(rel.toUserId)) {
        visited.add(rel.toUserId);
        nextLevel.push(rel.toUserId);
      }
    }

    if (level === 0) {
      const siblingRelations = await prisma.userRelation.findMany({
        where: {
          fromUserId: userId,
          type: "SIBLING",
        },
        select: { toUserId: true },
      });

      const siblingIds = [...new Set(siblingRelations.map((r) => r.toUserId))];

      if (siblingIds.length > 0) {
        const siblingUsers = await prisma.user.findMany({
          where: { id: { in: siblingIds } },
          select: { id: true, name: true, email: true, role: true },
        });

        root.siblings = siblingUsers.map((s) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          role: s.role,
          relationshipToUser: "sibling" as const,
        }));
      }
    }

    const spouseRelations = await prisma.userRelation.findMany({
      where: {
        fromUserId: { in: currentLevel },
        type: "SPOUSE",
      },
      select: { fromUserId: true, toUserId: true },
    });

    const spouseIds = [...new Set(spouseRelations.map((r) => r.toUserId))];
    const unvisitedSpouseIds = spouseIds.filter((id) => !visited.has(id));

    if (unvisitedSpouseIds.length > 0) {
      const spouseUsers = await prisma.user.findMany({
        where: { id: { in: unvisitedSpouseIds } },
        select: { id: true, name: true, email: true, role: true },
      });

      const spouseUserMap = new Map(spouseUsers.map((u) => [u.id, u]));

      for (const rel of spouseRelations) {
        if (visited.has(rel.toUserId)) {
          continue;
        }
        visited.add(rel.toUserId);

        const spouseUser = spouseUserMap.get(rel.toUserId);
        if (!spouseUser) {
          continue;
        }

        const spouseNode: TreeNode = {
          id: spouseUser.id,
          name: spouseUser.name,
          email: spouseUser.email,
          role: spouseUser.role,
          relationshipToUser: "spouse",
        };

        const userNode = nodeMap.get(rel.fromUserId);
        if (userNode) {
          userNode.spouse = spouseNode;
        }
      }
    }

    currentLevel = nextLevel;
  }

  return root;
}