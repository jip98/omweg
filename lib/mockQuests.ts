import { Quest, TourMode, StopPreference, QuestType } from './types'

type QuestTemplate = Omit<Quest, 'id' | 'createdAt' | 'status' | 'points'>

// Willekeurige afslag-suffix — elk niet-richting quest krijgt er één
const DIRECTION_SUFFIXES = [
  'Daarna neem je bij de eerstvolgende veilige mogelijkheid **links**.',
  'Daarna neem je bij de eerstvolgende veilige mogelijkheid **rechts**.',
  'Rijd daarna **rechtdoor** tot de volgende opdracht.',
  'Daarna neem je de **eerste zijstraat** die je veilig kunt nemen — links of rechts.',
  'Daarna kies je op de volgende kruising de **meest avontuurlijke kant**.',
  'Daarna neem je op de eerstvolgende rotonde de **tweede afslag**, als dat veilig is.',
  'Daarna sla je af bij de eerste straat met een **bomen of struiken** langs de kant.',
  'Daarna neem je de richting van het eerste **plaatsnaambord** dat je ziet.',
]

function randomSuffix(): string {
  return DIRECTION_SUFFIXES[Math.floor(Math.random() * DIRECTION_SUFFIXES.length)]
}

function q(
  title: string,
  base: string,
  type: QuestType,
  completionCondition: string,
  durationSeconds: number | null = null,
  withSuffix = true
): QuestTemplate {
  const instruction = withSuffix && type !== 'direction'
    ? `${base}\n\n${randomSuffix()}`
    : base
  return { title, instruction, type, durationSeconds, completionCondition, safetyNote: 'Veiligheid en verkeersregels gaan altijd voor.' }
}

// ─── RICHTING ────────────────────────────────────────────────────────────────
const DIRECTION_QUESTS: QuestTemplate[] = [
  q('Linksaf!', 'Neem bij de eerstvolgende veilige mogelijkheid links af. Geen haast — wacht op het goede moment.', 'direction', 'Je hebt links afgeslagen.', null, false),
  q('Rechtsaf!', 'Neem bij de eerstvolgende veilige mogelijkheid rechts af. Kies rustig je moment.', 'direction', 'Je hebt rechts afgeslagen.', null, false),
  q('Tweede afslag', 'Neem op de eerstvolgende rotonde de tweede afslag, als dat veilig en toegestaan is.', 'direction', 'Tweede rotonde-afslag genomen.', null, false),
  q('Richting het onbekende', 'Neem bij de volgende kruising de richting van het eerste dorpsnaambord dat je ziet — ook al ken je het niet.', 'direction', 'Je rijdt richting een onbekend dorp.', null, false),
  q('Kleinste weg', 'Kies bij de volgende kruising de smalste weg die je veilig kunt nemen.', 'direction', 'Je bent de smalste weg ingeslagen.', null, false),
  q('Volg het groen', 'Kies bij de volgende splitsing de weg met de meeste bomen of groen langs de kant.', 'direction', 'Groenste weg gekozen.', null, false),
  q('Minst logisch', 'Kies bij de volgende afslag de richting die het minst logisch voelt. Vertrouw je instinct.', 'direction', 'Minst logische richting gekozen.', null, false),
  q('Rustigste weg', 'Kies bij de volgende kruising bewust de rustigste, stillste weg die je veilig kunt nemen.', 'direction', 'Rustigste weg gekozen.', null, false),
]

// ─── TIMER ───────────────────────────────────────────────────────────────────
const TIMER_QUESTS: QuestTemplate[] = [
  // Kort (≤ 2 min) — geschikt voor 15-min tours
  q('Snel links!', 'Neem binnen 90 seconden een veilige linksafslag — welke dan ook. Kijk scherp!', 'timer', 'Linksafslag genomen of timer af.', 90),
  q('Twee minuten door', 'Rijd precies 2 minuten door op de weg die je nu rijdt. Geniet van het uitzicht.', 'timer', 'Timer afgelopen.', 120),
  q('Vlug beslissen', 'Bij de volgende kruising kies je binnen 90 seconden een richting — welke je hart zegt.', 'timer', 'Richting gekozen of timer af.', 90),
  // Middellang (3–5 min) — voor 30-min tours
  q('Snelle missie', 'Neem binnen 3 minuten een veilige rechterafslag — welke dan ook.', 'timer', 'Rechts afgeslagen of timer af.', 180),
  q('Volg de leider', 'Volg de auto voor jullie maximaal 5 minuten, zolang dit veilig en logisch blijft. Zie je een bus? Dan is de opdracht klaar.', 'timer', 'Timer afgelopen of bus gezien.', 300),
  q('Vijf minuten rechtstaan', 'Rijd 5 minuten zo recht mogelijk — geen afslagen, geen omwegen.', 'timer', 'Timer afgelopen.', 300),
  // Lang (7–15 min) — voor 60-min tours en langer
  q('Vrije koers', 'Rijd 7 minuten zonder vaste richting en zonder navigatie. Kijk waar je uitkomt.', 'timer', 'Timer afgelopen.', 420),
  q('Richting het noorden', 'Rijd 10 minuten zo veel mogelijk richting het noorden. Gebruik de kompas-app als je die hebt.', 'timer', 'Timer afgelopen.', 600),
  q('Kwartier op goed geluk', 'Rijd 15 minuten zonder route. Laat het gevoel bepalen welke kant je op gaat.', 'timer', 'Timer afgelopen.', 900),
]

