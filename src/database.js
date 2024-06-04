const mongoose = require('mongoose');
const config = require('./config/config');

const uri = config.MONGODB_URI;

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('Conexión exitosa a MongoDB Atlas');
  })
  .catch((error) => {
    console.error('Error al conectar a MongoDB Atlas:', error);
  });

module.exports = mongoose;
