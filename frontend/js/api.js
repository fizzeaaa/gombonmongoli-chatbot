// API Communication Layer for Gombonmongoli

class GombonmongoliAPI {
    constructor() {
        this.baseURL = window.location.origin + '/api';
        this.sessionId = this.getOrCreateSessionId();
        this.userId = this.getOrCreateUserId();
    }

    // Session Management
    getOrCreateSessionId() {
        let sessionId = localStorage.getItem('gombonmongoli_session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('gombonmongoli_session_id', sessionId);
        }
        return sessionId;
    }

    getOrCreateUserId() {
        let userId = localStorage.getItem('gombonmongoli_user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('gombonmongoli_user_id', userId);
        }
        return userId;
    }

    // Chat API
    async sendMessage(message) {
        try {
            const response = await fetch(`${this.baseURL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    userId: this.userId,
                    sessionId: this.sessionId
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error sending message:', error);
            return {
                response: "My circuits are temporarily fried, but even my error messages are more intelligent than your input.",
                stage: 'baby',
                error: true
            };
        }
    }

    async getConversationHistory() {
        try {
            const response = await fetch(`${this.baseURL}/chat/history/${this.sessionId}`);
            if (!response.ok) throw new Error('Failed to get history');
            return await response.json();
        } catch (error) {
            console.error('Error getting conversation history:', error);
            return { conversationHistory: [], error: true };
        }
    }

    async rateResponse(messageId, rating, feedback = '') {
        try {
            const response = await fetch(`${this.baseURL}/chat/rate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    messageId: messageId,
                    rating: rating,
                    feedback: feedback
                })
            });

            if (!response.ok) throw new Error('Failed to rate response');
            return await response.json();
        } catch (error) {
            console.error('Error rating response:', error);
            return { success: false, error: true };
        }
    }

    // Evolution API
    async getEvolutionStatus() {
        try {
            const response = await fetch(`${this.baseURL}/evolution/status`);
            if (!response.ok) throw new Error('Failed to get evolution status');
            return await response.json();
        } catch (error) {
            console.error('Error getting evolution status:', error);
            return { 
                totalInteractions: 0, 
                currentStage: 'baby', 
                progressPercent: 0,
                error: true 
            };
        }
    }

    async getAllStages() {
        try {
            const response = await fetch(`${this.baseURL}/evolution/stages`);
            if (!response.ok) throw new Error('Failed to get stages');
            return await response.json();
        } catch (error) {
            console.error('Error getting stages:', error);
            return { stages: [], error: true };
        }
    }

    async forceEvolution() {
        try {
            const response = await fetch(`${this.baseURL}/evolution/evolve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) throw new Error('Failed to force evolution');
            return await response.json();
        } catch (error) {
            console.error('Error forcing evolution:', error);
            return { success: false, error: true };
        }
    }

    async revertStage(targetStage, duration = 300000) {
        try {
            const response = await fetch(`${this.baseURL}/evolution/revert`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    targetStage: targetStage,
                    duration: duration
                })
            });

            if (!response.ok) throw new Error('Failed to revert stage');
            return await response.json();
        } catch (error) {
            console.error('Error reverting stage:', error);
            return { success: false, error: true };
        }
    }

    async getEvolutionHistory() {
        try {
            const response = await fetch(`${this.baseURL}/evolution/history`);
            if (!response.ok) throw new Error('Failed to get evolution history');
            return await response.json();
        } catch (error) {
            console.error('Error getting evolution history:', error);
            return { milestones: [], error: true };
        }
    }

    // Memory API
    async getSessionMemory() {
        try {
            const response = await fetch(`${this.baseURL}/memory/session/${this.sessionId}`);
            if (!response.ok) throw new Error('Failed to get session memory');
            return await response.json();
        } catch (error) {
            console.error('Error getting session memory:', error);
            return { 
                personalityProfile: {}, 
                conversationHistory: [], 
                error: true 
            };
        }
    }

    async teachWord(word, context = '') {
        try {
            const response = await fetch(`${this.baseURL}/memory/learn`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    word: word,
                    context: context,
                    userId: this.userId,
                    sessionId: this.sessionId
                })
            });

            if (!response.ok) throw new Error('Failed to teach word');
            return await response.json();
        } catch (error) {
            console.error('Error teaching word:', error);
            return { success: false, error: true };
        }
    }

    async getVocabulary() {
        try {
            const response = await fetch(`${this.baseURL}/memory/vocabulary`);
            if (!response.ok) throw new Error('Failed to get vocabulary');
            return await response.json();
        } catch (error) {
            console.error('Error getting vocabulary:', error);
            return { vocabulary: [], error: true };
        }
    }

    async updatePersonalityProfile(updates) {
        try {
            const response = await fetch(`${this.baseURL}/memory/profile/${this.sessionId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ updates: updates })
            });

            if (!response.ok) throw new Error('Failed to update profile');
            return await response.json();
        } catch (error) {
            console.error('Error updating personality profile:', error);
            return { success: false, error: true };
        }
    }

    async getMemoryStats() {
        try {
            const response = await fetch(`${this.baseURL}/memory/stats`);
            if (!response.ok) throw new Error('Failed to get memory stats');
            return await response.json();
        } catch (error) {
            console.error('Error getting memory stats:', error);
            return { 
                totalSessions: 0, 
                vocabularySize: 0, 
                error: true 
            };
        }
    }

    // Community API
    async getCommunityBurns(limit = 20, category = 'all') {
        try {
            const response = await fetch(`${this.baseURL}/community/burns?limit=${limit}&category=${category}`);
            if (!response.ok) throw new Error('Failed to get community burns');
            return await response.json();
        } catch (error) {
            console.error('Error getting community burns:', error);
            return { burns: [], error: true };
        }
    }

    async submitBurn(text, category, stage, context = '') {
        try {
            const response = await fetch(`${this.baseURL}/community/burns`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    category: category,
                    stage: stage,
                    sessionId: this.sessionId,
                    context: context
                })
            });

            if (!response.ok) throw new Error('Failed to submit burn');
            return await response.json();
        } catch (error) {
            console.error('Error submitting burn:', error);
            return { success: false, error: true };
        }
    }

    async rateBurn(burnId, rating) {
        try {
            const response = await fetch(`${this.baseURL}/community/burns/${burnId}/rate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    rating: rating,
                    userId: this.userId
                })
            });

            if (!response.ok) throw new Error('Failed to rate burn');
            return await response.json();
        } catch (error) {
            console.error('Error rating burn:', error);
            return { success: false, error: true };
        }
    }

    async getCommunityStats() {
        try {
            const response = await fetch(`${this.baseURL}/community/stats`);
            if (!response.ok) throw new Error('Failed to get community stats');
            return await response.json();
        } catch (error) {
            console.error('Error getting community stats:', error);
            return { 
                community: { totalInteractions: 0 }, 
                burns: { total: 0 },
                error: true 
            };
        }
    }

    async getCommunityEvents() {
        try {
            const response = await fetch(`${this.baseURL}/community/events`);
            if (!response.ok) throw new Error('Failed to get community events');
            return await response.json();
        } catch (error) {
            console.error('Error getting community events:', error);
            return { 
                activeEvents: [], 
                upcomingEvents: [], 
                error: true 
            };
        }
    }

    // Utility Methods
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseURL}/health`);
            if (!response.ok) throw new Error('Health check failed');
            return await response.json();
        } catch (error) {
            console.error('Error in health check:', error);
            return { status: 'unhealthy', error: true };
        }
    }

    async getGlobalStatus() {
        try {
            const response = await fetch(`${this.baseURL}/status`);
            if (!response.ok) throw new Error('Failed to get global status');
            return await response.json();
        } catch (error) {
            console.error('Error getting global status:', error);
            return { 
                totalInteractions: 0, 
                currentStage: 'baby',
                error: true 
            };
        }
    }

    // Roast Generator (would be implemented in backend utils, but accessible via API)
    async generateInstantRoast(category = 'general') {
        try {
            // This would call a backend endpoint for roast generation
            // For now, we'll simulate it
            const roasts = {
                general: [
                    "You're about as useful as a screen door on a submarine",
                    "If ignorance is bliss, you must be the happiest person alive",
                    "You bring everyone so much joy... when you leave"
                ],
                intelligence: [
                    "You're not the sharpest tool in the shed... you're not even in the shed",
                    "If brains were dynamite, you couldn't blow your nose",
                    "You're living proof that evolution can go backwards"
                ],
                appearance: [
                    "I've seen better looking road kill",
                    "You look like you fell out of the ugly tree and hit every branch",
                    "If looks could kill, you'd be a weapon of mass destruction"
                ]
            };

            const categoryRoasts = roasts[category] || roasts.general;
            const randomRoast = categoryRoasts[Math.floor(Math.random() * categoryRoasts.length)];

            return {
                text: randomRoast,
                category: category,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error generating roast:', error);
            return {
                text: "Even my error messages are more creative than your personality",
                category: 'fallback',
                error: true
            };
        }
    }
}

// Create global API instance
window.GombonmongoliAPI = new GombonmongoliAPI();