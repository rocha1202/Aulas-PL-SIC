const amqp = require("amqplib");
const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://rabbitmq:5672";
const EXCHANGE_NAME = "movies";
let channel;
async function connectRabbitMQ() {
  if (channel) return channel;
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, "fanout", {
      durable: true,
    });
    console.log("Connected to RabbitMQ");
    return channel;
  } catch (error) {
    console.log("Failed to connect to RabbitMQ", error);
    throw error;
  }
}
async function publishMovieCreatedEvent(movie) {
  const ch = await connectRabbitMQ();
  const event = {
    eventType: "MovieCreated",
    data: {
      id: movie.id,
      title: movie.title,
      year: movie.year,
    },
    timestamp: new Date().toISOString(),
  };
  ch.publish(EXCHANGE_NAME, "", Buffer.from(JSON.stringify(event)), {
    persistent: true,
  });
  console.log(`MovieCreated event published for movie id: ${movie.id}`);
}
module.exports = {
  publishMovieCreatedEvent,
};
