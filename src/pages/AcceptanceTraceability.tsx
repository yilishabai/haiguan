import React from 'react'
import { HudPanel } from '../components/ui/HudPanel'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const tempData = Array.from({ length: 24 }, (_, i) => ({
  time: `${i}:00`,
  temp: 18 + Math.sin(i * 0.25) * 3 + (Math.random() - 0.5)
}))

export const AcceptanceTraceability: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">数字溯源与验收</h1>
          <p className="text-gray-400">展示美妆跨境进口闭环的溯源与验收结果</p>
        </div>
      </div>

      {/* 中心：数字孪生溯源卡 */}
      <HudPanel className="p-6" title="Digital Twin" subtitle="产品数字履历">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* 3D旋转模型占位 */}
          <div className="flex items-center justify-center">
            <div className="relative w-56 h-56">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-cyber-cyan/30 to-neon-blue/20 border border-cyber-cyan/30 backdrop-blur-md" style={{ transformStyle: 'preserve-3d', animation: 'spin 10s linear infinite' }}></div>
              <div className="absolute inset-6 rounded-3xl bg-slate-900/60 border border-slate-700"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-cyber-cyan">化妆品瓶 模型</span>
              </div>
            </div>
          </div>
          {/* 数字履历 HUD */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="hud-panel p-4">
              <div className="text-sm text-gray-400">原产地证书</div>
              <div className="text-white font-semibold">法国厂商自动获取</div>
            </div>
            <div className="hud-panel p-4">
              <div className="text-sm text-gray-400">报关单回执</div>
              <div className="text-white font-semibold">海关电子签章</div>
            </div>
            <div className="hud-panel p-4">
              <div className="text-sm text-gray-400">冷链曲线</div>
              <div className="h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={tempData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                    <XAxis dataKey="time" hide />
                    <YAxis domain={[15, 25]} stroke="#64748b" />
                    <Tooltip contentStyle={{ backgroundColor: '#0B1120', border: '1px solid rgba(0,240,255,0.3)' }} />
                    <Line type="monotone" dataKey="temp" stroke="#00F0FF" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="text-xs text-emerald-green mt-2">运输温度最大 24.5℃</div>
            </div>
          </div>
        </div>
      </HudPanel>

      {/* 底部：验收指标 */}
      <HudPanel className="p-6" title="验收指标核算" subtitle="SRS约束性指标达成情况">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="hud-panel p-4">
            <div className="text-sm text-gray-400">协同准确率</div>
            <div className="digital-display text-emerald-green text-xl">100%</div>
            <div className="text-xs text-gray-400">无人工纠错</div>
          </div>
          <div className="hud-panel p-4">
            <div className="text-sm text-gray-400">全程耗时</div>
            <div className="digital-display text-cyber-cyan text-xl">2.1天</div>
            <div className="text-xs text-gray-400">优于基准 5天</div>
          </div>
          <div className="hud-panel p-4">
            <div className="text-sm text-gray-400">综合成本</div>
            <div className="digital-display text-emerald-green text-xl">-15%</div>
            <div className="text-xs text-gray-400">含物流、通关、支付</div>
          </div>
        </div>
      </HudPanel>

      <style>{`
        @keyframes spin { from { transform: rotateY(0deg); } to { transform: rotateY(360deg); } }
      `}</style>
    </div>
  )
}

export default AcceptanceTraceability

