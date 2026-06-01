const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  quote: (symbols) => ipcRenderer.invoke('yf-quote', symbols),
  chart: (symbol)  => ipcRenderer.invoke('yf-chart', symbol),
});
