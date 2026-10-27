# Supermarkt Tycoon

Handgezeichnetes 2D-Idle-Spiel im Browser (Handy-optimiert, Deutsch): Baue vom Kiosk zum Weltkonzern auf, verbessere Abteilungen, stelle Mitarbeiter und Manager ein, erweitere Parkplatz und Kassen, forsche im Labor und erfülle Bestellungen. Fünf Standorte mit eigener Optik.

## Aufbau
- `src/`: Quellcode (wird zu einer einzigen `public/index.html` gebaut)
- `build.sh`: baut `public/index.html` (mit Syntaxprüfung)
- `tools/sim.js`: Balance-Simulation (Bot kauft das beste Upgrade)
- `tools/smoke.js`: Rauchtest mit jsdom (klickt durch alle Seiten)
- `wrangler.jsonc`: Cloudflare Worker mit statischen Dateien

## Lokal / Deploy
```
npm install
npm run dev      # http://localhost:8787
npm run deploy
```

## Testmodus
In `src/b_data.js` steht `TESTMODUS = true`: €- und Werbe-Buttons gewähren sofort, es wird nichts bezahlt. Auf `false` stellen, bevor echte Käufe oder Werbung angebunden werden.

## Spielstand
Liegt im Browser (localStorage), Export und Import in den Einstellungen.
