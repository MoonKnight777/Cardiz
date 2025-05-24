// Game state
let gameState = {
    players: [],
    currentRound: 1,
    totalRounds: 13,
    maxCards: 7,
    scores: [],
    roundScores: [], // Array to store scores for each round
    trumpSuits: [],
    specialPlayerIndex: 0 // Track the special player's index
};

// DOM Elements
const gameSetup = document.getElementById('gameSetup');
const gamePlay = document.getElementById('gamePlay');
const gameResults = document.getElementById('gameResults');
const playerCount = document.getElementById('playerCount');
const maxCards = document.getElementById('maxCards');
const totalRounds = document.getElementById('totalRounds');
const playerNames = document.getElementById('playerNames');
const startGame = document.getElementById('startGame');
const currentRound = document.getElementById('currentRound');
const cardsThisRound = document.getElementById('cardsThisRound');
const trumpSuit = document.getElementById('trumpSuit');
const biddingPlayers = document.getElementById('biddingPlayers');
const scoringPlayers = document.getElementById('scoringPlayers');
const nextRound = document.getElementById('nextRound');
const finishGame = document.getElementById('finishGame');
const leaderboard = document.getElementById('leaderboard');
const downloadCSV = document.getElementById('downloadCSV');

// Event Listeners
playerCount.addEventListener('change', handlePlayerCountChange);
startGame.addEventListener('click', initializeGame);
// nextRound.addEventListener('click', proceedToNextRound);
// finishGame.addEventListener('click', endGame);
downloadCSV.addEventListener('click', downloadGameResults);

// Add event listeners for +/- buttons
document.querySelectorAll('.decrease-btn').forEach(btn => {
    btn.addEventListener('click', handleDecrease);
});

document.querySelectorAll('.increase-btn').forEach(btn => {
    btn.addEventListener('click', handleIncrease);
});

// Handle decrease button clicks
function handleDecrease(e) {
    const input = e.target.parentElement.querySelector('input');
    const currentValue = parseInt(input.value);
    const min = parseInt(input.min);
    if (currentValue > min) {
        input.value = currentValue - 1;
        input.dispatchEvent(new Event('change'));
    }
}

// Handle increase button clicks
function handleIncrease(e) {
    const input = e.target.parentElement.querySelector('input');
    const currentValue = parseInt(input.value);
    const max = parseInt(input.max);
    if (currentValue < max) {
        input.value = currentValue + 1;
        input.dispatchEvent(new Event('change'));
    }
}

// Calculate default max cards based on player count
function calculateDefaultMaxCards(playerCount) {
    const totalCards = 52;
    const maxCardsPerPlayer = Math.floor(totalCards / playerCount);
    return Math.min(maxCardsPerPlayer, 13); // Cap at 9 cards
}

// Handle player count changes
function handlePlayerCountChange() {
    const count = parseInt(playerCount.value);
    
    // Update max cards input
    const defaultMaxCards = calculateDefaultMaxCards(count);
    maxCards.value = defaultMaxCards;
    maxCards.max = defaultMaxCards;
    maxCards.min = defaultMaxCards; // Set minimum to same as maximum to prevent invalid values
    
    // Update player name inputs
    updatePlayerNameInputs();
}

// Update player name inputs when player count changes
function updatePlayerNameInputs() {
    const count = parseInt(playerCount.value);
    playerNames.innerHTML = '';
    
    for (let i = 0; i < count; i++) {
        const div = document.createElement('div');
        div.className = 'mb-4';
        div.innerHTML = `
            <label class="block text-sm font-medium text-gray-300">Player ${i + 1} Name</label>
            <input type="text" class="player-name mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500" required>
        `;
        playerNames.appendChild(div);
    }
}

// Initialize game
function initializeGame() {
    // Get player names
    const nameInputs = document.querySelectorAll('.player-name');
    gameState.players = Array.from(nameInputs).map(input => input.value.trim());
    
    // Validate inputs
    if (gameState.players.some(name => !name)) {
        alert('Please enter names for all players');
        return;
    }
    
    // Set game parameters
    gameState.maxCards = parseInt(maxCards.value);
    gameState.totalRounds = Math.min(parseInt(totalRounds.value), 50); // Cap at 50 rounds
    gameState.currentRound = 1;
    gameState.scores = Array(gameState.players.length).fill(0);
    gameState.trumpSuits = [];
    gameState.specialPlayerIndex = 0; // Start with first player as special
    
    // Show game play section
    gameSetup.classList.add('hidden');
    gamePlay.classList.remove('hidden');
    
    // Initialize first round
    updateRoundDisplay();
    renderBiddingPhase();
    
    // Hide scoring section initially
    document.querySelector('.bg-gray-800.rounded-lg.p-6.mb-8:nth-child(3)').classList.add('hidden');
    
    // Set initial trump suit
    updateTrumpSuit();

    // Add responsive classes to the game play section
    const gamePlaySection = document.querySelector('#gamePlay');
    if (gamePlaySection) {
        gamePlaySection.className = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8';
    }
}

