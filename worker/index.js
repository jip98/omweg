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
    mode, difficulty, timeLeftMinutes, allowStops,
    previousTitles = [], location = {}
  } = body

  const locationDesc = location.description || 'Locatie onbekend'
  const locationType = location.type || 'onbekend'
  const speedInfo = location.speedKmh ? `Snelheid: ~${location.speedKmh} km/u.` : ''
  const placeInfo = location.city ? `Stad: ${location.city}.` : location.village ? `Dorp: ${location.village}.` : ''

  return `Genereer één opdracht voor het Omweg roadtrip spel.
Modus: ${mode}
Moeilijkheid: ${difficulty}
Resterende tijd: ${timeLeftMinutes} minuten
Stops toegestaan: ${allowStops}
Vorige opdrachten (vermijd herhaling): ${previousTitles.slice(-5).join(', ') || 'geen'}

HUIDIGE LOCATIECONTEXT:
Omgeving: ${locationDesc}
Type: ${locationType}
${speedInfo}
${placeInfo}

Pas de opdracht aan op deze locatie. ${
  locationType === 'snelweg'    ? 'SNELWEG — NOOIT stoppen. Spotten, volg de leider, kleurenrace, kenteken-spel, afrit-roulette.' :
  locationType === '80weg'      ? '80 KM/U-WEG — Geen stops. Provinciale wegen, plaatsnamen raden, bomenrij, filewatcher.' :
  locationType === 'binnendoor' ? 'BINNENDOOR — Stoppen mag juist, hier zijn vaak mooie plekjes. Korte stop bij iets moois, plus spotten en richting.' :
  locationType === 'stad'       ? 'GROTE STAD — Blijf in de stad en verken via spotten/richting: straatkunst, onbekende straat inslaan, hoogste gebouw, fietser tellen. GEEN vaste bestemmingen (geen marktplein/centrum). Niet wegrijden.' :
  locationType === 'dorp'       ? 'KLEIN DORP — Rijd er doorheen. Kijk OF je een kerktoren/oude gevel ziet, kies het smalste straatje, dan het dorp uit richting onbekend bord. Neem niks aan over voorzieningen.' :
  locationType === 'landelijk'  ? 'PLATTELAND — Natuur, dieren, boerderij, onverharde weg, water, horizon.' :
  'ONBEKEND — geef een algemene rijdopdracht zoals richting, spotten of timer.'
}`
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders })
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
