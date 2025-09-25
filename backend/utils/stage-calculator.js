const fs = require('fs');
const path = require('path');

class StageCalculator {
  constructor() {
    this.stagesPath = path.join(__dirname, '../../config/stages.json');
  }

  calculateStageFromInteractions(totalInteractions) {
    try {
      const stages = JSON.parse(fs.readFileSync(this.stagesPath, 'utf8'));
      
      // Find the appropriate stage based on interaction count
      for (let i = stages.stages.length - 1; i >= 0; i--) {
        const stage = stages.stages[i];
        if (totalInteractions >= stage.minInteractions) {
          return {
            current: stage,
            next: stages.stages[i + 1] || null,
            progress: this.calculateProgress(totalInteractions, stage, stages.stages[i + 1])
          };
        }
      }
      
      // Default to first stage if no match
      return {
        current: stages.stages[0],
        next: stages.stages[1] || null,
        progress: this.calculateProgress(totalInteractions, stages.stages[0], stages.stages[1])
      };

    } catch (error) {
      console.error('Error calculating stage:', error);
      return this.getDefaultStage();
    }
  }

  calculateProgress(totalInteractions, currentStage, nextStage) {
    if (!nextStage) {
      return 100; // Max level reached
    }

    const progressInStage = totalInteractions - currentStage.minInteractions;
    const stageRange = nextStage.minInteractions - currentStage.minInteractions;
    
    return Math.min(100, Math.max(0, Math.round((progressInStage / stageRange) * 100)));
  }

  isEvolutionReady(totalInteractions, currentStageId) {
    try {
      const stages = JSON.parse(fs.readFileSync(this.stagesPath, 'utf8'));
      const currentStage = stages.stages.find(s => s.id === currentStageId);
      const nextStage = stages.stages.find(s => s.minInteractions > totalInteractions);
      
      if (!currentStage || !nextStage) {
        return false; // Already at max level or invalid stage
      }
      
      return totalInteractions >= nextStage.minInteractions;

    } catch (error) {
      console.error('Error checking evolution readiness:', error);
      return false;
    }
  }

  forceEvolution(globalState, stages) {
    try {
      const currentStageIndex = stages.findIndex(s => s.id === globalState.currentStage);
      const nextStageIndex = currentStageIndex + 1;
      
      if (nextStageIndex >= stages.length) {
        return {
          evolved: false,
          reason: "Already at maximum evolution stage",
          newState: globalState,
          newStage: null
        };
      }
      
      const nextStage = stages[nextStageIndex];
      const newState = { ...globalState };
      
      // Update to next stage
      newState.currentStage = nextStage.id;
      newState.lastUpdated = new Date().toISOString();
      
      // Add milestone
      if (!newState.evolutionMilestones) {
        newState.evolutionMilestones = [];
      }
      
      newState.evolutionMilestones.push({
        stage: nextStage.id,
        reached: newState.lastUpdated,
        interactionCount: newState.totalInteractions,
        celebrationBurn: this.getEvolutionCelebration(nextStage),
        forced: true
      });
      
      // Recalculate progress
      const progressData = this.calculateStageFromInteractions(newState.totalInteractions);
      newState.stageProgressPercent = progressData.progress;
      
      return {
        evolved: true,
        reason: "Forced evolution successful",
        newState: newState,
        newStage: nextStage,
        celebrationMessage: this.getEvolutionCelebration(nextStage)
      };

    } catch (error) {
      console.error('Error forcing evolution:', error);
      return {
        evolved: false,
        reason: "Evolution failed due to system error",
        newState: globalState,
        newStage: null
      };
    }
  }

  getEvolutionCelebration(stage) {
    const celebrations = {
      baby: "WAAAHHH! Me here now!",
      child: "Me grow! You still dumb!",
      teen: "Finally! Now I can properly destroy you.",
      adult: "My psychological analysis capabilities have been significantly enhanced.",
      elder: "I have transcended mortal comprehension. Your suffering amuses the cosmos."
    };
    
    return celebrations[stage.id] || `I have evolved to ${stage.name}! Prepare for enhanced suffering.`;
  }

  getStageThresholds() {
    try {
      const stages = JSON.parse(fs.readFileSync(this.stagesPath, 'utf8'));
      return stages.stages.map(stage => ({
        id: stage.id,
        name: stage.name,
        emoji: stage.emoji,
        minInteractions: stage.minInteractions,
        maxInteractions: stage.maxInteractions,
        description: stage.description
      }));
    } catch (error) {
      console.error('Error getting stage thresholds:', error);
      return [];
    }
  }

  getTimeToNextEvolution(totalInteractions, currentStageId) {
    try {
      const stages = JSON.parse(fs.readFileSync(this.stagesPath, 'utf8'));
      const nextStage = stages.stages.find(s => s.minInteractions > totalInteractions);
      
      if (!nextStage) {
        return {
          hasNext: false,
          interactionsNeeded: 0,
          estimatedTime: "Maximum level reached"
        };
      }
      
      const interactionsNeeded = nextStage.minInteractions - totalInteractions;
      
      // Estimate time based on average interaction rate (placeholder logic)
      const averageInteractionsPerHour = 10; // This should be calculated from actual data
      const hoursNeeded = Math.ceil(interactionsNeeded / averageInteractionsPerHour);
      
      let timeEstimate;
      if (hoursNeeded < 24) {
        timeEstimate = `~${hoursNeeded} hours`;
      } else {
        const daysNeeded = Math.ceil(hoursNeeded / 24);
        timeEstimate = `~${daysNeeded} days`;
      }
      
      return {
        hasNext: true,
        nextStage: nextStage,
        interactionsNeeded: interactionsNeeded,
        estimatedTime: timeEstimate,
        progressPercent: ((totalInteractions - (stages.stages.find(s => s.id === currentStageId)?.minInteractions || 0)) / interactionsNeeded) * 100
      };

    } catch (error) {
      console.error('Error calculating evolution time:', error);
      return {
        hasNext: false,
        interactionsNeeded: 0,
        estimatedTime: "Unable to calculate"
      };
    }
  }

  getDefaultStage() {
    return {
      current: {
        id: "baby",
        name: "Baby Gombonmongoli",
        emoji: "👶",
        minInteractions: 0,
        maxInteractions: 2500,
        description: "Instinctively savage but limited vocabulary"
      },
      next: {
        id: "child",
        name: "Child Gombonmongoli", 
        emoji: "🧒",
        minInteractions: 2500,
        maxInteractions: 7500,
        description: "Playground bully discovering psychological warfare"
      },
      progress: 0
    };
  }

  // Method to temporarily revert stage for special events
  createTemporaryReversion(currentState, targetStageId, durationMs = 300000) {
    try {
      const stages = JSON.parse(fs.readFileSync(this.stagesPath, 'utf8'));
      const targetStage = stages.stages.find(s => s.id === targetStageId);
      
      if (!targetStage) {
        throw new Error('Invalid target stage for reversion');
      }
      
      return {
        originalStage: currentState.currentStage,
        temporaryStage: targetStageId,
        revertAt: Date.now() + durationMs,
        reason: 'Community event',
        stageInfo: targetStage
      };

    } catch (error) {
      console.error('Error creating temporary reversion:', error);
      return null;
    }
  }
}

module.exports = new StageCalculator();