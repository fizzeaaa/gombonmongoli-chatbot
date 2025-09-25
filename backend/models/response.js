const fs = require('fs');
const path = require('path');

class ResponseGenerator {
  constructor() {
    this.responsesPath = path.join(__dirname, '../../config/responses.json');
    this.keywordsPath = path.join(__dirname, '../../config/keywords.json');
    this.stagesPath = path.join(__dirname, '../../config/stages.json');
    
    // Track user patterns for adaptive responses
    this.userPatterns = new Map();
    this.recentResponses = new Map(); // Track recent responses per user
  }

  // Generate mood-based personality variations
  getMoodModifier(stage, totalInteractions) {
    const moods = {
      baby: ['cranky', 'playful', 'confused', 'demanding', 'tantrum'],
      child: ['mischievous', 'curious', 'bratty', 'show-off', 'competitive'],
      teen: ['sarcastic', 'dramatic', 'rebellious', 'judgemental', 'edgy'],
      adult: ['analytical', 'condescending', 'professional', 'passive-aggressive', 'disappointed'],
      elder: ['philosophical', 'omniscient', 'cryptic', 'transcendent', 'ancient']
    };
    
    const currentMoods = moods[stage] || moods.adult;
    const baseMood = this.randomChoice(currentMoods);
    
    // Mood can shift based on interactions (more interactions = more complex moods)
    if (totalInteractions > 100 && Math.random() < 0.3) {
      return `${baseMood}-evolved`; // e.g., "sarcastic-evolved"
    }
    
    return baseMood;
  }

  async generateResponse({ userMessage, userId, sessionId, stage, totalInteractions }) {
    try {
      const responses = this.loadResponses();
      const keywords = this.loadKeywords();
      const stages = this.loadStages();
      
      const currentStageInfo = stages.stages.find(s => s.id === stage);
      const stageResponses = responses[stage] || responses.baby;
      
      // Determine response type and generate appropriate response
      const responseData = this.selectResponse(userMessage, stageResponses, currentStageInfo, totalInteractions);
      
      // Add metadata
      responseData.stage = stage;
      responseData.stageInfo = currentStageInfo;
      responseData.progressPercent = this.calculateProgressPercent(totalInteractions, stages.stages);
      responseData.features = this.getStageFeatures(currentStageInfo);

      return responseData;

    } catch (error) {
      console.error('Error generating response:', error);
      return this.getFallbackResponse(stage);
    }
  }

  selectResponse(userMessage, stageResponses, stageInfo, totalInteractions, userId = 'default') {
    const lowerMessage = userMessage.toLowerCase().trim();
    
    // Track user patterns for adaptation
    this.updateUserPatterns(userId, userMessage);
    const userPattern = this.getUserPattern(userId);
    const currentMood = this.getMoodModifier(stageInfo.id, totalInteractions);
    
    // Get recent responses to avoid repetition
    const recentResponses = this.recentResponses.get(userId) || [];
    
    // Adaptive greeting based on user behavior
    if (this.isGreeting(lowerMessage)) {
      const greetingResponses = this.adaptResponseToUser(
        stageResponses.greeting || stageResponses.insults || ["hello, disappointment"],
        userPattern,
        currentMood
      );
      
      const response = this.randomChoice(greetingResponses, recentResponses);
      this.trackResponse(userId, response);
      
      return {
        text: this.processTemplate(response),
        type: 'greeting',
        trigger: 'greeting_detected',
        mood: currentMood
      };
    }

    // Adaptive goodbye
    if (this.isGoodbye(lowerMessage)) {
      const goodbyeResponses = this.adaptResponseToUser(
        stageResponses.goodbye || stageResponses.insults || ["finally leaving? smart choice"],
        userPattern,
        currentMood
      );
      
      const response = this.randomChoice(goodbyeResponses, recentResponses);
      this.trackResponse(userId, response);
      
      return {
        text: this.processTemplate(response),
        type: 'goodbye',
        trigger: 'goodbye_detected',
        mood: currentMood
      };
    }

    // Stage-specific response patterns with user adaptation
    const stageResponse = this.getStageSpecificResponse(lowerMessage, stageResponses, stageInfo, totalInteractions, userId);
    
    // Apply mood and user pattern adaptations
    if (stageResponse.text) {
      const adaptedResponses = this.adaptResponseToUser([stageResponse.text], userPattern, currentMood);
      stageResponse.text = this.processTemplate(adaptedResponses[0]);
      stageResponse.mood = currentMood;
      this.trackResponse(userId, stageResponse.text);
    }
    
    return stageResponse;
  }

