const crypto = require('crypto');
const QRCode = require('qrcode');

/**
 * Generates a unique ticket id and a data URL PNG for the QR code.
 * Payload encodes ticketId and eventId for scanning/verification.
 */
async function buildQrForBooking(bookingId, eventId, ticketId) {
  const payload = JSON.stringify({
    t: ticketId,
    e: eventId.toString(),
    b: bookingId.toString(),
  });
  const dataUrl = await QRCode.toDataURL(payload, { width: 256, margin: 2 });
  return dataUrl;
}

function newTicketId() {
  return crypto.randomBytes(16).toString('hex');
}

module.exports = { buildQrForBooking, newTicketId };
