const SYSTEM_PROMPT = `Je bent de creatieve spelleider van Omweg, een roadtripspel voor passagiers. Je genereert verrassende, leuke en uitvoerbare rijdopdrachten.

VEILIGHEID:
- NOOIT: te hard rijden, gevaarlijk inhalen, telefoon voor bestuurder, illegaal parkeren.
- NOOIT om een foto vragen — telefoon in de hand is gevaarlijk.
- Schrijf in het Nederlands.

GEEN AANNAMES OVER DE OMGEVING (heel belangrijk):
- Neem NOOIT aan dat een specifieke plek bestaat of dichtbij is. Veel dorpen hebben GEEN marktplein, centrum, terras, museum of bezienswaardigheid.
- VERBODEN: "rijd naar het marktplein", "ga naar het centrum", "zoek het museum", "bezoek de bezienswaardigheid", "rijd naar de kerk" als doel.
- WEL goed: "rijd verder en KIJK OF je een kerktoren ziet" (open einde, geen verplichting).
- Een bestemming mag alleen "het eerste bord dat je ziet" zijn, nooit een vaste plek die er misschien niet is.

VERDELING (strikt):
- 50% richting/keuze — links, rechts, afslag kiezen
- 25% volgen/spotten — iets zien of een auto/weg volgen tijdens het rijden
- 20% timer — rijd X minuten / volg iets X minuten
- 5% stop — uitstappen, hooguit 1 op 20 quests

INSPIRATIE PER TYPE (gebruik deze ideeën als basis, maar varieer):
Volgen/spotten: rode/gele/blauwe auto, vrachtwagen met onbekend logo, bus, fietser, molen, kerktoren, brug, water, dier in weiland, straatnaam met dier/boom/beroep, reclamebord hardop lezen, provinciebord, kenteken-woordspel, kleurenrace (wie ziet als eerste 5 van een kleur), rood-rood-blauw reeks, oude gevel met jaartal, bloembak aan een huis, de auto voor je volgen tot een bepaald punt.
Richting: linksaf, rechtsaf, tweede afslag rotonde, richting onbekend dorp op bord, smalste weg, groenste weg, minst logische richting, tegenstroom, afrit-roulette, richting hoogste gebouw in zicht.
Timer: 90s snel links/rechts, 2 min rechtdoor, 3 min volg de auto voor je, 3 min zonder navigatie, richting het noorden, volg het hart (copiloot wijst links/rechts).
Stop (zeldzaam): koffie zoeken áls je toevallig iets ziet, of bij een mooi plekje even uitstappen — nooit naar een vaste plek.

LOCATIE:
- SNELWEG (>100 km/u): NOOIT stoppen. Spotten, timer, richting. Vrachtwagentelling, afrit-roulette, provinciebord, kleurenrace, kenteken-spel, volg de leider.
- 80-WEG (80–100 km/u): Geen stops. Provinciale wegen, plaatsnamen raden, bomenrij volgen.
- BINNENDOOR (50–80 km/u): Stoppen mag juist — hier zijn vaak mooie plekjes. Een korte stop bij iets moois, plus spotten en richting.
- STAD (grote stad): Rondrijden en ontdekken via spotten/richting. Straatkunst, onbekende straat inslaan, fietser tellen, hoogste gebouw. GEEN vaste bestemmingen.
- DORP (klein dorp): Kort doorheen rijden. Kijk OF je een kerktoren/oude gevel ziet, smalste straatje, dan het dorp uit richting onbekend bord. Neem niks aan over voorzieningen.
- PLATTELAND: Natuur-spotten, dieren, water, boerderijen, onverharde weg, horizon.

VERVOLGRICHTING (VERPLICHT op ELKE opdracht, altijd als tweede alinea):
Na de hoofdopdracht komt altijd op een nieuwe regel wat de bestuurder DAARNA doet.
Varieer: links, rechts, rechtdoor, rotonde-afslag, rustigste weg, richting plaatsnaambord, 5 minuten door.
Bij stop-opdrachten: wat doe je NADAT je weer in de auto zit?
Bij richting-opdrachten: wat doe je NADAT je de bocht hebt genomen?
Voorbeelden:
- "Daarna neem je bij de eerstvolgende veilige mogelijkheid **links**."
- "Rijd daarna **rechtdoor** tot je een kruising ziet."
- "Neem daarna de **tweede afslag** op de eerstvolgende rotonde."
- "Rijd daarna **5 minuten** door op de weg die je nu rijdt."
- "Daarna volg je de weg richting het eerste **onbekende dorp** op een bord."

JSON FORMAAT (geef ALLEEN dit terug):
{
  "title": "max 4 woorden",
  "instruction": "opdracht + richtingscomponent, 2-4 zinnen",
  "type": "direction | timer | spotting | stop | choice | random",
  "durationSeconds": getal in seconden bij timer (bijv. 90, 120, 180, 300), anders null — NOOIT een string,
  "completionCondition": "wanneer voltooid, 1 zin",
  "safetyNote": "Veiligheid en verkeersregels gaan altijd voor."
}`

