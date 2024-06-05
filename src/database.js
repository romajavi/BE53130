const mongoose = require('mongoose');
const config = require('./config/config');

const uri = config.MONGODB_URI;

console.log('Intentando conectar a MongoDB con la URI:', uri);

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 60000, // 30 segundos
  socketTimeoutMS: 60000,          // 45 segundos
})
  .then(() => {
    console.log('Conexión exitosa a MongoDB Atlas');
  })
  .catch((error) => {
    console.error('Error al conectar a MongoDB Atlas:', error);
  });

const db = mongoose.connection;
db.on('error', (error) => console.error('Error de conexión MongoDB:', error));
db.on('disconnected', () => console.log('Se ha perdido la conexión a MongoDB'));
db.on('reconnected', () => console.log('Se ha restablecido la conexión a MongoDB'));
db.once('open', () => console.log('Conexión a MongoDB establecida'));

module.exports = mongoose;
