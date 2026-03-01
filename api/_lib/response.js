/**
 * 통일된 API 응답 헬퍼
 */
function success(res, data, meta) {
  return res.status(200).json({
    success: true,
    data: data,
    error: null,
    meta: meta || null
  });
}

function error(res, message, statusCode) {
  return res.status(statusCode || 500).json({
    success: false,
    data: null,
    error: message,
    meta: null
  });
}

function notAllowed(res) {
  return error(res, 'Method not allowed', 405);
}

module.exports = { success, error, notAllowed };
