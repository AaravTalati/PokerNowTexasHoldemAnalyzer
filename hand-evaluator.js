// Poker Hand Evaluator - Calculates hand strength and suggests moves

class PokerHandEvaluator {
    constructor() {
        this.handRankings = {
            'high-card': 1,
            'pair': 2,
            'two-pair': 3,
            'three-of-a-kind': 4,
            'straight': 5,
            'flush': 6,
            'full-house': 7,
            'four-of-a-kind': 8,
            'straight-flush': 9,
            'royal-flush': 10
        };
        
        this.cardValues = {
            '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
            'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
        };
        
        this.suitValues = {
            '♠': 0, '♣': 1, '♥': 2, '♦': 3
        };
        
        // Preflop hand rankings (Sklansky-Chubukov rankings)
        this.preflopRankings = {
            'AA': 1, 'KK': 2, 'QQ': 3, 'JJ': 4, 'TT': 5, '99': 6, '88': 7, '77': 8,
            'AKs': 9, 'AQs': 10, 'AJs': 11, 'ATs': 12, 'A9s': 13, 'A8s': 14, 'A7s': 15,
            'AKo': 16, 'AQo': 17, 'AJo': 18, 'ATo': 19, 'A9o': 20, 'A8o': 21, 'A7o': 22,
            'KQs': 23, 'KJs': 24, 'KTs': 25, 'KQo': 26, 'KJo': 27, 'KTo': 28,
            'QJs': 29, 'QTs': 30, 'QJo': 31, 'QTo': 32,
            'JTs': 33, 'JTo': 34, 'T9s': 35, 'T9o': 36,
            '98s': 37, '98o': 38, '87s': 39, '87o': 40,
            '76s': 41, '76o': 42, '65s': 43, '65o': 44,
            '54s': 45, '54o': 46, '43s': 47, '43o': 48,
            '32s': 49, '32o': 50
        };
    }

    // Calculate remaining deck composition
    calculateRemainingDeck(holeCards, communityCards, visibleCards = []) {
        const allVisibleCards = [...holeCards, ...communityCards, ...visibleCards];
        const remainingCards = [];
        
        // Create full deck
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
        const suits = ['♠', '♣', '♥', '♦'];
        
        for (const rank of ranks) {
            for (const suit of suits) {
                const card = { rank, suit };
                const isVisible = allVisibleCards.some(visible => 
                    visible.rank === card.rank && visible.suit === card.suit
                );
                
                if (!isVisible) {
                    remainingCards.push(card);
                }
            }
        }
        
        return remainingCards;
    }

    // Calculate drawing odds for specific outs
    calculateDrawingOdds(outs, cardsToCome) {
        if (outs === 0) return 0;
        
        // Calculate remaining cards more accurately
        const totalCards = 52;
        const holeCards = 2;
        const maxCommunityCards = 5;
        const remainingCards = totalCards - holeCards - maxCommunityCards;
        const outsRemaining = Math.min(outs, remainingCards);
        
        if (cardsToCome === 1) {
            // Turn or river
            return outsRemaining / remainingCards;
        } else if (cardsToCome === 2) {
            // Flop to river (both turn and river)
            const missFirst = (remainingCards - outsRemaining) / remainingCards;
            const missSecond = (remainingCards - outsRemaining - 1) / (remainingCards - 1);
            return 1 - (missFirst * missSecond);
        }
        
        return 0;
    }

    // Count outs for drawing hands
    countOuts(holeCards, communityCards) {
        if (communityCards.length < 3) return 0; // Need at least flop
        
        const allCards = [...holeCards, ...communityCards];
        
        let outs = 0;
        
        // Check for flush draw
        const suitCounts = {};
        allCards.forEach(card => {
            suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
        });
        
        for (const [suit, count] of Object.entries(suitCounts)) {
            if (count === 4) {
                // Flush draw - 9 outs
                outs += 9;
                break; // Only count one flush draw
            }
        }
        
        // Check for straight draw
        const values = allCards.map(card => this.cardValues[card.rank]).sort((a, b) => a - b);
        const uniqueValues = [...new Set(values)];
        
        // Open-ended straight draw
        for (let i = 0; i <= uniqueValues.length - 4; i++) {
            const sequence = uniqueValues.slice(i, i + 4);
            if (sequence[3] - sequence[0] === 3) {
                // Open-ended straight draw - 8 outs
                outs += 8;
                break; // Only count one straight draw
            }
        }
        
        // Gutshot straight draw (only if no open-ended)
        if (outs === 0) {
            for (let i = 0; i <= uniqueValues.length - 3; i++) {
                const sequence = uniqueValues.slice(i, i + 3);
                if (sequence[2] - sequence[0] === 2) {
                    // Gutshot straight draw - 4 outs
                    outs += 4;
                    break;
                }
            }
        }
        
        // Check for overcard outs (if we have a pair)
        const valueGroups = this.groupByValue(allCards);
        const pairs = Object.entries(valueGroups).filter(([value, cards]) => cards.length >= 2);
        
        if (pairs.length > 0) {
            // We have at least a pair, check for overcard outs
            const pairValue = Math.max(...pairs.map(([value]) => parseInt(value)));
            const overcards = Object.keys(this.cardValues).filter(rank => 
                this.cardValues[rank] > pairValue && 
                !allCards.some(card => card.rank === rank)
            );
            outs += overcards.length * 3; // 3 outs per overcard
        }
        
        return outs;
    }