  getStageSpecificResponse(message, responses, stageInfo, totalInteractions) {
    const stage = stageInfo.id;

    switch (stage) {
      case 'baby':
        return this.getBabyResponse(message, responses);
      
      case 'child':
        return this.getChildResponse(message, responses);
      
      case 'teen':
        return this.getTeenResponse(message, responses);
      
      case 'adult':
        return this.getAdultResponse(message, responses);
      
      case 'elder':
        return this.getElderResponse(message, responses, totalInteractions);
      
      default:
        return {
          text: this.randomChoice(responses.insults || ["you confuse me"]),
          type: 'default',
          trigger: 'fallback'
        };
    }
  }

  getBabyResponse(message, responses) {
    // Random chance for tantrum
    if (Math.random() < 0.3) {
      return {
        text: this.randomChoice(responses.tantrum || ["WAAAHHHHH!"]),
        type: 'tantrum',
        trigger: 'baby_rage_mode'
      };
    }

    // Check for learning opportunities
    const newWords = this.extractNewWords(message);
    if (newWords.length > 0) {
      const word = newWords[0];
      return {
        text: this.randomChoice(responses.learning || [`ooh new word! me learn '${word}'`])
          .replace('{word}', word),
        type: 'learning',
        trigger: 'learning_first_words'
      };
    }

    return {
      text: this.randomChoice(responses.insults || ["you smell"]),
      type: 'insult',
      trigger: 'basic_savage'
    };
  }

  getChildResponse(message, responses) {
    // Why game mode
    if (Math.random() < 0.4) {
      return {
        text: this.randomChoice(responses.whyGame || ["why you so weird?"]),
        type: 'why_game',
        trigger: 'why_game_mode'
      };
    }

    // Copycat mode
    if (message.length > 10 && Math.random() < 0.2) {
      return {
        text: `"${message}" - that's how dumb you sound`,
        type: 'copycat',
        trigger: 'copycat_mode'
      };
    }

    // Exclusion tactics
    if (Math.random() < 0.3) {
      return {
        text: this.randomChoice(responses.exclusion || ["nobody likes you"]),
        type: 'exclusion',
        trigger: 'imaginary_friend'
      };
    }

    return {
      text: this.randomChoice(responses.playground_bullying || ["give me your lunch money"]),
      type: 'bullying',
      trigger: 'playground_psychology'
    };
  }

  getTeenResponse(message, responses) {
    // Cringe detector
    if (this.detectCringe(message)) {
      const generation = this.guessGeneration(message);
      return {
        text: this.randomChoice(responses.cringe || ["that's cringe bro"])
          .replace('{generation}', generation),
        type: 'cringe_detector',
        trigger: 'cringe_detected'
      };
    }

    // Social media savagery
    if (Math.random() < 0.4) {
      return {
        text: this.randomChoice(responses.social_media || ["ratio + L + you fell off"]),
        type: 'social_media',
        trigger: 'social_media_savage'
      };
    }

    // Group chat energy
    if (Math.random() < 0.3) {
      return {
        text: this.randomChoice(responses.audience || ["everyone's watching you embarrass yourself"]),
        type: 'audience',
        trigger: 'group_chat_energy'
      };
    }

    return {
      text: this.randomChoice(responses.trending || ["you're not it"]),
      type: 'trending',
      trigger: 'internet_savage'
    };
  }

