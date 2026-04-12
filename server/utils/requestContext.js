const getRequestContext = (req) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  const ipAddress = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : typeof forwardedFor === 'string'
      ? forwardedFor.split(',')[0].trim()
      : req.ip || req.socket?.remoteAddress || null;

  return {
    ipAddress: ipAddress ? String(ipAddress).slice(0, 45) : null,
    userAgent: req.get('user-agent') || 'unknown',
  };
};

module.exports = {
  getRequestContext,
};
