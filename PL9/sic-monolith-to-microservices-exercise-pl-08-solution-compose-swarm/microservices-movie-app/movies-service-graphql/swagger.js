const swaggerAutogen = require("swagger-autogen")();

const doc = {
    info: {
        title: "My API",
        description: "Swagger documentation",
    },
    host: "localhost:3001",
    schemes: ["http"],
    tags: [
        { name: "Movies", description: "Movies related endpoints" },
    ],
    definitions: {
        Review: {
            id: 1,
            movieId: "123",
            userId: "123",
            text: "Review text"
        },
        GetMovie: {
            id: 1,
            title: "Example title",
            year: 123
        },
        CreateMovie: {
            title: "Example title",
            year: 123
        },
        FullMovie: {
            id: 1,
            title: "Example title",
            year: 123,
            reviews: [{ $ref: '#/definitions/Review' }]
        }
    }
};

const outputFile = "./swagger-output.json";
const endpointsFiles = ["./app.js"];

swaggerAutogen(outputFile, endpointsFiles, doc);