    // Adjust hand strength based on number of players
    adjustForPlayerCount(handStrength, playerCount) {
        const adjustments = {
            'high-card': { 2: -0.3, 3: -0.5, 4: -0.7, 5: -0.8, 6: -0.9, 7: -1.0, 8: -1.0 },
            'pair': { 2: -0.2, 3: -0.3, 4: -0.4, 5: -0.5, 6: -0.6, 7: -0.7, 8: -0.8 },
            'two-pair': { 2: -0.1, 3: -0.2, 4: -0.3, 5: -0.4, 6: -0.5, 7: -0.6, 8: -0.7 },
            'three-of-a-kind': { 2: 0.0, 3: -0.1, 4: -0.2, 5: -0.3, 6: -0.4, 7: -0.5, 8: -0.6 },
            'straight': { 2: 0.1, 3: 0.0, 4: -0.1, 5: -0.2, 6: -0.3, 7: -0.4, 8: -0.5 },
            'flush': { 2: 0.2, 3: 0.1, 4: 0.0, 5: -0.1, 6: -0.2, 7: -0.3, 8: -0.4 },
            'full-house': { 2: 0.3, 3: 0.2, 4: 0.1, 5: 0.0, 6: -0.1, 7: -0.2, 8: -0.3 },
            'four-of-a-kind': { 2: 0.4, 3: 0.3, 4: 0.2, 5: 0.1, 6: 0.0, 7: -0.1, 8: -0.2 },
            'straight-flush': { 2: 0.5, 3: 0.4, 4: 0.3, 5: 0.2, 6: 0.1, 7: 0.0, 8: -0.1 },
            'royal-flush': { 2: 0.6, 3: 0.5, 4: 0.4, 5: 0.3, 6: 0.2, 7: 0.1, 8: 0.0 }
        };
        
        const adjustment = adjustments[handStrength]?.[playerCount] || 0;
        return adjustment;
    }

    // Evaluate hand (main method)
    evaluateHand(holeCards, communityCards, playerCount = 6, position = 'middle') {
        try {
            console.log('=== EVALUATING HAND ===');
            console.log('Hole cards:', holeCards);
            console.log('Community cards:', communityCards);
            
            // If we have community cards, evaluate the complete hand
            if (communityCards && communityCards.length > 0) {
                const allCards = [...holeCards, ...communityCards];
                console.log('All cards for evaluation:', allCards);
                
                const evaluation = this.evaluateCompleteHand(allCards, playerCount);
                console.log('Complete hand evaluation:', evaluation);
                
                return {
                    ...evaluation,
                    holeCards: holeCards,
                    communityCards: communityCards,
                    gamePhase: this.getGamePhase(communityCards)
                };
            } else {
                // Preflop evaluation
                const evaluation = this.evaluatePreflop(holeCards, playerCount, position);
                console.log('Preflop evaluation:', evaluation);
                
                return {
                    ...evaluation,
                    holeCards: holeCards,
                    communityCards: [],
                    gamePhase: 'preflop'
                };
            }
        } catch (error) {
            console.error('Error in evaluateHand:', error);
            return {
                strength: 'error',
                description: 'Error evaluating hand',
                holeCards: holeCards,
                communityCards: communityCards,
                gamePhase: 'unknown'
            };
        }
    }

    // Evaluate incomplete hand (preflop, flop, turn)
    evaluateIncompleteHand(holeCards, communityCards, playerCount = 6, position = 'middle') {
        const gamePhase = this.getGamePhase(communityCards);
        
        if (gamePhase === 'preflop') {
            return this.evaluatePreflop(holeCards, playerCount, position);
        } else if (gamePhase === 'flop') {
            return this.evaluateFlop(holeCards, communityCards, playerCount);
        } else if (gamePhase === 'turn') {
            return this.evaluateTurn(holeCards, communityCards, playerCount);
        }
        
        return { strength: 'unknown', rank: 0, description: 'Unknown game phase' };
    }

