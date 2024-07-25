const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUiExpress = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'PetXpress API',
            version: '1.0.0',
            description: 'Documentación de la API de PetXpress e-commerce',
        },
    },
    apis: ['./src/docs/**/*.yaml'], //ruta donde busca archivos yaml para la documentacuón. 
};

const swaggerSpecs = swaggerJsdoc(options);

module.exports = {
    serve: swaggerUiExpress.serve,
    setup: swaggerUiExpress.setup(swaggerSpecs),
};