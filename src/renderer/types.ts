export interface OpenClawStatus {
  installed: boolean
  nodeVersion: string | null
  pnpmInstalled: boolean
  gatewayRunning: boolean
  version: string | null
}

export interface NodeCheckResult {
  installed: boolean
  version: string | null
  meetsRequirement: boolean
}

declare global {
  interface Window {
    openclaw: {
      getStatus: () => Promise<OpenClawStatus>
      checkNode: () => Promise<NodeCheckResult>
      checkPnpm: () => Promise<boolean>
      installPnpm: () => Promise<void>
      installDeps: () => Promise<void>
      build: () => Promise<void>
      startGateway: () => Promise<void>
      stopGateway: () => Promise<boolean>
      onProgress: (callback: (msg: string) => void) => void
      onLog: (callback: (msg: string) => void) => void
    }
    electron: {
      platform: string
    }
  }
}