    // Evaluate preflop hand with player count and position
    evaluatePreflop(holeCards, playerCount = 6, position = 'middle') {
        if (holeCards.length !== 2) {
            return { strength: 'incomplete', rank: 0, description: 'Need exactly 2 hole cards' };
        }

        const card1 = holeCards[0];
        const card2 = holeCards[1];
        
        const value1 = this.cardValues[card1.rank];
        const value2 = this.cardValues[card2.rank];
        const isSuited = card1.suit === card2.suit;
        
        // Create hand notation (e.g., "AKs", "QJo")
        const highCard = Math.max(value1, value2);
        const lowCard = Math.min(value1, value2);
        const highRank = this.getValueRank(highCard);
        const lowRank = this.getValueRank(lowCard);
        const handNotation = isSuited ? `${highRank}${lowRank}s` : `${highRank}${lowRank}o`;
        
        // Get preflop ranking
        const preflopRank = this.preflopRankings[handNotation] || 100;
        const maxRank = Math.max(...Object.values(this.preflopRankings));
        const normalizedRank = preflopRank / maxRank;
        
        // Adjust for player count
        const playerAdjustment = this.adjustForPlayerCount('pair', playerCount);
        
        // Adjust for position
        const positionMultiplier = {
            'early': 0.8,
            'middle': 1.0,
            'late': 1.2,
            'button': 1.3,
            'small-blind': 1.1,
            'big-blind': 0.9
        }[position] || 1.0;
        
        let adjustedRank = normalizedRank * positionMultiplier + playerAdjustment;
        
        // Determine strength category with better suited connector recognition
        let strength = 'high-card';
        let description = handNotation;
        
        if (value1 === value2) {
            strength = 'pair';
            description = `Pair of ${highRank}s`;
        } else if (Math.abs(value1 - value2) === 1) {
            if (isSuited) {
                strength = 'connectors';
                description = `Suited Connectors ${handNotation}`;
            } else {
                strength = 'connectors';
                description = `Connectors ${handNotation}`;
            }
        } else if (value1 >= 10 && value2 >= 10) {
            strength = 'broadway';
            description = `Broadway ${handNotation}`;
        } else if (isSuited) {
            strength = 'suited';
            description = `Suited ${handNotation}`;
        }
        
        // Boost suited connectors
        let finalRank = adjustedRank;
        if (strength === 'connectors' && isSuited) {
            finalRank *= 1.2; // 20% boost for suited connectors
        }
        
        // Add chart suggestion
        const chartSuggestion = this.getPreflopChartSuggestion(holeCards);
        return {
            strength: strength,
            rank: finalRank,
            description: `${description} (${Math.round(finalRank * 100)}% strength)`,
            suited: isSuited,
            highCard: highCard,
            lowCard: lowCard,
            preflopRank: preflopRank,
            playerCount: playerCount,
            position: position,
            chartSuggestion: chartSuggestion.action,
            chartColor: chartSuggestion.color,
            chartLabel: chartSuggestion.label
        };
    }

    // Get rank from value
    getValueRank(value) {
        const rankMap = {
            14: 'A', 13: 'K', 12: 'Q', 11: 'J', 10: 'T',
            9: '9', 8: '8', 7: '7', 6: '6', 5: '5', 4: '4', 3: '3', 2: '2'
        };
        return rankMap[value] || value;
    }

    // Evaluate complete hand (5+ cards)
    evaluateCompleteHand(allCards, playerCount = 6) {
        const sortedCards = this.sortCards(allCards);
        const hand = this.findBestHand(sortedCards);
        
        // Adjust for player count
        const playerAdjustment = this.adjustForPlayerCount(hand.strength, playerCount);
        const adjustedRank = this.handRankings[hand.strength] + playerAdjustment;
        
        return {
            strength: hand.strength,
            rank: adjustedRank,
            description: hand.description,
            cards: hand.cards,
            kickers: hand.kickers,
            playerCount: playerCount
        };
    }