// Update round display
function updateRoundDisplay() {
    currentRound.textContent = gameState.currentRound;
    const cards = calculateCardsThisRound();
    cardsThisRound.textContent = cards;
}

// Calculate cards for current round
function calculateCardsThisRound() {
    const max = gameState.maxCards;
    const round = gameState.currentRound;
    const cycle = 2 * max - 2;
    const position = (round - 1) % cycle;
    const cards = position < max ? position + 1 : 2 * max - position - 1;
    
    // Ensure total cards don't exceed 52
    const totalCards = cards * gameState.players.length;
    return totalCards <= 52 ? cards : Math.floor(52 / gameState.players.length);
}


function renderActionBar(phase) {
    // Remove existing action bar if present
    const existingBar = document.getElementById('actionBar');
    if (existingBar) existingBar.remove();

    const actionBar = document.createElement('div');
    actionBar.id = 'actionBar';
    actionBar.className = 'fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4 z-50 md:relative md:border-0';

    if (phase === 'bidding') {
        actionBar.innerHTML = `
            <div class="container mx-auto">
                <div class="flex justify-center">
                    <button id="proceedToScoring" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors w-full md:w-auto">
                        Proceed to Scoring
                    </button>
                    <button id="finishGame" class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors w-full sm:w-auto">
                        Finish Game
                    </button>
                </div>
            </div>
        `;
    } else if (phase === 'scoring') {
        actionBar.innerHTML = `
            <div class="container mx-auto">
                <div class="flex flex-col sm:flex-row justify-center gap-4">
                    <button id="nextRound" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors w-full sm:w-auto">
                        Next Round
                    </button>
                    <button id="finishGame" class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors w-full sm:w-auto">
                        Finish Game
                    </button>
                </div>
            </div>
        `;
    }

    document.body.appendChild(actionBar);
}


