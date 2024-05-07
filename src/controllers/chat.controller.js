const Product = require('../models/product');

const sendMessage = async (data) => {
  try {
    const message = {
      user: data.user,
      message: data.message,
      timestamp: new Date(),
    };
    await client.db().collection('messages').insertOne(message);
    console.log('Mensaje guardado en la base de datos');
  } catch (error) {
    console.error('Error al guardar el mensaje en la base de datos:', error);
  }
};

module.exports = {
  sendMessage,
};