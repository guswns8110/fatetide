import type { ReadingCategory } from '../../data/tarot/types';

const categories: { value: ReadingCategory; label: string; hint: string; icon: string }[] = [
  { value: 'general', label: 'General', hint: 'The bigger picture', icon: '✦' },
  { value: 'love', label: 'Love', hint: 'Connection & care', icon: '♡' },
  { value: 'career', label: 'Career', hint: 'Work & purpose', icon: '✧' },
  { value: 'money', label: 'Money', hint: 'Resources & choices', icon: '◈' },
];

export default function CategorySelector({ selected, onSelect, disabled }: { selected: ReadingCategory | null; onSelect: (value: ReadingCategory) => void; disabled: boolean }) {
  return <fieldset className="category-fieldset" disabled={disabled}>
    <legend>What is on your mind?</legend>
    <div className="category-grid">
      {categories.map(({ value, label, hint, icon }) => <button key={value} type="button" className={`category-option ${selected === value ? 'is-selected' : ''}`} aria-pressed={selected === value} onClick={() => onSelect(value)}>
        <span className="category-icon" aria-hidden="true">{icon}</span><span><strong>{label}</strong><small>{hint}</small></span>
      </button>)}
    </div>
  </fieldset>;
}
