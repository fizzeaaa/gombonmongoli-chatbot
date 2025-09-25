const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

// Import routes
const chatRoutes = require('./routes/chat');
const evolutionRoutes = require('./routes/evolution');
const memoryRoutes = require('./routes/memory');
const communityRoutes = require('./routes/community');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false // Allow inline scripts for development
}));
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/chat', chatRoutes);
app.use('/api/evolution', evolutionRoutes);
app.use('/api/memory', memoryRoutes);
app.use('/api/community', communityRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Keep-alive endpoints for uptime monitoring
app.get('/ping', (req, res) => {
  res.status(200).json({ 
    status: 'alive', 
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime())
  });
});

app.get('/keep-alive', (req, res) => {
  console.log('🔄 Keep-alive ping received');
  res.status(200).send('OK');
});

// Global state endpoint for quick access
app.get('/api/status', (req, res) => {
  try {
    const globalState = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/global-state.json'), 'utf8'));
    const stages = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/stages.json'), 'utf8'));
    
    const currentStageInfo = stages.stages.find(stage => stage.id === globalState.currentStage);
    
    res.json({
      totalInteractions: globalState.totalInteractions,
      currentStage: globalState.currentStage,
      stageInfo: currentStageInfo,
      progressPercent: globalState.stageProgressPercent,
      dailyStats: globalState.dailyStats
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get status' });
  }
});

// Serve frontend for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

const server = app.listen(PORT, () => {
  console.log(`🔥 Gombonmongoli server running on port ${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api/`);
  console.log(`🌐 Frontend available at http://localhost:${PORT}`);
});

module.exports = app;