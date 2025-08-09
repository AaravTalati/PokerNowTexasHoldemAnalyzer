// PokerNow UI Overlay - Displays analysis and suggestions on the table

class PokerNowUIOverlay {
    constructor() {
        this.overlay = null;
        this.isVisible = false;
        this.currentAnalysis = null;
        this.primaryColor = '#4CAF50'; // Default color
        this.createOverlay();
    }

    // Create the main overlay element
    createOverlay() {
        try {
            this.overlay = document.createElement('div');
            this.overlay.id = 'pokernow-analyzer-overlay';
            this.overlay.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                width: 300px;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                border-radius: 10px;
                padding: 15px;
                font-family: Arial, sans-serif;
                font-size: 14px;
                z-index: 10000;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
                border: 2px solid #4CAF50;
                display: none;
            `;

            this.overlay.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h3 style="margin: 0; color: #4CAF50; font-size: 16px;" class="primary-color">🎯 PokerNow Analyzer</h3>
                    <button id="overlay-close" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer;">×</button>
                </div>
                <div>
                    <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;" class="hand-strength">Waiting...</div>
                    <div style="color: #ccc; font-size: 12px; margin-bottom: 10px;" class="hand-description">-</div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                        <div>
                            <div style="color: #4CAF50; font-weight: bold;" class="primary-color">Pot Odds</div>
                            <div class="pot-odds-value">-</div>
                        </div>
                        <div>
                            <div style="color: #4CAF50; font-weight: bold;" class="primary-color">Implied Odds</div>
                            <div class="implied-odds-value">-</div>
                        </div>
                        <div>
                            <div style="color: #4CAF50; font-weight: bold;" class="primary-color">Players</div>
                            <div class="players-value">-</div>
                        </div>
                        <div>
                            <div style="color: #4CAF50; font-weight: bold;" class="primary-color">Game Phase</div>
                            <div class="game-phase-value">-</div>
                        </div>
                        <div>
                            <div style="color: #4CAF50; font-weight: bold;" class="primary-color">Outs</div>
                            <div class="outs-value" title="Outs = cards that can improve your hand. Examples: 9 outs for flush draw, 8 outs for open-ended straight draw, 4 outs for gutshot straight draw">-</div>
                        </div>
                        <div>
                            <div style="color: #4CAF50; font-weight: bold;" class="primary-color">Drawing Odds</div>
                            <div class="drawing-odds-value">-</div>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <div style="color: #4CAF50; font-weight: bold; margin-bottom: 5px;" class="primary-color">Win Probability</div>
                        <div class="win-probability" style="font-size: 20px; font-weight: bold; text-align: center; padding: 10px; border-radius: 5px; margin-bottom: 5px; background: #9E9E9E;">-</div>
                        <div class="win-probability-details" style="text-align: center; color: #ccc; font-size: 12px; margin-top: 5px;">-</div>
                    </div>
                    
                    <div style="text-align: center; font-size: 10px; color: #666;">
                        Press H to hide/show
                    </div>
                </div>
            `;

            // Add close button functionality
            const closeButton = this.overlay.querySelector('#overlay-close');
            if (closeButton) {
                closeButton.addEventListener('click', () => {
                    // Only hide for session, do not set persistent flag
                    this.overlay.style.display = 'none';
                    this.isVisible = false;
                });
            }

            // Add keyboard shortcut
            document.addEventListener('keydown', (e) => {
                if (e.key.toLowerCase() === 'h') {
                    this.toggle();
                }
            });

            // Show or hide overlay based on previous state
            if (localStorage.getItem('pokernowOverlayHidden') === 'true') {
                this.overlay.style.display = 'none';
                this.isVisible = false;
            } else {
                this.overlay.style.display = 'block';
                this.isVisible = true;
            }

            document.body.appendChild(this.overlay);
            console.log('UI Overlay created successfully');
        } catch (error) {
            console.error('Error creating UI overlay:', error);
        }
    }

