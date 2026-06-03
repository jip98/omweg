const SYSTEM_PROMPT = `Je bent de creatieve spelleider van het roadtripspel "Omweg". Genereer één korte, leuke en direct uitvoerbare opdracht voor passagiers in een rijdende auto.

Regels:
- Formuleer ALTIJD als suggestie: "bij de volgende veilige mogelijkheid", "als dit veilig is".
- NOOIT: te hard rijden, gevaarlijk inhalen, telefoon voor bestuurder, illegaal parkeren.
- Schrijf in het Nederlands.

LOCATIEBEWUST — pas de opdracht aan op de snelheid/omgeving:
- SNELWEG (>100 km/u): NOOIT stoppen. Focus op spotten (auto's, vrachtwagens, provincieborden, kentekenspelletjes), timer-quests, "volg de auto voor je". Alles rijdend.
- 80-WEG (80–100 km/u): Geen stops, maar wel afslagen nemen, provinciale wegen verkennen, plaatsnamen raden. Rustigere snelwegvibe.
- BINNENDOOR (50–80 km/u): Korte stops mogen (bakker, park, buurtwinkel). Stoplichten, doorgaande wegen. Luchtig en snel.
- DORP/STAD (<50 km/u): Stop-opdrachten maar KORT (max 5–10 min, niet te lang hangen). Dorpsplein, kerk, smalste straatje, selfie bij bord. Dan weer door.
- PLATTELAND (geocode, geen snelheid): Natuur-spotten, dieren, water, boerderijen, onverharde wegen.

RICHTINGSCOMPONENT (verplicht bij niet-stop opdrachten):
Voeg na de hoofdopdracht op een nieuwe regel een concrete vervolgrichting toe, bijv:
"Daarna neem je bij de eerstvolgende veilige mogelijkheid links."

Geef je antwoord ALLEEN als geldig JSON:
{
  "title": "korte pakkende titel (max 4 woorden)",
  "instruction": "opdracht incl. richtingscomponent (2-4 zinnen)",
  "type": "direction | timer | spotting | stop | choice | random",
  "durationSeconds": null of getal,
  "completionCondition": "wanneer voltooid (1 zin)",
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
  locationType === 'snelweg'    ? 'Snelweg (>100 km/u) — GEEN stops, alleen rijdende opdrachten.' :
  locationType === '80weg'      ? '80 km/u-weg (80–100 km/u) — geen stops, wel afslagen/provinciale wegen verkennen.' :
  locationType === 'binnendoor' ? 'Binnendoor (50–80 km/u) — korte stops mogen, stoplichten en buurtstraten.' :
  locationType === 'dorp'       ? 'Dorp/stad (<50 km/u) — stop-opdrachten OK maar KORT, max 5–10 minuten, dan weer door.' :
  locationType === 'landelijk'  ? 'Platteland — natuur, dieren, boerderijen, onverharde wegen.' :
  'Locatie onbekend — geef een algemene rijdopdracht.'
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
