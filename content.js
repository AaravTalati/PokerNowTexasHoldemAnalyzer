// PokerNow Analyzer Content Script
console.log('PokerNow Analyzer content script loaded.');

// Create a visible indicator that the extension is working
function createExtensionIndicator() {
    try {
        const indicator = document.createElement('div');
        indicator.id = 'pokernow-analyzer-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #4CAF50;
            color: white;
            padding: 10px;
            border-radius: 5px;
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        `;
        indicator.innerHTML = `
            <strong>PokerNow Analyzer Active</strong><br>
            <small>Press H to show/hide overlay</small>
        `;
        document.body.appendChild(indicator);
        
        // Remove indicator after 5 seconds
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }, 5000);
    } catch (error) {
        console.error('Error creating extension indicator:', error);
    }
}

// Import the parser, evaluator, and UI overlay
let parser;
let evaluator;
let uiOverlay;

// Function to initialize the parser and evaluator
function initializeComponents() {
    try {
        // Wait a bit for all scripts to load
        setTimeout(() => {
            try {
                // Create parser instance
                if (typeof PokerNowParser !== 'undefined') {
                    parser = new PokerNowParser();
                    console.log('PokerNow Parser initialized');
                } else {
                    console.error('PokerNowParser not available');
                }
                
                // Create evaluator instance
                if (typeof PokerHandEvaluator !== 'undefined') {
                    evaluator = new PokerHandEvaluator();
                    console.log('Poker Hand Evaluator initialized');
                } else {
                    console.error('PokerHandEvaluator not available');
                }
                
                // Create UI overlay instance
                if (typeof PokerNowUIOverlay !== 'undefined') {
                    uiOverlay = new PokerNowUIOverlay();
                    console.log('PokerNow UI Overlay initialized');
                } else {
                    console.error('PokerNowUIOverlay not available');
                }
            } catch (error) {
                console.error('Error initializing components:', error);
            }
        }, 1000); // Wait 1 second for scripts to load
    } catch (error) {
        console.error('Error in initializeComponents:', error);
    }
}

// Function to extract game state from PokerNow
function extractGameState() {
    try {
        if (!parser) {
            console.error('Parser not initialized');
            return null;
        }
        
        return parser.extractGameState();
    } catch (error) {
        console.error('Error extracting game state:', error);
        return null;
    }
}

// Function to analyze hand and suggest move
function analyzeHandAndSuggestMove(gameState) {
    try {
        if (!evaluator || !gameState) {
            console.error('Evaluator or game state not available');
            return null;
        }

        console.log('=== HAND ANALYSIS ===');
        
        // Use actual player count from game state
        const playerCount = gameState.playerCount || 2; // Default to 2 if not detected
        const position = 'middle'; // Default assumption
        
        console.log(`Analyzing hand with ${playerCount} players`);
        
        // Evaluate the hand with actual player count and position
        const handEvaluation = evaluator.evaluateHand(
            gameState.holeCards, 
            gameState.communityCards, 
            playerCount, 
            position
        );
        console.log('Hand evaluation:', handEvaluation);
        console.log('Hole cards:', gameState.holeCards);
        console.log('Community cards:', gameState.communityCards);
        console.log('All cards:', [...gameState.holeCards, ...gameState.communityCards]);
        
        // Debug: Check if we have a flush
        const allCards = [...gameState.holeCards, ...gameState.communityCards];
        const suitGroups = {};
        allCards.forEach(card => {
            if (!suitGroups[card.suit]) suitGroups[card.suit] = [];
            suitGroups[card.suit].push(card);
        });
        console.log('Suit groups:', suitGroups);
        for (const [suit, cards] of Object.entries(suitGroups)) {
            if (cards.length >= 5) {
                console.log(`FLUSH DETECTED: ${suit} with ${cards.length} cards:`, cards);
            }
        }
        
        // Calculate pot odds
        const potOdds = evaluator.calculatePotOdds(gameState.pot, gameState.currentBet);
        console.log('Pot odds calculation:', { pot: gameState.pot, currentBet: gameState.currentBet, potOdds: potOdds });
        
        // Count outs for drawing hands
        const outs = evaluator.countOuts(gameState.holeCards, gameState.communityCards);
        const drawingOdds = evaluator.calculateDrawingOdds(outs, 2); // 2 cards to come
        console.log('Outs calculation:', { 
            holeCards: gameState.holeCards, 
            communityCards: gameState.communityCards, 
            outs: outs, 
            drawingOdds: drawingOdds 
        });
        
        // Calculate implied odds (more advanced than pot odds)
        const impliedOdds = evaluator.calculateImpliedOdds(gameState.pot, gameState.currentBet, outs, playerCount);
        console.log('Implied odds calculation:', { impliedOdds: impliedOdds });
        
        // Calculate remaining deck composition
        // const remainingDeck = evaluator.calculateRemainingDeck(
        //     gameState.holeCards, 
        //     gameState.communityCards
        // );
        // console.log('Remaining deck calculation:', {
        //     holeCards: gameState.holeCards.length,
        //     communityCards: gameState.communityCards.length,
        //     remainingDeck: remainingDeck.length,
        //     expectedRemaining: 52 - gameState.holeCards.length - gameState.communityCards.length
        // });
        
        // Calculate win probability instead of suggesting action
        const winProbability = evaluator.calculateWinProbability(
            handEvaluation, 
            potOdds, 
            gameState.currentBet, 
            gameState.isMyTurn,
            playerCount,
            position
        );
        console.log('Win probability analysis:', winProbability);
        
        const analysis = {
            handEvaluation: handEvaluation,
            potOdds: potOdds,
            impliedOdds: impliedOdds,
            outs: outs,
            drawingOdds: drawingOdds,
            winProbability: winProbability,
            gameState: gameState,
            playerCount: playerCount,
            position: position,
            gamePhase: gameState.gamePhase
        };
        
        // Update UI overlay with analysis
        if (uiOverlay) {
            try {
                uiOverlay.updateAnalysis(analysis);
                if (gameState.isMyTurn && localStorage.getItem('pokernowOverlayHidden') !== 'true') {
                    uiOverlay.show();
                    // Remove the flashing notification
                    // uiOverlay.showNotification(`🎯 ${suggestion.action.toUpperCase()} - ${Math.round(suggestion.confidence * 100)}% confidence`, 'success');
                }
            } catch (error) {
                console.error('Error updating UI overlay:', error);
            }
        }
        
        return analysis;
    } catch (error) {
        console.error('Error analyzing hand:', error);
        return null;
    }
}

// Lightweight game monitoring - no heavy DOM watching
function startGameMonitoring() {
    try {
        console.log('Starting lightweight game monitoring...');
        
        // Show indicator that extension is working
        createExtensionIndicator();
        
        // Initialize components
        initializeComponents();
        
        // Extract initial state
        const initialState = extractGameState();
        console.log('Initial game state:', initialState);

        // Simple periodic check every 5 seconds instead of heavy DOM monitoring
        setInterval(() => {
            try {
                const currentState = extractGameState();
                if (currentState && currentState.isMyTurn) {
                    console.log('It\'s your turn! Analyzing hand...');
                    const analysis = analyzeHandAndSuggestMove(currentState);
                    if (analysis && analysis.winProbability) {
                        const percentage = Math.round(analysis.winProbability.winProbability * 100);
                        console.log('🎯 WIN PROBABILITY:', `${percentage}%`);
                        console.log('📝 Hand:', analysis.winProbability.handDescription);
                        console.log('📊 Game Phase:', analysis.winProbability.gamePhase);
                    }
                }
            } catch (error) {
                console.error('Error in periodic check:', error);
            }
        }, 5000); // Check every 5 seconds instead of 2
    } catch (error) {
        console.error('Error starting game monitoring:', error);
    }
}

// On page load, restore overlay state from localStorage
// (No longer force visible)
// localStorage.setItem('pokernowOverlayHidden', 'false');

// Listen for messages from background script (extension button) and popup
chrome.runtime && chrome.runtime.onMessage && chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === 'toggleOverlay') {
        if (uiOverlay) uiOverlay.toggle();
    }
    if (msg && msg.type === 'setPrimaryColor') {
        const setColorWhenReady = () => {
            if (uiOverlay && typeof uiOverlay.setPrimaryColor === 'function') {
                uiOverlay.setPrimaryColor(msg.color);
            } else {
                // Try again in 100ms if not ready
                setTimeout(setColorWhenReady, 100);
            }
        };
        setColorWhenReady();
    }
});

// On page load, set overlay color from storage
if (chrome && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['pokernowPrimaryColor'], (result) => {
        const color = result.pokernowPrimaryColor || '#4CAF50';
        // Wait for UI overlay to be initialized
        const setColorWhenReady = () => {
            if (uiOverlay && typeof uiOverlay.setPrimaryColor === 'function') {
                uiOverlay.setPrimaryColor(color);
            } else {
                // Try again in 500ms if not ready
                setTimeout(setColorWhenReady, 500);
            }
        };
        setColorWhenReady();
    });
}

// Make functions available globally for console access
window.pokerNowAnalyzer = {
    getState: () => parser ? parser.getGameState() : null,
    analyzeHand: () => {
        const state = parser ? parser.getGameState() : null;
        return state ? analyzeHandAndSuggestMove(state) : null;
    },
    showOverlay: () => uiOverlay ? uiOverlay.show() : null,
    hideOverlay: () => uiOverlay ? uiOverlay.hide() : null,
    toggleOverlay: () => uiOverlay ? uiOverlay.toggle() : null
};

// Start monitoring when page is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startGameMonitoring);
} else {
    startGameMonitoring();
}