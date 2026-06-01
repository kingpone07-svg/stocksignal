#!/bin/bash
# StockSignal starten – Doppelklick genügt
cd "$(dirname "$0")"

# Node.js prüfen
if ! command -v node &>/dev/null; then
  osascript -e 'display alert "Node.js fehlt" message "Bitte Node.js von https://nodejs.org installieren (LTS-Version), dann dieses Script erneut starten."'
  exit 1
fi

# Abhängigkeiten installieren (nur beim ersten Start)
if [ ! -d "node_modules" ]; then
  echo "📦 Installiere Electron (einmalig, ~2 Minuten)..."
  npm install
fi

# App starten
echo "🚀 StockSignal startet..."
npm start
