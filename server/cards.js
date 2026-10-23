const SUITS = ['clubs', 'diamonds', 'hearts', 'spades'];
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'];

// The "2" variants of the image files are the nicer face-card art
function imageFor(value, suit) {
  const fancy = ['jack', 'queen', 'king'].includes(value) || (value === 'ace' && suit === 'spades');
  return `${value}_of_${suit}${fancy ? '2' : ''}.png`;
}

export const DECK = SUITS.flatMap((suit) =>
  VALUES.map((value) => ({
    id: (value === '10' ? '1' : value[0]) + suit[0],
    src: imageFor(value, suit),
    suit,
    value,
  })),
);

export function shuffle(cards) {
  const copy = cards.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function hasFourOfAKind(hand) {
  const counts = {};
  return hand.some((card) => (counts[card.value] = (counts[card.value] || 0) + 1) >= 4);
}