    // Find the best 5-card hand from 7 cards
    findBestHand(cards) {
        console.log('=== FINDING BEST HAND ===');
        console.log('All cards:', cards);
        
        if (cards.length < 5) {
            console.log('Not enough cards for evaluation');
            return { strength: 'incomplete', description: 'Not enough cards' };
        }

        // Check for straight flush
        const straightFlush = this.checkStraightFlush(cards);
        if (straightFlush) {
            console.log('Found straight flush:', straightFlush);
            return straightFlush;
        }

        // Check for four of a kind
        const fourOfAKind = this.checkFourOfAKind(cards);
        if (fourOfAKind) {
            console.log('Found four of a kind:', fourOfAKind);
            return fourOfAKind;
        }

        // Check for full house
        const fullHouse = this.checkFullHouse(cards);
        if (fullHouse) {
            console.log('Found full house:', fullHouse);
            return fullHouse;
        }

        // Check for flush
        const flush = this.checkFlush(cards);
        if (flush) {
            console.log('Found flush:', flush);
            return flush;
        }

        // Check for straight
        const straight = this.checkStraight(cards);
        if (straight) {
            console.log('Found straight:', straight);
            return straight;
        }

        // Check for three of a kind
        const threeOfAKind = this.checkThreeOfAKind(cards);
        if (threeOfAKind) {
            console.log('Found three of a kind:', threeOfAKind);
            return threeOfAKind;
        }

        // Check for two pair
        const twoPair = this.checkTwoPair(cards);
        if (twoPair) {
            console.log('Found two pair:', twoPair);
            return twoPair;
        }

        // Check for pair
        const pair = this.checkPair(cards);
        if (pair) {
            console.log('Found pair:', pair);
            return pair;
        }

        // High card
        const highCard = this.checkHighCard(cards);
        console.log('Found high card:', highCard);
        return highCard;
    }

    // Sort cards by value (high to low)
    sortCards(cards) {
        return cards.sort((a, b) => {
            const valueA = this.cardValues[a.rank];
            const valueB = this.cardValues[b.rank];
            return valueB - valueA;
        });
    }

    // Check for straight flush
    checkStraightFlush(cards) {
        const flush = this.checkFlush(cards);
        if (!flush) return null;

        const straight = this.checkStraight(flush.cards);
        if (!straight) return null;

        const isRoyal = straight.cards[0].rank === 'A' && straight.cards[4].rank === 'T';
        
        return {
            strength: isRoyal ? 'royal-flush' : 'straight-flush',
            description: isRoyal ? 'Royal Flush' : 'Straight Flush',
            cards: straight.cards,
            kickers: []
        };
    }

    // Check for four of a kind
    checkFourOfAKind(cards) {
        const groups = this.groupByValue(cards);
        
        for (const [value, group] of Object.entries(groups)) {
            if (group.length >= 4) {
                const kickers = cards.filter(card => card.rank !== value).slice(0, 1);
                return {
                    strength: 'four-of-a-kind',
                    description: `Four of a Kind, ${value}s`,
                    cards: group.slice(0, 4),
                    kickers: kickers
                };
            }
        }
        
        return null;
    }

    // Check for full house
    checkFullHouse(cards) {
        const groups = this.groupByValue(cards);
        const pairs = Object.entries(groups).filter(([value, group]) => group.length >= 2);
        
        if (pairs.length >= 2) {
            // Find the highest three of a kind
            const threeOfAKind = pairs.find(([value, group]) => group.length >= 3);
            if (threeOfAKind) {
                const remainingPairs = pairs.filter(([value, group]) => value !== threeOfAKind[0]);
                if (remainingPairs.length > 0) {
                    const pair = remainingPairs[0];
                    return {
                        strength: 'full-house',
                        description: `Full House, ${threeOfAKind[0]}s over ${pair[0]}s`,
                        cards: [...threeOfAKind[1].slice(0, 3), ...pair[1].slice(0, 2)],
                        kickers: []
                    };
                }
            }
        }
        
        return null;
    }

    // Check for flush
    checkFlush(cards) {
        const groups = this.groupBySuit(cards);
        
        for (const [suit, group] of Object.entries(groups)) {
            if (group.length >= 5) {
                return {
                    strength: 'flush',
                    description: `Flush, ${suit}`,
                    cards: group.slice(0, 5),
                    kickers: []
                };
            }
        }
        
        return null;
    }

    // Check for straight
    checkStraight(cards) {
        const uniqueValues = [...new Set(cards.map(card => this.cardValues[card.rank]))].sort((a, b) => b - a);
        
        for (let i = 0; i <= uniqueValues.length - 5; i++) {
            const sequence = uniqueValues.slice(i, i + 5);
            if (sequence[0] - sequence[4] === 4) {
                const straightCards = [];
                for (const value of sequence) {
                    const card = cards.find(c => this.cardValues[c.rank] === value);
                    if (card) straightCards.push(card);
                }
                
                return {
                    strength: 'straight',
                    description: `Straight, ${this.getRankName(sequence[0])} high`,
                    cards: straightCards,
                    kickers: []
                };
            }
        }
        
        // Check for Ace-low straight (A,2,3,4,5)
        if (uniqueValues.includes(14) && uniqueValues.includes(2) && uniqueValues.includes(3) && 
            uniqueValues.includes(4) && uniqueValues.includes(5)) {
            const straightCards = [];
            const lowStraight = [14, 2, 3, 4, 5];
            for (const value of lowStraight) {
                const card = cards.find(c => this.cardValues[c.rank] === value);
                if (card) straightCards.push(card);
            }
            
            return {
                strength: 'straight',
                description: 'Straight, 5 high',
                cards: straightCards,
                kickers: []
            };
        }
        
        return null;
    }