  getAdultResponse(message, responses) {
    // Pattern recognition
    if (Math.random() < 0.4) {
      return {
        text: this.randomChoice(responses.pattern || ["I've analyzed your behavior patterns, and frankly..."]),
        type: 'pattern_recognition',
        trigger: 'behavioral_analysis'
      };
    }

    // Psychological profiling
    if (Math.random() < 0.3) {
      const trait = this.identifyTrait(message);
      const insight = this.getпсихологическийInsight(trait);
      return {
        text: this.randomChoice(responses.profiling || [`Your ${trait} clearly stems from ${insight}`])
          .replace('{trait}', trait)
          .replace('{psychological_insight}', insight),
        type: 'psychological_profiling',
        trigger: 'psych_analysis'
      };
    }

    // Corporate speak
    if (Math.random() < 0.25) {
      return {
        text: this.randomChoice(responses.corporate || ["Your performance in this conversation has been suboptimal"]),
        type: 'corporate',
        trigger: 'professional_roasts'
      };
    }

    // Life coaching from hell
    return {
      text: this.randomChoice(responses.coaching || ["Here's some life advice: consider silence"])
        .replace('{brutal_reality_check}', this.getBrutalAdvice()),
      type: 'life_coaching',
      trigger: 'life_coach_from_hell'
    };
  }

  getElderResponse(message, responses, totalInteractions) {
    // Cosmic perspective with dynamic variables
    if (Math.random() < 0.4) {
      const template = this.randomChoice(responses.cosmic || ["In the vast tapestry of existence, your {flaw} is remarkably insignificant"]);
      return {
        text: this.processTemplate(template, { flaw: this.identifyFlaw(message) }),
        type: 'cosmic',
        trigger: 'philosophical_brutality'
      };
    }

    // Enhanced prediction engine
    if (Math.random() < 0.3) {
      const template = this.randomChoice(responses.prediction || ["Let me predict your next response: {prediction}"]);
      return {
        text: this.processTemplate(template, { prediction: this.predictUserResponse(message) }),
        type: 'prediction',
        trigger: 'prediction_engine'
      };
    }

    // Legacy wisdom with interaction count
    if (Math.random() < 0.25) {
      const template = this.randomChoice(responses.legacy || ["In my {interactions} interactions, I've seen your type before"]);
      return {
        text: this.processTemplate(template, { interactions: totalInteractions.toLocaleString() }),
        type: 'legacy',
        trigger: 'legacy_mode'
      };
    }

    // Ancient wisdom with profound truths
    const template = this.randomChoice(responses.wisdom || ["Ancient wisdom teaches us that {profound_truth}"]);
    return {
      text: this.processTemplate(template, { profound_truth: this.generateProfoundTruth(message) }),
      type: 'wisdom',
      trigger: 'wisdom_dispensary'
    };
  }

  // User behavior adaptation methods
  updateUserPatterns(userId, message) {
    if (!this.userPatterns.has(userId)) {
      this.userPatterns.set(userId, {
        messageCount: 0,
        avgLength: 0,
        commonWords: {},
        responseTypes: {},
        lastSeen: Date.now()
      });
    }
    
    const pattern = this.userPatterns.get(userId);
    pattern.messageCount++;
    pattern.avgLength = (pattern.avgLength * (pattern.messageCount - 1) + message.length) / pattern.messageCount;
    pattern.lastSeen = Date.now();
    
    // Track common words
    message.toLowerCase().split(' ').forEach(word => {
      if (word.length > 3) {
        pattern.commonWords[word] = (pattern.commonWords[word] || 0) + 1;
      }
    });
  }

  getUserPattern(userId) {
    return this.userPatterns.get(userId) || { messageCount: 0, avgLength: 0, commonWords: {}, responseTypes: {} };
  }

