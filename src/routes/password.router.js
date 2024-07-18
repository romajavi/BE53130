const express = require('express');
const router = express.Router();
const { requestPasswordReset, resetPassword, renderResetPasswordForm } = require('../controllers/password.controller');

router.get('/forgot-password', (req, res) => {
    res.render('forgot-password');
});

router.post('/forgot-password', requestPasswordReset);

router.get('/reset-password/:token', renderResetPasswordForm);

router.post('/reset-password/:token', resetPassword);

module.exports = router;