// ─── SPOTTEN ─────────────────────────────────────────────────────────────────
const SPOTTING_QUESTS: QuestTemplate[] = [
  q('Rode auto!', 'Rijd door tot je een rode auto ziet. Zodra iemand er een spot, is de opdracht klaar.', 'spotting', 'Rode auto gespot.'),
  q('Busje, busje!', 'Rijd verder totdat iemand een bus ziet. Snel of laat — de bus bepaalt het.', 'spotting', 'Bus gespot.'),
  q('Waterzoeker', 'Rijd tot je water ziet — een rivier, kanaal, meer, sloot of plas telt mee.', 'spotting', 'Water gespot.'),
  q('Straatnaam met een dier', 'Rijd totdat je een straatnaam met een dier erin ziet. Let goed op de borden!', 'spotting', 'Straatnaam met dier gevonden.'),
  q('Kerktoren', 'Rijd totdat je een kerktoren of kerk ziet.', 'spotting', 'Kerk gespot.'),
  q('Tankstation', 'Neem de eerste afslag nadat je een tankstation gespot hebt.', 'spotting', 'Eerste afslag na tankstation.'),
  q('Molen!', 'Rijd door totdat iemand een windmolen of watermolen ziet.', 'spotting', 'Molen gespot.'),
  q('Onbekende vrachtwagen', 'Rijd tot je een vrachtwagen ziet met een bedrijfsnaam die niemand in de auto kent.', 'spotting', 'Onbekende vrachtwagen gespot.'),
  q('Brug in zicht', 'Rijd totdat je een brug over een waterweg passeert.', 'spotting', 'Brug gepasseerd.'),
  q('Dier in het weiland', 'Rijd totdat iemand een dier in een weiland ziet — koe, schaap, paard, alles telt.', 'spotting', 'Dier in weiland gespot.'),
  q('Gele auto', 'Rijd tot je een gele of oranje auto ziet. Die zijn zeldzaam!', 'spotting', 'Gele auto gespot.'),
  q('Fietser', 'Rijd tot je een fietser voorbij ziet — en zwaai!', 'spotting', 'Fietser gespot.'),
  q('Reclamebord', 'Rijd tot je een reclamebord ziet langs de weg. Lees hem hardop voor.', 'spotting', 'Reclamebord gelezen.'),
  q('Brievenbus', 'Rijd tot je een rode of gele brievenbus ziet.', 'spotting', 'Brievenbus gespot.'),
]

// ─── STOPS ───────────────────────────────────────────────────────────────────
const STOP_QUESTS: QuestTemplate[] = [
  q('Koffie!', 'Zoek een plek waar je koffie kunt halen. Tankstation, bakker, café — alles mag.', 'stop', 'Koffie gevonden.', null, false),
  q('Mooie plek', 'Stop bij de eerste plek die mooi, bijzonder of raar genoeg is om even te parkeren. Maak een foto!', 'stop', 'Veilig gestopt.', null, false),
  q('Dorpskern', 'Rijd richting het eerste plaatsnaambord dat je ziet. Stop even in het dorp.', 'stop', 'Gestopt in het dorp.', null, false),
]

// ─── CHALLENGE ───────────────────────────────────────────────────────────────
const CHALLENGE_QUESTS: QuestTemplate[] = [
  q('Blindehoek', 'Neem de eerstvolgende afslag die je NIET kon zien aankomen — verassing!', 'direction', 'Verrassingsafslag genomen.', null, false),
  q('Tegenstroom', 'Kies bij de volgende kruising de richting tegenovergesteld aan het drukste verkeer.', 'direction', 'Rustigste kant gekozen.', null, false),
  q('Drie afslagen', 'Neem de eerstvolgende drie afslagen in deze volgorde: links, rechts, links — als dat veilig is.', 'direction', 'Drie afslagen genomen.', null, false),
  q('Onbekend dorp', 'Rijdt naar het dichtstbijzijnde dorp op een bord dat niemand in de auto ooit bezocht heeft.', 'spotting', 'Nieuw dorp gevonden.'),
  q('Willekeurige minuten', 'Laat iemand een getal van 3 t/m 9 kiezen. Rijd precies dat aantal minuten rechtdoor.', 'timer', 'Timer afgelopen.', 0), // durationSeconds wordt client-side gezet
  q('Foto of feit', 'Stop bij een object langs de weg dat iedereen bijzonder genoeg vindt — en leg uit waarom. +2 bonuspunten!', 'stop', 'Foto gemaakt of feit verteld.', null, false),
  q('Spiegel de route', 'De bestuurder kiest de volgende 5 minuten elke richting tegenovergesteld aan wat hij/zij normaal zou kiezen.', 'timer', 'Timer afgelopen.', 300),
]

