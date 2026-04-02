// Create this file at: api/cron-webhook.js
// This allows external cron services to trigger your scheduled tasks

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Verify secret key
  const secret = req.headers['x-cron-secret'] || req.query.secret;
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    // Import and run your cron jobs
    const { startCronJobs } = require('../server/src/cron/scheduler');
    
    // Run jobs once
    await startCronJobs();
    
    res.json({ 
      success: true, 
      message: 'Cron jobs executed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cron execution error:', error);
    res.status(500).json({ 
      error: 'Failed to execute cron jobs',
      details: error.message 
    });
  }
};