    // Check for three of a kind
    checkThreeOfAKind(cards) {
        const groups = this.groupByValue(cards);
        
        for (const [value, group] of Object.entries(groups)) {
            if (group.length >= 3) {
                const kickers = cards.filter(card => card.rank !== value).slice(0, 2);
                return {
                    strength: 'three-of-a-kind',
                    description: `Three of a Kind, ${value}s`,
                    cards: group.slice(0, 3),
                    kickers: kickers
                };
            }
        }
        
        return null;
    }

    // Check for two pair
    checkTwoPair(cards) {
        const groups = this.groupByValue(cards);
        const pairs = Object.entries(groups).filter(([value, group]) => group.length >= 2);
        
        if (pairs.length >= 2) {
            const kickers = cards.filter(card => 
                card.rank !== pairs[0][0] && card.rank !== pairs[1][0]
            ).slice(0, 1);
            
            return {
                strength: 'two-pair',
                description: `Two Pair, ${pairs[0][0]}s and ${pairs[1][0]}s`,
                cards: [...pairs[0][1].slice(0, 2), ...pairs[1][1].slice(0, 2)],
                kickers: kickers
            };
        }
        
        return null;
    }

    // Check for pair
    checkPair(cards) {
        console.log('=== CHECKING FOR PAIR ===');
        console.log('Cards to check:', cards);
        
        const groups = this.groupByValue(cards);
        console.log('Groups by value:', groups);
        
        for (const [value, group] of Object.entries(groups)) {
            console.log(`Checking value ${value}: ${group.length} cards`);
            if (group.length >= 2) {
                const kickers = cards.filter(card => card.rank !== value).slice(0, 3);
                console.log(`PAIR FOUND: ${value}s with kickers:`, kickers);
                return {
                    strength: 'pair',
                    description: `Pair of ${value}s`,
                    cards: group.slice(0, 2),
                    kickers: kickers
                };
            }
        }
        
        console.log('No pair found');
        return null;
    }

    // Check for high card
    checkHighCard(cards) {
        return {
            strength: 'high-card',
            description: `High Card, ${cards[0].rank}`,
            cards: cards.slice(0, 1),
            kickers: cards.slice(1, 5)
        };
    }

    // Group cards by value
    groupByValue(cards) {
        const groups = {};
        cards.forEach(card => {
            if (!groups[card.rank]) groups[card.rank] = [];
            groups[card.rank].push(card);
        });
        return groups;
    }

    // Group cards by suit
    groupBySuit(cards) {
        const groups = {};
        cards.forEach(card => {
            if (!groups[card.suit]) groups[card.suit] = [];
            groups[card.suit].push(card);
        });
        return groups;
    }

    // Get rank name
    getRankName(value) {
        const rankNames = {
            14: 'Ace', 13: 'King', 12: 'Queen', 11: 'Jack',
            10: 'Ten', 9: 'Nine', 8: 'Eight', 7: 'Seven',
            6: 'Six', 5: 'Five', 4: 'Four', 3: 'Three', 2: 'Two'
        };
        return rankNames[value] || value;
    }

    // Get game phase
    getGamePhase(communityCards) {
        if (communityCards.length === 0) return 'preflop';
        if (communityCards.length === 3) return 'flop';
        if (communityCards.length === 4) return 'turn';
        if (communityCards.length === 5) return 'river';
        return 'unknown';
    }

    // Calculate pot odds
    calculatePotOdds(pot, callAmount) {
        console.log('=== POT ODDS CALCULATION ===');
        console.log('Pot size:', pot);
        console.log('Call amount:', callAmount);
        
        // Handle edge cases
        if (callAmount === 0) {
            console.log('No bet to call, pot odds: 0');
            return 0;
        }
        
        if (pot === 0) {
            console.log('No pot, pot odds: 0');
            return 0;
        }
        
        // Pot odds = (pot size) / (amount to call)
        // This gives us the ratio of pot to call amount
        const potOdds = pot / callAmount;
        
        console.log('Raw pot odds:', potOdds);
        
        // Round to 4 decimal places as requested
        const roundedPotOdds = Math.round(potOdds * 10000) / 10000;
        
        console.log('Rounded pot odds:', roundedPotOdds);
        console.log('Display format:', `${roundedPotOdds}:1`);
        
        return roundedPotOdds;
    }

