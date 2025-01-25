import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EyeNet API Documentation',
      version: '1.0.0',
      description: 'API documentation for the EyeNet Network Monitoring System',
      contact: {
        name: 'EyeNet Support',
        email: 'support@eyenet.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: [
    './src/routes/*.ts',
    './src/models/*.ts',
    './src/controllers/*.ts'
  ]
};

export const swaggerSpec = swaggerJsdoc(options);
