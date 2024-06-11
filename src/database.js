const mongoose = require('mongoose');
const config = require('./config/config');

const uri = config.MONGODB_URI;

console.log('Intentando conectar a MongoDB con la URI:', uri);

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000, 
  socketTimeoutMS: 30000,          
})
  .then(() => {
    console.log('Conexión exitosa a MongoDB Atlas');
  })
  .catch((error) => {
    console.error('Error al conectar a MongoDB Atlas:', error);
    process.exit(1);
  });

const db = mongoose.connection;
db.on('error', (error) => {
  console.error('Error de conexión MongoDB:', error);
  process.exit(1);  // Agregamos esto
});
db.on('disconnected', () => console.log('Se ha perdido la conexión a MongoDB'));
db.on('reconnected', () => console.log('Se ha restablecido la conexión a MongoDB'));
db.once('open', () => console.log('Conexión a MongoDB establecida'));

module.exports = db;
