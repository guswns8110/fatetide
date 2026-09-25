import { zodiacSigns } from '../data/zodiac/signs';
import type { Element, Modality, ZodiacSign } from '../data/zodiac/types';

/**
 * Rule-based zodiac compatibility. Nothing here is random and nothing is stored per pair:
 * text is composed from each sign's own traits plus shared element and modality relationships.
 * A+B and B+A are the same pair, and the result is always built in zodiac-wheel order.
 */

export type Tone = 'harmonious' | 'dynamic' | 'mixed' | 'challenging';
export type Relation = 'same' | 'opposite' | 'other';

export interface CompatibilityResult {
  /** The two signs in zodiac-wheel order (the same for A+B and B+A). */
  pair: readonly [ZodiacSign, ZodiacSign];
  relation: Relation;
  tone: Tone;
  toneLabel: string;
  sections: {
    overall: string;
    communication: string;
    love: string;
    emotional: string;
    challenges: string;
    advice: string;
  };
}

const TONES: Record<Tone, { label: string; blurb: string; love: string; advice: string }> = {
  harmonious: {
    label: 'Harmonious',
    blurb: 'This pairing tends to flow naturally, with shared rhythms that make everyday closeness easier.',
    love: 'Romantic warmth may come easily, and the main invitation is not to take that ease for granted.',
    advice: 'Keep growing together so comfort does not become routine.',
  },
  dynamic: {
    label: 'Dynamic',
    blurb: 'This pairing tends to be lively, with strong energy, attraction, and contrast that keeps things interesting.',
    love: 'Attraction may be strong, and so may differences; both are worth working with.',
    advice: 'Treat differences as information rather than as a verdict.',
  },
  mixed: {
    label: 'Mixed',
    blurb: 'This pairing tends to offer both easy stretches and real differences, depending on the moment and the people.',
    love: 'Warmth and misunderstanding may alternate, and clear conversation helps a great deal.',
    advice: "Get curious about each other's style rather than assuming your own is the default.",
  },
  challenging: {
    label: 'Challenging',
    blurb: 'This pairing tends to ask for extra patience and translation, because the two styles differ noticeably.',
    love: 'Connection can still be deep, and it may take more conscious effort to feel understood.',
    advice: 'Go slowly, ask what the other means, and appreciate effort as much as outcome.',
  },
};

interface ElementPairText { overall: string; communication: string; emotional: string; challenge: string }

