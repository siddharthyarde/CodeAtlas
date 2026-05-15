/**
 * Send a standardised success response.
 * @param {import('express').Response} res
 * @param {*} data
 * @param {number} [status=200]
 */
function sendSuccess(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

/**
 * Send a standardised error response.
 * @param {import('express').Response} res
 * @param {string} error
 * @param {number} [status=400]
 */
function sendError(res, error, status = 400) {
  return res.status(status).json({ success: false, error });
}

module.exports = { sendSuccess, sendError };
