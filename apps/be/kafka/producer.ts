import { producer, TOPICS } from "./config";
import { logger } from "../lib/logger";

/**
 * Performs main operation.
 * @returns {Promise<void>} Description of return value
 */
async function startProducer() {
  try {
    // Connect the producer
    await producer.connect();
    logger.info("Producer connected successfully");

    // Send a basic message
    await producer.send({
      topic: TOPICS.QUICKSTART_EVENTS,
      messages: [
        {
          value: "hi there",
        },
      ],
    });

    logger.info("Message sent to quickstart-events topic");

    // Disconnect
    await producer.disconnect();
    logger.info("Producer disconnected");
  } catch (error) {
    logger.error("Error in producer:", error);
    process.exit(1);
  }
}

startProducer();