/** Keys are the two elements in alphabetical order. */
const ELEMENT_PAIRS: Record<string, ElementPairText> = {
  'fire-fire': {
    overall: 'Two fire signs tend to create warmth, momentum, and a shared appetite for action.',
    communication: 'Conversation is likely to be lively, direct, and quick, with enthusiasm running ahead of listening.',
    emotional: 'Feelings are expressed in the moment and can pass just as fast, which keeps things fresh but may leave deeper needs unspoken.',
    challenge: 'Both may want to lead, and sparks can become arguments when neither slows down.',
  },
  'earth-earth': {
    overall: 'Two earth signs often build steadiness, practicality, and a shared respect for reliability.',
    communication: 'Talk tends to be practical and calm, focused on plans and real-world matters.',
    emotional: 'Care is shown through dependable acts; deeper feelings may go unspoken unless someone opens the door.',
    challenge: 'Routine can harden into inertia, and neither may want to be the first to change course.',
  },
  'air-air': {
    overall: 'Two air signs often share curiosity, conversation, and a light, adaptable connection.',
    communication: 'Ideas flow easily and humor helps, and the pair may enjoy talking for hours.',
    emotional: 'Feelings are often discussed rather than felt, so emotional depth may need to be invited on purpose.',
    challenge: 'Distance or over-analysis can creep in when things get emotional.',
  },
  'water-water': {
    overall: 'Two water signs often share intuition, empathy, and an emotional language that needs few words.',
    communication: 'Much is communicated through tone and mood, which can feel like being understood without speaking.',
    emotional: 'Feelings run deep and are easily shared, and they can also amplify each other.',
    challenge: 'Moods may feed each other, and unspoken hurts can pile up without an outside anchor.',
  },
  'air-fire': {
    overall: 'Air feeds fire: this pairing tends to be energetic, playful, and full of ideas.',
    communication: 'Conversation tends to be quick and spirited, with plenty of brainstorming.',
    emotional: 'Both may prefer action or ideas to lingering in heavy feelings, so emotions may need deliberate attention.',
    challenge: 'Restlessness on both sides can leave little grounding, and follow-through may need an explicit agreement.',
  },
  'earth-water': {
    overall: 'Water nourishes earth: this pairing often feels supportive, sensual, and stable.',
    communication: 'Communication tends to be gentle and practical, with care shown through attention.',
    emotional: "Earth can give water a steady place to feel, and water can soften earth's reserve.",
    challenge: 'Comfort can slide into avoiding difficult topics, and quiet resentments may build.',
  },
  'earth-fire': {
    overall: 'Earth and fire can combine drive with follow-through when they respect each other\'s pace.',
    communication: "Fire's directness meets earth's caution, so decisions may involve some negotiation.",
    emotional: 'Fire expresses and moves on; earth absorbs and holds, which can create mismatched timing.',
    challenge: "Fire may feel slowed down while earth feels rushed, and each may read the other's style as criticism.",
  },
  'air-earth': {
    overall: 'Air and earth approach life differently: one is drawn to ideas and options, the other to substance and certainty.',
    communication: 'Air tends to explore aloud while earth wants concrete conclusions, which can frustrate both.',
    emotional: 'Air may intellectualize feelings, while earth may keep them practical and private.',
    challenge: 'Each may find the other either too abstract or too rigid unless they translate between styles.',
  },
  'fire-water': {
    overall: 'Fire and water can create steam: this pairing brings strong feelings and strong contrast.',
    communication: 'Fire says it plainly; water feels the tone and may hear more than was meant.',
    emotional: 'Fire moves quickly through emotion while water lingers, so timing may need patience.',
    challenge: "Fire's bluntness can hurt water, and water's moods can seem hard to read to fire.",
  },
  'air-water': {
    overall: 'Air and water can meet in curiosity and empathy, though they process differently.',
    communication: 'Air wants to talk it through; water wants to feel it through, so each may need to meet the other halfway.',
    emotional: 'Water may wish for more emotional presence while air offers perspective instead.',
    challenge: 'Rational explanations may seem cold to water, and emotional intensity may seem overwhelming to air.',
  },
};

interface ModalityPairText { overall: string; challenge: string; advice: string }

/** Keys are the two modalities in alphabetical order. */
const MODALITY_PAIRS: Record<string, ModalityPairText> = {
  'cardinal-cardinal': {
    overall: 'Two cardinal signs both like to initiate, which brings energy and shared ambition.',
    challenge: 'Both may want to steer, so decisions can become contests.',
    advice: 'Agree on who leads in which areas, and take turns.',
  },
  'cardinal-fixed': {
    overall: 'A cardinal sign starts things and a fixed sign sustains them, a combination that can build real momentum.',
    challenge: "The cardinal sign may feel held back by the fixed sign's resistance to change, while the fixed sign may feel pushed.",
    advice: 'Let one start and the other steady, and thank each other for it.',
  },
  'cardinal-mutable': {
    overall: 'A cardinal sign initiates and a mutable sign adapts, which can flow smoothly when the leader listens.',
    challenge: 'The mutable sign may go along until resentment builds, and the cardinal sign may not notice.',
    advice: 'Ask direct questions and welcome honest answers.',
  },
  'fixed-fixed': {
    overall: 'Two fixed signs bring loyalty and staying power to a partnership.',
    challenge: 'Neither may want to yield, and small disagreements can harden into standoffs.',
    advice: 'Choose flexibility on small things to protect what matters most.',
  },
  'fixed-mutable': {
    overall: 'A fixed sign offers stability and a mutable sign brings flexibility, so they can balance each other well.',
    challenge: 'The fixed sign may find the mutable one inconsistent, while the mutable sign may feel pinned down.',
    advice: 'Set a few reliable anchors and leave the rest open.',
  },
  'mutable-mutable': {
    overall: 'Two mutable signs adapt easily and often enjoy variety together.',
    challenge: 'Decisions can drift, and neither may want to be the one who commits.',
    advice: 'Pick a simple plan and check in on it.',
  },
};

