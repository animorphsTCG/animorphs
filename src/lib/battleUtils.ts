
import { AnimorphCard } from "@/types";
import { fetchAnimorphCards, getRandomDeck } from "./db";

// Shuffle array helper function
export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Generate decks for players with specified size
export async function generatePlayerDecks(
  playerCount: number, 
  deckSize: number, 
  excludeCardIds: number[] = []
): Promise<AnimorphCard[][]> {
  try {
    // Get all cards first
    const allCards = await fetchAnimorphCards(200);
    
    // Filter out excluded cards
    const availableCards = excludeCardIds.length > 0
      ? allCards.filter(card => !excludeCardIds.includes(card.id))
      : allCards;
      
    // Shuffle the cards
    const shuffledCards = shuffleArray(availableCards);
    
    // Divide cards among players
    const decks: AnimorphCard[][] = [];
    
    for (let i = 0; i < playerCount; i++) {
      const startIndex = i * deckSize;
      const endIndex = startIndex + deckSize;
      decks.push(shuffledCards.slice(startIndex, endIndex));
    }
    
    return decks;
  } catch (error) {
    console.error("Error generating player decks:", error);
    throw error;
  }
}

// Handle deck selection for players when both might choose same cards
export function preventDuplicateMatches(
  deck1: AnimorphCard[], 
  deck2: AnimorphCard[]
): [AnimorphCard[], AnimorphCard[]] {
  // Find duplicate cards by card number
  const duplicateCardNumbers = deck1
    .map(card => card.card_number)
    .filter(cardNumber => deck2.some(card => card.card_number === cardNumber));
  
  // If there are 3 or more duplicate cards, we need to reorder
  if (duplicateCardNumbers.length >= 3) {
    // Create a copy of decks to reorder
    const newDeck1 = [...deck1];
    const newDeck2 = [...deck2];
    
    // Get indices of duplicate cards in both decks
    const duplicateIndices1 = duplicateCardNumbers.map(num => 
      newDeck1.findIndex(card => card.card_number === num)
    );
    
    const duplicateIndices2 = duplicateCardNumbers.map(num => 
      newDeck2.findIndex(card => card.card_number === num)
    );
    
    // Reorder duplicate cards in deck2 to avoid direct comparison
    for (let i = 0; i < duplicateIndices1.length; i++) {
      // Swap with a different duplicate card
      const swapIndex = (i + Math.floor(duplicateIndices2.length / 2)) % duplicateIndices2.length;
      const temp = newDeck2[duplicateIndices2[i]];
      newDeck2[duplicateIndices2[i]] = newDeck2[duplicateIndices2[swapIndex]];
      newDeck2[duplicateIndices2[swapIndex]] = temp;
    }
    
    return [newDeck1, newDeck2];
  }
  
  return [deck1, deck2];
}

// Compare stats function
export function compareStats(
  cards: AnimorphCard[], 
  stat: keyof AnimorphCard
): number {
  // Find the maximum value
  const values = cards.map(card => card[stat] as number);
  const maxValue = Math.max(...values);
  
  // Return the index of player with highest stat (first occurrence)
  return values.findIndex(value => value === maxValue);
}

// AI stat selection strategy
export function selectAIStat(aiCard: AnimorphCard, opponentCards: AnimorphCard[]): keyof AnimorphCard {
  const statOptions: Array<keyof AnimorphCard> = ['power', 'health', 'attack', 'sats', 'size'];
  
  // Check each stat and count how many opponents the AI would beat
  const statWins = statOptions.map(stat => {
    let wins = 0;
    const aiValue = aiCard[stat] as number;
    
    opponentCards.forEach(card => {
      const opponentValue = card[stat] as number;
      if (aiValue > opponentValue) wins++;
    });
    
    return { stat, wins };
  });
  
  // Sort by most wins
  statWins.sort((a, b) => b.wins - a.wins);
  
  // Return the stat that would win against most opponents
  return statWins[0].stat;
}

// Generate 10-card decks for 1v1 battles
export async function generate1v1Decks(
  selectedCards1: number[], 
  selectedCards2: number[]
): Promise<[AnimorphCard[], AnimorphCard[]]> {
  try {
    const allCards = await fetchAnimorphCards(200);
    
    // Create decks based on selected card IDs
    const deck1 = selectedCards1.map(id => 
      allCards.find(card => card.id === id)!
    ).filter(Boolean);
    
    const deck2 = selectedCards2.map(id => 
      allCards.find(card => card.id === id)!
    ).filter(Boolean);
    
    // Check and prevent duplicate matches
    return preventDuplicateMatches(deck1, deck2);
  } catch (error) {
    console.error("Error generating 1v1 decks:", error);
    throw error;
  }
}

// Helper to determine winner by card count
export function determineWinnerByCardCount(playerDecks: AnimorphCard[][]): number {
  let winnerIndex = -1;
  let maxCards = -1;
  
  playerDecks.forEach((deck, index) => {
    if (deck.length > maxCards) {
      maxCards = deck.length;
      winnerIndex = index;
    }
  });
  
  return winnerIndex;
}

// Check if any player is out of cards
export function isPlayerOutOfCards(playerDecks: AnimorphCard[][]): boolean {
  return playerDecks.some(deck => deck.length === 0);
}
