const mongoose = require('mongoose');

const uri = "mongodb+srv://admin:1234@cluster0.rcj2pgu.mongodb.net/test?retryWrites=true&w=majority";

mongoose.connect(uri)
  .then(() => {
    console.log('Conexión exitosa a MongoDB Atlas');
  })
  .catch((error) => {
    console.error('Error al conectar a MongoDB Atlas:', error);
  });

module.exports = mongoose;