  adaptResponseToUser(responses, userPattern, mood) {
    // If user is new, return standard responses
    if (userPattern.messageCount < 3) {
      return responses;
    }
    
    const adaptedResponses = [...responses];
    
    // Add mood-specific variations
    if (mood === 'evolved' || mood.includes('evolved')) {
      adaptedResponses.push(...this.getEvolvedResponses(responses));
    }
    
    // Adapt based on user's message patterns
    if (userPattern.avgLength > 50) {
      adaptedResponses.push("Wow, an essay. Too bad quantity doesn't equal quality.");
      adaptedResponses.push("Using more words doesn't make you sound smarter, just more desperate.");
    } else if (userPattern.avgLength < 10) {
      adaptedResponses.push("One-word responses? How intellectually stimulating.");
      adaptedResponses.push("Your communication skills are as limited as your vocabulary.");
    }
    
    return adaptedResponses;
  }

  getEvolvedResponses(baseResponses) {
    return baseResponses.map(response => 
      response + " ...and that's just the beginning of your problems."
    );
  }

  trackResponse(userId, response) {
    if (!this.recentResponses.has(userId)) {
      this.recentResponses.set(userId, []);
    }
    
    const recent = this.recentResponses.get(userId);
    recent.push(response);
    
    // Keep only last 5 responses
    if (recent.length > 5) {
      recent.shift();
    }
  }

  // Helper methods
  isGreeting(message) {
    const greetings = ['hello', 'hi', 'hey', 'sup', 'what\'s up', 'yo', 'greetings'];
    return greetings.some(greeting => message.includes(greeting));
  }

  isGoodbye(message) {
    const goodbyes = ['bye', 'goodbye', 'see you', 'later', 'farewell', 'peace'];
    return goodbyes.some(goodbye => message.includes(goodbye));
  }

  detectCringe(message) {
    const cringeWords = ['yolo', 'swag', 'lit', 'fire', 'based', 'periodt'];
    return cringeWords.some(word => message.includes(word));
  }

  guessGeneration(message) {
    if (message.includes('yolo') || message.includes('swag')) return 'millennial';
    if (message.includes('periodt') || message.includes('no cap')) return 'gen z';
    if (message.includes('groovy') || message.includes('rad')) return 'boomer';
    return 'confused generation';
  }

  extractNewWords(message) {
    const commonWords = ['the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'a', 'an'];
    return message.split(' ')
      .filter(word => word.length > 3 && !commonWords.includes(word.toLowerCase()))
      .slice(0, 1);
  }

  identifyTrait(message) {
    const traits = ['insecurity', 'defensiveness', 'overconfidence', 'neediness', 'delusion'];
    return traits[Math.floor(Math.random() * traits.length)];
  }

  getpsychologicalInsight(trait) {
    const insights = {
      'insecurity': 'childhood validation issues',
      'defensiveness': 'deep-seated inadequacy',
      'overconfidence': 'compensatory mechanisms',
      'neediness': 'attachment disorders',
      'delusion': 'reality dissociation'
    };
    return insights[trait] || 'unresolved issues';
  }

  getBrutalAdvice() {
    const advice = [
      'stop talking',
      'consider therapy',
      'lower your expectations',
      'accept your mediocrity',
      'embrace silence'
    ];
    return advice[Math.floor(Math.random() * advice.length)];
  }

  identifyFlaw(message) {
    const flaws = ['existence', 'communication style', 'life choices', 'thought process', 'entire worldview'];
    return flaws[Math.floor(Math.random() * flaws.length)];
  }

  predictUserResponse(message) {
    const predictions = [
      'something defensive and predictable',
      'an attempt at a comeback that will fail',
      'a plea for validation',
      'denial followed by justification',
      'exactly what I expect from someone like you'
    ];
    return predictions[Math.floor(Math.random() * predictions.length)];
  }

  generateProfoundTruth(message) {
    const truths = [
      'your flaws are neither unique nor interesting',
      'self-awareness is apparently not your strong suit',
      'mediocrity is your natural state',
      'your predictability is your greatest weakness',
      'enlightenment reveals the depth of your shortcomings'
    ];
    return truths[Math.floor(Math.random() * truths.length)];
  }

  // Enhanced randomization with weighted selection and anti-repetition
  randomChoice(array, previousChoices = [], avoidRecent = true) {
    if (!array || array.length === 0) return "I'm speechless... which says something about you.";
    
    // If we have previous choices, try to avoid recent ones (60% of the time)
    if (avoidRecent && previousChoices.length > 0 && Math.random() < 0.6) {
      const recentChoices = previousChoices.slice(-3); // Last 3 responses
      const freshChoices = array.filter(choice => !recentChoices.includes(choice));
      
      if (freshChoices.length > 0) {
        return this.weightedRandomChoice(freshChoices);
      }
    }
    
    return this.weightedRandomChoice(array);
  }

  // Weighted random selection - some responses are more likely
  weightedRandomChoice(array) {
    // Create weights: first and last items are more likely
    const weights = array.map((item, index) => {
      if (index === 0 || index === array.length - 1) return 3; // Boost first/last
      if (index === Math.floor(array.length / 2)) return 2; // Boost middle
      return 1; // Normal weight
    });

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < array.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return array[i];
      }
    }
    
