import { createConsumer, TOPICS } from "./config";
import { logger } from "../lib/logger";

/**
 * Performs main operation.
 * @returns {Promise<void>} Description of return value
 */
async function startConsumer() {
  // Create a consumer with a unique group ID
  const consumer = createConsumer("modheshwari");

  try {
    // Connect the consumer
    await consumer.connect();
    console.log("Consumer connected successfully");

    // Subscribe to topics
    await consumer.subscribe({
      topic: TOPICS.QUICKSTART_EVENTS,
      fromBeginning: true,
    });

    await consumer.subscribe({
      topic: TOPICS.PAYMENT_DONE,
      fromBeginning: true,
    });

    console.log("Subscribed to topics. Waiting for messages...");

    // Process messages
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        console.log({
          topic: topic,
          partition: partition,
          offset: message.offset,
          key: message.key?.toString(),
          value: message.value?.toString(),
          timestamp: message.timestamp,
        });
      },
    });
  } catch (error) {
    logger.error("Error in consumer:", error);
    await consumer.disconnect();
    process.exit(1);
  }
}

startConsumer();
