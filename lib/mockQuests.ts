import { Quest, TourMode, StopPreference, QuestType } from './types'
import type { LocationType } from './useLocation'

type QuestTemplate = Omit<Quest, 'id' | 'createdAt' | 'status' | 'points'>

// Na elke voltooide opdracht: wat doe je vervolgens?
const DIRECTION_SUFFIXES = [
  'Daarna neem je bij de eerstvolgende veilige mogelijkheid **links**.',
  'Daarna neem je bij de eerstvolgende veilige mogelijkheid **rechts**.',
  'Rijd daarna **rechtdoor** tot de volgende opdracht.',
  'Daarna neem je de **eerste zijstraat** die je veilig kunt nemen.',
  'Daarna kies je op de volgende kruising de **minst bekende richting**.',
  'Daarna neem je op de eerstvolgende rotonde de **tweede afslag**, als dat veilig is.',
  'Daarna volg je de weg met de **meeste bomen** langs de kant.',
  'Daarna neem je de richting van het eerste **plaatsnaambord** dat je ziet.',
  'Rijd daarna **5 minuten** door op de weg die je nu rijdt.',
  'Daarna kies je de weg die er het **avontuurlijkst** uitziet.',
]

// Na een stop: wat doe je als je weer in de auto zit?
const AFTER_STOP_SUFFIXES = [
  'Rij daarna **rechtdoor** en kijk wat je tegenkomt.',
  'Neem daarna bij de eerste kruising **links**.',
  'Neem daarna bij de eerste kruising **rechts**.',
  'Rijd daarna richting het eerste **onbekende dorp** op een bord.',
  'Rijd daarna **5 minuten** zonder te navigeren.',
  'Kies daarna de **rustigste weg** die je kunt vinden.',
]

