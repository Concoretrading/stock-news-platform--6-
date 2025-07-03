exports.testFunction = (req, res) => {
  res.json({
    success: true,
    message: 'Test function is working!',
    timestamp: new Date().toISOString()
  });
}; 