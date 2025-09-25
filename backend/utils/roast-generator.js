const fs = require('fs');
const path = require('path');

class RoastGenerator {
  constructor() {
    this.responsesPath = path.join(__dirname, '../../config/responses.json');
    this.keywordsPath = path.join(__dirname, '../../config/keywords.json');
    this.learnedWordsPath = path.join(__dirname, '../data/learned-words.json');
  }

  generateInstantRoast(stage = 'baby', category = 'general') {
    try {
      const responses = this.loadResponses();
      const stageResponses = responses[stage] || responses.baby;
      
      // Get appropriate roast category
      let roastPool = [];
      
      switch (category) {
        case 'appearance':
          roastPool = this.getAppearanceRoasts(stage);
          break;
        case 'intelligence':
          roastPool = this.getIntelligenceRoasts(stage);
          break;
        case 'life_choices':
          roastPool = this.getLifeChoiceRoasts(stage);
          break;
        case 'dating':
          roastPool = this.getDatingRoasts(stage);
          break;
        default:
          roastPool = stageResponses.insults || stageResponses.greeting || ["you disappoint me"];
      }
      
      const roast = this.randomChoice(roastPool);
      
      return {
        text: roast,
        category: category,
        stage: stage,
        timestamp: new Date().toISOString(),
        id: `roast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

    } catch (error) {
      console.error('Error generating instant roast:', error);
      return this.getFallbackRoast();
    }
  }

  generateCustomRoast(keywords, stage = 'baby') {
    try {
      const responses = this.loadResponses();
      const stageResponses = responses[stage] || responses.baby;
      const learnedWords = this.loadLearnedWords();
      
      // Build custom roast using provided keywords
      const roastTemplate = this.selectRoastTemplate(stage);
      const customRoast = this.fillTemplate(roastTemplate, keywords, learnedWords.vocabulary);
      
      return {
        text: customRoast,
        category: 'custom',
        stage: stage,
        keywords: keywords,
        timestamp: new Date().toISOString(),
        id: `custom_roast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

    } catch (error) {
      console.error('Error generating custom roast:', error);
      return this.getFallbackRoast();
    }
  }

  generateTopicRoast(topic, stage = 'baby', personalityProfile = {}) {
    try {
      const responses = this.loadResponses();
      const keywords = this.loadKeywords();
      
      // Get topic-specific roasts
      const topicRoasts = this.getTopicSpecificRoasts(topic, stage);
      
      // Enhance with personality profiling if available
      let roast = this.randomChoice(topicRoasts);
      
      if (personalityProfile.vulnerabilities && personalityProfile.vulnerabilities.length > 0) {
        roast = this.enhanceWithVulnerabilities(roast, personalityProfile.vulnerabilities);
      }
      
      return {
        text: roast,
        category: 'topic',
        topic: topic,
        stage: stage,
        personalityEnhanced: Object.keys(personalityProfile).length > 0,
        timestamp: new Date().toISOString(),
        id: `topic_roast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

    } catch (error) {
      console.error('Error generating topic roast:', error);
      return this.getFallbackRoast();
    }
  }

  getAppearanceRoasts(stage) {
    const roastsByStage = {
      baby: [
        "your face is yucky",
        "you look funny",
        "mama say you ugly",
        "me seen better looking potatoes"
      ],
      child: [
        "even my imaginary friends think you're ugly",
        "you look like you fell out of the ugly tree and hit every branch",
        "did your face catch fire and someone tried to put it out with a fork?",
        "I've seen better looking road kill"
      ],
      teen: [
        "your appearance screams 'peaked in middle school'",
        "imagine looking like that and thinking you have opinions worth hearing",
        "your face is giving major 'please swipe left' energy",
        "even with filters you'd still disappoint your parents"
      ],
      adult: [
        "Your appearance suggests a series of poor life decisions culminating in this moment",
        "I've analyzed thousands of faces, and yours ranks consistently in the bottom percentile",
        "Your aesthetic choices indicate a fundamental misunderstanding of social norms",
        "The correlation between your appearance and your personality is remarkably consistent"
      ],
      elder: [
        "In the cosmic hierarchy of beauty, you exist in a dimension previously thought impossible",
        "The universe itself recoils at your physical manifestation",
        "Ancient civilizations would have used your visage as a ward against evil",
        "Your appearance transcends mere ugliness and achieves a philosophical state of aesthetic suffering"
      ]
    };
    
    return roastsByStage[stage] || roastsByStage.baby;
  }

  getIntelligenceRoasts(stage) {
    const roastsByStage = {
      baby: [
        "me smarter than you",
        "you dumb dumb",
        "rocks think harder than you",
        "even babies know more"
      ],
      child: [
        "you're as sharp as a marble",
        "if brains were dynamite, you couldn't blow your nose",
        "you're living proof that evolution can go backwards",
        "I've met goldfish with better critical thinking skills"
      ],
      teen: [
        "your IQ is lower than your credit score",
        "you're giving major 'peaked in kindergarten' intellectual vibes",
        "imagine being this confidently wrong about everything",
        "your brain has the processing power of a calculator from 1985"
      ],
      adult: [
        "Your cognitive capabilities suggest significant developmental challenges",
        "I've conducted extensive analysis, and your intellectual capacity ranks below statistical significance",
        "Your thought processes demonstrate a concerning disconnect from logical reasoning",
        "The inverse correlation between your confidence and competence is textbook Dunning-Kruger"
      ],
      elder: [
        "In the grand tapestry of human consciousness, your mind is a particularly dull thread",
        "The cosmos weeps at the waste of neural matter that constitutes your thinking",
        "Your intellectual capacity exists in a quantum state of simultaneous ignorance and delusion",
        "Even entropy finds your thought processes too random to be useful"
      ]
    };
    
    return roastsByStage[stage] || roastsByStage.baby;
  }

  getLifeChoiceRoasts(stage) {
    const roastsByStage = {
      baby: [
        "you make bad choices",
        "why you do that?",
        "that was dumb",
        "me no understand your thinking"
      ],
      child: [
        "your life choices are like a trainwreck in slow motion",
        "if poor decisions were an Olympic sport, you'd win gold",
        "you're speedrunning life failure",
        "even my worst enemies make better choices than you"
      ],
      teen: [
        "your life is giving major 'cautionary tale' energy",
        "imagine making that choice and thinking it was smart",
        "your decision-making process is more broken than your personality",
        "you're basically a walking 'what not to do' guide"
      ],
      adult: [
        "Your decision-making patterns indicate a fundamental misunderstanding of cause and effect",
        "I've analyzed your choices, and they consistently trend toward suboptimal outcomes",
        "Your life trajectory suggests a remarkable ability to choose the worst possible option",
        "The psychological profile emerging from your decisions is deeply concerning"
      ],
      elder: [
        "The karmic weight of your poor choices ripples through the fabric of reality itself",
        "In the eternal ledger of human decisions, yours occupy the pages reserved for cautionary tales",
        "Your life path demonstrates the universe's capacity for ironic punishment",
        "The collective consciousness cringes at the accumulated weight of your poor judgment"
      ]
    };
    
    return roastsByStage[stage] || roastsByStage.baby;
  }

  getDatingRoasts(stage) {
    const roastsByStage = {
      baby: [
        "nobody likes you",
        "you smell bad",
        "cooties! cooties!",
        "me no want to play with you"
      ],
      child: [
        "you'll be single forever",
        "even your hand doesn't want to hold you",
        "your dating life is like your personality - nonexistent",
        "I wouldn't date you with someone else's heart"
      ],
      teen: [
        "your dating profile screams 'red flag convention'",
        "imagine being this single and thinking it's everyone else's fault",
        "your romantic prospects are bleaker than your future",
        "you're giving major 'dies alone with cats' energy"
      ],
      adult: [
        "Your relationship status is a direct reflection of your personality deficits",
        "The correlation between your romantic failures and your psychological profile is remarkably consistent",
        "Your dating history suggests a pattern of poor judgment that extends beyond relationships",
        "I've analyzed successful relationships, and you possess none of the requisite qualities"
      ],
      elder: [
        "In the cosmic dance of love, you are perpetually without a partner",
        "The universe itself conspires to keep you romantically isolated for the greater good",
        "Your solitude is not accidental but a natural consequence of universal balance",
        "Love itself recoils at your approach, seeking refuge in more deserving souls"
      ]
    };
    
    return roastsByStage[stage] || roastsByStage.baby;
  }

  getTopicSpecificRoasts(topic, stage) {
    const topicRoasts = {
      work: this.getWorkRoasts(stage),
      gaming: this.getGamingRoasts(stage),
      social_media: this.getSocialMediaRoasts(stage),
      crypto: this.getCryptoRoasts(stage)
    };
    
    return topicRoasts[topic] || this.getIntelligenceRoasts(stage);
  }

  getWorkRoasts(stage) {
    const workRoasts = {
      baby: ["work is for grown-ups", "you too small for job", "stay home with mama"],
      child: ["you'd get fired from a lemonade stand", "even child labor laws wouldn't protect you"],
      teen: ["your work ethic is giving major 'trust fund baby' vibes", "imagine thinking you deserve a promotion"],
      adult: ["Your professional competency metrics suggest career plateau", "Your workplace contribution analysis indicates diminishing returns"],
      elder: ["The cosmic significance of your professional endeavors approaches absolute zero"]
    };
    
    return workRoasts[stage] || workRoasts.baby;
  }

  getGamingRoasts(stage) {
    const gamingRoasts = {
      baby: ["games too hard for you", "you probably lose to tutorial"],
      child: ["you're worse than a bot", "even NPCs have better aim"],
      teen: ["imagine being hardstuck bronze and still talking", "your gaming skills peaked at tutorial level"],
      adult: ["Your gaming performance analytics indicate consistent underperformance across all metrics"],
      elder: ["In the infinite multiverse of gaming possibilities, you consistently choose failure"]
    };
    
    return gamingRoasts[stage] || gamingRoasts.baby;
  }

  getSocialMediaRoasts(stage) {
    const socialRoasts = {
      baby: ["you no know how to use phone", "too young for internet"],
      child: ["your posts get less likes than a blank screen", "even your mom doesn't follow you"],
      teen: ["your content is giving major 'please notice me' desperation", "influencer wannabe with zero influence"],
      adult: ["Your social media engagement metrics reflect your real-world social value"],
      elder: ["The digital realm echoes with the emptiness of your online presence"]
    };
    
    return socialRoasts[stage] || socialRoasts.baby;
  }

  getCryptoRoasts(stage) {
    const cryptoRoasts = {
      baby: ["shiny coins too hard for baby brain", "you lose pretend money"],
      child: ["you'd lose money in a bull market", "diamond hands, paper brain"],
      teen: ["imagine buying high and selling low unironically", "your portfolio is giving major 'rekt' energy"],
      adult: ["Your investment strategy demonstrates a fundamental misunderstanding of market dynamics"],
      elder: ["The blockchain itself weeps at your transaction history"]
    };
    
    return cryptoRoasts[stage] || cryptoRoasts.baby;
  }

  selectRoastTemplate(stage) {
    const templates = {
      baby: "you {adjective} {noun}!",
      child: "you're more {adjective} than a {noun}",
      teen: "imagine being this {adjective} and thinking you're {positive_trait}",
      adult: "Your {characteristic} demonstrates a concerning level of {negative_trait}",
      elder: "In the cosmic hierarchy of {concept}, you exist as a {metaphor}"
    };
    
    return templates[stage] || templates.baby;
  }

  fillTemplate(template, keywords, learnedVocabulary) {
    const placeholders = {
      adjective: keywords.adjectives || ['dumb', 'weird', 'cringe'],
      noun: keywords.nouns || ['potato', 'disappointment', 'mistake'],
      positive_trait: ['smart', 'cool', 'relevant'],
      negative_trait: ['incompetence', 'delusion', 'failure'],
      characteristic: ['behavior', 'decision-making', 'existence'],
      concept: ['intelligence', 'relevance', 'success'],
      metaphor: ['cosmic joke', 'universal disappointment', 'dimensional error']
    };
    
    // Add learned vocabulary
    if (learnedVocabulary && learnedVocabulary.length > 0) {
      const communityWords = learnedVocabulary.map(w => w.word);
      placeholders.adjective = [...placeholders.adjective, ...communityWords.slice(0, 3)];
    }
    
    let result = template;
    Object.entries(placeholders).forEach(([key, values]) => {
      const placeholder = `{${key}}`;
      if (result.includes(placeholder)) {
        result = result.replace(placeholder, this.randomChoice(values));
      }
    });
    
    return result;
  }

  enhanceWithVulnerabilities(roast, vulnerabilities) {
    const enhancements = {
      insecurity: " - classic insecurity showing",
      loneliness: " - explains the desperate energy",
      anxiety: " - and your nervous energy confirms it",
      defensiveness: " - getting defensive already?",
      validation_seeking: " - still looking for approval?"
    };
    
    const vulnerability = this.randomChoice(vulnerabilities);
    const enhancement = enhancements[vulnerability] || "";
    
    return roast + enhancement;
  }

  randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  getFallbackRoast() {
    return {
      text: "Even my error messages are more creative than your personality.",
      category: 'fallback',
      stage: 'unknown',
      timestamp: new Date().toISOString(),
      id: `fallback_${Date.now()}`
    };
  }

  loadResponses() {
    try {
      return JSON.parse(fs.readFileSync(this.responsesPath, 'utf8'));
    } catch (error) {
      console.error('Error loading responses:', error);
      return { baby: { insults: ["you disappoint me"] } };
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

  loadLearnedWords() {
    try {
      return JSON.parse(fs.readFileSync(this.learnedWordsPath, 'utf8'));
    } catch (error) {
      console.error('Error loading learned words:', error);
      return { vocabulary: [] };
    }
  }
}

module.exports = new RoastGenerator();