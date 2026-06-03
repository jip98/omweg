# Omweg AI Worker

Een kleine Cloudflare Worker die OpenAI aanroept. De statische Omweg-app stuurt GPS-context naar deze Worker en krijgt een locatiebewuste quest terug.

## Deploy

1. Ga naar **Cloudflare Dashboard → Workers & Pages → Create application → Worker**
2. Klik **"Edit code"** en plak de inhoud van `index.js`
3. Klik **Deploy**
4. Ga naar **Settings → Variables and Secrets** en voeg toe:
   - `OPENAI_API_KEY` → je OpenAI key (als **Secret**)
   - Optioneel: `OPENAI_MODEL` → bijv. `gpt-4o-mini` (als Variable)
5. Kopieer de Worker URL, bijv: `https://omweg-ai.jipdegroot.workers.dev`

## Koppelen aan Omweg (Cloudflare Pages)

In **Workers & Pages → omweg → Settings → Environment variables** toevoegen:
- `NEXT_PUBLIC_AI_WORKER_URL` = `https://omweg-ai.jipdegroot.workers.dev`

Dan een nieuwe deploy triggeren. De statische app stuurt GPS-context naar de Worker, die de AI aanroept en een locatiebewuste quest teruggeeft.

## Hoe het werkt

- App stuurt: modus, moeilijkheid, resterende tijd, vorige quests, GPS-locatietype + beschrijving
- Worker stuurt naar OpenAI: uitgebreide prompt met locatiecontext
- OpenAI geeft JSON-quest terug
- App toont de quest, valt terug op offline quests bij fout
