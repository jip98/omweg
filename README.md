# Omweg 🛣️

> Laat AI bepalen waar je uitkomt.

Een AI-roadtripspel voor in de auto. Passagiers krijgen verrassende rijdopdrachten gegenereerd door AI. De bestuurder rijdt altijd veilig en bepaalt zelf wat hij/zij doet.

---

## Snel starten

### 1. Installeer dependencies

```bash
cd "Omweg game"
npm install
```

### 2. Maak een `.env.local` bestand

```bash
cp .env.example .env.local
```

Open `.env.local` en vul je OpenAI API key in:

```
OPENAI_API_KEY=sk-proj-...
```

**Zonder API key** werkt de app ook — er worden dan offline voorbeeldopdrachten gebruikt.

Haal een API key op via: https://platform.openai.com/api-keys

### 3. Start de development server

```bash
npm run dev
```

Open de browser op **http://localhost:3000**

Voor de beste ervaring: open op je telefoon via het lokale netwerk.

---

## Projectstructuur

```
app/
  page.tsx          → Startscherm
  setup/page.tsx    → Tour instellen
  tour/page.tsx     → Actieve tour met opdrachten
  summary/page.tsx  → Eindscherm met score
  api/quest/route.ts → AI opdracht generatie (OpenAI)

components/
  QuestCard.tsx     → Opdrachtenkaart
  TimerDisplay.tsx  → Countdown timer
  SafetyBanner.tsx  → Veiligheidsmelding

lib/
  types.ts          → TypeScript interfaces
  tourStore.tsx     → React context + localStorage state
  mockQuests.ts     → Offline fallback opdrachten (60+)
```

---

## Tech stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** (glassmorphism design)
- **OpenAI API** (gpt-4o-mini voor opdrachten)
- State in **localStorage** (geen backend nodig voor MVP)

---

## Omgeving variabelen

| Variabele | Beschrijving | Standaard |
|---|---|---|
| `OPENAI_API_KEY` | OpenAI API key | — (offline modus) |
| `OPENAI_MODEL` | Welk model te gebruiken | `gpt-4o-mini` |

---

## Bouwen voor productie

```bash
npm run build
npm start
```

---

## Vervolgstappen na MVP

### Snel toe te voegen
- [ ] **Foto's tijdens de rit** — camera-integratie via browser API
- [ ] **GPS-context** — huidige locatie meegeven aan AI voor locatierelevante opdrachten
- [ ] **Meer modi** — seizoensmodi (kerst, zomer), nacht-modus
- [ ] **Punten animaties** — confetti bij voltooiing

### Middellange termijn
- [ ] **Accounts** (Supabase auth) — ritten opslaan, geschiedenis bekijken
- [ ] **Multiplayer** — meerdere spelers elk op eigen telefoon
- [ ] **Route opslaan** — toon achteraf op kaart (Mapbox / Leaflet)
- [ ] **Social sharing** — eindscherm delen als TikTok-stijl video

### Later
- [ ] **Betaalmuur** — premium modi, onbeperkte AI-opdrachten
- [ ] **App store** — React Native / Expo wrapper
- [ ] **Badges** — achievements per toertype, moeilijkheid, locatie

---

## Veiligheid

De app is uitsluitend bedoeld voor **passagiers**. Alle opdrachten worden geformuleerd als suggesties. De bestuurder rijdt altijd zelf verantwoordelijk, veilig en volgens de verkeersregels.