// Render bidding phase
function renderBiddingPhase() {
    biddingPlayers.innerHTML = '';
    const cardsThisRound = calculateCardsThisRound();
    
    // Reorder players to put special player last
    const orderedPlayers = [...gameState.players];
    const specialPlayer = orderedPlayers.splice(gameState.specialPlayerIndex, 1)[0];
    orderedPlayers.push(specialPlayer);
    
    // Create a container for the bidding section
    const biddingContainer = document.createElement('div');
    biddingContainer.className = 'space-y-4';
    
    orderedPlayers.forEach((player, index) => {
        const isSpecialPlayer = index === orderedPlayers.length - 1;
        
        // Calculate initial bid for special player
        const totalBidsSoFar = 0;
        const forbiddenBid = cardsThisRound - totalBidsSoFar;
        const initialBid = isSpecialPlayer && forbiddenBid === 0 ? 1 : 0;
        
        const div = document.createElement('div');
        div.className = 'bg-gray-800 p-4 rounded-lg border border-gray-700';
        div.innerHTML = `
            <h4 class="text-gray-200 mb-2">${player}${isSpecialPlayer ? ' (Special Player)' : ''}</h4>
            <div class="flex items-center gap-2">
                <button class="decrease-btn bg-gray-700 px-3 py-1 rounded hover:bg-gray-600 text-gray-200">-</button>
                <span class="bid-value text-xl text-gray-200">${initialBid}</span>
                <button class="increase-btn bg-gray-700 px-3 py-1 rounded hover:bg-gray-600 text-gray-200">+</button>
            </div>
            <div class="mt-2 text-sm text-gray-400">
                Max bid: ${cardsThisRound}
            </div>
        `;

        const bidValue = div.querySelector('.bid-value');
        const decreaseBtn = div.querySelector('.decrease-btn');
        const increaseBtn = div.querySelector('.increase-btn');

        // Increase button logic
        increaseBtn.addEventListener('click', () => {
            let currentBid = parseInt(bidValue.textContent);
            let newBid = currentBid + 1;
            const totalBids = getTotalBids();
            const forbiddenBid = cardsThisRound - totalBids;

            if (newBid > cardsThisRound) return;

            if (isSpecialPlayer && totalBids < cardsThisRound && newBid === forbiddenBid) {
                if (newBid + 1 <= cardsThisRound) {
                    bidValue.textContent = newBid + 1;
                    updateMaxBids();
                }
                return;
            }

            bidValue.textContent = newBid;
            updateMaxBids();
        });

        // Decrease button logic
        decreaseBtn.addEventListener('click', () => {
            let currentBid = parseInt(bidValue.textContent);
            let newBid = currentBid - 1;
            const totalBids = getTotalBids();
            const forbiddenBid = cardsThisRound - totalBids;

            if (newBid < 0) return;

            if (isSpecialPlayer && totalBids < cardsThisRound && newBid === forbiddenBid) {
                if (newBid - 1 >= 0) {
                    bidValue.textContent = newBid - 1;
                    updateMaxBids();
                }
                return;
            }

            bidValue.textContent = newBid;
            updateMaxBids();
        });

        biddingContainer.appendChild(div);
    });

    // Add the bidding container to the main container
    biddingPlayers.appendChild(biddingContainer);

    // Create a fixed bottom action bar
    renderActionBar('bidding');

    // Add event listener for the scoring button
    document.getElementById('proceedToScoring').addEventListener('click', () => {
        const totalBids = getTotalBids();
        if (totalBids === cardsThisRound) {
            alert('Total bids cannot equal the number of cards in the round. Please adjust the bids.');
            return;
        }
        document.querySelector('.bg-gray-800.rounded-lg.p-6.mb-8:nth-child(2)').classList.add('hidden');
        document.querySelector('.bg-gray-800.rounded-lg.p-6.mb-8:nth-child(3)').classList.remove('hidden');
        renderScoringPhase();
    });
    document.getElementById('finishGame').addEventListener('click', () => {
        if (confirm('Are you sure you want to finish the game?')) {
            endGame();
        }
    });

    function getTotalBids() {
        return Array.from(document.querySelectorAll('.bid-value'))
            .reduce((sum, el) => sum + parseInt(el.textContent), 0);
    }

    function updateMaxBids() {
        const bidValues = document.querySelectorAll('.bid-value');
        const maxBidTexts = document.querySelectorAll('.text-gray-400');
        const totalBids = getTotalBids();

        bidValues.forEach((bidVal, index) => {
            const currentBid = parseInt(bidVal.textContent);
            const isSpecial = index === bidValues.length - 1;
            const forbiddenBid = cardsThisRound - (totalBids - currentBid);

            // For special player, check if forbidden bid changed from 0 to non-zero
            if (isSpecial) {
                const previousForbiddenBid = cardsThisRound - (totalBids - currentBid - 1); // Calculate previous forbidden bid
                if (previousForbiddenBid === 0 && forbiddenBid !== 0 && currentBid === 1) {
                    // If forbidden bid changed from 0 to non-zero and current bid is 1, reset to 0
                    bidVal.textContent = '0';
                }
            }

            maxBidTexts[index].textContent = isSpecial && totalBids < cardsThisRound
                ? `Max bid: Cannot bid ${forbiddenBid}`
                : `Max bid: ${cardsThisRound}`;
        });
    }
}

// Render scoring phase
function renderScoringPhase() {
    scoringPlayers.innerHTML = '';
    
    // Get the bids from the bidding phase
    const bids = Array.from(document.querySelectorAll('.bid-value')).map(el => parseInt(el.textContent));
    
    // Create a container for the scoring section
    const scoringContainer = document.createElement('div');
    scoringContainer.className = 'space-y-4 mb-16 md:mb-0';
    
    gameState.players.forEach((player, index) => {
        const div = document.createElement('div');
        div.className = 'bg-gray-800 p-4 rounded-lg border border-gray-700';
        div.innerHTML = `
            <h4 class="text-gray-200 mb-2">${player}</h4>
            <div class="mb-2">
                <span class="text-sm text-gray-400">Bid: ${bids[index]}</span>
            </div>
            <div class="flex items-center gap-4">
                <label class="text-sm text-gray-400">Result:</label>
                <div class="flex items-center gap-4">
                    <label class="inline-flex items-center">
                        <input type="radio" name="result_${index}" value="hit" class="form-radio text-blue-600" checked>
                        <span class="ml-2 text-gray-200">Hit</span>
                    </label>
                    <label class="inline-flex items-center">
                        <input type="radio" name="result_${index}" value="miss" class="form-radio text-blue-600">
                        <span class="ml-2 text-gray-200">Miss</span>
                    </label>
                </div>
            </div>
        `;
        
        scoringContainer.appendChild(div);
    });

    // Add the scoring container to the main container
    scoringPlayers.appendChild(scoringContainer);

    // Create a fixed bottom action bar with direct buttons
    renderActionBar('scoring');

    // Add event listeners for the action buttons
    document.getElementById('nextRound').addEventListener('click', () => {
        proceedToNextRound();
    });

    document.getElementById('finishGame').addEventListener('click', () => {
        if (confirm('Are you sure you want to finish the game?')) {
            endGame();
        }
    });
}