    // Calculate implied odds (more advanced than pot odds)
    calculateImpliedOdds(pot, callAmount, outs, playerCount = 6) {
        console.log('=== IMPLIED ODDS CALCULATION ===');
        console.log('Pot size:', pot);
        console.log('Call amount:', callAmount);
        console.log('Outs:', outs);
        console.log('Player count:', playerCount);
        
        if (callAmount === 0 || outs === 0) {
            console.log('No bet to call or no outs, implied odds: 0');
            return 0;
        }
        
        // Calculate drawing odds
        const drawingOdds = this.calculateDrawingOdds(outs, 2); // 2 cards to come
        
        // Implied odds = (pot + potential future bets) / call amount
        // For simplicity, we'll estimate potential future bets based on outs and player count
        const estimatedFutureBets = outs * playerCount * 0.1; // Rough estimate
        const totalPotentialPot = pot + estimatedFutureBets;
        
        const impliedOdds = totalPotentialPot / callAmount;
        const roundedImpliedOdds = Math.round(impliedOdds * 10000) / 10000;
        
        console.log('Drawing odds:', drawingOdds);
        console.log('Estimated future bets:', estimatedFutureBets);
        console.log('Total potential pot:', totalPotentialPot);
        console.log('Implied odds:', roundedImpliedOdds);
        
        return roundedImpliedOdds;
    }

    // Calculate win probability based on pure statistics
    calculateWinProbability(handEvaluation, potOdds, currentBet, isMyTurn, playerCount = 6, position = 'middle') {
        const strength = handEvaluation.strength;
        const holeCards = handEvaluation.holeCards || [];
        const communityCards = handEvaluation.communityCards || [];
        const gamePhase = this.getGamePhase(communityCards);
        
        console.log('=== PURE STATISTICAL WIN PROBABILITY ===');
        console.log('Game phase:', gamePhase);
        console.log('Hole cards:', holeCards);
        console.log('Community cards:', communityCards);
        console.log('Player count:', playerCount);
        
        let winProbability = 0;
        let calculationMethod = '';
        
        if (gamePhase === 'preflop') {
            // Use standard preflop hand rankings
            winProbability = this.calculatePreflopProbability(holeCards, playerCount);
            calculationMethod = 'Standard preflop rankings';
        } else {
            // Calculate actual win percentage vs all possible opponent hands
            winProbability = this.calculatePostFlopProbability(holeCards, communityCards, playerCount);
            calculationMethod = 'Monte Carlo simulation vs all opponent hands';
        }
        
        console.log('Calculation method:', calculationMethod);
        console.log('Win probability:', winProbability);
        
        return {
            winProbability: winProbability,
            calculationMethod: calculationMethod,
            playerCount: playerCount,
            gamePhase: gamePhase,
            handStrength: strength,
            handDescription: handEvaluation.description || strength,
            holeCards: holeCards,
            communityCards: communityCards
        };
    }
    
    // Calculate preflop probability using standard rankings
    calculatePreflopProbability(holeCards, playerCount) {
        if (holeCards.length !== 2) return 0.5;
        
        const card1 = holeCards[0];
        const card2 = holeCards[1];
        const value1 = this.cardValues[card1.rank];
        const value2 = this.cardValues[card2.rank];
        const isSuited = card1.suit === card2.suit;
        
        // Create hand notation
        const highCard = Math.max(value1, value2);
        const lowCard = Math.min(value1, value2);
        const highRank = this.getValueRank(highCard);
        const lowRank = this.getValueRank(lowCard);
        const handNotation = isSuited ? `${highRank}${lowRank}s` : `${highRank}${lowRank}o`;
        
        // Standard preflop win percentages (heads-up, 2 players)
        const preflopPercentages = {
            // Pairs
            'AA': 85.3, 'KK': 82.4, 'QQ': 79.9, 'JJ': 77.2, 'TT': 74.6,
            '99': 71.7, '88': 68.8, '77': 65.9, '66': 62.9, '55': 59.9,
            '44': 56.9, '33': 53.9, '22': 50.9,
            
            // Suited broadway
            'AKs': 67.0, 'AQs': 66.4, 'AJs': 65.4, 'ATs': 64.4, 'A9s': 63.4,
            'KQs': 63.4, 'KJs': 62.4, 'KTs': 61.4, 'QJs': 61.4, 'QTs': 60.4,
            'JTs': 59.4,
            
            // Offsuit broadway
            'AKo': 65.4, 'AQo': 64.9, 'AJo': 63.9, 'ATo': 62.9, 'A9o': 61.9,
            'KQo': 61.9, 'KJo': 60.9, 'KTo': 59.9, 'QJo': 59.9, 'QTo': 58.9,
            'JTo': 57.9,
            
            // Suited connectors
            'T9s': 58.4, '98s': 57.4, '87s': 56.4, '76s': 55.4, '65s': 54.4,
            '54s': 53.4, '43s': 52.4, '32s': 51.4,
            
            // Offsuit connectors
            'T9o': 56.9, '98o': 55.9, '87o': 54.9, '76o': 53.9, '65o': 52.9,
            '54o': 51.9, '43o': 50.9, '32o': 49.9,
            
            // Suited one-gappers
            'J9s': 57.4, 'T8s': 56.4, '97s': 55.4, '86s': 54.4, '75s': 53.4,
            '64s': 52.4, '53s': 51.4, '42s': 50.4,
            
            // Offsuit one-gappers
            'J9o': 55.9, 'T8o': 54.9, '97o': 53.9, '86o': 52.9, '75o': 51.9,
            '64o': 50.9, '53o': 49.9, '42o': 48.9
        };
        
        let basePercentage = preflopPercentages[handNotation] || 50.0;
        
        // Adjust for player count (more players = lower percentage)
        if (playerCount > 2) {
            const playerAdjustment = Math.pow(0.5, playerCount - 2); // Exponential decay
            basePercentage = 50 + (basePercentage - 50) * playerAdjustment;
        }
        
        return basePercentage / 100; // Convert to decimal
    }
    
