const swaggerAutogen = require("swagger-autogen")();

const doc = {
  info: {
    title: "Reviews Microservice API",
    description: "Swagger documentation for the Reviews service",
    version: "1.0.0"
  },
  host: "localhost:3002",
  basePath: "/",
  schemes: ["http"],
  consumes: ["application/json"],
  produces: ["application/json"],
  tags: [
    {
      name: "Reviews",
      description: "Endpoints related to movie reviews"
    }
  ],
  definitions: {
    Review: {
      id: 1,
      movieId: 1,
      userId: 2,
      text: "Very underrated movie!"
    },
    ReviewInput: {
      movieId: 1,
      userId: 2,
      text: "Your review text here"
    },
    ErrorResponse: {
      error: "Review not found"
    },
    DeleteResponse: {
      message: "Review deleted"
    }
  }
};

const outputFile = "./swagger-output.json";
const endpointsFiles = ["./app.js"];

swaggerAutogen(outputFile, endpointsFiles, doc);