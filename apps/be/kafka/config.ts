import { Kafka } from "kafkajs";
import { KAFKA_BROKER } from "@modheshwari/config/be";

// Kafka configuration
export const kafka = new Kafka({
  clientId: "modheshwari-app",
  brokers: [KAFKA_BROKER],
});

// Create producer instance
export const producer = kafka.producer({ idempotent: true });

// Create consumer instance with a consumer group
export const createConsumer =
  /**
   * Executes create consumer operation.
   * @param {string} groupId - Description of groupId
   * @returns {import("/Users/nalindalal/modheshwari/node_modules/kafkajs/types/index").Consumer} Description of return value
   */
  (groupId: string) => {
    return kafka.consumer({ groupId });
  };

// Topics
export const TOPICS = {
  QUICKSTART_EVENTS: "quickstart-events",
  PAYMENT_DONE: "payment-done",
  NOTIFICATION_EVENTS: "notification.events",
  NOTIFICATION_EMAIL: "notification.email",
  NOTIFICATION_PUSH: "notification.push",
  NOTIFICATION_SMS: "notification.sms",
  NOTIFICATION_READ: "notification.read",
} as const;
