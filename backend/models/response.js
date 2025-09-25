const fs = require('fs');
const path = require('path');

class ResponseGenerator {
  constructor() {
    this.responsesPath = path.join(__dirname, '../../config/responses.json');
    this.keywordsPath = path.join(__dirname, '../../config/keywords.json');
    this.stagesPath = path.join(__dirname, '../../config/stages.json');
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

  selectResponse(userMessage, stageResponses, stageInfo, totalInteractions) {
    const lowerMessage = userMessage.toLowerCase().trim();
    
    // Greeting detection
    if (this.isGreeting(lowerMessage)) {
      return {
        text: this.randomChoice(stageResponses.greeting || stageResponses.insults || ["hello, disappointment"]),
        type: 'greeting',
        trigger: 'greeting_detected'
      };
    }

    // Goodbye detection
    if (this.isGoodbye(lowerMessage)) {
      return {
        text: this.randomChoice(stageResponses.goodbye || stageResponses.insults || ["finally leaving? smart choice"]),
        type: 'goodbye',
        trigger: 'goodbye_detected'
      };
    }

    // Stage-specific response patterns
    return this.getStageSpecificResponse(lowerMessage, stageResponses, stageInfo, totalInteractions);
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
    // Cosmic perspective
    if (Math.random() < 0.4) {
      const flaw = this.identifyFlaw(message);
      return {
        text: this.randomChoice(responses.cosmic || ["In the vast tapestry of existence, your {flaw} is remarkably insignificant"])
          .replace('{flaw}', flaw),
        type: 'cosmic',
        trigger: 'philosophical_brutality'
      };
    }

    // Prediction engine
    if (Math.random() < 0.3) {
      const prediction = this.predictUserResponse(message);
      return {
        text: this.randomChoice(responses.prediction || ["Let me predict your next response: {prediction}"])
          .replace('{eerily_accurate_guess}', prediction),
        type: 'prediction',
        trigger: 'prediction_engine'
      };
    }

    // Legacy wisdom
    if (Math.random() < 0.25) {
      return {
        text: this.randomChoice(responses.legacy || [`In my ${totalInteractions} interactions, I've seen your type before`])
          .replace('{interactions}', totalInteractions.toLocaleString()),
        type: 'legacy',
        trigger: 'legacy_mode'
      };
    }

    // Ancient wisdom
    const profoundTruth = this.generateProfoundTruth(message);
    return {
      text: this.randomChoice(responses.wisdom || ["Ancient wisdom teaches us that {profound_truth}"])
        .replace('{profound_truth_about_flaws}', profoundTruth),
      type: 'wisdom',
      trigger: 'wisdom_dispensary'
    };
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

  randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
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