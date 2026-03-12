import { contextBridge, ipcRenderer } from 'electron'

// 暴露给前端的 API
contextBridge.exposeInMainWorld('openclaw', {
  // 获取状态
  getStatus: () => ipcRenderer.invoke('openclaw:getStatus'),
  
  // 检测 Node.js
  checkNode: () => ipcRenderer.invoke('openclaw:checkNode'),
  
  // 检测 pnpm
  checkPnpm: () => ipcRenderer.invoke('openclaw:checkPnpm'),
  
  // 安装 pnpm
  installPnpm: () => ipcRenderer.invoke('openclaw:installPnpm'),
  
  // 安装依赖
  installDeps: () => ipcRenderer.invoke('openclaw:installDeps'),
  
  // 构建
  build: () => ipcRenderer.invoke('openclaw:build'),
  
  // 启动 Gateway
  startGateway: () => ipcRenderer.invoke('openclaw:startGateway'),
  
  // 停止 Gateway
  stopGateway: () => ipcRenderer.invoke('openclaw:stopGateway'),
  
  // 监听进度
  onProgress: (callback: (msg: string) => void) => {
    ipcRenderer.on('openclaw:progress', (_, msg) => callback(msg))
  },
  
  // 监听日志
  onLog: (callback: (msg: string) => void) => {
    ipcRenderer.on('openclaw:log', (_, msg) => callback(msg))
  }
})

// 平台信息
contextBridge.exposeInMainWorld('electron', {
  platform: process.platform
})