// Proceed to next round
function proceedToNextRound() {
    // Get bids and results
    const bids = Array.from(document.querySelectorAll('.bid-value')).map(el => parseInt(el.textContent));
    const results = gameState.players.map((_, index) => {
        const selectedResult = document.querySelector(`input[name="result_${index}"]:checked`);
        if (!selectedResult) {
            alert('Please record results for all players');
            return null;
        }
        return selectedResult.value;
    });
    
    if (results.includes(null)) {
        return;
    }
    
    // Calculate scores for this round
    const roundScores = gameState.players.map((_, index) => {
        const bid = bids[index];
        const hit = results[index] === 'hit';
        return hit ? 10 + bid : 0;
    });
    
    // Store round scores
    gameState.roundScores.push(roundScores);
    
    // Update total scores
    gameState.scores = gameState.scores.map((score, index) => score + roundScores[index]);
    gameState.trumpSuits.push(trumpSuit.value);
    
    if (gameState.currentRound === gameState.totalRounds) {
        endGame();
    } else {
        gameState.currentRound++;
        // Update special player index (rotate to next player)
        gameState.specialPlayerIndex = (gameState.specialPlayerIndex + 1) % gameState.players.length;
        
        // Show bidding section and hide scoring section
        document.querySelector('.bg-gray-800.rounded-lg.p-6.mb-8:nth-child(2)').classList.remove('hidden');
        document.querySelector('.bg-gray-800.rounded-lg.p-6.mb-8:nth-child(3)').classList.add('hidden');
        updateRoundDisplay();
        updateTrumpSuit(); // Update trump suit for new round
        renderBiddingPhase();
    }
}

// End game and show results
function endGame() {
    gamePlay.classList.add('hidden');
    gameResults.classList.remove('hidden');
    document.getElementById('finishGame').classList.add('hidden');
    let nextround = document.getElementById('nextRound')
    let proceedToScoring = document.getElementById('proceedToScoring')
    if(nextround){
        nextround.classList.add('hidden');
    }
    if(proceedToScoring){
        proceedToScoring.classList.add('hidden');
    }
    
    // Create leaderboard
    const playerScores = gameState.players.map((player, index) => ({
        name: player,
        score: gameState.scores[index]
    })).sort((a, b) => b.score - a.score);
    
    leaderboard.innerHTML = `
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-700">
                <thead class="bg-gray-800">
                    <tr>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Rank</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Player</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Score</th>
                    </tr>
                </thead>
                <tbody class="bg-gray-900 divide-y divide-gray-800">
                    ${playerScores.map((player, index) => `
                        <tr>
                            <td class="px-4 py-2 text-sm text-gray-200">${index + 1}</td>
                            <td class="px-4 py-2 text-sm text-gray-200">${player.name}</td>
                            <td class="px-4 py-2 text-sm text-gray-200">${player.score}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Download game results as CSV
function downloadGameResults() {
    // Get the actual number of players
    const numPlayers = gameState.players.length;
    
    // Headers for the CSV - only include actual players
    const headers = [
        'Round',
        'Trump Suit',
        ...gameState.players.map(player => `${player} (Round Score)`),
    ];
    
    // Create rows for each played round
    const rows = gameState.roundScores.map((roundScore, index) => {
        const roundNumber = index + 1;
        const trumpSuit = gameState.trumpSuits[index];
        
        // Calculate running total for each player up to this round
        const runningTotals = gameState.players.map((_, playerIndex) => {
            return gameState.roundScores
                .slice(0, index + 1)
                .reduce((sum, scores) => sum + scores[playerIndex], 0);
        });
        
        return [
            roundNumber,
            trumpSuit,
            ...roundScore.slice(0, numPlayers), // Only include scores for actual players
        ];
    });
    
    // Add a final row with total scores - only for actual players
    const finalRow = [
        'Final',
        '',
        ...gameState.scores.slice(0, numPlayers), // Only include scores for actual players
    ];
    
    // Combine all data
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(',')),
        finalRow.join(',')
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'judgment_game_results.csv';
    link.click();
}

// Initialize the game setup
function initializeGameSetup() {
    // Set initial player count and trigger change event
    playerCount.value = 4;
    handlePlayerCountChange();

    // Add responsive classes to the game setup section
    const gameSetupSection = document.querySelector('#gameSetup');
    if (gameSetupSection) {
        gameSetupSection.className = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8';
    }
}

// Call initialization
initializeGameSetup();

// Update trump suit based on round number
function updateTrumpSuit() {
    const suits = ['spade', 'diamond', 'club', 'heart','lowest', 'spade','diamond', 'club', 'heart','highest'];
    const suitIndex = (gameState.currentRound - 1) % suits.length;
    trumpSuit.value = suits[suitIndex];
}