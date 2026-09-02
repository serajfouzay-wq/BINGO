// AI Team Building — the 10 activities and their scoring, ported from the
// company app. Kept byte-faithful on the numbers so a team's score here means
// the same thing it did there.
//
// Scoring, for reference:
//   +100  check-in (scan)
//   +100  per step ticked (5 steps = 500)
//   +200 / 350 / 500  completion, by Easy / Normal / Hard
//   +speed bonus from the activity's own tier ladder, multiplied by
//    difficulty (Easy 1x, Normal 1.4x, Hard 1.8x)

export type AitbDifficulty = 'Easy' | 'Normal' | 'Hard'

export type AitbActivity = {
  id: number
  act: string
  emoji: string
  color: string
  name: string
  outType: string
  tagline: string
  steps: string[]
  stepEmojis: string[]
  apps: string[]
  mins: number
  difficulty: AitbDifficulty
  props: string[]
  /** Ascending minutes from check-in: finish within uptoMin -> earn pts. */
  bonusTiers: { uptoMin: number; pts: number }[]
}

export const AITB_ACTIVITIES: AitbActivity[] = [
  { id: 1, act: '01', emoji: '🎯', color: '#fb7185', name: 'Nerf Prompt Cups',
    outType: 'AI Image', tagline: 'Shoot cups, reveal secret words, turn them into a wild AI picture!',
    steps: ['Shoot 1 red, 1 blue and 1 yellow cup.','Shout the cup numbers to the host!','Watch the big screen — your secret words appear!','Put the 3 words together — that\u2019s your prompt!','Ask AI to make the picture and score points!'],
    stepEmojis: ['🔫','📢','📺','🧩','🎨'],
    apps: ['Arena','ChatGPT','Gemini','Copilot','Ideogram'], mins: 10, difficulty: 'Easy',
    props: ['Nerf blaster + darts','Red / blue / yellow cup sets (numbered)','Secret word slips inside each cup','Table to line up the cups'],
    bonusTiers: [{uptoMin:2.5,pts:1000},{uptoMin:5,pts:800},{uptoMin:7.5,pts:600},{uptoMin:10,pts:400},{uptoMin:12.5,pts:200}] },

  { id: 2, act: '02', emoji: '🕹️', color: '#22d3ee', name: 'Retro Game Speed Build',
    outType: '3 Playable Browser Games', tagline: 'Fastest team to build 3 working retro games with AI wins!',
    steps: ['Pick 1 builder for each game + 1 tester.','Ask AI to build Mario, Pac-Man and Donkey Kong.','You have 15 minutes — go go go!','Test every game — it must really play!','Other team tries your games. Best games win!'],
    stepEmojis: ['🙋','🤖','⏱️','🎮','🏆'],
    apps: ['AI Studio','Canva AI','Antigravity','Kimi'], mins: 15, difficulty: 'Hard', props: [],
    bonusTiers: [{uptoMin:4,pts:1000},{uptoMin:8,pts:800},{uptoMin:11,pts:600},{uptoMin:15,pts:400},{uptoMin:19,pts:200}] },

  { id: 3, act: '03', emoji: '🏰', color: '#a78bfa', name: 'Rubber Band Castle',
    outType: 'AI Castle + Team Composite', tagline: 'Stack ALL the cups into a castle — no hands, only strings!',
    steps: ['Everyone holds ONE string on the rubber band.','Pull together to grab cups — NO hands!','Stack ALL the cups into one castle.','Take a photo of your cup castle.','AI turns it into a REAL castle — with your team on top!'],
    stepEmojis: ['🪢','🙌','🏗️','📸','🏰'],
    apps: ['Arena','ChatGPT','Gemini','Copilot','Nano Banana'], mins: 12, difficulty: 'Normal',
    props: ['Rubber band with 6–8 strings tied on','Stack of cups (8–10) for the castle'],
    bonusTiers: [{uptoMin:3,pts:1000},{uptoMin:6,pts:800},{uptoMin:9,pts:600},{uptoMin:12,pts:400},{uptoMin:15,pts:200}] },

  { id: 4, act: '04', emoji: '🌳', color: '#34d399', name: 'Resort Tree App Sprint',
    outType: 'Interactive Web App', tagline: 'Photograph 6 trees, then build a real tree app with AI!',
    steps: ['Find any 6 different trees around the vicinity.','Split up and snap photos of each tree.','Run back and build a tree app with AI.','Add fun facts + 1 mini game or quiz.','Share your app with a QR code!'],
    stepEmojis: ['🔍','📷','💻','🧠','📲'],
    apps: ['Canva AI','AI Studio','Antigravity','Kimi','Claude'], mins: 20, difficulty: 'Hard', props: [],
    bonusTiers: [{uptoMin:5,pts:1000},{uptoMin:10,pts:800},{uptoMin:15,pts:600},{uptoMin:20,pts:400},{uptoMin:25,pts:200}] },

  { id: 5, act: '05', emoji: '🎶', color: '#f472b6', name: 'Roulette Jingle & Dance Off',
    outType: 'AI Song + Live Dance', tagline: 'Spin the wheels, make an AI song, dance it live!',
    steps: ['Spin both wheels — keep what you get!','Write a song about your two words.','Make the song with AI (60 seconds).','Invent a dance — EVERYONE joins in.','Perform it live for the crowd!'],
    stepEmojis: ['🎡','✍️','🎵','💃','🎤'],
    apps: ['Suno','ChatGPT','Claude'], mins: 15, difficulty: 'Normal',
    props: ['Portable speaker (play the AI song for the dance)'],
    bonusTiers: [{uptoMin:4,pts:1000},{uptoMin:8,pts:800},{uptoMin:11,pts:600},{uptoMin:15,pts:400},{uptoMin:19,pts:200}] },

  { id: 6, act: '06', emoji: '🎬', color: '#fbbf24', name: 'Random Card Cinematic',
    outType: 'Cinematic Video', tagline: '4 surprise cards become one epic AI movie scene!',
    steps: ['Tap DRAW — no swaps, keep all 4 cards!','Pick 2 teammates to star as your actors.','Mix the cards + your actors into one movie idea.','Ask AI to make your movie scene.','Watch it together on the big screen!'],
    stepEmojis: ['🃏','🎭','💡','🤖','🍿'],
    apps: ['Arena','Kling','Veo (Flow)','Higgsfield'], mins: 15, difficulty: 'Normal', props: [],
    bonusTiers: [{uptoMin:4,pts:1000},{uptoMin:8,pts:800},{uptoMin:11,pts:600},{uptoMin:15,pts:400},{uptoMin:19,pts:200}] },

  { id: 7, act: '07', emoji: '🏓', color: '#60a5fa', name: 'Ping Pong Alphabet Pitch',
    outType: 'AI Ad Campaign + Pitch', tagline: 'Bounce balls into letter cups, make 7 words, pitch a crazy AI ad!',
    steps: ['Bounce balls into the letter cups — 90 seconds!','Collect at least 7 different letters.','Make 7 words using ALL your letters.','Give the words to AI — it makes a crazy ad!','Pitch your ad like a TV star!'],
    stepEmojis: ['🏓','🔤','📝','🤖','🌟'],
    apps: ['Arena','ChatGPT','Gemini','Copilot','Claude'], mins: 12, difficulty: 'Normal',
    props: ['26 cups labelled A–Z','Ping pong balls (6+)','Table for the cup grid'],
    bonusTiers: [{uptoMin:3,pts:1000},{uptoMin:6,pts:800},{uptoMin:9,pts:600},{uptoMin:12,pts:400},{uptoMin:15,pts:200}] },

  { id: 8, act: '08', emoji: '👁️', color: '#f59e0b', name: 'Speed Edit Showdown',
    outType: 'Image Recreation', tagline: 'Relay-race to recreate the picture on the big screen with AI!',
    steps: ['Pick a target picture from the gallery below.','Take turns — each member writes the next prompt!','Keep regenerating until it matches.','Show the marshal your picture AND your prompt!','Faster ✅ from the marshal = more points!'],
    stepEmojis: ['👀','🔁','🎨','🙋','⚡'],
    apps: ['Arena','ChatGPT','Gemini','Copilot','Nano Banana'], mins: 12, difficulty: 'Easy', props: [],
    bonusTiers: [{uptoMin:3,pts:1000},{uptoMin:6,pts:800},{uptoMin:9,pts:600},{uptoMin:12,pts:400},{uptoMin:15,pts:200}] },

  { id: 9, act: '09', emoji: '🐘', color: '#2dd4bf', name: 'Found Object Animals',
    outType: 'Animated Interaction Video', tagline: 'Draw 2 surprise animals — build them, then bring them to life with AI!',
    steps: ['Tap DRAW to get your 2 surprise animals!','Build each from found items (indoors/outdoors) — or draw them!','Finish both animal shapes and snap a photo.','Photo it — AI makes them REAL animals!','AI animates your 2 animals playing together.'],
    stepEmojis: ['🎲','🧺','🖼️','📸','🎬'],
    apps: ['Arena','Nano Banana','Gemini','Kling','Higgsfield'], mins: 15, difficulty: 'Hard',
    props: ['Collection basket for found objects','Paper + markers (for teams who prefer to draw)'],
    bonusTiers: [{uptoMin:4,pts:1000},{uptoMin:8,pts:800},{uptoMin:11,pts:600},{uptoMin:15,pts:400},{uptoMin:19,pts:200}] },

  { id: 10, act: '10', emoji: '🧭', color: '#c084fc', name: 'Resort Character Journey',
    outType: '10-Scene Travelogue', tagline: 'One mascot, 10 real resort spots — tell A Day in the Life!',
    steps: ['Create ONE cartoon mascot character.','Photo 10 real spots — pool, lobby, spa...','AI puts your mascot in every photo.','Same mascot in all 10 — don\u2019t change it!','Tell the story: A Day in the Life!'],
    stepEmojis: ['🎨','📷','🤖','🔒','📖'],
    apps: ['Arena','ChatGPT','Gemini','Copilot','Nano Banana'], mins: 20, difficulty: 'Hard', props: [],
    bonusTiers: [{uptoMin:5,pts:1000},{uptoMin:10,pts:800},{uptoMin:15,pts:600},{uptoMin:20,pts:400},{uptoMin:25,pts:200}] },
]

