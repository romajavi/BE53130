const mongoose = require('mongoose');
const config = require('./config/config');
const logger = require('./utils/logger');

const uri = config.MONGODB_URI;

logger.info('Intentando conectar a MongoDB con la URI:', uri);

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  connectTimeoutMS: 30000, 
  socketTimeoutMS: 30000,          
})
  .then(() => {
    logger.info('Conexión exitosa a MongoDB Atlas');
  })
  .catch((error) => {
    logger.error('Error al conectar a MongoDB Atlas:', error);
    process.exit(1);
  });

const db = mongoose.connection;
db.on('error', (error) => {
  logger.error('Error de conexión MongoDB:', error);
  process.exit(1);  // Agregamos esto
});
db.on('disconnected', () => console.log('Se ha perdido la conexión a MongoDB'));
db.on('reconnected', () => console.log('Se ha restablecido la conexión a MongoDB'));
db.once('open', () => console.log('Conexión a MongoDB establecida'));

module.exports = db;
