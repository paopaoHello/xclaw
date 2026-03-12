import { spawn, execSync } from 'child_process'
import { app } from 'electron'
import * as path from 'path'
import * as fs from 'fs'

const OPENCLAW_MIN_NODE_VERSION = '22.12.0'

interface OpenClawStatus {
  installed: boolean
  nodeVersion: string | null
  pnpmInstalled: boolean
  gatewayRunning: boolean
  version: string | null
}

class OpenClawManager {
  private openclawDir: string
  private gatewayProcess: ReturnType<typeof spawn> | null = null

  constructor() {
    // OpenClaw 源码目录
    this.openclawDir = path.join(app.getAppPath(), 'openclaw-src')
  }

  /**
   * 检测 Node.js 版本
   */
  checkNodeVersion(): { installed: boolean; version: string | null; meetsRequirement: boolean } {
    try {
      const output = execSync('node --version', { encoding: 'utf-8' })
      const version = output.trim().replace('v', '')
      const meetsRequirement = this.compareVersion(version, OPENCLAW_MIN_NODE_VERSION) >= 0
      
      return { installed: true, version, meetsRequirement }
    } catch {
      return { installed: false, version: null, meetsRequirement: false }
    }
  }

  /**
   * 检测 pnpm 是否安装
   */
  checkPnpm(): boolean {
    try {
      execSync('pnpm --version', { encoding: 'utf-8' })
      return true
    } catch {
      return false
    }
  }

  /**
   * 安装 pnpm
   */
  async installPnpm(): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = spawn('npm', ['install', '-g', 'pnpm'], {
        shell: true,
        stdio: 'inherit'
      })
      
      proc.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`pnpm 安装失败，退出码: ${code}`))
        }
      })
    })
  }

  /**
   * 安装 OpenClaw 依赖
   */
  async installDependencies(onProgress?: (message: string) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      onProgress?.('正在安装依赖...')
      
      const proc = spawn('pnpm', ['install'], {
        cwd: this.openclawDir,
        shell: true,
        stdio: 'inherit'
      })
      
      proc.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`依赖安装失败，退出码: ${code}`))
        }
      })
    })
  }

  /**
   * 构建 OpenClaw
   */
  async build(onProgress?: (message: string) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      onProgress?.('正在构建 OpenClaw...')
      
      const proc = spawn('pnpm', ['run', 'build'], {
        cwd: this.openclawDir,
        shell: true,
        stdio: 'inherit'
      })
      
      proc.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`构建失败，退出码: ${code}`))
        }
      })
    })
  }

  /**
   * 启动 Gateway
   */
  async startGateway(onLog?: (message: string) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      onLog?.('正在启动 Gateway...')
      
      this.gatewayProcess = spawn('pnpm', ['run', 'start'], {
        cwd: this.openclawDir,
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe']
      })

      this.gatewayProcess.stdout?.on('data', (data) => {
        onLog?.(data.toString())
      })

      this.gatewayProcess.stderr?.on('data', (data) => {
        onLog?.(data.toString())
      })

      this.gatewayProcess.on('close', (code) => {
        this.gatewayProcess = null
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`Gateway 已退出，退出码: ${code}`))
        }
      })

      // 等待一下再返回
      setTimeout(() => resolve(), 2000)
    })
  }

  /**
   * 停止 Gateway
   */
  stopGateway(): void {
    if (this.gatewayProcess) {
      this.gatewayProcess.kill()
      this.gatewayProcess = null
    }
  }

  /**
   * 获取 OpenClaw 状态
   */
  async getStatus(): Promise<OpenClawStatus> {
    const nodeInfo = this.checkNodeVersion()
    const pnpmInstalled = this.checkPnpm()
    
    // 检查 OpenClaw 是否已安装（通过检查源码目录）
    const installed = fs.existsSync(this.openclawDir)
    
    // 尝试获取版本
    let version: string | null = null
    if (installed) {
      try {
        const pkgPath = path.join(this.openclawDir, 'package.json')
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
        version = pkg.version
      } catch {
        // ignore
      }
    }

    return {
      installed,
      nodeVersion: nodeInfo.version,
      pnpmInstalled,
      gatewayRunning: this.gatewayProcess !== null,
      version
    }
  }

  /**
   * 版本比较
   */
  private compareVersion(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number)
    const parts2 = v2.split('.').map(Number)
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0
      const p2 = parts2[i] || 0
      if (p1 > p2) return 1
      if (p1 < p2) return -1
    }
    return 0
  }
}

export const openclawManager = new OpenClawManager()
