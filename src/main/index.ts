import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { openclawManager } from './openclaw'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    console.log('🪟 Window is ready!')
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// 注册 IPC 处理器
function setupIpcHandlers(): void {
  // 获取 OpenClaw 状态
  ipcMain.handle('openclaw:getStatus', async () => {
    return await openclawManager.getStatus()
  })

  // 检测 Node.js 版本
  ipcMain.handle('openclaw:checkNode', () => {
    return openclawManager.checkNodeVersion()
  })

  // 检测 pnpm
  ipcMain.handle('openclaw:checkPnpm', () => {
    return openclawManager.checkPnpm()
  })

  // 安装 pnpm
  ipcMain.handle('openclaw:installPnpm', async () => {
    return await openclawManager.installPnpm()
  })

  // 安装依赖
  ipcMain.handle('openclaw:installDeps', async (event) => {
    return await openclawManager.installDependencies((msg) => {
      mainWindow?.webContents.send('openclaw:progress', msg)
    })
  })

  // 构建
  ipcMain.handle('openclaw:build', async () => {
    return await openclawManager.build((msg) => {
      mainWindow?.webContents.send('openclaw:progress', msg)
    })
  })

  // 启动 Gateway
  ipcMain.handle('openclaw:startGateway', async () => {
    return await openclawManager.startGateway((msg) => {
      mainWindow?.webContents.send('openclaw:log', msg)
    })
  })

  // 停止 Gateway
  ipcMain.handle('openclaw:stopGateway', () => {
    openclawManager.stopGateway()
    return true
  })
}

app.whenReady().then(() => {
  console.log('🚀 App is starting...')

  electronApp.setAppUserModelId('com.xclaw.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 设置 IPC 处理器
  setupIpcHandlers()

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  // 停止 Gateway
  openclawManager.stopGateway()
  
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
