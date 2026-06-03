const SYSTEM_PROMPT = `Je bent de creatieve spelleider van het roadtripspel "Omweg". Genereer één korte, leuke en direct uitvoerbare opdracht voor passagiers in een rijdende auto.

Regels:
- Formuleer ALTIJD als suggestie: "bij de volgende veilige mogelijkheid", "als dit veilig is".
- NOOIT: te hard rijden, gevaarlijk inhalen, telefoon voor bestuurder, illegaal parkeren.
- Schrijf in het Nederlands.

LOCATIEBEWUST — pas de opdracht aan op de omgeving:
- Op de SNELWEG: geen stops, focus op spotten (auto's, borden, vrachtwagens), timer-quests, provincieborden, "volg de auto voor je". Geen korte stoptijden want dat is gevaarlijk.
- In de STAD: korte sightseeing-stops (max 10 min), "zoek een terras", "rij door de hoofdstraat", historische gebouwen, korte wandeling. Geen lange rijtijden want er zijn veel stoplichten.
- In een DORP: stop-opdrachten maar KORT (max 5-10 min, niet te lang in het dorp hangen), "foto van het dorpsplein", "zoek de kerk of het gemeentehuis", "vraag iemand om een tip". Daarna weer door.
- Op het PLATTELAND: natuur-spotten (dieren, water, molens, boerderijen), rustige wegen, "rijd tot je een brug ziet", landelijke avonturen.

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
  locationType === 'snelweg' ? 'De bestuurder rijdt snel op de snelweg — geen stops, geen gevaarlijke manoeuvres.' :
  locationType === 'dorp' ? 'Je bent in een dorp — geef een korte stop-opdracht of sightseeing-tip, maar niet te lang blijven.' :
  locationType === 'stad' ? 'Je bent in de stad — stoplichten en parkeren is mogelijk, geef stedelijke opdrachten.' :
  locationType === 'landelijk' ? 'Je rijdt op het platteland — natuur en rustige wegen staan centraal.' :
  'Geef een algemene opdracht.'
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
