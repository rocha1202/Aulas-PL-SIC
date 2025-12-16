const amqp = require("amqplib");
const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://rabbitmq:5672";
const EXCHANGE_NAME = "movies";
const QUEUE_NAME = "notifications";
const pino = require("pino");
const logger = pino({
  transport: {
    target: "pino-pretty",
    options: { colorize: true },
  },
});
const RETRY_INTERVAL = 5000;
async function start() {
  while (true) {
    try {
      const connection = await amqp.connect(RABBITMQ_URL);
      const channel = await connection.createChannel();
      // Declare exchange, that routes to a queue/event broker
      await channel.assertExchange(EXCHANGE_NAME, "fanout", { durable: true });
      // Declare queue/event broker
      await channel.assertQueue(QUEUE_NAME, { durable: true });
      // Bind the queue/event broker to the exchange
      await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, "");
      logger.info(`Waiting for messages in queue: ${QUEUE_NAME}`);
      // Consume messages
      channel.consume(QUEUE_NAME, (msg) => {
        if (msg !== null) {
          const movieEvent = JSON.parse(msg.content.toString());
          logger.info(
            `MovieCreated event received: ${JSON.stringify(movieEvent)}`
          );
          // Simulate get all user emails from user service
          // Simulate sending email
          logger.info(
            `Sending email notification for movie: ${movieEvent.data.title}`
          );
          // Acknowledge message
          channel.ack(msg);
        }
      });
      break; // exit retry loop on success
    } catch (err) {
      logger.error("Failed to start Notification Service", err);
      await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL));
    }
  }
}
start();
    