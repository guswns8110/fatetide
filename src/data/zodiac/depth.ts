import type { ZodiacDepth } from './types';

/**
 * Longer evergreen sections shown only on the zodiac guide pages. Kept apart from signs.ts so the
 * interactive horoscope and compatibility bundles do not have to carry this text.
 */
export const zodiacDepth: Readonly<Record<string, ZodiacDepth>> = {
  aries: {
    relationships: "Aries tends to say what it feels in the moment, which can be a relief for people who dislike guessing. In close relationships the practice is pacing: pausing to ask a question before answering, and noticing when enthusiasm leaves little room for the other person's timing. Friendships with Aries often deepen through shared activity more than long talks, so doing something together may be the easiest way in.",
    workStyle: "Aries is usually energized by a clear target and a short feedback loop. Starting is easy; the middle of a long project is where motivation can dip, so breaking work into visible wins helps. Autonomy tends to matter more than praise. A useful habit is to write down what done looks like before beginning, so the drive to move fast points at the right thing.",
    growthPrompts: [
      'Where am I moving fast because it is useful, and where because waiting feels uncomfortable?',
      'When did I last change my mind after really listening?',
      'What would finishing look like for the project I am tempted to abandon?',
      'Who might need me to slow down with them?',
    ],
  },
  taurus: {
    relationships: "Taurus builds trust through consistency: showing up, remembering preferences, keeping small promises. That steadiness is a real gift, and it can also make disagreements feel heavier than they are, because a Taurus may quietly store what bothers them. Naming a small irritation early, in plain words, tends to protect the closeness Taurus values most. Shared meals, routines, and physical comfort often carry more meaning than speeches.",
    workStyle: "Taurus usually works best at a sustainable pace with clear structure and tangible results. Rushed pivots and vague expectations drain them, while craft, quality, and long-term progress motivate them. It may help to schedule small experiments with change, so that adapting becomes a practiced skill rather than a disruption.",
    growthPrompts: [
      'What am I holding onto because it is truly valuable, and what because it is familiar?',
      'Which small comfort would genuinely restore me this week?',
      'What is one change I have been resisting that might make things easier?',
      'How do I know when steady has become stuck?',
    ],
  },
  gemini: {
    relationships: "Gemini connects through conversation, humor, and curiosity about how other people think. That makes them easy company, and it can leave partners wondering how deeply a feeling has landed, since Gemini may talk about emotions instead of resting in them. Sharing one plain sentence about what matters, rather than several clever ones, often does more for trust than any amount of wit. Variety keeps the bond lively; consistency keeps it safe.",
    workStyle: "Gemini tends to thrive on variety, learning, and quick exchanges of ideas. Long stretches on a single task can feel like a cage, while too many open loops can scatter attention. Working in short focused blocks, with a running list of ideas parked for later, often lets curiosity and completion coexist.",
    growthPrompts: [
      'Which of my many ideas actually wants to become a finished thing?',
      'When I explain a feeling, am I also letting myself feel it?',
      'What would I say if I used only two sentences?',
      'Who would benefit from my full, unhurried attention this week?',
    ],
  },
  cancer: {
    relationships: "Cancer reads emotional atmosphere quickly and tends to care for people through food, memory, and small attentions. The other side is a habit of retreating when hurt, expecting others to notice without being told. Cancers often benefit from saying, even briefly, that they need a little time and will come back. Once trust is secure, they can be exceptionally loyal, warm, and remembering companions.",
    workStyle: "Cancer often does best where the culture is supportive and the work has a human purpose. Sudden criticism can linger longer than intended, so predictable feedback helps. They tend to pay close attention to how a team feels, which is valuable, and worth balancing with clear boundaries so other people's stress is not absorbed as their own.",
    growthPrompts: [
      'What am I feeling right now, and whose feeling is it?',
      'What do I need to ask for instead of hoping it will be noticed?',
      'Which memory keeps visiting me, and what does it want me to see?',
      'What does safe enough look like today?',
    ],
  },
  leo: {
    relationships: "Leo brings warmth, generosity, and a flair for making people feel celebrated. In return, Leo usually longs to be genuinely seen and appreciated, and can be stung by indifference. Being direct about that wish, instead of testing for it, keeps relationships honest. A Leo who also asks how you really are, and waits for the answer, often finds that admiration and closeness can grow together.",
    workStyle: "Leo tends to be motivated by ownership, creativity, and recognition for real effort. Roles with visibility and room to lead bring out their best, while work where credit is invisible can feel flat. Building in regular acknowledgement, and giving it to others, keeps motivation steady. Confident leadership works best when it leaves space for other people's ideas.",
    growthPrompts: [
      'What do I want to be appreciated for that I have not said out loud?',
      'Where can I give the spotlight away and still feel like myself?',
      'When was my pride protecting something tender?',
      'What would I make if no one were watching?',
    ],
  },
  virgo: {
    relationships: "Virgo shows care through attention to detail: remembering what you said, fixing the thing that was bothering you, making life easier. The same eye for improvement can drift into criticism, which may land as disapproval even when it is meant as help. Leading with appreciation, and asking whether feedback is wanted, tends to keep closeness intact. Virgos often relax most with people who let them be imperfect.",
    workStyle: "Virgo typically excels with clear standards, tidy systems, and problems that reward careful analysis. Perfectionism is the recurring risk: projects can stall while details are polished. Setting a defined good-enough threshold in advance, and a stopping time, tends to protect both quality and energy.",
    growthPrompts: [
      'What would done look like if I trusted my own work?',
      'Am I helping, or am I correcting?',
      'What worry keeps looping, and what one step would give it a size?',
      'How would I treat a friend who made this mistake?',
    ],
  },
  libra: {
    relationships: "Libra is often the person who notices everyone's comfort and smooths the edges. The risk is adapting so much that their own preferences go unspoken, which can turn into quiet resentment. Practicing small, early honesty, such as saying I would prefer this, keeps harmony real rather than performed. Libra tends to flourish in relationships that feel fair and that make room for beauty and conversation.",
    workStyle: "Libra tends to thrive in collaborative settings where fairness and aesthetics matter: mediation, design, teamwork, client-facing roles. Decisions with many valid options can stall them, so setting a deadline or narrowing to two choices helps. Working alongside someone who enjoys deciding can be a relief rather than a threat.",
    growthPrompts: [
      'What do I actually prefer, apart from what would keep the peace?',
      'Which small no could I say kindly this week?',
      'What decision have I been weighing longer than it deserves?',
      'Where is fair being used to avoid choosing?',
    ],
  },
  scorpio: {
    relationships: "Scorpio seeks depth and tends to hold back until trust is proven, which can look like intensity or secrecy from the outside. Loyalty, once given, is usually total. The practice is offering small pieces of vulnerability before certainty arrives, and asking directly instead of testing. Scorpios often value a partner or friend who can stay steady through difficult conversations without needing them to be softer than they are.",
    workStyle: "Scorpio typically works with unusual focus on problems that need investigation, strategy, or persistence. They tend to prefer depth over breadth and may resist oversight. Motivation comes from meaning and mastery. Guarding against all-or-nothing effort, and building in rest, helps intensity remain sustainable.",
    growthPrompts: [
      'What am I protecting by staying private, and is it still worth protecting?',
      'Which small trust could I offer this week?',
      'What grudge is costing me more than the original hurt?',
      'What would change if I asked instead of assumed?',
    ],
  },
  sagittarius: {
    relationships: "Sagittarius usually offers honesty, humor, and enthusiasm, and expects the same freedom in return. Bluntness can wound people who hear it as judgment, so adding a sentence of warmth often preserves the message. Commitment feels easiest when it does not feel like confinement, so shared adventures, learning, and room for time alone tend to keep the bond alive.",
    workStyle: "Sagittarius often does best with autonomy, variety, and a larger purpose to point at. Detailed administration and rigid schedules may feel draining. Pairing the big vision with one accountable partner or a simple checklist helps ideas reach completion. Teaching, travel, writing, and coaching often use their strengths well.",
    growthPrompts: [
      'Which promise did I make in enthusiasm that deserves a realistic look?',
      'What am I running toward, and what am I running from?',
      'How could I say the honest thing more gently?',
      'What would it feel like to be fully here for one ordinary day?',
    ],
  },
  capricorn: {
    relationships: "Capricorn shows love through commitment, reliability, and practical support, sometimes more comfortably than through words. Reserve can be mistaken for distance, and the person underneath is often warm and wry once trust is established. Scheduling unhurried time without a goal, and sharing a worry before it becomes a problem, helps Capricorn feel supported as much as supportive.",
    workStyle: "Capricorn tends to be motivated by mastery, structure, and long-term progress. They usually plan carefully and can carry heavy responsibility without complaint, which makes rest and delegation the real skills to practice. Measuring success by more than output, such as health, relationships, and learning, keeps ambition from becoming a treadmill.",
    growthPrompts: [
      'What would I do differently if success were not the measure?',
      'Which responsibility could I share or set down?',
      'Who has offered help that I have not accepted?',
      'What does rest look like when it is not earned?',
    ],
  },
  aquarius: {
    relationships: "Aquarius values friendship, independence, and intellectual respect, and often treats a partner as a collaborator in ideas. Emotional closeness may feel more natural through shared projects than through direct declarations, and partners sometimes need it said aloud. Saying plainly how they feel, even imperfectly, builds a bridge between their inner world and the people close to them.",
    workStyle: "Aquarius commonly thrives in roles that let them innovate, think systemically, and work toward a purpose beyond themselves. Micromanagement and heavy tradition tend to frustrate them. They may need help translating vision into steps, and partnering with someone who enjoys logistics can turn ideas into results.",
    growthPrompts: [
      'Where does my independence protect me, and where does it keep people out?',
      'Which feeling could I name today without analyzing it?',
      'What idea would I test if being unconventional cost nothing?',
      'Who might want to be included in something I am doing alone?',
    ],
  },
  pisces: {
    relationships: "Pisces is often deeply empathic, tuned in to what others feel before they say it. That sensitivity makes for tender friendships and can also mean absorbing moods that are not theirs. Clear, kind boundaries are an act of care rather than a withdrawal of it. Saying what they need in plain words, instead of hoping it is sensed, helps Pisces be met as fully as they meet others.",
    workStyle: "Pisces tends to do their best work when imagination has room and the environment is gentle. Harsh, rigid settings can drain them, and open-ended tasks can become foggy without structure. A simple routine, a visible list, and protected quiet time give creativity a place to land.",
    growthPrompts: [
      'Whose mood am I carrying right now?',
      'What boundary would feel like kindness to everyone involved?',
      'What dream deserves one small, concrete step this week?',
      'Where do I go when I want to escape, and what might I need instead?',
    ],
  },
};