// Na een richtingsopdracht: je hebt de bocht genomen — nu?
const AFTER_DIRECTION_SUFFIXES = [
  'Rijd daarna **rechtdoor** tot je een kruising ziet.',
  'Daarna neem je bij de volgende kruising weer **rechts**.',
  'Daarna neem je bij de volgende kruising weer **links**.',
  'Rijd daarna **3 minuten** door op deze weg.',
  'Daarna volg je de weg die er het **smalst** uitziet.',
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function q(
  title: string,
  base: string,
  type: QuestType,
  completionCondition: string,
  durationSeconds: number | null = null,
): QuestTemplate {
  let suffix: string
  if (type === 'stop') {
    suffix = pick(AFTER_STOP_SUFFIXES)
  } else if (type === 'direction') {
    suffix = pick(AFTER_DIRECTION_SUFFIXES)
  } else {
    suffix = pick(DIRECTION_SUFFIXES)
  }
  const instruction = `${base}\n\n${suffix}`
  return { title, instruction, type, durationSeconds, completionCondition, safetyNote: 'Veiligheid en verkeersregels gaan altijd voor.' }
}

// ─── RICHTING ────────────────────────────────────────────────────────────────
const DIRECTION_QUESTS: QuestTemplate[] = [
  q('Linksaf!', 'Neem bij de eerstvolgende veilige mogelijkheid links af. Geen haast — wacht op het goede moment.', 'direction', 'Je hebt links afgeslagen.'),
  q('Rechtsaf!', 'Neem bij de eerstvolgende veilige mogelijkheid rechts af. Kies rustig je moment.', 'direction', 'Je hebt rechts afgeslagen.'),
  q('Tweede afslag', 'Neem op de eerstvolgende rotonde de tweede afslag, als dat veilig en toegestaan is.', 'direction', 'Tweede rotonde-afslag genomen.'),
  q('Richting het onbekende', 'Neem bij de volgende kruising de richting van het eerste dorpsnaambord dat je ziet — ook al ken je het niet.', 'direction', 'Je rijdt richting een onbekend dorp.'),
  q('Kleinste weg', 'Kies bij de volgende kruising de smalste weg die je veilig kunt nemen.', 'direction', 'Je bent de smalste weg ingeslagen.'),
  q('Volg het groen', 'Kies bij de volgende splitsing de weg met de meeste bomen of groen langs de kant.', 'direction', 'Groenste weg gekozen.'),
  q('Minst logisch', 'Kies bij de volgende afslag de richting die het minst logisch voelt. Vertrouw je instinct.', 'direction', 'Minst logische richting gekozen.'),
  q('Rustigste weg', 'Kies bij de volgende kruising bewust de rustigste, stillste weg die je veilig kunt nemen.', 'direction', 'Rustigste weg gekozen.'),
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
  q('Koffie!', 'Zoek een plek waar je koffie kunt halen. Tankstation, bakker, café — alles mag.', 'stop', 'Koffie gevonden.'),
  q('Mooie plek', 'Stop bij de eerste plek die mooi, bijzonder of raar genoeg is om even te parkeren. Geniet even van het uitzicht.', 'stop', 'Veilig gestopt.'),
  q('Dorpskern', 'Rijd richting het eerste plaatsnaambord dat je ziet. Stop even in het dorp.', 'stop', 'Gestopt in het dorp.'),
]

// ─── CHALLENGE ───────────────────────────────────────────────────────────────
const CHALLENGE_QUESTS: QuestTemplate[] = [
  q('Blindehoek', 'Neem de eerstvolgende afslag die je NIET kon zien aankomen — verassing!', 'direction', 'Verrassingsafslag genomen.'),
  q('Tegenstroom', 'Kies bij de volgende kruising de richting tegenovergesteld aan het drukste verkeer.', 'direction', 'Rustigste kant gekozen.'),
  q('Drie afslagen', 'Neem de eerstvolgende drie afslagen in deze volgorde: links, rechts, links — als dat veilig is.', 'direction', 'Drie afslagen genomen.'),
  q('Onbekend dorp', 'Rijdt naar het dichtstbijzijnde dorp op een bord dat niemand in de auto ooit bezocht heeft.', 'spotting', 'Nieuw dorp gevonden.'),
  q('Willekeurige minuten', 'Laat iemand een getal van 3 t/m 9 kiezen. Rijd precies dat aantal minuten rechtdoor.', 'timer', 'Timer afgelopen.', 0), // durationSeconds wordt client-side gezet
  q('Foto of feit', 'Stop bij een object langs de weg dat iedereen bijzonder genoeg vindt — en leg uit waarom. +2 bonuspunten!', 'stop', 'Foto gemaakt of feit verteld.'),
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
  q('Breed en open', 'Kies de breedste, openste weg die je kunt vinden bij de volgende splitsing.', 'direction', 'Breedste weg gekozen.'),
  q('Lekker door', 'Rijd 6 minuten door op de weg die je nu al rijdt — geniet van het uitzicht!', 'timer', 'Timer afgelopen.', 360),
  q('Panoramaplek', 'Zoek een plek met een mooi uitzicht waar je even veilig kunt stoppen.', 'stop', 'Panoramaplek gevonden.'),
  q('Bochtenweg', 'Kies de weg met de meeste bochten bij de volgende splitsing.', 'direction', 'Bochtige weg gekozen.'),
  q('Windmeter', 'Steek je hand even uit het raam (als dit veilig is!). Welke kant waait de wind? Rijd die kant op.', 'direction', 'Windrichting gevolgd.'),
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
  q('Verrassingsplek', 'Stop bij de volgende mooie of romantische plek die je veilig kunt bereiken. Maak er iets van.', 'stop', 'Samen gestopt op een mooie plek.'),
  q('Zonsondergang zoeken', 'Rijd richting de ondergaande zon. Kies de weg met het mooiste uitzicht.', 'direction', 'Mooi uitzicht gevonden.'),
  q('Geheimzinnig dorp', 'Rijdt naar het kleinste dorp dat jullie op een bord zien. Ontdek iets leuks.', 'spotting', 'Klein dorp bezocht.'),
  q('Verrassingsplek', 'Stop op een plek die jullie allebei mooi vinden. Stap even uit en geniet. +2 punten!', 'stop', 'Mooi plekje gevonden.'),
  q('Rustmoment', 'Zoek een stille, mooie plek om 5 minuten te stoppen. Zet de motor uit en geniet.', 'timer', 'Rustmoment genomen.', 300),
]

// ─── CASUAL ──────────────────────────────────────────────────────────────────
const CASUAL_QUESTS: QuestTemplate[] = [
  q('Lekker rijden', 'Rijd 5 minuten gewoon lekker door. Geen doel, geen stress.', 'timer', 'Timer afgelopen.', 300),
  q('Vertrouwde weg', 'Rijd richting een plek die jullie allebei kennen maar al lang niet bezocht hebben.', 'direction', 'Richting bekend doel ingeslagen.'),
  q('Simpel rechts', 'Neem gewoon rechts bij de volgende kruising. Soms is simpel het beste.', 'direction', 'Rechts afgeslagen.'),
  q('Pauze-plek', 'Zoek een parkje, bankje of terras om even te stoppen als dat uitkomt.', 'stop', 'Pauze genomen.'),
]

// ─── LOCATIE-SPECIFIEKE POOLS ────────────────────────────────────────────────

const HIGHWAY_QUESTS: QuestTemplate[] = [
  q('Provinciebord!', 'Rijd door totdat je een provinciebord ziet. Welke provincie komen jullie binnen?', 'spotting', 'Provinciebord gespot.'),
  q('Vrachtwagen race', 'Tel de vrachtwagens die jullie inhalen of die jullie inhalen. Wie bereikt 5 het eerst?', 'spotting', 'Iemand heeft 5 vrachtwagens geteld.'),
  q('Snelste kleur', 'Welke autokleur zie je het vaakst op deze snelweg? Roep ze hardop!', 'timer', 'Timer afgelopen.', 120),
  q('Kenteken-spel', 'Bedenk een woord van de letters op het eerste kenteken dat je ziet.', 'random', 'Woord bedacht.'),
  q('Volg de leider', 'Volg de auto voor jullie maximaal 3 minuten, zolang dit veilig blijft.', 'timer', 'Timer afgelopen of van file af.', 180),
  q('Afrit-roulette', 'Neem de eerstvolgende afrit. Ontdek wat er te zien is en keer daarna terug of ga door.', 'direction', 'Afrit genomen.'),
]

const VILLAGE_QUESTS: QuestTemplate[] = [
  q('Dorpskerk', 'Zoek de kerk of het gemeentehuis van dit dorp. Stap even uit en kijk rond — max 5 minuten.', 'stop', 'Kerk of gemeentehuis gevonden.'),
  q('Dorpsplein', 'Stop even op het dorpsplein als je dat veilig kunt. Bekijk de omgeving 2 minuten.', 'timer', 'Kort gestopt.', 120),
  q('Vraag een tip', 'Stop bij een voorbijganger of winkel en vraag de mooiste tip voor de omgeving. Dan door!', 'stop', 'Tip ontvangen.'),
  q('Kleinste straatje', 'Rijd door het smalste straatje van het dorp dat je veilig kunt nemen. Dan er weer uit!', 'direction', 'Door het straatje gereden.'),
  q('Dorpsnaambord', 'Stop bij het dorpsnaambord aan de uitgang van het dorp. Even uitstappen en rondkijken!', 'stop', 'Dorpsnaambord gevonden.'),
]

const CITY_QUESTS: QuestTemplate[] = [
  q('Straatkunst', 'Rijd door totdat je straatkunst of graffiti ziet. Mooi of lelijk — maakt niet uit.', 'spotting', 'Straatkunst gespot.'),
  q('Terras-stop', 'Zoek een terras of koffiebar waar je kort kunt stoppen. Max 10 minuten.', 'stop', 'Koffie of drankje gehaald.'),
  q('Fietser tellen', 'Tel de fietsers die jullie de komende 2 minuten zien. Wie telt er het meest?', 'timer', 'Timer afgelopen.', 120),
  q('Marktplein', 'Rijd naar het centrum of marktplein van de stad. Even rondrijden en dan door.', 'direction', 'Centrum bezocht.'),
  q('Onbekende straat', 'Neem de eerstvolgende straat die jullie allebei nog nooit gehoord hebben.', 'direction', 'Onbekende straat ingeslagen.'),
]

const RURAL_QUESTS: QuestTemplate[] = [
  q('Dier in het weiland', 'Rijd totdat iemand een dier in een weiland ziet — koe, schaap, paard, alles telt.', 'spotting', 'Dier gespot.'),
  q('Waterzoeker', 'Rijd tot je water ziet — rivier, kanaal, meer of sloot.', 'spotting', 'Water gespot.'),
  q('Boerderij', 'Rijd totdat je een boerderij of schuur ziet. Wat verbouwen ze? Raad het!', 'spotting', 'Boerderij gespot.'),
  q('Onverharde weg', 'Neem de eerstvolgende onverharde weg of zandpad dat je veilig op kunt. Even verkennen!', 'direction', 'Zandpad genomen.'),
  q('Horizon', 'Rijd 3 minuten in de richting van het mooiste uitzicht dat je ziet.', 'timer', 'Timer afgelopen.', 180),
]

// 80-wegen: provinciale wegen, buiten bebouwde kom, mag iets meer dan snelweg
const ROAD80_QUESTS: QuestTemplate[] = [
  q('Provinciale weg', 'Rijd tot je een provinciale-wegbord (N-nummer) ziet. Welk nummer is het?', 'spotting', 'N-wegbord gespot.'),
  q('Tankstation afrit', 'Neem de eerstvolgende afrit met een tankstation. Even stoppen en dan door!', 'spotting', 'Tankstation gevonden.'),
  q('Plaatsnaambord', 'Rijd tot je een plaatsnaambord ziet dat niemand kent. Dat is jullie volgende richting.', 'spotting', 'Onbekend dorp gevonden.'),
  q('Filewatcher', 'Zie je tegenliggers vertragen? Volg 2 minuten de weg en kijk wat er verandert.', 'timer', 'Timer afgelopen.', 120),
  q('Bomenrij', 'Rijd tot je een weg met bomen aan beide kanten ziet. Neem die richting!', 'spotting', 'Bomenrij gevonden.'),
]

// Binnendoor: 50-80 km/u, doorgaande wegen door dorpen/stad, korte stops ok
const BINNENDOOR_QUESTS: QuestTemplate[] = [
  q('Bakker of slager', 'Rijd tot je een bakker, slager of kaaswinkel ziet. Stop even als je kunt!', 'spotting', 'Winkel gespot.'),
  q('Verkeersdrempel', 'Tel de verkeersdrempels of wegversmallingen die jullie de komende 2 minuten tegenkomen.', 'timer', 'Timer afgelopen.', 120),
  q('Stoplicht-route', 'Volg bij het volgende stoplicht de richting die het minst voor de hand ligt.', 'direction', 'Onverwachte richting gekozen.'),
  q('Buurtsuper', 'Zoek een kleine supermarkt of buurtwinkel. Stop kort als je iets nodig hebt.', 'spotting', 'Buurtwinkel gespot.'),
  q('Speeltuin of park', 'Rijd totdat je een speeltuin, park of groene plek ziet.', 'spotting', 'Groene plek gespot.'),
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

const LOCATION_BONUS: Record<string, QuestTemplate[]> = {
  snelweg:     HIGHWAY_QUESTS,
  '80weg':     ROAD80_QUESTS,
  binnendoor:  BINNENDOOR_QUESTS,
  stad:        CITY_QUESTS,   // stad = rondrijden en ontdekken, stops OK
  dorp:        VILLAGE_QUESTS, // dorp = kort bezoek, dan door
  landelijk:   RURAL_QUESTS,
}

export function getRandomMockQuest(
  mode: string,
  stopPreference: StopPreference,
  previousTitles: string[],
  timeLeftMinutes = 30,
  locationType: LocationType = 'onbekend'
): QuestTemplate {
  let pool = POOLS[mode] ?? BASE_POOL

  // Voeg locatie-specifieke quests toe (50% kans om er een te trekken)
  const locationPool = LOCATION_BONUS[locationType] ?? []
  if (locationPool.length > 0 && Math.random() < 0.5) {
    pool = [...locationPool, ...pool]
  }

  if (stopPreference === 'geen') {
    pool = pool.filter(q => q.type !== 'stop')
  }

  // Op snelweg en 80-weg: geen stop-opdrachten
  if (locationType === 'snelweg' || locationType === '80weg') {
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
  if (template.durationSeconds === 0) {
    const maxMins = Math.min(5, Math.floor(timeLeftMinutes * 0.4))
    const mins = 2 + Math.floor(Math.random() * Math.max(1, maxMins - 1))
    return { ...template, durationSeconds: mins * 60 }
  }

  // Elke instantie krijgt een verse richting-suffix (q() heeft er al één,
  // maar hier verversen we hem zodat hij niet altijd hetzelfde is)
  const basePart = template.instruction.split('\n\n')[0]
  let freshSuffix: string
  if (template.type === 'stop') {
    freshSuffix = pick(AFTER_STOP_SUFFIXES)
  } else if (template.type === 'direction') {
    freshSuffix = pick(AFTER_DIRECTION_SUFFIXES)
  } else {
    freshSuffix = pick(DIRECTION_SUFFIXES)
  }
  return { ...template, instruction: `${basePart}\n\n${freshSuffix}` }
}
