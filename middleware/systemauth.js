const systemAuthMiddleware = (req, res, next) => {
    // Get system API key from request headers
    const systemApiKey = req.headers['x-system-api-key'];
    
    // Check API key against environment variable or config
    const validApiKey = process.env.SYSTEM_API_KEY || 'whythisprojectsohard';
    
    if (!systemApiKey || systemApiKey !== validApiKey) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: System-level authentication required'
      });
    }
    
    // Authentication successful
    next();
};
  
module.exports = systemAuthMiddleware;