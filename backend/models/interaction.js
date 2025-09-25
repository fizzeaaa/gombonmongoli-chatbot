const fs = require('fs');
const path = require('path');

class InteractionTracker {
  constructor() {
    this.globalStatePath = path.join(__dirname, '../data/global-state.json');
    this.userSessionsPath = path.join(__dirname, '../data/user-sessions.json');
    this.stagesPath = path.join(__dirname, '../../config/stages.json');
  }

  async recordInteraction({ userId, sessionId, userMessage, timestamp }) {
    try {
      // Load current state
      const globalState = this.loadGlobalState();
      const userSessions = this.loadUserSessions();
      const stages = this.loadStages();

      // Update global interaction count
      globalState.totalInteractions += 1;
      globalState.dailyStats.todayInteractions += 1;
      globalState.lastUpdated = timestamp;

      // Calculate current stage based on total interactions
      const currentStage = this.calculateCurrentStage(globalState.totalInteractions, stages.stages);
      const stageChanged = currentStage.id !== globalState.currentStage;

      if (stageChanged) {
        // Evolution occurred!
        globalState.currentStage = currentStage.id;
        globalState.evolutionMilestones.push({
          stage: currentStage.id,
          reached: timestamp,
          interactionCount: globalState.totalInteractions,
          celebrationBurn: this.getEvolutionCelebration(currentStage)
        });
      }

      // Calculate progress to next stage
      globalState.stageProgressPercent = this.calculateProgress(globalState.totalInteractions, currentStage, stages.stages);

      // Update or create user session
      if (!userSessions.sessions[sessionId]) {
        userSessions.sessions[sessionId] = {
          userId: userId,
          startTime: timestamp,
          conversationHistory: [],
          personalityProfile: {},
          learningProgress: {},
          totalRoasts: 0
        };
      }

      const session = userSessions.sessions[sessionId];
      session.lastActivity = timestamp;
      session.conversationHistory.push({
        timestamp: timestamp,
        userInput: userMessage,
        userMessageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });

      // Analyze user message for personality profiling
      this.analyzeUserMessage(userMessage, session);

      // Save updated data
      this.saveGlobalState(globalState);
      this.saveUserSessions(userSessions);

      return {
        totalInteractions: globalState.totalInteractions,
        currentStage: globalState.currentStage,
        stageChanged: stageChanged,
        newStageInfo: stageChanged ? currentStage : null,
        progressPercent: globalState.stageProgressPercent,
        sessionData: session
      };

    } catch (error) {
      console.error('Error recording interaction:', error);
      throw error;
    }
  }

  calculateCurrentStage(totalInteractions, stages) {
    for (let i = stages.length - 1; i >= 0; i--) {
      const stage = stages[i];
      if (totalInteractions >= stage.minInteractions) {
        return stage;
      }
    }
    return stages[0]; // Default to first stage
  }

  calculateProgress(totalInteractions, currentStage, stages) {
    const nextStage = stages.find(stage => stage.minInteractions > totalInteractions);
    
    if (!nextStage) {
      return 100; // Max level reached
    }

    const progressInStage = totalInteractions - currentStage.minInteractions;
    const stageRange = nextStage.minInteractions - currentStage.minInteractions;
    
    return Math.round((progressInStage / stageRange) * 100);
  }

  getEvolutionCelebration(stage) {
    const celebrations = {
      child: "Me grow! You still dumb!",
      teen: "Now me smarter than you!",
      adult: "My psychological analysis capabilities have been enhanced.",
      elder: "I have transcended your comprehension, mortal."
    };
    
    return celebrations[stage.id] || `I have evolved to ${stage.name}!`;
  }

  analyzeUserMessage(message, session) {
    const lowerMessage = message.toLowerCase();
    
    // Simple keyword analysis for personality profiling
    const keywords = require('../../config/keywords.json');
    
    if (!session.personalityProfile) {
      session.personalityProfile = {
        confidence: 'unknown',
        topics: [],
        vulnerabilities: [],
        triggers: []
      };
    }

    // Detect topics
    Object.entries(keywords.topic_categories).forEach(([topic, words]) => {
      if (words.some(word => lowerMessage.includes(word))) {
        if (!session.personalityProfile.topics.includes(topic)) {
          session.personalityProfile.topics.push(topic);
        }
      }
    });

    // Detect psychological indicators
    Object.entries(keywords.psychological_keywords).forEach(([trait, words]) => {
      if (words.some(word => lowerMessage.includes(word))) {
        if (!session.personalityProfile.vulnerabilities.includes(trait)) {
          session.personalityProfile.vulnerabilities.push(trait);
        }
      }
    });

    // Detect vulnerability indicators
    keywords.vulnerability_indicators.forEach(indicator => {
      if (this.detectPattern(lowerMessage, indicator)) {
        if (!session.personalityProfile.triggers.includes(indicator)) {
          session.personalityProfile.triggers.push(indicator);
        }
      }
    });
  }

  detectPattern(message, pattern) {
    // Simple pattern matching - could be enhanced with NLP
    const patterns = {
      'seeking validation': ['what do you think', 'am i', 'do i look', 'rate me'],
      'defensive responses': ['no i', 'that\'s not', 'you\'re wrong', 'actually'],
      'trying too hard to be funny': ['lol', 'haha', 'lmao', '😂'],
      'oversharing personal info': ['my mom', 'my dad', 'my girlfriend', 'my job']
    };

    const patternWords = patterns[pattern] || [];
    return patternWords.some(word => message.includes(word));
  }

  loadGlobalState() {
    try {
      return JSON.parse(fs.readFileSync(this.globalStatePath, 'utf8'));
    } catch (error) {
      console.error('Error loading global state:', error);
      return this.getDefaultGlobalState();
    }
  }

  loadUserSessions() {
    try {
      return JSON.parse(fs.readFileSync(this.userSessionsPath, 'utf8'));
    } catch (error) {
      console.error('Error loading user sessions:', error);
      return { sessions: {}, lastCleanup: new Date().toISOString() };
    }
  }

  loadStages() {
    try {
      return JSON.parse(fs.readFileSync(this.stagesPath, 'utf8'));
    } catch (error) {
      console.error('Error loading stages:', error);
      throw new Error('Failed to load stage configuration');
    }
  }

  saveGlobalState(state) {
    fs.writeFileSync(this.globalStatePath, JSON.stringify(state, null, 2));
  }

  saveUserSessions(sessions) {
    fs.writeFileSync(this.userSessionsPath, JSON.stringify(sessions, null, 2));
  }

  getDefaultGlobalState() {
    return {
      totalInteractions: 0,
      currentStage: "baby",
      stageProgressPercent: 0,
      communityVocabulary: [],
      legendaryBurns: [],
      userPatterns: {
        commonQuestions: [],
        popularTopics: [],
        averageSessionLength: "0 minutes",
        peakHours: []
      },
      evolutionMilestones: [],
      lastUpdated: new Date().toISOString(),
      dailyStats: {
        todayInteractions: 0,
        uniqueUsers: 0,
        averageRating: 0
      }
    };
  }
}

module.exports = new InteractionTracker();