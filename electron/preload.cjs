const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('openmind',Object.freeze({open:()=>ipcRenderer.invoke('file:open'),save:payload=>ipcRenderer.invoke('file:save',payload),pdf:payload=>ipcRenderer.invoke('print:pdf',payload),print:payload=>ipcRenderer.invoke('print:physical',payload),openLink:url=>ipcRenderer.invoke('link:open',url)}));