const RELATION_TEXT: Record<Relation, string> = {
  same: 'Sharing a sign often means recognizing yourself in the other person, including the habits that are easier to see from the outside.',
  opposite: 'As opposite signs on the zodiac wheel, they hold complementary qualities, which can feel magnetic and, at times, like pulling in different directions.',
  other: '',
};

const pairKey = <T extends string>(a: T, b: T) => [a, b].sort().join('-');

function elementAffinity(a: Element, b: Element): 'high' | 'mid' | 'low' {
  if (a === b) return 'high';
  const key = pairKey(a, b);
  if (key === 'air-fire' || key === 'earth-water') return 'high';
  if (key === 'earth-fire' || key === 'air-water') return 'mid';
  return 'low';
}

function chooseTone(a: ZodiacSign, b: ZodiacSign, relation: Relation): Tone {
  if (relation === 'opposite') return 'dynamic';
  const affinity = elementAffinity(a.element, b.element);
  let tone: Tone = affinity === 'high' ? 'harmonious' : affinity === 'mid' ? 'mixed' : 'challenging';
  const modalities: [Modality, Modality] = [a.modality, b.modality];
  if (tone === 'harmonious' && modalities[0] === 'fixed' && modalities[1] === 'fixed') tone = 'dynamic';
  if (tone === 'challenging' && modalities[0] === 'mutable' && modalities[1] === 'mutable') tone = 'mixed';
  return tone;
}

function relationOf(indexA: number, indexB: number): Relation {
  if (indexA === indexB) return 'same';
  return Math.abs(indexA - indexB) === 6 ? 'opposite' : 'other';
}

type TraitKey = 'communication' | 'love' | 'emotional' | 'friction';

function traitSentence(a: ZodiacSign, b: ZodiacSign, key: TraitKey, prefix: string): string {
  const lead = prefix ? `${prefix}, ` : '';
  if (a.id === b.id) return `${lead}${a.name} ${a.compat[key]}. With two of the same sign, that pattern is mirrored back at full strength.`;
  return `${lead}${a.name} ${a.compat[key]}, while ${b.name} ${b.compat[key]}.`;
}

function needSentence(a: ZodiacSign, b: ZodiacSign): string {
  if (a.id === b.id) return `Two ${a.name} signs together may benefit from ${a.compat.need}.`;
  return `${a.name} may benefit from ${a.compat.need}, and ${b.name} from ${b.compat.need}.`;
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export function getCompatibility(idA: string, idB: string): CompatibilityResult | null {
  const indexA = zodiacSigns.findIndex((sign) => sign.id === idA);
  const indexB = zodiacSigns.findIndex((sign) => sign.id === idB);
  if (indexA === -1 || indexB === -1) return null;

  const [first, second] = indexA <= indexB ? [indexA, indexB] : [indexB, indexA];
  const a = zodiacSigns[first];
  const b = zodiacSigns[second];
  const relation = relationOf(first, second);
  const tone = chooseTone(a, b, relation);
  const toneText = TONES[tone];
  const elements = ELEMENT_PAIRS[pairKey(a.element, b.element)];
  const modalities = MODALITY_PAIRS[pairKey(a.modality, b.modality)];

  const overall = [toneText.blurb, elements.overall, modalities.overall, RELATION_TEXT[relation]].filter(Boolean).join(' ');
  const communication = `${capitalize(traitSentence(a, b, 'communication', ''))} ${elements.communication}`;
  const love = `${traitSentence(a, b, 'love', 'In love')} ${toneText.love}`;
  const emotional = `${traitSentence(a, b, 'emotional', 'Emotionally')} ${elements.emotional}`;
  const challenges = `${traitSentence(a, b, 'friction', 'Under stress')} ${elements.challenge} ${modalities.challenge}`;
  const advice = `${needSentence(a, b)} ${modalities.advice} ${toneText.advice}`;

  return { pair: [a, b], relation, tone, toneLabel: toneText.label, sections: { overall, communication, love, emotional, challenges, advice } };
}