export const AITB_POINTS = { scan: 100, step: 100, complete: 300 } as const
export const AITB_COMPLETE:   Record<AitbDifficulty, number> = { Easy: 200, Normal: 350, Hard: 500 }
export const AITB_BONUS_MULT: Record<AitbDifficulty, number> = { Easy: 1, Normal: 1.4, Hard: 1.8 }

export function aitbActivity(id: number) {
  return AITB_ACTIVITIES.find(a => a.id === id)
}

/** Match an imported bingo card to its activity by title. */
export function aitbByName(name: string) {
  const n = name.trim().toLowerCase()
  return AITB_ACTIVITIES.find(a => a.name.toLowerCase() === n)
}

/** Speed bonus for finishing in `elapsedMs`, scaled by difficulty. */
export function aitbSpeedBonus(elapsedMs: number, a: Pick<AitbActivity,'bonusTiers'|'difficulty'>): number {
  const mins = elapsedMs / 60_000
  const mult = AITB_BONUS_MULT[a.difficulty] ?? 1
  for (const t of a.bonusTiers) if (mins <= t.uptoMin) return Math.round(t.pts * mult)
  return 0
}

/** Best possible score: check-in + every step + completion + top bonus. */
export function aitbMaxPoints(a: AitbActivity): number {
  return AITB_POINTS.scan + a.steps.length * AITB_POINTS.step
    + AITB_COMPLETE[a.difficulty]
    + Math.round((a.bonusTiers[0]?.pts ?? 0) * AITB_BONUS_MULT[a.difficulty])
}
