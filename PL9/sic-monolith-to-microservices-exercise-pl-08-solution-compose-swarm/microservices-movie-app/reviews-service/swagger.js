const swaggerAutogen = require("swagger-autogen")();

const doc = {
    info: {
        title: "My API",
        description: "Swagger documentation",
    },
    host: "localhost:3002",
    schemes: ["http"],
    tags: [
        { name: "Reviews", description: "Reviews related endpoints" },
    ],
    definitions: {
        GetReview: {
            id: 1,
            movieId: "123",
            userId: "123",
            text: "Review text"
        },
        CreateReview: {
            movieId: "123",
            text: "Review text"
        }
    }
};

const outputFile = "./swagger-output.json";
const endpointsFiles = ["./app.js"];

swaggerAutogen(outputFile, endpointsFiles, doc);
