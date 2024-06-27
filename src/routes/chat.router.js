const express = require('express');
const router = express.Router();
const Message = require('../models/message.model');
const { isUser } = require('../middlewares/auth.middleware');

// GET para renderizar la pág de chat
router.get('/', isUser, async (req, res) => {
  try {
    const messages = await Message.find().populate('user', 'first_name').lean();
    console.log('Usuario actual:', req.user); // dep
    res.render('chat', { messages, user: req.user });
  } catch (error) {
    console.error('Error al obtener los mensajes:', error);
    res.render('chat', { messages: [], user: req.user });
  }
});

module.exports = router;