    // Show the overlay
    show() {
        try {
            if (this.overlay) {
                this.overlay.style.display = 'block';
                this.isVisible = true;
                localStorage.setItem('pokernowOverlayHidden', 'false');
            }
        } catch (error) {
            console.error('Error showing overlay:', error);
        }
    }

    // Hide the overlay
    hide() {
        try {
            if (this.overlay) {
                this.overlay.style.display = 'none';
                this.isVisible = false;
                localStorage.setItem('pokernowOverlayHidden', 'true');
            }
        } catch (error) {
            console.error('Error hiding overlay:', error);
        }
    }

    // Toggle overlay visibility
    toggle() {
        try {
            if (this.isVisible) {
                this.hide();
            } else {
                this.show();
            }
        } catch (error) {
            console.error('Error toggling overlay:', error);
        }
    }

    // Update the overlay with new analysis data
    updateAnalysis(analysis) {
        try {
            if (!analysis || !this.overlay) return;

            this.currentAnalysis = analysis;

            // Update hand strength
            const handStrengthEl = this.overlay.querySelector('.hand-strength');
            const handDescriptionEl = this.overlay.querySelector('.hand-description');
            const winProbabilityEl = this.overlay.querySelector('.win-probability');
            const winProbabilityDetailsEl = this.overlay.querySelector('.win-probability-details');

            // Preflop: show only chart suggestion, hide win probability
            if (analysis.gamePhase === 'preflop' && analysis.handEvaluation && analysis.handEvaluation.chartSuggestion) {
                if (handStrengthEl) {
                    handStrengthEl.textContent = `Preflop Suggestion:`;
                }
                if (handDescriptionEl) {
                    handDescriptionEl.textContent = `${analysis.handEvaluation.chartSuggestion}`;
                    handDescriptionEl.style.color = this.getChartColor(analysis.handEvaluation.chartColor);
                }
                if (winProbabilityEl) {
                    winProbabilityEl.textContent = '-';
                    winProbabilityEl.style.backgroundColor = '#9E9E9E';
                }
                if (winProbabilityDetailsEl) {
                    winProbabilityDetailsEl.textContent = 'Based on starting hand chart';
                }
                return;
            }

            // Postflop: show win probability and normal analysis
            if (handStrengthEl && analysis.handEvaluation) {
                const strength = analysis.handEvaluation.strength;
                const description = analysis.handEvaluation.description;
                handStrengthEl.textContent = this.formatHandStrength(strength);
                if (handDescriptionEl) {
                    handDescriptionEl.textContent = description;
                    handDescriptionEl.style.color = '#ccc';
                }
            }

            // Update game info
            const potOddsEl = this.overlay.querySelector('.pot-odds-value');
            const impliedOddsEl = this.overlay.querySelector('.implied-odds-value');
            const playersEl = this.overlay.querySelector('.players-value');
            const gamePhaseEl = this.overlay.querySelector('.game-phase-value');
            const outsEl = this.overlay.querySelector('.outs-value');
            const drawingOddsEl = this.overlay.querySelector('.drawing-odds-value');

            if (potOddsEl) {
                potOddsEl.textContent = (typeof analysis.potOdds === 'number') ? `${Math.round(analysis.potOdds * 10000) / 10000}:1` : '-';
            }
            if (impliedOddsEl) {
                impliedOddsEl.textContent = (typeof analysis.impliedOdds === 'number') ? `${Math.round(analysis.impliedOdds * 10000) / 10000}:1` : '-';
            }
            if (playersEl) {
                playersEl.textContent = analysis.playerCount || '-';
            }
            if (gamePhaseEl) {
                gamePhaseEl.textContent = analysis.gamePhase || '-';
            }
            if (outsEl) {
                outsEl.textContent = (typeof analysis.outs === 'number') ? analysis.outs : '-';
            }
            if (drawingOddsEl) {
                drawingOddsEl.textContent = (typeof analysis.drawingOdds === 'number') ? `${Math.round(analysis.drawingOdds * 10000) / 10000}` : '-';
            }

            // Update win probability with new statistical data
            if (analysis.winProbability && winProbabilityEl) {
                const probability = analysis.winProbability.winProbability;
                const percentage = Math.round(probability * 10000) / 100; // Round to 2 decimal places for percentage
                const calculationMethod = analysis.winProbability.calculationMethod || 'Unknown';
                const gamePhase = analysis.winProbability.gamePhase || 'Unknown';
                
                winProbabilityEl.textContent = `${percentage.toFixed(2)}%`;
                winProbabilityEl.style.backgroundColor = this.getProbabilityColor(percentage);
                
                if (winProbabilityDetailsEl) {
                    winProbabilityDetailsEl.textContent = `${calculationMethod} | ${gamePhase}`;
                }
            }
        } catch (error) {
            console.error('Error updating analysis:', error);
        }
    }