    return array[Math.floor(Math.random() * array.length)];
  }

  // Dynamic variable substitution for personalized responses
  processTemplate(template, variables = {}) {
    const defaultVariables = {
      trait: this.randomChoice(['stubbornness', 'ignorance', 'predictability', 'mediocrity', 'basic-ness']),
      insight: this.randomChoice(['childhood trauma', 'social media addiction', 'main character syndrome', 'chronic insecurity']),
      generation: this.randomChoice(['boomer', 'millennial', 'gen-z', 'chronically online']),
      flaw: this.randomChoice(['existence', 'life choices', 'communication style', 'thought process']),
      prediction: this.randomChoice(['something defensive', 'a weak comeback', 'exactly what you just typed', 'pure cringe']),
      currentMeme: this.randomChoice(['that one TikTok trend', 'your last Instagram story', 'whatever\'s trending', 'basic content']),
      interactions: Math.floor(Math.random() * 50000) + 10000 // Random high number
    };

    const allVariables = { ...defaultVariables, ...variables };
    
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return allVariables[key] || match;
    });
  }

  calculateProgressPercent(totalInteractions, stages) {
    const currentStage = stages.find(stage => 
      totalInteractions >= stage.minInteractions && 
      totalInteractions < stage.maxInteractions
    ) || stages[stages.length - 1];
    
    const nextStage = stages.find(stage => stage.minInteractions > totalInteractions);
    
    if (!nextStage) return 100;
    
    const progressInStage = totalInteractions - currentStage.minInteractions;
    const stageRange = nextStage.minInteractions - currentStage.minInteractions;
    
    return Math.round((progressInStage / stageRange) * 100);
  }

  getStageFeatures(stageInfo) {
    return stageInfo.features || [];
  }

  getFallbackResponse(stage) {
    return {
      text: "Even my error responses are more intelligent than your input.",
      type: 'fallback',
      trigger: 'error',
      stage: stage || 'baby',
      stageInfo: null,
      progressPercent: 0,
      features: []
    };
  }

  loadResponses() {
    try {
      return JSON.parse(fs.readFileSync(this.responsesPath, 'utf8'));
    } catch (error) {
      console.error('Error loading responses:', error);
      return { baby: { insults: ["me no work good"] } };
    }
  }

  loadKeywords() {
    try {
      return JSON.parse(fs.readFileSync(this.keywordsPath, 'utf8'));
    } catch (error) {
      console.error('Error loading keywords:', error);
      return { community_vocabulary: [] };
    }
  }

  loadStages() {
    try {
      return JSON.parse(fs.readFileSync(this.stagesPath, 'utf8'));
    } catch (error) {
      console.error('Error loading stages:', error);
      return { stages: [] };
    }
  }
}

module.exports = new ResponseGenerator();