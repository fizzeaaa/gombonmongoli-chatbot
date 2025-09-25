// Main Application Controller for Gombonmongoli

class GombonmongoliApp {
    constructor() {
        this.api = window.GombonmongoliAPI;
        this.currentStage = 'baby';
        this.isTyping = false;
        this.elements = {};
        this.config = {
            typingSpeed: 30,
            maxMessageLength: 500,
            autoUpdateInterval: 30000 // 30 seconds
        };
        
        this.init();
    }

    async init() {
        console.log('🔥 Initializing Gombonmongoli Evolution System...');
        
        // Cache DOM elements
        this.cacheElements();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Load initial data
        await this.loadInitialData();
        
        // Start periodic updates
        this.startPeriodicUpdates();
        
        // Show welcome message
        this.showWelcomeMessage();
        
        console.log('✅ Gombonmongoli system ready!');
    }

    cacheElements() {
        this.elements = {
            // Header elements
            stageIcon: document.getElementById('stageIcon'),
            stageName: document.getElementById('stageName'),
            stageDescription: document.getElementById('stageDescription'),
            progressFill: document.getElementById('progressFill'),
            progressText: document.getElementById('progressText'),
            
            // Character elements
            characterEmoji: document.getElementById('characterEmoji'),
            speechBubble: document.getElementById('speechBubble'),
            bubbleText: document.getElementById('bubbleText'),
            
            // Chat elements
            chatContainer: document.getElementById('chatContainer'),
            messageInput: document.getElementById('messageInput'),
            sendButton: document.getElementById('sendButton'),
            typingIndicator: document.getElementById('typingIndicator'),
            
            // Feature buttons
            instantRoast: document.getElementById('instantRoast'),
            roastCategory: document.getElementById('roastCategory'),
            customKeywords: document.getElementById('customKeywords'),
            customRoast: document.getElementById('customRoast'),
            stageSelector: document.getElementById('stageSelector'),
            evolutionHistory: document.getElementById('evolutionHistory'),
            forceEvolution: document.getElementById('forceEvolution'),
            conversationHistory: document.getElementById('conversationHistory'),
            personalityProfile: document.getElementById('personalityProfile'),
            learningProgress: document.getElementById('learningProgress'),
            hallOfShame: document.getElementById('hallOfShame'),
            communityStats: document.getElementById('communityStats'),
            teachWords: document.getElementById('teachWords'),
            
            // Stats elements
            totalInteractions: document.getElementById('totalInteractions'),
            currentStageDisplay: document.getElementById('currentStageDisplay'),
            vocabularySize: document.getElementById('vocabularySize'),
            
            // Modal elements
            modalOverlay: document.getElementById('modalOverlay'),
            modal: document.getElementById('modal'),
            modalTitle: document.getElementById('modalTitle'),
            modalContent: document.getElementById('modalContent'),
            closeModal: document.getElementById('closeModal'),
            
            // Notifications
            notifications: document.getElementById('notifications')
        };
    }

