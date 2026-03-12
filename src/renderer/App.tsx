import { useState, useEffect } from 'react'
import './types'

interface Status {
  installed: boolean
  nodeVersion: string | null
  pnpmInstalled: boolean
  gatewayRunning: boolean
  version: string | null
}

function App() {
  const [status, setStatus] = useState<Status | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')

  // 加载状态
  const loadStatus = async () => {
    try {
      const s = await window.openclaw.getStatus()
      setStatus(s)
    } catch (e) {
      console.error('Failed to get status:', e)
    }
  }

  useEffect(() => {
    loadStatus()

    // 监听进度
    window.openclaw.onProgress((msg) => {
      setProgress(msg)
      setLogs(prev => [...prev, `[进度] ${msg}`])
    })

    // 监听日志
    window.openclaw.onLog((msg) => {
      setLogs(prev => [...prev, msg])
    })
  }, [])

  // 一键安装并启动
  const handleInstall = async () => {
    setLoading(true)
    setLogs([])

    try {
      // 1. 检查 Node.js
      const nodeInfo = await window.openclaw.checkNode()
      if (!nodeInfo.installed) {
        setLogs(prev => [...prev, '❌ 未安装 Node.js，请先安装 Node.js >= 22.12.0'])
        setLoading(false)
        return
      }
      if (!nodeInfo.meetsRequirement) {
        setLogs(prev => [...prev, `⚠️ Node.js 版本过低: ${nodeInfo.version}，需要 >= 22.12.0`])
        setLoading(false)
        return
      }
      setLogs(prev => [...prev, `✅ Node.js 版本: ${nodeInfo.version}`])

      // 2. 检查 pnpm
      const hasPnpm = await window.openclaw.checkPnpm()
      if (!hasPnpm) {
        setLogs(prev => [...prev, '📦 正在安装 pnpm...'])
        await window.openclaw.installPnpm()
        setLogs(prev => [...prev, '✅ pnpm 安装完成'])
      } else {
        setLogs(prev => [...prev, '✅ pnpm 已安装'])
      }

      // 3. 安装依赖
      setLogs(prev => [...prev, '📦 正在安装 OpenClaw 依赖...'])
      await window.openclaw.installDeps()
      setLogs(prev => [...prev, '✅ 依赖安装完成'])

      // 4. 构建
      setLogs(prev => [...prev, '🔨 正在构建 OpenClaw...'])
      await window.openclaw.build()
      setLogs(prev => [...prev, '✅ 构建完成'])

      // 5. 启动 Gateway
      setLogs(prev => [...prev, '🚀 正在启动 Gateway...'])
      await window.openclaw.startGateway()
      setLogs(prev => [...prev, '✅ Gateway 已启动'])

      await loadStatus()
    } catch (e: any) {
      setLogs(prev => [...prev, `❌ 错误: ${e.message}`])
    }

    setLoading(false)
    setProgress('')
  }

  // 启动 Gateway
  const handleStart = async () => {
    setLoading(true)
    try {
      await window.openclaw.startGateway()
      await loadStatus()
    } catch (e: any) {
      setLogs(prev => [...prev, `❌ 启动失败: ${e.message}`])
    }
    setLoading(false)
  }

  // 停止 Gateway
  const handleStop = async () => {
    setLoading(true)
    try {
      await window.openclaw.stopGateway()
      await loadStatus()
    } catch (e: any) {
      setLogs(prev => [...prev, `❌ 停止失败: ${e.message}`])
    }
    setLoading(false)
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#1a1a2e',
      color: '#eee',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '20px'
    }}>
      {/* 标题 */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '36px', margin: 0 }}>🦊 xclaw</h1>
        <p style={{ color: '#888', margin: '5px 0' }}>OpenClaw 桌面客户端</p>
      </div>

      {/* 状态显示 */}
      <div style={{ 
        background: '#16213e', 
        borderRadius: '10px', 
        padding: '15px',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 10px 0' }}>📊 状态</h3>
        {status ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>Node.js: <span style={{ color: status.nodeVersion ? '#4ade80' : '#f87171' }}>
              {status.nodeVersion || '未安装'}
            </span></div>
            <div>pnpm: <span style={{ color: status.pnpmInstalled ? '#4ade80' : '#f87171' }}>
              {status.pnpmInstalled ? '已安装' : '未安装'}
            </span></div>
            <div>OpenClaw: <span style={{ color: status.installed ? '#4ade80' : '#f87171' }}>
              {status.version || '未安装'}
            </span></div>
            <div>Gateway: <span style={{ color: status.gatewayRunning ? '#4ade80' : '#f87171' }}>
              {status.gatewayRunning ? '运行中' : '已停止'}
            </span></div>
          </div>
        ) : (
          <p>加载中...</p>
        )}
      </div>

      {/* 进度显示 */}
      {progress && (
        <div style={{ 
          background: '#0f3460', 
          borderRadius: '10px', 
          padding: '15px',
          marginBottom: '20px',
          color: '#4ade80'
        }}>
          {progress}
        </div>
      )}

      {/* 按钮 */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={handleInstall}
          disabled={loading}
          style={{
            flex: 1,
            padding: '15px',
            fontSize: '16px',
            background: '#e94560',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? '处理中...' : '⚡ 一键安装并启动'}
        </button>

        {status?.gatewayRunning ? (
          <button 
            onClick={handleStop}
            disabled={loading}
            style={{
              padding: '15px 30px',
              fontSize: '16px',
              background: '#f87171',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            停止
          </button>
        ) : (
          <button 
            onClick={handleStart}
            disabled={loading || !status?.installed}
            style={{
              padding: '15px 30px',
              fontSize: '16px',
              background: '#4ade80',
              color: '#1a1a2e',
              border: 'none',
              borderRadius: '8px',
              cursor: (loading || !status?.installed) ? 'not-allowed' : 'pointer',
              opacity: (loading || !status?.installed) ? 0.6 : 1
            }}
          >
            启动
          </button>
        )}
      </div>

      {/* 日志输出 */}
      <div style={{ 
        flex: 1,
        background: '#0f0f23', 
        borderRadius: '10px', 
        padding: '15px',
        overflow: 'auto',
        fontFamily: 'monospace',
        fontSize: '12px'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#888' }}>📝 日志</h3>
        {logs.map((log, i) => (
          <div key={i} style={{ marginBottom: '5px' }}>{log}</div>
        ))}
      </div>
    </div>
  )
}

export default App
