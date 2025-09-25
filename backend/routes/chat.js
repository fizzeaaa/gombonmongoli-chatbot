const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const responseGenerator = require('../models/response');
const interactionTracker = require('../models/interaction');

// Main chat endpoint
router.post('/', async (req, res) => {
  try {
    const { message, userId, sessionId } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Generate or use provided session ID
    const currentSessionId = sessionId || uuidv4();
    const currentUserId = userId || `user_${Date.now()}`;

    // Track the interaction
    const interactionData = await interactionTracker.recordInteraction({
      userId: currentUserId,
      sessionId: currentSessionId,
      userMessage: message.trim(),
      timestamp: new Date().toISOString()
    });

    // Generate response based on current stage
    const response = await responseGenerator.generateResponse({
      userMessage: message.trim(),
      userId: currentUserId,
      sessionId: currentSessionId,
      stage: interactionData.currentStage,
      totalInteractions: interactionData.totalInteractions
    });

    res.json({
      response: response.text,
      stage: response.stage,
      stageInfo: response.stageInfo,
      sessionId: currentSessionId,
      totalInteractions: interactionData.totalInteractions,
      progressPercent: response.progressPercent,
      features: response.features,
      metadata: {
        responseType: response.type,
        trigger: response.trigger,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: 'Failed to generate response',
      fallback: "Even my error messages are more intelligent than your input."
    });
  }
});

// Get conversation history
router.get('/history/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const userSessions = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/user-sessions.json'), 'utf8'));
    
    const session = userSessions.sessions[sessionId];
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      conversationHistory: session.conversationHistory || [],
      personalityProfile: session.personalityProfile || {},
      sessionStats: {
        messageCount: session.conversationHistory ? session.conversationHistory.length : 0,
        sessionStarted: session.startTime,
        lastActivity: session.lastActivity
      }
    });

  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Failed to get conversation history' });
  }
});

// Rate a response
router.post('/rate', (req, res) => {
  try {
    const { sessionId, messageId, rating, feedback } = req.body;
    
    if (!sessionId || !messageId || rating === undefined) {
      return res.status(400).json({ error: 'Session ID, message ID, and rating are required' });
    }

    // Store rating for analytics
    const ratingData = {
      sessionId,
      messageId,
      rating: parseInt(rating),
      feedback: feedback || '',
      timestamp: new Date().toISOString()
    };

    // Here you would store the rating in your database
    // For now, we'll just acknowledge it
    console.log('Rating received:', ratingData);

    res.json({ 
      success: true, 
      message: rating > 7 ? "Thanks for the feedback!" : "Noted. I'll try to be more devastating next time."
    });

  } catch (error) {
    console.error('Rating error:', error);
    res.status(500).json({ error: 'Failed to save rating' });
  }
});

module.exports = router;