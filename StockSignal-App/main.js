const { app, BrowserWindow, ipcMain, shell } = require('electron');
const https = require('https');
const path  = require('path');

// ── Yahoo Finance headers (server-side, no CORS) ─────────────────────────────
const YF_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  Referer: 'https://finance.yahoo.com/',
  Origin:  'https://finance.yahoo.com',
};

function get(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: YF_HEADERS }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(get(res.headers.location));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString()));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

// ── IPC: batch quote ─────────────────────────────────────────────────────────
ipcMain.handle('yf-quote', async (_event, symbols) => {
  const fields = [
    'regularMarketPrice','regularMarketChange','regularMarketChangePercent',
    'regularMarketPreviousClose','regularMarketDayHigh','regularMarketDayLow',
    'fiftyTwoWeekHigh','fiftyTwoWeekLow','longName','shortName','fullExchangeName',
  ].join(',');
  const url = `https://query1.finance.yahoo.com/v7/finance/quote` +
              `?symbols=${encodeURIComponent(symbols)}&fields=${fields}`;
  try {
    const body = await get(url);
    return JSON.parse(body);
  } catch (e) {
    // fallback: query2
    const url2 = url.replace('query1', 'query2');
    const body = await get(url2);
    return JSON.parse(body);
  }
});

// ── IPC: chart ───────────────────────────────────────────────────────────────
ipcMain.handle('yf-chart', async (_event, symbol) => {
  const path_ = `${encodeURIComponent(symbol)}?interval=1d&range=6mo&includePrePost=false`;
  const url1 = `https://query1.finance.yahoo.com/v8/finance/chart/${path_}`;
  const url2 = `https://query2.finance.yahoo.com/v8/finance/chart/${path_}`;
  try {
    const body = await get(url1);
    return JSON.parse(body);
  } catch (e) {
    const body = await get(url2);
    return JSON.parse(body);
  }
});

// ── Window ───────────────────────────────────────────────────────────────────
function createWindow() {
  const win = new BrowserWindow({
    width:  1440,
    height: 900,
    minWidth:  900,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',   // native macOS traffic lights
    backgroundColor: '#070b12',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // HTML im gleichen Ordner suchen, sonst eine Ebene höher (Entwicklungsmodus)
  const fs = require('fs');
  const htmlLocal  = path.join(__dirname, 'stocksignal.html');
  const htmlParent = path.join(__dirname, '..', 'stocksignal.html');
  win.loadFile(fs.existsSync(htmlLocal) ? htmlLocal : htmlParent);

  // Open external links in default browser, not in the app
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
