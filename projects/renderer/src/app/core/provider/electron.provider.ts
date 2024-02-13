import { Injectable } from '@angular/core'
import type { IpcRenderer } from 'electron' // renderer
import type { Clipboard, Shell } from 'electron/common'
import type { IpcMain, GlobalShortcut, Screen, App, BrowserWindow } from 'electron/main' //main

export interface Remote {
  getCurrentWindow: () => BrowserWindow
  app: App
  screen: Screen
  shell: Shell
  clipboard: Clipboard
  globalShortcut: GlobalShortcut
  ipcMain: IpcMain
}

@Injectable({
  providedIn: 'root',
})
export class ElectronProvider {
  // private readonly electron: Electron

  constructor() {  }

  // TODO: refactor
  // Remote was removed: this should be implemented with ipcRender / ipcMain instead
  // see https://github.com/electron/electron/issues/21408
  // https://nornagon.medium.com/electrons-remote-module-considered-harmful-70d69500f31
  public provideRemote(): Remote {
    return (window as any).remote as Remote
    /*{
      app,
      getCurrentWindow: () => getCurrentWindow(),
      screen,
      shell,
      clipboard,
      globalShortcut
    }*/
  }

  public provideIpcRenderer(): IpcRenderer {
    return (window as any).ipcRenderer
  }

  public provideIpcMain(): IpcMain {
    return this.provideRemote().ipcMain
  }
}
