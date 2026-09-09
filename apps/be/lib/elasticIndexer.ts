import elasticClient from "./elastic";
import { logger } from "./logger";

/**
 * Performs index user operation.
 * @param {any} user - Description of user
 * @returns {Promise<void>} Description of return value
 */
export async function indexUser(user: any) {
  if (!user || !user.id) return;
  try {
    await elasticClient.index({
      index: "users",
      id: user.id,
      body: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profile: {
          gotra: user.profile?.gotra,
          profession: user.profile?.profession,
          bloodGroup: user.profile?.bloodGroup,
          location: user.profile?.location,
        },
        location: user.locationLat && user.locationLng ? { lat: user.locationLat, lon: user.locationLng } : undefined,
      },
      refresh: false,
    });
  } catch (err) {
    logger.error("Failed to index user:", err);
  }
}

/**
 * Performs delete user operation.
 * @param {string} userId - Description of userId
 * @returns {Promise<void>} Description of return value
 */
export async function deleteUser(userId: string) {
  if (!userId) return;
  try {
    await elasticClient.delete({ index: "users", id: userId });
  } catch (err: any) {
    // ignore not found (Elasticsearch client error shape varies)
    const status = err?.meta?.statusCode ?? err?.statusCode ?? (err && (err as any).status);
    if (status !== 404) logger.error("Failed to delete user from index:", err);
  }
}

/**
 * Performs index event operation.
 * @param {any} ev - Description of ev
 * @returns {Promise<void>} Description of return value
 */
export async function indexEvent(ev: any) {
  if (!ev || !ev.id) return;
  try {
    await elasticClient.index({
      index: "events",
      id: ev.id,
      body: {
        id: ev.id,
        name: ev.name,
        description: ev.description,
        date: ev.date,
        venue: ev.venue,
        status: ev.status,
        location: ev.locationLat && ev.locationLng ? { lat: ev.locationLat, lon: ev.locationLng } : undefined,
      },
      refresh: false,
    });
  } catch (err) {
    logger.error("Failed to index event:", err);
  }
}

/**
 * Performs delete event operation.
 * @param {string} eventId - Description of eventId
 * @returns {Promise<void>} Description of return value
 */
export async function deleteEvent(eventId: string) {
  if (!eventId) return;
  try {
    await elasticClient.delete({ index: "events", id: eventId });
  } catch (err: any) {
    const status = err?.meta?.statusCode ?? err?.statusCode ?? (err && (err as any).status);
    if (status !== 404) logger.error("Failed to delete event from index:", err);
  }
}

export default {
  indexUser,
  deleteUser,
  indexEvent,
  deleteEvent,
};
