const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Get session memory
router.get('/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const userSessions = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/user-sessions.json'), 'utf8'));
    
    const session = userSessions.sessions[sessionId];
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      sessionId: sessionId,
      personalityProfile: session.personalityProfile || {},
      conversationHistory: session.conversationHistory || [],
      learningProgress: session.learningProgress || {},
      sessionStats: {
        messageCount: session.conversationHistory ? session.conversationHistory.length : 0,
        sessionStarted: session.startTime,
        lastActivity: session.lastActivity,
        totalRoasts: session.totalRoasts || 0,
        averageRating: session.averageRating || 0
      }
    });

  } catch (error) {
    console.error('Session memory error:', error);
    res.status(500).json({ error: 'Failed to get session memory' });
  }
});

// Learn new vocabulary from community
router.post('/learn', (req, res) => {
  try {
    const { word, context, userId, sessionId } = req.body;
    
    if (!word || !word.trim()) {
      return res.status(400).json({ error: 'Word is required' });
    }

    const learnedWords = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/learned-words.json'), 'utf8'));
    
    // Check if word already exists
    const existingWord = learnedWords.vocabulary.find(item => 
      item.word.toLowerCase() === word.toLowerCase()
    );

    if (existingWord) {
      existingWord.frequency += 1;
      existingWord.lastUsed = new Date().toISOString();
    } else {
      learnedWords.vocabulary.push({
        word: word.trim().toLowerCase(),
        context: context || '',
        learnedFrom: userId || 'anonymous',
        sessionId: sessionId || 'unknown',
        learnedAt: new Date().toISOString(),
        frequency: 1,
        lastUsed: new Date().toISOString(),
        approved: true // Auto-approve for now, could add moderation later
      });
    }

    learnedWords.lastUpdated = new Date().toISOString();
    
    // Save updated vocabulary
    fs.writeFileSync(
      path.join(__dirname, '../data/learned-words.json'), 
      JSON.stringify(learnedWords, null, 2)
    );

    res.json({
      success: true,
      message: `"${word}" has been added to my vocabulary. I'll use it to roast people more effectively.`,
      wordCount: learnedWords.vocabulary.length,
      isNewWord: !existingWord
    });

  } catch (error) {
    console.error('Learn vocabulary error:', error);
    res.status(500).json({ error: 'Failed to learn new vocabulary' });
  }
});

// Get learned vocabulary
router.get('/vocabulary', (req, res) => {
  try {
    const learnedWords = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/learned-words.json'), 'utf8'));
    
    // Sort by frequency and recency
    const sortedVocabulary = learnedWords.vocabulary
      .filter(word => word.approved)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 100); // Limit to top 100

    res.json({
      vocabulary: sortedVocabulary,
      totalWords: learnedWords.vocabulary.length,
      lastUpdated: learnedWords.lastUpdated,
      stats: {
        mostUsed: sortedVocabulary[0]?.word || 'none',
        recentlyAdded: learnedWords.vocabulary
          .sort((a, b) => new Date(b.learnedAt) - new Date(a.learnedAt))
          .slice(0, 5)
          .map(item => item.word)
      }
    });

  } catch (error) {
    console.error('Vocabulary error:', error);
    res.status(500).json({ error: 'Failed to get vocabulary' });
  }
});

// Update personality profile
router.post('/profile/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const { traits, vulnerabilities, triggers, updates } = req.body;
    
    const userSessions = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/user-sessions.json'), 'utf8'));
    
    if (!userSessions.sessions[sessionId]) {
      userSessions.sessions[sessionId] = {
        startTime: new Date().toISOString(),
        conversationHistory: [],
        personalityProfile: {}
      };
    }

    const session = userSessions.sessions[sessionId];
    
    // Update personality profile
    if (traits) session.personalityProfile.traits = { ...session.personalityProfile.traits, ...traits };
    if (vulnerabilities) session.personalityProfile.vulnerabilities = vulnerabilities;
    if (triggers) session.personalityProfile.triggers = triggers;
    if (updates) session.personalityProfile = { ...session.personalityProfile, ...updates };
    
    session.lastActivity = new Date().toISOString();
    
    // Save updated sessions
    fs.writeFileSync(
      path.join(__dirname, '../data/user-sessions.json'), 
      JSON.stringify(userSessions, null, 2)
    );

    res.json({
      success: true,
      message: 'Personality profile updated. I now know exactly how to destroy you.',
      updatedProfile: session.personalityProfile
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update personality profile' });
  }
});

// Get global memory stats
router.get('/stats', (req, res) => {
  try {
    const userSessions = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/user-sessions.json'), 'utf8'));
    const learnedWords = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/learned-words.json'), 'utf8'));
    const globalState = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/global-state.json'), 'utf8'));
    
    const sessionCount = Object.keys(userSessions.sessions).length;
    const totalMessages = Object.values(userSessions.sessions)
      .reduce((total, session) => total + (session.conversationHistory?.length || 0), 0);
    
    res.json({
      totalSessions: sessionCount,
      totalMessages: totalMessages,
      vocabularySize: learnedWords.vocabulary.length,
      totalInteractions: globalState.totalInteractions,
      averageSessionLength: totalMessages / Math.max(sessionCount, 1),
      memoryStats: {
        oldestSession: Math.min(...Object.values(userSessions.sessions).map(s => new Date(s.startTime).getTime())),
        newestSession: Math.max(...Object.values(userSessions.sessions).map(s => new Date(s.startTime).getTime())),
        mostActiveSession: Object.entries(userSessions.sessions)
          .sort(([,a], [,b]) => (b.conversationHistory?.length || 0) - (a.conversationHistory?.length || 0))[0]?.[0] || null
      }
    });

  } catch (error) {
    console.error('Memory stats error:', error);
    res.status(500).json({ error: 'Failed to get memory stats' });
  }
});

module.exports = router;