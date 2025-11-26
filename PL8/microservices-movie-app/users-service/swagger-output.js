const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'User Service API',
    description: 'API com autenticação JWT e autorização por papel',
  },
  host: 'localhost:3003',
  schemes: ['http'],
  securityDefinitions: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    }
  },
  security: [{ bearerAuth: [] }]
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./index.js']; // ou o nome do teu ficheiro principal

swaggerAutogen(outputFile, endpointsFiles, doc);