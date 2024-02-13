/**
 * @module preload
 */
import remote from '@electron/remote'
import { ipcRenderer } from 'electron'
//import { initialize } from '@electron/remote/main'

//initialize();

// import { contextBridge } from 'electron'
/*
contextBridge.exposeInMainWorld('electron', {
    dirname: () => __dirname
})
*/

(window as any).ipcRenderer = ipcRenderer;
(window as any).remote = remote;

console.log('window.remote is defined', !!(window as any).remote)