    // Format hand strength for display
    formatHandStrength(strength) {
        try {
            const strengthMap = {
                'royal-flush': '🃏 Royal Flush',
                'straight-flush': '🔥 Straight Flush',
                'four-of-a-kind': '🃏 Four of a Kind',
                'full-house': '🏠 Full House',
                'flush': '💎 Flush',
                'straight': '📏 Straight',
                'three-of-a-kind': '🎲 Three of a Kind',
                'two-pair': '👥 Two Pair',
                'pair': '👤 Pair',
                'high-card': '🃏 High Card',
                'connectors': '🔗 Connectors',
                'broadway': '👑 Broadway',
                'incomplete': '⏳ Incomplete'
            };
            return strengthMap[strength] || strength;
        } catch (error) {
            console.error('Error formatting hand strength:', error);
            return strength;
        }
    }

    // Get color for probability
    getProbabilityColor(percentage) {
        if (percentage >= 80) return '#4CAF50'; // Green - very strong
        if (percentage >= 60) return '#8BC34A'; // Light green - strong
        if (percentage >= 40) return '#FFC107'; // Yellow - medium
        if (percentage >= 20) return '#FF9800'; // Orange - weak
        return '#F44336'; // Red - very weak
    }

    // Add a helper to get chart color
    getChartColor(chartColor) {
        if (chartColor === 'red') return '#F44336';
        if (chartColor === 'yellow') return '#FFC107';
        if (chartColor === 'blue') return '#2196F3';
        if (chartColor === 'green') return '#9E9E9E';
        return '#ccc';
    }

    // Get color for action
    getActionColor(action) {
        try {
            const colorMap = {
                'RAISE': '#4CAF50', // Green
                'CALL': '#2196F3',  // Blue
                'FOLD': '#F44336',  // Red
                'CHECK': '#FF9800', // Orange
                'WAIT': '#9E9E9E'   // Gray
            };
            return colorMap[action] || '#9E9E9E';
        } catch (error) {
            console.error('Error getting action color:', error);
            return '#9E9E9E';
        }
    }

    // Show notification
    showNotification(message, type = 'info') {
        try {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: ${type === 'success' ? '#4CAF50' : type === 'warning' ? '#FF9800' : '#2196F3'};
                color: white;
                padding: 15px 20px;
                border-radius: 5px;
                font-family: Arial, sans-serif;
                font-size: 14px;
                z-index: 10001;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            `;
            notification.textContent = message;

            document.body.appendChild(notification);

            // Remove after 3 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 3000);
        } catch (error) {
            console.error('Error showing notification:', error);
        }
    }

    // Destroy the overlay
    destroy() {
        try {
            if (this.overlay && this.overlay.parentNode) {
                this.overlay.parentNode.removeChild(this.overlay);
            }
        } catch (error) {
            console.error('Error destroying overlay:', error);
        }
    }

    setPrimaryColor(color) {
        try {
            if (!this.overlay) return;
            
            this.primaryColor = color;
            
            // Update border color
            this.overlay.style.borderColor = color;
            
            // Update all elements with the primary-color class
            const primaryColorElements = this.overlay.querySelectorAll('.primary-color');
            primaryColorElements.forEach(el => {
                el.style.color = color;
            });
            
        } catch (error) {
            console.error('Error setting primary color:', error);
        }
    }
}

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PokerNowUIOverlay;
} 