const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const stageCalculator = require('../utils/stage-calculator');

// Get current evolution status
router.get('/status', (req, res) => {
  try {
    const globalState = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/global-state.json'), 'utf8'));
    const stages = JSON.parse(fs.readFileSync(path.join(__dirname, '../../config/stages.json'), 'utf8'));
    
    const currentStageInfo = stages.stages.find(stage => stage.id === globalState.currentStage);
    const nextStage = stages.stages.find(stage => stage.minInteractions > globalState.totalInteractions);
    
    res.json({
      totalInteractions: globalState.totalInteractions,
      currentStage: globalState.currentStage,
      stageInfo: currentStageInfo,
      nextStage: nextStage,
      progressPercent: globalState.stageProgressPercent,
      milestones: globalState.evolutionMilestones,
      isEvolutionReady: stageCalculator.isEvolutionReady(globalState.totalInteractions, globalState.currentStage)
    });

  } catch (error) {
    console.error('Evolution status error:', error);
    res.status(500).json({ error: 'Failed to get evolution status' });
  }
});

// Get all available stages
router.get('/stages', (req, res) => {
  try {
    const stages = JSON.parse(fs.readFileSync(path.join(__dirname, '../../config/stages.json'), 'utf8'));
    res.json(stages);
  } catch (error) {
    console.error('Stages error:', error);
    res.status(500).json({ error: 'Failed to get stages' });
  }
});

// Force evolution to next stage (admin only in production)
router.post('/evolve', (req, res) => {
  try {
    const globalState = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/global-state.json'), 'utf8'));
    const stages = JSON.parse(fs.readFileSync(path.join(__dirname, '../../config/stages.json'), 'utf8'));
    
    const evolution = stageCalculator.forceEvolution(globalState, stages.stages);
    
    if (evolution.evolved) {
      // Save updated state
      fs.writeFileSync(
        path.join(__dirname, '../data/global-state.json'), 
        JSON.stringify(evolution.newState, null, 2)
      );
      
      res.json({
        success: true,
        message: `Evolution successful! Gombonmongoli is now ${evolution.newStage.name}`,
        newStage: evolution.newStage,
        celebrationMessage: evolution.celebrationMessage
      });
    } else {
      res.json({
        success: false,
        message: evolution.reason
      });
    }

  } catch (error) {
    console.error('Evolution error:', error);
    res.status(500).json({ error: 'Failed to evolve' });
  }
});

// Temporarily revert to previous stage
router.post('/revert', (req, res) => {
  try {
    const { targetStage, duration } = req.body;
    
    if (!targetStage) {
      return res.status(400).json({ error: 'Target stage is required' });
    }

    const stages = JSON.parse(fs.readFileSync(path.join(__dirname, '../../config/stages.json'), 'utf8'));
    const stageExists = stages.stages.find(stage => stage.id === targetStage);
    
    if (!stageExists) {
      return res.status(400).json({ error: 'Invalid stage' });
    }

    // Implement temporary reversion logic
    const revertData = {
      originalStage: stageExists.id,
      revertedAt: new Date().toISOString(),
      duration: duration || 300000, // 5 minutes default
      reason: 'Community request'
    };

    res.json({
      success: true,
      message: `Temporarily reverted to ${stageExists.name}`,
      revertData: revertData,
      stageInfo: stageExists
    });

  } catch (error) {
    console.error('Revert error:', error);
    res.status(500).json({ error: 'Failed to revert stage' });
  }
});

// Get evolution history
router.get('/history', (req, res) => {
  try {
    const globalState = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/global-state.json'), 'utf8'));
    
    res.json({
      milestones: globalState.evolutionMilestones || [],
      totalInteractions: globalState.totalInteractions,
      evolutionTimeline: globalState.evolutionMilestones.map(milestone => ({
        stage: milestone.stage,
        reached: milestone.reached,
        interactionCount: milestone.interactionCount || 0,
        celebrationBurn: milestone.celebrationBurn
      }))
    });

  } catch (error) {
    console.error('Evolution history error:', error);
    res.status(500).json({ error: 'Failed to get evolution history' });
  }
});

module.exports = router;