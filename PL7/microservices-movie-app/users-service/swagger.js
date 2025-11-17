const swaggerAutogen = require("swagger-autogen")();

const doc = {
  info: {
    title: "User Service API",
    description: "API com autenticação JWT e autorização por papel",
  },
  host: "localhost:3003",
  schemes: ["http"],
  securityDefinitions: {
    bearerAuth: {
      type: "apiKey",
      name: "Authorization",
      in: "header",
      description: "Insere o token JWT no formato: Bearer <token>",
    },
  },
  security: [{ bearerAuth: [] }],
  definitions: {
    User: {
      id: 1,
      name: "Alice",
      email: "alice@email.com",
      role: "admin",
    },
    UserInput: {
      name: "Alice",
      email: "alice@email.com",
      password: "password123",
      role: "admin",
    },
    UserUpdate: {
      name: "Alice Updated",
      email: "alice.updated@email.com",
    },
    UserLogin: {
      email: "alice@email.com",
      password: "password123",
    },
  },
};

const outputFile = "./swagger-output.json";
const endpointsFiles = ["./app.js"];

swaggerAutogen(outputFile, endpointsFiles, doc);
