const Ticket = require('../models/ticket');

const createTicket = async (ticketData) => {
    const { amount, purchaser } = ticketData;

    const code = generateUniqueCode();

    const ticket = new Ticket({
        code,
        amount,
        purchaser,
    });

    await ticket.save();

    return ticket;
};

const generateUniqueCode = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 7);
    return `TICKET-${timestamp}-${randomStr}`;
};

module.exports = {
    createTicket,
};