    setupEventListeners() {
        // Chat functionality
        this.elements.sendButton.addEventListener('click', () => this.sendMessage());
        this.elements.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Roast generator
        this.elements.instantRoast.addEventListener('click', () => this.generateInstantRoast());
        this.elements.customRoast.addEventListener('click', () => this.generateCustomRoast());

        // Evolution controls
        this.elements.stageSelector.addEventListener('click', () => this.showStageSelector());
        this.elements.evolutionHistory.addEventListener('click', () => this.showEvolutionHistory());
        this.elements.forceEvolution.addEventListener('click', () => this.forceEvolution());

        // Memory features
        this.elements.conversationHistory.addEventListener('click', () => this.showConversationHistory());
        this.elements.personalityProfile.addEventListener('click', () => this.showPersonalityProfile());
        this.elements.learningProgress.addEventListener('click', () => this.showLearningProgress());

        // Community features
        this.elements.hallOfShame.addEventListener('click', () => this.showHallOfShame());
        this.elements.communityStats.addEventListener('click', () => this.showCommunityStats());
        this.elements.teachWords.addEventListener('click', () => this.showTeachWords());

        // Modal controls
        this.elements.closeModal.addEventListener('click', () => this.hideModal());
        this.elements.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.elements.modalOverlay) {
                this.hideModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideModal();
            }
        });
    }

    async loadInitialData() {
        try {
            // Load evolution status
            const status = await this.api.getEvolutionStatus();
            this.updateEvolutionDisplay(status);
            
            // Load global stats
            const globalStats = await this.api.getGlobalStatus();
            this.updateGlobalStats(globalStats);
            
            // Load vocabulary stats
            const memoryStats = await this.api.getMemoryStats();
            this.updateMemoryStats(memoryStats);
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showNotification('Failed to load system data', 'error');
        }
    }

    startPeriodicUpdates() {
        setInterval(async () => {
            await this.loadInitialData();
        }, this.config.autoUpdateInterval);
    }

    showWelcomeMessage() {
        const welcomeMessage = {
            text: "Welcome to my domain, human. I am <strong>Gombonmongoli</strong>, and I will evolve through community interactions. Currently, I'm just a baby... but I'm already better than you.",
            stage: this.currentStage,
            type: 'greeting'
        };
        
        this.displayBotMessage(welcomeMessage);
    }

    async sendMessage() {
        const message = this.elements.messageInput.value.trim();
        
        if (!message || this.isTyping) return;
        
        if (message.length > this.config.maxMessageLength) {
            this.showNotification(`Message too long! Maximum ${this.config.maxMessageLength} characters.`, 'warning');
            return;
        }

        // Display user message
        this.displayUserMessage(message);
        this.elements.messageInput.value = '';

        // Show typing indicator
        this.showTyping();
        this.playCharacterAnimation('thinking');

        try {
            // Send to API
            const response = await this.api.sendMessage(message);
            
            // Hide typing indicator
            this.hideTyping();
            
            // Update evolution status if changed
            if (response.stageInfo && response.stage !== this.currentStage) {
                this.handleStageEvolution(response.stage, response.stageInfo);
            }
            
            // Display bot response
            this.displayBotMessage(response);
            
            // Update progress
            this.updateEvolutionDisplay({
                currentStage: response.stage,
                progressPercent: response.progressPercent,
                totalInteractions: response.totalInteractions
            });
            
        } catch (error) {
            this.hideTyping();
            console.error('Error sending message:', error);
            this.displayBotMessage({
                text: "My circuits are temporarily fried, but even my error messages are more intelligent than your input.",
                stage: this.currentStage,
                type: 'error'
            });
        }
    }

    displayUserMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message slide-in-right';
        messageDiv.innerHTML = `
            <div class="message-sender">You</div>
            <div class="message-content">${this.escapeHtml(text)}</div>
        `;
        
        this.elements.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    displayBotMessage(responseData) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message bot-message ${this.getMessageAnimationClass(responseData.type)}`;
        
        const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        messageDiv.setAttribute('data-message-id', messageId);
        
        messageDiv.innerHTML = `
            <div class="message-sender">Gombonmongoli</div>
            <div class="message-content">${responseData.text}</div>
        `;
        
        this.elements.chatContainer.appendChild(messageDiv);
        
        // Add rating buttons for non-system messages
        if (responseData.type !== 'greeting' && responseData.type !== 'error') {
            this.addRatingButtons(messageDiv, messageId);
        }
        
        // Play character animation based on response type
        this.playCharacterAnimation(this.getCharacterAnimationType(responseData.type));
        
        // Show speech bubble temporarily
        this.showSpeechBubble(responseData.text.substring(0, 50) + '...');
        
        this.scrollToBottom();
    }

    getMessageAnimationClass(type) {
        const animations = {
            'tantrum': 'message-tantrum',
            'roast': 'message-roast',
            'wisdom': 'message-wisdom',
            'default': 'slide-in-left'
        };
        return animations[type] || animations.default;
    }

    getCharacterAnimationType(responseType) {
        const animations = {
            'tantrum': 'angry',
            'roast': 'evil',
            'insult': 'laughing',
            'wisdom': 'thinking',
            'default': 'idle'
        };
        return animations[responseType] || animations.default;
    }

    playCharacterAnimation(animationType) {
        const character = this.elements.characterEmoji;
        
        // Remove existing animation classes
        character.classList.remove('character-angry', 'character-laughing', 'character-thinking', 'character-evil');
        
        // Add new animation class
        if (animationType !== 'idle') {
            character.classList.add(`character-${animationType}`);
            
            // Remove animation after duration
            setTimeout(() => {
                character.classList.remove(`character-${animationType}`);
            }, 2000);
        }
    }

    showSpeechBubble(text) {
        this.elements.bubbleText.textContent = text;
        this.elements.speechBubble.style.display = 'block';
        
        setTimeout(() => {
            this.elements.speechBubble.style.display = 'none';
        }, 3000);
    }

    addRatingButtons(messageElement, messageId) {
        const ratingDiv = document.createElement('div');
        ratingDiv.className = 'message-rating';
        ratingDiv.innerHTML = `
            <div class="rating-prompt">Rate this roast:</div>
            <div class="rating-buttons">
                ${[1,2,3,4,5,6,7,8,9,10].map(rating => 
                    `<button class="rating-btn" data-rating="${rating}">${rating}</button>`
                ).join('')}
            </div>
        `;
        
        ratingDiv.addEventListener('click', async (e) => {
            if (e.target.classList.contains('rating-btn')) {
                const rating = parseInt(e.target.dataset.rating);
                await this.rateMessage(messageId, rating);
                ratingDiv.style.display = 'none';
            }
        });
        
        messageElement.appendChild(ratingDiv);
    }

    async rateMessage(messageId, rating) {
        try {
            const result = await this.api.rateResponse(messageId, rating);
            if (result.success) {
                this.showNotification(result.message || 'Rating submitted!', 'success');
            }
        } catch (error) {
            console.error('Error rating message:', error);
            this.showNotification('Failed to submit rating', 'error');
        }
    }

    showTyping() {
        this.isTyping = true;
        this.elements.typingIndicator.style.display = 'flex';
        this.scrollToBottom();
    }

    hideTyping() {
        this.isTyping = false;
        this.elements.typingIndicator.style.display = 'none';
    }

    scrollToBottom() {
        setTimeout(() => {
            this.elements.chatContainer.scrollTop = this.elements.chatContainer.scrollHeight;
        }, 100);
    }

    updateEvolutionDisplay(status) {
        if (status.stageInfo) {
            this.elements.stageIcon.textContent = status.stageInfo.emoji;
            this.elements.stageName.textContent = status.stageInfo.name;
            this.elements.stageDescription.textContent = status.stageInfo.description;
            this.elements.characterEmoji.textContent = status.stageInfo.emoji;
            
            // Update theme
            this.updateTheme(status.currentStage);
        }
        
        if (status.progressPercent !== undefined) {
            this.elements.progressFill.style.width = `${status.progressPercent}%`;
        }
        
        if (status.totalInteractions !== undefined) {
            const nextStageInteractions = this.getNextStageInteractions(status.currentStage);
            this.elements.progressText.textContent = 
                `${status.totalInteractions.toLocaleString()} / ${nextStageInteractions.toLocaleString()} interactions`;
        }
        
        this.currentStage = status.currentStage || this.currentStage;
    }

    updateTheme(stage) {
        // Remove existing stage classes
        document.body.classList.remove('stage-baby', 'stage-child', 'stage-teen', 'stage-adult', 'stage-elder');
        
        // Add new stage class
        document.body.classList.add(`stage-${stage}`);
    }

    updateGlobalStats(stats) {
        if (stats.totalInteractions !== undefined) {
            this.elements.totalInteractions.textContent = stats.totalInteractions.toLocaleString();
        }
        
        if (stats.stageInfo) {
            this.elements.currentStageDisplay.textContent = stats.stageInfo.name.replace(' Gombonmongoli', '');
        }
    }

    updateMemoryStats(stats) {
        if (stats.vocabularySize !== undefined) {
            this.elements.vocabularySize.textContent = stats.vocabularySize.toLocaleString();
        }
    }

    getNextStageInteractions(currentStage) {
        const stageThresholds = {
            'baby': 2500,
            'child': 7500,
            'teen': 20000,
            'adult': 50000,
            'elder': 999999
        };
        return stageThresholds[currentStage] || 999999;
    }

    handleStageEvolution(newStage, stageInfo) {
        console.log(`🎉 EVOLUTION! From ${this.currentStage} to ${newStage}`);
        
        // Show evolution celebration
        this.showEvolutionCelebration(stageInfo);
        
        // Update current stage
        this.currentStage = newStage;
        
        // Trigger stage transition animation
        document.body.classList.add('stage-transition');
        setTimeout(() => {
            document.body.classList.remove('stage-transition');
        }, 2000);
    }

    showEvolutionCelebration(stageInfo) {
        // Create celebration overlay
        const celebration = document.createElement('div');
        celebration.className = 'evolution-celebration';
        celebration.innerHTML = `
            <div class="celebration-content">
                <div class="celebration-emoji">${stageInfo.emoji}</div>
                <h2>EVOLUTION COMPLETE!</h2>
                <p>Gombonmongoli has evolved to <strong>${stageInfo.name}</strong></p>
                <p>${stageInfo.description}</p>
            </div>
        `;
        
        document.body.appendChild(celebration);
        
        // Remove after animation
        setTimeout(() => {
            document.body.removeChild(celebration);
        }, 4000);
        
        // Show notification
        this.showNotification(`🎉 Evolution to ${stageInfo.name}!`, 'success');
        
        // Play screen shake effect
        document.body.classList.add('screen-shake');
        setTimeout(() => {
            document.body.classList.remove('screen-shake');
        }, 500);
    }

    // Feature Methods (simplified for now - would be expanded)
    async generateInstantRoast() {
        const category = this.elements.roastCategory.value;
        const roast = await this.api.generateInstantRoast(category);
        
        this.displayBotMessage({
            text: roast.text,
            stage: this.currentStage,
            type: 'roast'
        });
    }

    async generateCustomRoast() {
        const keywords = this.elements.customKeywords.value.trim();
        if (!keywords) {
            this.showNotification('Enter some keywords first!', 'warning');
            return;
        }
        
        // Simple custom roast generation
        const roastTemplates = [
            `Your ${keywords} is more disappointing than my expectations`,
            `I've seen better ${keywords} at a discount store`,
            `Even ${keywords} would be embarrassed to be associated with you`
        ];
        
        const randomTemplate = roastTemplates[Math.floor(Math.random() * roastTemplates.length)];
        
        this.displayBotMessage({
            text: randomTemplate,
            stage: this.currentStage,
            type: 'roast'
        });
        
        this.elements.customKeywords.value = '';
    }

    showModal(title, content) {
        this.elements.modalTitle.textContent = title;
        this.elements.modalContent.innerHTML = content;
        this.elements.modalOverlay.style.display = 'flex';
    }

    hideModal() {
        this.elements.modalOverlay.style.display = 'none';
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        this.elements.notifications.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
        
        // Click to dismiss
        notification.addEventListener('click', () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Placeholder methods for features (would be fully implemented)
    async showStageSelector() {
        this.showModal('Stage Selector', 'Stage selector coming soon...');
    }

    async showEvolutionHistory() {
        this.showModal('Evolution History', 'Evolution history coming soon...');
    }

    async forceEvolution() {
        const result = await this.api.forceEvolution();
        if (result.success) {
            this.showNotification(result.message, 'success');
        } else {
            this.showNotification(result.reason || 'Evolution failed', 'error');
        }
    }

    async showConversationHistory() {
        this.showModal('Conversation History', 'Your conversation history coming soon...');
    }

    async showPersonalityProfile() {
        this.showModal('Personality Profile', 'Your psychological profile coming soon...');
    }

    async showLearningProgress() {
        this.showModal('Learning Progress', 'Learning progress coming soon...');
    }

    async showHallOfShame() {
        this.showModal('Hall of Shame', 'Community hall of shame coming soon...');
    }

    async showCommunityStats() {
        this.showModal('Community Stats', 'Community statistics coming soon...');
    }

    async showTeachWords() {
        this.showModal('Teach Words', 'Teach new vocabulary coming soon...');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.gombonmongoliApp = new GombonmongoliApp();
});