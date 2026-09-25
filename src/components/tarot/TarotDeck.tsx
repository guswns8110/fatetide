import type { TarotCard as CardData } from '../../data/tarot/types';
import TarotCard from './TarotCard';

export default function TarotDeck({ cards, onChoose }: { cards: readonly CardData[]; onChoose: (index: number) => void }) {
  return <div className="deck-choice" role="group" aria-label="Choose one of three face-down cards">
    {cards.map((card, index) => <button className="deck-choice-button" type="button" key={card.id} aria-label={`Choose card ${index + 1}`} onClick={() => onChoose(index)}><TarotCard /><span>Card {index + 1}</span></button>)}
  </div>;
}