// ─── MYSTERY ─────────────────────────────────────────────────────────────────
const MYSTERY_QUESTS: QuestTemplate[] = [
  q('Geheime afslag', 'Rijd tot je een onbekend dorp op een bord ziet. Rij daar naartoe — geen uitleg toegestaan.', 'spotting', 'Geheime bestemming bereikt.'),
  q('Ogen dicht', 'De copiloot telt tot 30 met ogen dicht. Welke richting kiest de bestuurder in die tijd?', 'timer', 'Timer afgelopen.', 30),
  q('Mysterieuze route', 'Rijd 8 minuten volledig op gevoel. Geen kaart, geen uitleg, gewoon rijden.', 'timer', 'Timer afgelopen.', 480),
  q('Verdwenen!', 'Rijd door totdat niemand in de auto meer weet in welke gemeente jullie zijn. Dan is de opdracht klaar.', 'spotting', 'Niemand weet meer waar je bent.'),
  q('Volg het hart', 'De copiloot wijst alleen met links- of rechterhand — de bestuurder rijdt blindelings die kant op bij elke kruising. 3 minuten.', 'timer', 'Timer afgelopen.', 180),
  q('Duister bord', 'Neem de richting van het eerste bord dat je ziet dat je nooit eerder hebt opgevolgd.', 'spotting', 'Onbekend bord gevolgd.'),
]

// ─── CABRIO / FUN DRIVE ──────────────────────────────────────────────────────
const CABRIO_QUESTS: QuestTemplate[] = [
  q('Zonkant op!', 'Rijd de komende 5 minuten zo veel mogelijk richting de zon.', 'timer', 'Timer afgelopen.', 300),
  q('Breed en open', 'Kies de breedste, openste weg die je kunt vinden bij de volgende splitsing.', 'direction', 'Breedste weg gekozen.', null, false),
  q('Lekker door', 'Rijd 6 minuten door op de weg die je nu al rijdt — geniet van het uitzicht!', 'timer', 'Timer afgelopen.', 360),
  q('Panoramaplek', 'Zoek een plek met een mooi uitzicht waar je even veilig kunt stoppen.', 'stop', 'Panoramaplek gevonden.', null, false),
  q('Bochtenweg', 'Kies de weg met de meeste bochten bij de volgende splitsing.', 'direction', 'Bochtige weg gekozen.', null, false),
  q('Windmeter', 'Steek je hand even uit het raam (als dit veilig is!). Welke kant waait de wind? Rijd die kant op.', 'direction', 'Windrichting gevolgd.', null, false),
]

// ─── KIDS ────────────────────────────────────────────────────────────────────
const KIDS_QUESTS: QuestTemplate[] = [
  q('Dierenspotter', 'Wie is de eerste die een dier ziet buiten — koe, paard, hond, kat, vogel? Die wint!', 'spotting', 'Eerste dier gespot.'),
  q('Kleurenrace', 'Iedereen kiest een kleur auto. Wie er als eerste 3 van die kleur ziet wint!', 'spotting', 'Iemand heeft 3 auto\'s van zijn kleur geteld.'),
  q('Alfabet op borden', 'Zoek samen letters op borden in alfabetische volgorde. Hoe ver komen jullie?', 'random', 'Zo ver mogelijk.'),
  q('Tel de fietsen', 'Wie ziet de meeste fietsen in de volgende 3 minuten? Tel hardop!', 'timer', 'Timer afgelopen.', 180),
  q('Raad het dorp', 'Rijdt naar een dorp op een bord. Wie raadt als eerste wat er te zien is in dat dorp?', 'spotting', 'Dorp bereikt en geraden.'),
  q('Geluidsimitatie', 'Iemand imiteert het geluid van een voertuig dat jullie zien. De rest moet raden welk!', 'random', 'Iedereen heeft gedaan.'),
  q('Rood-rood-blauw', 'Rijd tot je achter elkaar een rode auto, nog een rode auto én een blauwe auto ziet.', 'spotting', 'Rode, rode, blauwe auto gezien.'),
]

