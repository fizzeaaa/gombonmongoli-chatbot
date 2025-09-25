const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Get hall of fame burns
router.get('/burns', (req, res) => {
  try {
    const { limit = 20, category = 'all' } = req.query;
    const legendaryBurns = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/legendary-burns.json'), 'utf8'));
    
    let burns = legendaryBurns.burns || [];
    
    // Filter by category if specified
    if (category !== 'all') {
      burns = burns.filter(burn => burn.category === category);
    }
    
    // Sort by rating and limit results
    burns = burns
      .sort((a, b) => b.rating - a.rating)
      .slice(0, parseInt(limit));

    res.json({
      burns: burns,
      categories: ['savage', 'clever', 'psychological', 'philosophical', 'legendary'],
      hallOfFame: legendaryBurns.hallOfFame || [],
      stats: {
        totalBurns: legendaryBurns.burns?.length || 0,
        averageRating: burns.reduce((sum, burn) => sum + burn.rating, 0) / Math.max(burns.length, 1),
        topRated: burns[0] || null
      }
    });

  } catch (error) {
    console.error('Burns error:', error);
    res.status(500).json({ error: 'Failed to get community burns' });
  }
});

// Submit a burn for community rating
router.post('/burns', (req, res) => {
  try {
    const { text, category, stage, sessionId, context } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Burn text is required' });
    }

    const legendaryBurns = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/legendary-burns.json'), 'utf8'));
    
    const newBurn = {
      id: `burn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: text.trim(),
      category: category || 'general',
      stage: stage || 'unknown',
      sessionId: sessionId || 'anonymous',
      context: context || '',
      rating: 0,
      votes: 0,
      createdAt: new Date().toISOString(),
      approved: true // Auto-approve for now
    };

    if (!legendaryBurns.burns) legendaryBurns.burns = [];
    legendaryBurns.burns.push(newBurn);
    
    // Save updated burns
    fs.writeFileSync(
      path.join(__dirname, '../data/legendary-burns.json'), 
      JSON.stringify(legendaryBurns, null, 2)
    );

    res.json({
      success: true,
      message: 'Your burn has been submitted to the community for judgment.',
      burnId: newBurn.id,
      burn: newBurn
    });

  } catch (error) {
    console.error('Submit burn error:', error);
    res.status(500).json({ error: 'Failed to submit burn' });
  }
});

// Rate a community burn
router.post('/burns/:burnId/rate', (req, res) => {
  try {
    const { burnId } = req.params;
    const { rating, userId } = req.body;
    
    if (!rating || rating < 1 || rating > 10) {
      return res.status(400).json({ error: 'Rating must be between 1 and 10' });
    }

    const legendaryBurns = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/legendary-burns.json'), 'utf8'));
    
    const burn = legendaryBurns.burns?.find(b => b.id === burnId);
    if (!burn) {
      return res.status(404).json({ error: 'Burn not found' });
    }

    // Simple rating system (could be enhanced with user tracking to prevent duplicate votes)
    const newRating = ((burn.rating * burn.votes) + parseInt(rating)) / (burn.votes + 1);
    burn.rating = Math.round(newRating * 10) / 10;
    burn.votes += 1;
    burn.lastRated = new Date().toISOString();

    // Check if it qualifies for hall of fame (rating > 8.5 and at least 5 votes)
    if (burn.rating > 8.5 && burn.votes >= 5) {
      if (!legendaryBurns.hallOfFame) legendaryBurns.hallOfFame = [];
      
      const alreadyInHallOfFame = legendaryBurns.hallOfFame.find(hof => hof.id === burnId);
      if (!alreadyInHallOfFame) {
        legendaryBurns.hallOfFame.push({
          ...burn,
          inductedAt: new Date().toISOString()
        });
      }
    }
    
    // Save updated burns
    fs.writeFileSync(
      path.join(__dirname, '../data/legendary-burns.json'), 
      JSON.stringify(legendaryBurns, null, 2)
    );

    res.json({
      success: true,
      message: rating > 7 ? 'Excellent taste in burns!' : 'Your standards are questionable, but noted.',
      newRating: burn.rating,
      totalVotes: burn.votes,
      hallOfFameWorthy: burn.rating > 8.5 && burn.votes >= 5
    });

  } catch (error) {
    console.error('Rate burn error:', error);
    res.status(500).json({ error: 'Failed to rate burn' });
  }
});

// Get community statistics
router.get('/stats', (req, res) => {
  try {
    const globalState = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/global-state.json'), 'utf8'));
    const legendaryBurns = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/legendary-burns.json'), 'utf8'));
    const userSessions = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/user-sessions.json'), 'utf8'));
    const learnedWords = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/learned-words.json'), 'utf8'));

    const totalSessions = Object.keys(userSessions.sessions).length;
    const totalBurns = legendaryBurns.burns?.length || 0;
    const hallOfFameCount = legendaryBurns.hallOfFame?.length || 0;

    res.json({
      community: {
        totalInteractions: globalState.totalInteractions,
        totalSessions: totalSessions,
        currentStage: globalState.currentStage,
        vocabularySize: learnedWords.vocabulary?.length || 0
      },
      burns: {
        total: totalBurns,
        hallOfFame: hallOfFameCount,
        averageRating: totalBurns > 0 ? 
          legendaryBurns.burns.reduce((sum, burn) => sum + burn.rating, 0) / totalBurns : 0,
        topRated: legendaryBurns.burns?.sort((a, b) => b.rating - a.rating)[0] || null
      },
      milestones: globalState.evolutionMilestones || [],
      activity: {
        dailyInteractions: globalState.dailyStats?.todayInteractions || 0,
        peakHours: globalState.userPatterns?.peakHours || [],
        popularTopics: globalState.userPatterns?.popularTopics || []
      }
    });

  } catch (error) {
    console.error('Community stats error:', error);
    res.status(500).json({ error: 'Failed to get community stats' });
  }
});

// Community events (placeholder for future features)
router.get('/events', (req, res) => {
  res.json({
    activeEvents: [],
    upcomingEvents: [
      {
        id: 'chaos_mode',
        name: 'Community Chaos Mode',
        description: 'Vote to temporarily revert Gombonmongoli to baby stage',
        type: 'voting',
        status: 'planned'
      },
      {
        id: 'burn_battle',
        name: 'Ultimate Burn Battle',
        description: 'Community vs Gombonmongoli roast competition',
        type: 'competition',
        status: 'planned'
      }
    ],
    pastEvents: []
  });
});

module.exports = router;