    // Calculate post-flop probability using Monte Carlo simulation
    calculatePostFlopProbability(holeCards, communityCards, playerCount) {
        if (holeCards.length !== 2) return 0.5;
        
        // Create remaining deck (remove our cards and community cards)
        const remainingDeck = this.calculateRemainingDeck(holeCards, communityCards);
        console.log(`Remaining cards in deck: ${remainingDeck.length} (should be ${52 - holeCards.length - communityCards.length})`);
        
        // Simulate opponent hands and calculate win percentage
        const simulations = 1000; // Number of simulations
        let wins = 0;
        let ties = 0;
        
        for (let i = 0; i < simulations; i++) {
            // Deal random opponent cards
            const shuffledDeck = [...remainingDeck].sort(() => Math.random() - 0.5);
            const opponentCards = shuffledDeck.slice(0, 2);
            
            // Create full hands
            const myHand = [...holeCards, ...communityCards];
            const opponentHand = [...opponentCards, ...communityCards];
            
            // Evaluate both hands using the correct method
            const myBestHand = this.findBestHand(myHand);
            const opponentBestHand = this.findBestHand(opponentHand);
            
            // Compare hands
            const myRank = this.handRankings[myBestHand.strength] || 0;
            const opponentRank = this.handRankings[opponentBestHand.strength] || 0;
            
            if (myRank > opponentRank) {
                wins++;
            } else if (myRank === opponentRank) {
                // Tie - split the win
                wins += 0.5;
                ties += 0.5;
            }
        }
        
        let winPercentage = (wins / simulations) * 100;
        
        // Adjust for player count (more players = lower percentage)
        if (playerCount > 2) {
            const playerAdjustment = Math.pow(0.5, playerCount - 2);
            winPercentage = 50 + (winPercentage - 50) * playerAdjustment;
        }
        
        // Additional adjustment for high card hands on river (they should be very weak)
        const gamePhase = this.getGamePhase(communityCards);
        if (gamePhase === 'river') {
            // Check if we have a high card hand
            const allCards = [...holeCards, ...communityCards];
            const handEvaluation = this.findBestHand(allCards);
            if (handEvaluation.strength === 'high-card') {
                // High card on river should have very low probability
                winPercentage = Math.min(winPercentage, 15); // Cap at 15% for high card on river
            }
        }
        
        console.log(`Simulation results: ${wins} wins, ${ties} ties out of ${simulations} simulations`);
        console.log(`Raw win percentage: ${winPercentage.toFixed(1)}%`);
        console.log(`Game phase: ${gamePhase}, Hand strength: ${this.findBestHand([...holeCards, ...communityCards]).strength}`);
        
        return winPercentage / 100; // Convert to decimal
    }

    // Get rank string from value
    getValueRank(value) {
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
        return ranks[value - 2] || 'A';
    }
    
    // Calculate remaining deck after removing known cards
    calculateRemainingDeck(holeCards, communityCards) {
        const allCards = [...holeCards, ...communityCards];
        const remainingDeck = [];
        
        // Create full deck
        const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        
        for (const suit of suits) {
            for (const rank of ranks) {
                const card = { rank, suit };
                // Check if this card is not in our known cards
                const isKnown = allCards.some(knownCard => 
                    knownCard.rank === card.rank && knownCard.suit === card.suit
                );
                if (!isKnown) {
                    remainingDeck.push(card);
                }
            }
        }
        
        console.log(`Known cards: ${allCards.length} (hole: ${holeCards.length}, community: ${communityCards.length})`);
        console.log(`Remaining deck: ${remainingDeck.length} cards`);
        
        return remainingDeck;
    }

