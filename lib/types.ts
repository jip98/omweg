export type TourMode = 'casual' | 'date' | 'kids' | 'challenge' | 'mystery' | 'cabrio'
export type Difficulty = 'rustig' | 'normaal' | 'chaotisch'
export type RoadPreference = 'alles' | 'geen-snelweg' | 'rustig' | 'landelijk' | 'stad'
export type StopPreference = 'geen' | 'kort' | 'koffie' | 'mooi'
export type QuestType = 'direction' | 'timer' | 'spotting' | 'stop' | 'choice' | 'random'
export type QuestStatus = 'active' | 'completed' | 'skipped'
export type TourStatus = 'setup' | 'active' | 'paused' | 'completed'

export interface TourSettings {
  mode: TourMode
  duration: number
  difficulty: Difficulty
  roadPreference: RoadPreference
  stopPreference: StopPreference
}

export interface Quest {
  id: string
  title: string
  instruction: string
  type: QuestType
  durationSeconds: number | null
  completionCondition: string
  safetyNote: string
  status: QuestStatus
  createdAt: number
  completedAt?: number
  points: number
}

export interface TourState {
  id: string
  settings: TourSettings
  startedAt: number
  endedAt?: number
  status: TourStatus
  quests: Quest[]
  totalScore: number
}

export const MODE_LABELS: Record<TourMode, string> = {
  casual: 'Casual Tour',
  date: 'Date Mode',
  kids: 'Kids Mode',
  challenge: 'Challenge Mode',
  mystery: 'Mystery Route',
  cabrio: 'Cabrio / Fun Drive',
}

export const MODE_ICONS: Record<TourMode, string> = {
  casual: '🚗',
  date: '💕',
  kids: '🎉',
  challenge: '⚡',
  mystery: '🌀',
  cabrio: '🌞',
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  rustig: 'Rustig',
  normaal: 'Normaal',
  chaotisch: 'Chaotisch',
}

export const ROAD_LABELS: Record<RoadPreference, string> = {
  alles: 'Alles',
  'geen-snelweg': 'Geen snelweg',
  rustig: 'Alleen rustige wegen',
  landelijk: 'Landelijk',
  stad: 'Stad / dorp',
}

export const STOP_LABELS: Record<StopPreference, string> = {
  geen: 'Geen stops',
  kort: 'Korte stops',
  koffie: 'Koffie / eten toestaan',
  mooi: 'Mooie plekken zoeken',
}

export const END_TITLES: string[] = [
  'Jullie zijn professioneel verdwaald 🗺️',
  'Chaotische tourlegendes 🏆',
  'Omweg-kampioenen 🥇',
  'Meesters van het toeval 🎲',
  'De GPS heeft het opgegeven 📍',
  'Officieel: nergens naartoe 🌀',
  'Roadtrip royalty 👑',
  'Van A naar... ergens anders 🛣️',
]