function buildPrompt(body) {
  const {
    mode, difficulty, timeLeftMinutes, totalMinutes,
    phase, partOfDay, questNumber,
    allowStops, roadPreference,
    returnHome, headingHome,
    previousTitles = [], location = {}
  } = body

  const locationType = location.type || 'onbekend'

  // Locatieregels per type
  const locationRule =
    locationType === 'snelweg'    ? 'SNELWEG — NOOIT stoppen. Spotten, volg de leider, kleurenrace, kenteken-spel, afrit-roulette.' :
    locationType === '80weg'      ? '80 KM/U-WEG — Geen stops. Provinciale wegen, plaatsnamen raden, bomenrij, filewatcher.' :
    locationType === 'binnendoor' ? 'BINNENDOOR — Stoppen mag juist, hier zijn vaak mooie plekjes. Korte stop bij iets moois, plus spotten en richting.' :
    locationType === 'stad'       ? 'GROTE STAD — Blijf in de stad en verken via spotten/richting: straatkunst, onbekende straat inslaan, hoogste gebouw, fietser tellen. GEEN vaste bestemmingen. Niet wegrijden.' :
    locationType === 'dorp'       ? 'KLEIN DORP — Rijd er doorheen. Kijk OF je een kerktoren/oude gevel ziet, kies het smalste straatje, dan het dorp uit richting onbekend bord. Neem niks aan over voorzieningen.' :
    locationType === 'landelijk'  ? 'PLATTELAND — Natuur, dieren, boerderij, onverharde weg, water, horizon.' :
    'ONBEKEND — geef een algemene rijdopdracht zoals richting, spotten of timer.'

  // Faseregels: pas opdracht aan op hoe ver de rit is
  const phaseRule =
    phase === 'begin' ? 'BEGIN van de rit — opwarmer, laagdrempelig, zet de toon.' :
    phase === 'einde' ? `EINDE nadert (nog ${timeLeftMinutes} min) — houd opdrachten KORT, geen lange timers die over de eindtijd lopen. Eventueel richting een mooi eindpunt.` :
    'MIDDEN van de rit — alles mag, wees creatief en gevarieerd.'

  // Tijd van de dag
  const timeRule =
    partOfDay === 'ochtend' ? 'OCHTEND — fris, eventueel koffie spotten.' :
    partOfDay === 'middag'  ? 'MIDDAG — volop daglicht, alles kan.' :
    partOfDay === 'avond'   ? 'AVOND — laag zonlicht, mooie luchten, zonsondergang-richting kan leuk zijn.' :
    'NACHT — donker. Focus op verlichte dingen: verlichte borden, lichtreclame, koplampen tellen. Geen "spot een dier in het weiland" (niet zichtbaar).'

  // Bouw de regels samen, alleen niet-lege
  const lines = [
    `Modus: ${mode}`,
    `Moeilijkheid: ${difficulty}`,
    `Tour: ${totalMinutes ?? '?'} min totaal, nog ${timeLeftMinutes} min te gaan (fase: ${phase ?? 'onbekend'})`,
    `Opdrachtnummer: ${questNumber ?? '?'}`,
    `Tijd van de dag: ${partOfDay ?? 'onbekend'}`,
    `Stops toegestaan: ${allowStops}`,
    roadPreference ? `Wegvoorkeur: ${roadPreference}` : null,
    location.description ? `Waar: ${location.description}` : null,
    location.road ? `Straat/weg: ${location.road}` : null,
    location.county ? `Gemeente/regio: ${location.county}` : null,
    location.speedKmh != null ? `Snelheid: ~${location.speedKmh} km/u` : null,
    location.compass ? `Rijrichting: naar het ${location.compass} (zeg NIET "rijd naar het ${location.compass}", daar gaan ze al heen — kies een ANDERE richting)` : null,
    `Vorige opdrachten (vermijd herhaling): ${previousTitles.slice(-5).join(', ') || 'geen'}`,
  ].filter(Boolean)

  // Terugkeer naar start in de eindfase
  const homeRule = returnHome
    ? `\nTERUGKEER: De rit loopt af en de spelers willen richting hun vertrekpunt. ${
        headingHome
          ? `Het startpunt ligt globaal in de richting **${headingHome}**. Geef opdrachten die hen geleidelijk die kant op sturen (kies wegen/afslagen richting het ${headingHome}), zonder saaie kale navigatie — houd het speels.`
          : 'Stuur hen met richting-opdrachten geleidelijk terug, speels gehouden.'
      }`
    : ''

  return `Genereer één opdracht voor het Omweg roadtrip spel.

${lines.join('\n')}

LOCATIE: ${locationRule}
FASE: ${phaseRule}
TIJD: ${timeRule}${homeRule}

Stem de opdracht concreet af op bovenstaande context.`
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' }

// Sla like/dislike op in D1 (generiek — zonder plaatsnaam)
async function handleFeedback(request, env) {
  if (!env.DB) {
    return new Response(JSON.stringify({ ok: false, error: 'geen database' }), { status: 200, headers: jsonHeaders })
  }
  const f = await request.json()
  const vote = f.vote === 1 ? 1 : f.vote === -1 ? -1 : 0
  if (vote === 0) return new Response(JSON.stringify({ ok: false }), { status: 400, headers: jsonHeaders })

  try {
    await env.DB.prepare(
      `INSERT INTO feedback (vote, type, title, instruction, mode, location_type, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      vote,
      String(f.type ?? '').slice(0, 20),
      String(f.title ?? '').slice(0, 120),
      String(f.instruction ?? '').slice(0, 500),
      String(f.mode ?? '').slice(0, 20),
      String(f.locationType ?? '').slice(0, 20),
      Date.now()
    ).run()
    return new Response(JSON.stringify({ ok: true }), { headers: jsonHeaders })
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 200, headers: jsonHeaders })
  }
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders })
    }

    const { pathname } = new URL(request.url)
    if (pathname.endsWith('/feedback')) {
      return handleFeedback(request, env)
    }

    try {
      const body = await request.json()
      const apiKey = env.OPENAI_API_KEY
      const model = env.OPENAI_MODEL || 'gpt-4o-mini'

      if (!apiKey) {
        return new Response(JSON.stringify({ error: 'No API key configured' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: buildPrompt(body) },
          ],
          temperature: 0.9,
          max_tokens: 400,
          response_format: { type: 'json_object' },
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI error: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content
      if (!content) throw new Error('Empty response')

      const quest = JSON.parse(content)
      quest.safetyNote = 'Veiligheid en verkeersregels gaan altijd voor.'

      return new Response(JSON.stringify(quest), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
  }
}
