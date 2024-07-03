const logger = require('../utils/logger');


class CustomError extends Error {
    constructor(message, statusCode, details = {}) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
    }
}

function errorHandler(err, req, res, next) {
    logger.error(err);

    if (err instanceof CustomError) {
        return res.status(err.statusCode).json({
            error: err.message,
            details: err.details
        });
    }

    res.status(500).json({
        error: 'Internal Server Error'
    });
}

module.exports = { CustomError, errorHandler };