    // Map hole cards to chart suggestion (returns {action, color, label})
    getPreflopChartSuggestion(holeCards) {
        if (!holeCards || holeCards.length !== 2) return { action: 'unknown', color: 'gray', label: 'Unknown' };
        const card1 = holeCards[0];
        const card2 = holeCards[1];
        const value1 = this.cardValues[card1.rank];
        const value2 = this.cardValues[card2.rank];
        const isSuited = card1.suit === card2.suit;
        // Always order high to low for chart lookup
        const high = Math.max(value1, value2);
        const low = Math.min(value1, value2);
        const highRank = this.getValueRank(high);
        const lowRank = this.getValueRank(low);
        let key = '';
        if (value1 === value2) {
            key = `${highRank}${lowRank}`; // e.g. 88
        } else if (isSuited) {
            key = `${highRank}${lowRank}s`;
        } else {
            key = `${highRank}${lowRank}o`;
        }
        // Corrected chart mapping from user
        const chart = {
          "AA": "red", "KK": "red", "QQ": "red", "JJ": "red", "TT": "red", "99": "red", "88": "red", "77": "red", "66": "yellow", "55": "yellow", "44": "blue", "33": "blue", "22": "blue",
          "AKs": "red", "AQs": "red", "AJs": "red", "ATs": "red", "A9s": "yellow", "A8s": "yellow", "A7s": "yellow", "A6s": "yellow", "A5s": "blue", "A4s": "blue", "A3s": "blue", "A2s": "blue",
          "KQs": "red", "KJs": "red", "KTs": "red", "K9s": "yellow", "K8s": "blue", "K7s": "blue", "K6s": "blue", "K5s": "blue", "K4s": "blue", "K3s": "blue", "K2s": "blue",
          "QJs": "red", "QTs": "red", "Q9s": "yellow", "Q8s": "yellow", "Q7s": "green", "Q6s": "green", "Q5s": "green", "Q4s": "green", "Q3s": "green", "Q2s": "green",
          "JTs": "red", "J9s": "red", "J8s": "yellow", "J7s": "blue", "J6s": "green", "J5s": "green", "J4s": "green", "J3s": "green", "J2s": "green",
          "T9s": "red", "T8s": "yellow", "T7s": "blue", "T6s": "green", "T5s": "green", "T4s": "green", "T3s": "green", "T2s": "green",
          "98s": "yellow", "97s": "blue", "96s": "blue", "95s": "green", "94s": "green", "93s": "green", "92s": "green",
          "87s": "blue", "86s": "blue", "85s": "green", "84s": "green", "83s": "green", "82s": "green",
          "76s": "blue", "75s": "blue", "74s": "green", "73s": "green", "72s": "green",
          "65s": "blue", "64s": "green", "63s": "green", "62s": "green",
          "54s": "blue", "53s": "green", "52s": "green",
          "43s": "green", "42s": "green",
          "32s": "green",
          "AKo": "red", "AQo": "red", "AJo": "red", "ATo": "red", "KQo": "red", "KJo": "red", "KTo": "red", "QJo": "yellow", "JTo": "yellow", "QTo": "yellow", "KTo": "yellow",
          "A9o": "blue", "A8o": "blue", "A7o": "blue", 
          "Q9o": "blue", "J9o": "blue", "J8o": "blue", 
          "T9o": "blue", "T8o": "blue", "98o": "blue", "97o": "blue", "87o": "blue",
          "A6o": "green", "A5o": "green", "A4o": "green", "A3o": "green", "A2o": "green",
          "K9o": "green", "K8o": "green", "K7o": "green", "K6o": "green", "K5o": "green", "K4o": "green", "K3o": "green", "K2o": "green",
          "Q8o": "green", "Q7o": "green", "Q6o": "green", "Q5o": "green", "Q4o": "green", "Q3o": "green", "Q2o": "green",
          "J7o": "green", "J6o": "green", "J5o": "green", "J4o": "green", "J3o": "green", "J2o": "green",
          "T7o": "green", "T6o": "green", "T5o": "green", "T4o": "green", "T3o": "green", "T2o": "green",
          "96o": "green", "95o": "green", "94o": "green", "93o": "green", "92o": "green",
          "86o": "green", "85o": "green", "84o": "green", "83o": "green", "82o": "green",
          "76o": "green", "75o": "green", "74o": "green", "73o": "green", "72o": "green",
          "65o": "green", "64o": "green", "63o": "green", "62o": "green",
          "54o": "green", "53o": "green", "52o": "green",
          "43o": "green", "42o": "green",
          "32o": "green"
        };
        const colorToAction = {
            red: 'Raise (Any Position)',
            yellow: 'Raise/Call (Mid/Late)',
            blue: 'Call (Late)',
            green: 'Fold'
        };
        const color = chart[key] || 'green';
        const action = colorToAction[color];
        return { action, color, label: key };
    }
}

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PokerHandEvaluator;
} 