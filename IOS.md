# Omweg als iOS-app

De app draait nu ook als native iOS-app via **Capacitor**. De web-app zit in een
native schil; alle features (GPS, spraak, AI via de Worker, kaart, delen) werken.

## Eenmalig: wat je nodig hebt op je Mac

1. **Xcode** (gratis uit de App Store) — de volledige versie, niet alleen de
   Command Line Tools. Open Xcode één keer zodat het de extra componenten installeert.
2. Geen CocoaPods nodig — deze setup gebruikt Swift Package Manager.

## App bouwen en openen

```bash
cd "Omweg game"

# 1. Web-app bouwen + naar het iOS-project syncen
npm run ios:sync

# 2. Open het project in Xcode
npm run ios:open
```

In Xcode:
1. Selecteer bovenin een doel: een **simulator** (bijv. iPhone 15) of je **eigen iPhone**
   (via kabel, en "Trust" op de telefoon).
2. Bij je eigen toestel: ga naar **Signing & Capabilities** → kies je Apple ID als **Team**
   (een gratis Apple ID werkt voor testen op je eigen toestel).
3. Klik op ▶ (Run). De app installeert en start.

## Na een codewijziging

Telkens als je iets aan de web-app verandert:

```bash
npm run ios:sync
```

Daarna in Xcode opnieuw op ▶ drukken. (De web-assets in `ios/App/App/public/`
worden automatisch ververst; die map staat daarom in `.gitignore`.)

## Naar de App Store

1. Een **Apple Developer-account** (€99/jaar) is nodig voor distributie.
2. In Xcode: **Product → Archive** → volg de Organizer naar App Store Connect.
3. Vul daar de app-gegevens, screenshots en privacy-info in. Let op: vermeld het
   locatiegebruik (staat al beschreven in `Info.plist`).

## Wat is er ingesteld

- `capacitor.config.ts` — app-id `nl.jipdegroot.omweg`, naam "Omweg", webDir `out`
- App-icoon + splash screen gegenereerd uit `assets/icon.png` (1024×1024)
- `Info.plist` bevat de locatie-toestemming (`NSLocationWhenInUseUsageDescription`)
- De AI draait via de Cloudflare Worker (vaste URL), dus geen extra config nodig

## Icoon aanpassen

Vervang `assets/icon.png` (1024×1024) door je eigen logo en draai:

```bash
npx @capacitor/assets generate --ios
npm run ios:sync
```
