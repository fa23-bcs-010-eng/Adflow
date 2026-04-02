const cron = require('node-cron');
const { publishScheduledAds, expireAds, healthCheck } = require('../services/cron.service');

const startCronJobs = () => {
  // Publish scheduled ads – every hour
  cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Running: publishScheduledAds');
    try { await publishScheduledAds(); }
    catch (e) { console.error('[CRON] publishScheduledAds error:', e.message); }
  });

  // Expire ads – every hour
  cron.schedule('30 * * * *', async () => {
    console.log('[CRON] Running: expireAds');
    try { await expireAds(); }
    catch (e) { console.error('[CRON] expireAds error:', e.message); }
  });

  // Health check – every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    console.log('[CRON] Running: healthCheck');
    try { await healthCheck(); }
    catch (e) { console.error('[CRON] healthCheck error:', e.message); }
  });

  console.log('✅ Cron jobs started');
};

module.exports = { startCronJobs };
