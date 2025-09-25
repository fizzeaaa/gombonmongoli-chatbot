// Health check endpoint for UptimeRobot
app.get('/ping', (req, res) => {
  res.status(200).json({ 
    status: 'alive', 
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime())
  });
});

// Keep-alive endpoint
app.get('/keep-alive', (req, res) => {
  console.log('🔄 Keep-alive ping received');
  res.status(200).send('OK');
});