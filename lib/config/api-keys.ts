export const apiKeys = {
  polygon: 'mTmTNRmv236VbU8ijndr1F5EOJz8NR3s' // PAID $79 PLAN KEY ONLY
};

// Validate API keys are available
const validateApiKeys = () => {
  if (!apiKeys.polygon) {
    throw new Error('Polygon.io API key is required');
  }
  
  console.log('✅ API keys validated');
  return true;
};

// Get API key securely
const getPolygonKey = () => {
  validateApiKeys();
  return apiKeys.polygon;
};

export { getPolygonKey }; 