export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { getRandomMockQuest } from '@/lib/mockQuests'
import { TourMode, Difficulty, StopPreference } from '@/lib/types'

const SYSTEM_PROMPT = `Je bent de creatieve spelleider van het roadtripspel "Omweg". Genereer één korte, leuke en direct uitvoerbare opdracht voor passagiers in een rijdende auto.

Regels:
- De opdracht mag gaan over: links/rechts rijden, een voertuig volgen, wachten tot je iets ziet, een timer gebruiken, een stopplek zoeken of een willekeurige richting kiezen.
- Formuleer ALTIJD als suggestie: "bij de volgende veilige mogelijkheid", "als dit veilig is", "zolang dit veilig blijft".
- NOOIT: te hard rijden, abrupt remmen, gevaarlijk inhalen, telefoon gebruiken als bestuurder, illegaal parkeren, verkeersregels overtreden.
- Maak de opdracht passend bij de gekozen modus, moeilijkheid en beschikbare tijd.
- Schrijf in het Nederlands.

BELANGRIJK — Richtingscomponent:
Elke opdracht die NIET van type "direction" of "stop" is, MOET eindigen met een concrete vervolgactie. Voeg na de hoofdopdracht op een nieuwe regel toe, bijvoorbeeld:
"Daarna neem je bij de eerstvolgende veilige mogelijkheid links."
of: "Daarna neem je de tweede afslag op de eerstvolgende rotonde."
of: "Rijd daarna rechtdoor tot de volgende opdracht."
Kies telkens een andere richting zodat het afwisselt.

Geef je antwoord ALLEEN als geldig JSON object met deze velden:
{
  "title": "korte pakkende titel (max 4 woorden)",
  "instruction": "duidelijke en speelse opdracht incl. richtingscomponent (2-4 zinnen)",
  "type": "direction | timer | spotting | stop | choice | random",
  "durationSeconds": null of een getal in seconden,
  "completionCondition": "wanneer is de opdracht voltooid (1 zin)",
  "safetyNote": "Veiligheid en verkeersregels gaan altijd voor."
}`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { mode, difficulty, timeLeftMinutes, allowStops, previousTitles = [] } = body as {
      mode: TourMode
      difficulty: Difficulty
      timeLeftMinutes: number
      allowStops: StopPreference
      previousTitles: string[]
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      const mock = getRandomMockQuest(mode, allowStops, previousTitles)
      return NextResponse.json(mock)
    }

    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

    const userPrompt = `Genereer één opdracht voor het Omweg roadtrip spel.
Modus: ${mode}
Moeilijkheid: ${difficulty}
Resterende tijd: ${timeLeftMinutes} minuten
Stops toegestaan: ${allowStops}
Vorige opdrachten (vermijd herhaling): ${previousTitles.slice(-5).join(', ') || 'geen'}

Bedenk iets origineels dat past bij de modus en moeilijkheid. Bij "chaotisch" mag het absurder en uitdagender. Bij "rustig" rustig en eenvoudig.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.9,
        max_tokens: 400,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const mock = getRandomMockQuest(mode, allowStops, previousTitles)
      return NextResponse.json(mock)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      const mock = getRandomMockQuest(mode, allowStops, previousTitles)
      return NextResponse.json(mock)
    }

    const parsed = JSON.parse(content)
    parsed.safetyNote = 'Veiligheid en verkeersregels gaan altijd voor.'

    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json(
      { error: 'Quest generatie mislukt' },
      { status: 500 }
    )
  }
}
