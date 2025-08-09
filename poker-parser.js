// PokerNow Parser - Extracts game state from PokerNow DOM

class PokerNowParser {
    constructor() {
        this.gameState = {
            holeCards: [],
            communityCards: [],
            pot: 0,
            currentBet: 0,
            minRaise: 0,
            playerPosition: '',
            gamePhase: 'preflop', // preflop, flop, turn, river
            players: [],
            isMyTurn: false,
            actionButtons: []
        };
    }

    // Extract card information from DOM elements
    extractCards() {
        const cards = [];
        
        // Look for card elements with various possible selectors
        const cardSelectors = [
            '[class*="card"]',
            '[class*="Card"]',
            '[data-testid*="card"]',
            '[class*="playing-card"]',
            '[class*="PlayingCard"]'
        ];

        cardSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                const cardInfo = this.parseCardElement(element);
                if (cardInfo) {
                    cards.push(cardInfo);
                }
            });
        });

        return cards;
    }

    // Parse individual card element - updated for PokerNow structure
    parseCardElement(element) {
        try {
            const className = element.className || '';
            const textContent = element.textContent || '';
            
            // Look for PokerNow's specific span structure
            const valueSpan = element.querySelector('.value');
            const suitSpan = element.querySelector('.suit');
            
            if (valueSpan && suitSpan) {
                const rank = valueSpan.textContent || '';
                const suitCode = suitSpan.textContent || '';
                
                // Map suit codes to symbols
                const suitMap = { 's': '♠', 'h': '♥', 'd': '♦', 'c': '♣' };
                const suit = suitMap[suitCode];
                
                if (rank && suit) {
                    return {
                        rank: rank,
                        suit: suit,
                        element: element,
                        source: 'span-elements'
                    };
                }
            }
            
            // PokerNow specific parsing - look for card-s-Rank pattern
            const cardMatch = className.match(/card-([scdh])-([2-9TJQKA])/);
            if (cardMatch) {
                const suit = cardMatch[1];
                const rank = cardMatch[2];
                const suitMap = { 's': '♠', 'h': '♥', 'd': '♦', 'c': '♣' };
                
                return {
                    rank: rank,
                    suit: suitMap[suit],
                    element: element,
                    source: 'class-pattern'
                };
            }
            
            // Look for card rank and suit in text content
            const textMatch = textContent.match(/([2-9TJQKA])([scdh])/);
            if (textMatch) {
                const rank = textMatch[1];
                const suit = textMatch[2];
                const suitMap = { 's': '♠', 'h': '♥', 'd': '♦', 'c': '♣' };
                
                return {
                    rank: rank,
                    suit: suitMap[suit],
                    element: element,
                    source: 'text-content'
                };
            }

            // Look for card info in data attributes
            const rank = element.getAttribute('data-rank') || element.getAttribute('data-card-rank');
            const suit = element.getAttribute('data-suit') || element.getAttribute('data-card-suit');
            
            if (rank && suit) {
                return {
                    rank: rank,
                    suit: suit,
                    element: element,
                    source: 'data-attributes'
                };
            }

        } catch (error) {
            console.error('Error parsing card element:', error);
        }

        return null;
    }

    // Extract hole cards specifically
    extractHoleCards() {
        const holeCards = [];
        
        // Look for player's hole cards - PokerNow uses table-player-cards
        const playerCardContainers = document.querySelectorAll('.table-player-cards');
        
        playerCardContainers.forEach(container => {
            // Look for cards with visible content (not empty)
            const cards = container.querySelectorAll('.card-container');
            cards.forEach(card => {
                const textContent = card.textContent || '';
                if (textContent.trim() !== '') {
                    const cardInfo = this.parseCardElement(card);
                    if (cardInfo) {
                        holeCards.push(cardInfo);
                    }
                }
            });
        });
        
        return holeCards;
    }

    // Extract community cards specifically
    extractCommunityCards() {
        const communityCards = [];
        
        // Look for community cards - PokerNow uses table-cards
        const communityCardContainers = document.querySelectorAll('.table-cards');
        
        communityCardContainers.forEach(container => {
            const cards = container.querySelectorAll('.card-container');
            cards.forEach(card => {
                const textContent = card.textContent || '';
                if (textContent.trim() !== '') {
                    const cardInfo = this.parseCardElement(card);
                    if (cardInfo) {
                        communityCards.push(cardInfo);
                    }
                }
            });
        });
        
        return communityCards;
    }

    // Extract pot information
    extractPot() {
        console.log('=== EXTRACTING POT ===');
        
        const potSelectors = [
            '[class*="pot"]',
            '[class*="Pot"]',
            '[data-testid*="pot"]',
            '[class*="total-pot"]',
            '[class*="pot-size"]',
            '[class*="pot-amount"]',
            '.pot',
            '.Pot'
        ];

        for (const selector of potSelectors) {
            const elements = document.querySelectorAll(selector);
            console.log(`Trying selector "${selector}": found ${elements.length} elements`);
            
            for (const element of elements) {
                const text = element.textContent || element.innerText || '';
                console.log(`Pot element text: "${text}"`);
                
                // Look for numbers in the text
                const potMatch = text.match(/(\d+(?:,\d+)*)/);
                if (potMatch) {
                    const potValue = parseInt(potMatch[1].replace(/,/g, ''));
                    console.log(`Found pot value: ${potValue}`);
                    return potValue;
                }
            }
        }

        console.log('No pot value found, returning 0');
        return 0;
    }

    // Extract current bet information
    extractCurrentBet() {
        console.log('=== EXTRACTING CURRENT BET ===');
        
        const betSelectors = [
            '[class*="bet"]',
            '[class*="Bet"]',
            '[class*="current-bet"]',
            '[data-testid*="bet"]',
            '[class*="bet-amount"]',
            '[class*="call-amount"]',
            '[class*="raise-amount"]',
            '.bet',
            '.Bet'
        ];

        for (const selector of betSelectors) {
            const elements = document.querySelectorAll(selector);
            console.log(`Trying selector "${selector}": found ${elements.length} elements`);
            
            for (const element of elements) {
                const text = element.textContent || element.innerText || '';
                console.log(`Bet element text: "${text}"`);
                
                // Look for numbers in the text
                const betMatch = text.match(/(\d+(?:,\d+)*)/);
                if (betMatch) {
                    const betValue = parseInt(betMatch[1].replace(/,/g, ''));
                    console.log(`Found bet value: ${betValue}`);
                    return betValue;
                }
            }
        }

        console.log('No bet value found, returning 0');
        return 0;
    }

    // Determine game phase based on community cards
    determineGamePhase(communityCards) {
        if (communityCards.length === 0) return 'preflop';
        if (communityCards.length === 3) return 'flop';
        if (communityCards.length === 4) return 'turn';
        if (communityCards.length === 5) return 'river';
        return 'unknown';
    }

    // Check if it's the player's turn
    checkIfMyTurn() {
        const actionSelectors = [
            '[class*="action"]',
            '[class*="Action"]',
            '[class*="button"]',
            'button'
        ];

        for (const selector of actionSelectors) {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
                const text = element.textContent || element.innerText || '';
                if (text.toLowerCase().includes('fold') || 
                    text.toLowerCase().includes('call') || 
                    text.toLowerCase().includes('raise') ||
                    text.toLowerCase().includes('check')) {
                    return true;
                }
            }
        }

        return false;
    }

    // Extract action buttons
    extractActionButtons() {
        const buttons = [];
        const actionSelectors = [
            'button',
            '[class*="button"]',
            '[class*="action"]'
        ];

        actionSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                const text = element.textContent || element.innerText || '';
                if (text.toLowerCase().includes('fold') || 
                    text.toLowerCase().includes('call') || 
                    text.toLowerCase().includes('raise') ||
                    text.toLowerCase().includes('check') ||
                    text.toLowerCase().includes('all-in')) {
                    buttons.push({
                        action: text.toLowerCase(),
                        element: element,
                        enabled: !element.disabled
                    });
                }
            });
        });

        return buttons;
    }

    // Extract player count
    extractPlayerCount() {
        console.log('=== PLAYER COUNT DETECTION ===');
        
        // Method 1: Look for owner-table-name elements (actual players)
        const ownerTableNames = document.querySelectorAll('.owner-table-name');
        console.log(`Found ${ownerTableNames.length} owner-table-name elements`);
        
        if (ownerTableNames.length > 0) {
            const activePlayers = Array.from(ownerTableNames).filter(element => {
                const text = element.textContent || element.innerText || '';
                const hasName = text.trim().length > 0 && text !== 'Owner:';
                const isVisible = element.offsetWidth > 0 && element.offsetHeight > 0;
                console.log(`Owner element: "${text}", hasName=${hasName}, visible=${isVisible}`);
                return hasName && isVisible;
            });
            
            console.log(`Found ${activePlayers.length} active players using owner-table-name`);
            return Math.max(2, Math.min(9, activePlayers.length));
        }
        
        // Method 2: Look for actual player cards
        const playerCardContainers = document.querySelectorAll('.table-player-cards');
        const activeCardContainers = Array.from(playerCardContainers).filter(container => {
            const cards = container.querySelectorAll('.card-container');
            const hasCards = cards.length > 0;
            const isVisible = container.offsetWidth > 0 && container.offsetHeight > 0;
            console.log(`Player container: ${hasCards} cards, visible: ${isVisible}`);
            return hasCards && isVisible;
        });
        
        if (activeCardContainers.length > 0) {
            console.log(`Found ${activeCardContainers.length} players with cards`);
            return Math.max(2, Math.min(9, activeCardContainers.length));
        }
        
        // Method 3: Look for player elements with actual content
        const playerSelectors = [
            '[class*="player"]',
            '[class*="Player"]',
            '[class*="seat"]',
            '[class*="Seat"]',
            '.table-player',
            '.player-info'
        ];

        for (const selector of playerSelectors) {
            const elements = document.querySelectorAll(selector);
            console.log(`Trying selector "${selector}": found ${elements.length} elements`);
            
            // Count elements that have visible content (active players)
            const activePlayers = Array.from(elements).filter(element => {
                const text = element.textContent || element.innerText || '';
                const hasName = text.match(/[a-zA-Z]/); // Has letters (name)
                const hasChips = text.match(/\d+/); // Has numbers (chips)
                const hasCards = element.querySelector('.card-container'); // Has cards
                const isVisible = element.offsetWidth > 0 && element.offsetHeight > 0; // Actually visible
                const hasContent = hasName || hasChips || hasCards;
                
                console.log(`Player element: hasContent=${hasContent}, visible=${isVisible}, text="${text.substring(0, 20)}"`);
                return hasContent && isVisible;
            });
            
            if (activePlayers.length > 0) {
                console.log(`Found ${activePlayers.length} active players using selector: ${selector}`);
                return Math.max(2, Math.min(9, activePlayers.length));
            }
        }

        // Method 4: Look for betting elements (buttons, chips, etc.)
        const bettingElements = document.querySelectorAll('button, [class*="bet"], [class*="chip"]');
        const activeBettingElements = Array.from(bettingElements).filter(element => {
            const text = element.textContent || element.innerText || '';
            return text.toLowerCase().includes('fold') || 
                   text.toLowerCase().includes('call') || 
                   text.toLowerCase().includes('raise') ||
                   text.toLowerCase().includes('check');
        });
        
        if (activeBettingElements.length > 0) {
            console.log(`Found ${activeBettingElements.length} betting elements`);
            // Estimate players based on betting elements (usually 2-3 per player)
            const estimatedPlayers = Math.ceil(activeBettingElements.length / 3);
            return Math.max(2, Math.min(9, estimatedPlayers));
        }

        // Fallback: default to 2 players
        console.log('No players detected, defaulting to 2');
        return 2;
    }

    // Main function to extract all game state
    extractGameState() {
        console.log('Extracting game state from PokerNow...');

        // Extract hole cards and community cards separately
        const holeCards = this.extractHoleCards();
        const communityCards = this.extractCommunityCards();
        
        console.log('Hole cards found:', holeCards);
        console.log('Community cards found:', communityCards);

        // Extract other game information
        const pot = this.extractPot();
        const currentBet = this.extractCurrentBet();
        const isMyTurn = this.checkIfMyTurn();
        const actionButtons = this.extractActionButtons();
        const gamePhase = this.determineGamePhase(communityCards);
        const playerCount = this.extractPlayerCount();

        this.gameState = {
            holeCards: holeCards,
            communityCards: communityCards,
            pot: pot,
            currentBet: currentBet,
            minRaise: currentBet * 2, // Basic min raise calculation
            playerPosition: '',
            gamePhase: gamePhase,
            players: [],
            playerCount: playerCount,
            isMyTurn: isMyTurn,
            actionButtons: actionButtons
        };

        console.log('Extracted game state:', this.gameState);
        return this.gameState;
    }

    // Get the current game state
    getGameState() {
        return this.gameState;
    }
}

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PokerNowParser;
} 