// ─── DATE MODE ───────────────────────────────────────────────────────────────
const DATE_QUESTS: QuestTemplate[] = [
  q('Verrassingsplek', 'Stop bij de volgende mooie of romantische plek die je veilig kunt bereiken. Maak er iets van.', 'stop', 'Samen gestopt op een mooie plek.', null, false),
  q('Zonsondergang zoeken', 'Rijd richting de ondergaande zon. Kies de weg met het mooiste uitzicht.', 'direction', 'Mooi uitzicht gevonden.', null, false),
  q('Geheimzinnig dorp', 'Rijdt naar het kleinste dorp dat jullie op een bord zien. Ontdek iets leuks.', 'spotting', 'Klein dorp bezocht.'),
  q('Foto samen', 'Stop op een plek die jullie allebei mooi vinden en maak een foto samen. +2 punten!', 'stop', 'Foto gemaakt.', null, false),
  q('Rustmoment', 'Zoek een stille, mooie plek om 5 minuten te stoppen. Zet de motor uit en geniet.', 'timer', 'Rustmoment genomen.', 300),
]

// ─── CASUAL ──────────────────────────────────────────────────────────────────
const CASUAL_QUESTS: QuestTemplate[] = [
  q('Lekker rijden', 'Rijd 5 minuten gewoon lekker door. Geen doel, geen stress.', 'timer', 'Timer afgelopen.', 300),
  q('Vertrouwde weg', 'Rijd richting een plek die jullie allebei kennen maar al lang niet bezocht hebben.', 'direction', 'Richting bekend doel ingeslagen.', null, false),
  q('Simpel rechts', 'Neem gewoon rechts bij de volgende kruising. Soms is simpel het beste.', 'direction', 'Rechts afgeslagen.', null, false),
  q('Pauze-plek', 'Zoek een parkje, bankje of terras om even te stoppen als dat uitkomt.', 'stop', 'Pauze genomen.', null, false),
]

// ─── POOLS PER MODUS ─────────────────────────────────────────────────────────

const BASE_POOL = [
  ...DIRECTION_QUESTS,
  ...TIMER_QUESTS,
  ...SPOTTING_QUESTS,
]

const POOLS: Record<string, QuestTemplate[]> = {
  casual:    [...CASUAL_QUESTS, ...BASE_POOL, ...STOP_QUESTS],
  date:      [...DATE_QUESTS, ...STOP_QUESTS, ...SPOTTING_QUESTS, ...DIRECTION_QUESTS],
  kids:      [...KIDS_QUESTS, ...DIRECTION_QUESTS, ...SPOTTING_QUESTS],
  challenge: [...CHALLENGE_QUESTS, ...BASE_POOL],
  mystery:   [...MYSTERY_QUESTS, ...BASE_POOL],
  cabrio:    [...CABRIO_QUESTS, ...BASE_POOL],
}

export function getRandomMockQuest(
  mode: string,
  stopPreference: StopPreference,
  previousTitles: string[],
  timeLeftMinutes = 30
): QuestTemplate {
  let pool = POOLS[mode] ?? BASE_POOL

  if (stopPreference === 'geen') {
    pool = pool.filter(q => q.type !== 'stop')
  }

  // Max timer: 15min→120s (2min), 30min→240s (4min), 60min→480s (8min), 90min+→600s
  const maxTimerSeconds = Math.min(Math.max(timeLeftMinutes * 8, 60), 600)
  pool = pool.filter(q =>
    q.type !== 'timer' ||
    q.durationSeconds === null ||
    q.durationSeconds === 0 ||
    q.durationSeconds <= maxTimerSeconds
  )

  // Als er na filtering niets overblijft, gebruik alleen richting/spotten
  if (pool.length === 0) {
    pool = [...DIRECTION_QUESTS, ...SPOTTING_QUESTS]
  }

  const unused = pool.filter(q => !previousTitles.includes(q.title))
  const source = unused.length > 0 ? unused : pool
  const template = source[Math.floor(Math.random() * source.length)]

  // Voor challenge-quests met durationSeconds === 0: willekeurige 2-5 min
  // begrensd op beschikbare tijd
  if (template.durationSeconds === 0) {
    const maxMins = Math.min(5, Math.floor(timeLeftMinutes * 0.4))
    const mins = 2 + Math.floor(Math.random() * Math.max(1, maxMins - 1))
    return { ...template, durationSeconds: mins * 60 }
  }

  // Geef een verse suffix mee zodat elke instantie een andere richting heeft
  if (template.type !== 'direction' && template.type !== 'stop') {
    const basePart = template.instruction.split('\n\n')[0]
    return { ...template, instruction: `${basePart}\n\n${randomSuffix()}` }
  }

  return template
}
