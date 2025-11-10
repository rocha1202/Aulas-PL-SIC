const swaggerAutogen = require("swagger-autogen")();

const doc = {
  info: {
    title: "Movies Microservice API",
    description: "Swagger documentation for the Movies service",
    version: "1.0.0"
  },
  host: "localhost:3001",
  basePath: "/",
  schemes: ["http"],
  consumes: ["application/json"],
  produces: ["application/json"],
  tags: [
    {
      name: "Movies",
      description: "Endpoints related to movie management"
    }
  ],
  definitions: {
    Movie: {
      id: 1,
      title: "Treasure Planet",
      year: 2002
    },
    MovieInput: {
      title: "Treasure Planet",
      year: 2002
    },
    Review: {
      id: 1,
      movieId: 1,
      userId: 2,
      text: "Very underrated movie!"
    },
    DeleteResponse: {
      message: "Movie deleted"
    },
    ErrorResponse: {
      error: "Movie not found"
    }
  }
};

const outputFile = "./swagger-output.json";
const endpointsFiles = ["./app.js"];

swaggerAutogen(outputFile, endpointsFiles, doc);