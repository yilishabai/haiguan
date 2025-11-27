import React, { useState } from 'react'
import { CreditCard, Truck } from 'lucide-react'
import { HudPanel, StatusBadge } from '../components/ui/HudPanel'

export const CollaborationWorkbench: React.FC = () => {
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [copilotOpen, setCopilotOpen] = useState(true)

  const tasks = [
    { id: 'PO-2025-8812', title: '雅诗兰黛小棕瓶 x 5000', route: '🇫🇷 -> 🇨🇳', tags: ['等待报关', '美妆'] },
    { id: 'PO-2025-7741', title: '科颜氏安白瓶 x 3000', route: '🇫🇷 -> 🇨🇳', tags: ['支付处理中', '美妆'] },
    { id: 'PO-2025-6620', title: '法国红酒 AOC x 1200', route: '🇫🇷 -> 🇨🇳', tags: ['待报关', '酒水'] },
    { id: 'PO-2025-5508', title: '松下电吹风 x 800', route: '🇯🇵 -> 🇨🇳', tags: ['物流在途', '家电'] },
    { id: 'PO-2025-4495', title: '香奈儿粉底液 x 2000', route: '🇫🇷 -> 🇨🇳', tags: ['异常阻断', '美妆'] },
    { id: 'PO-2025-3381', title: '海蓝之谜精华 x 1000', route: '🇫🇷 -> 🇨🇳', tags: ['待支付', '美妆'] }
  ]

  return (
    <div className="space-y-6">
      {/* 标题与业务KPI */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">供应链协同 - 智能订单管理</h1>
          <p className="text-gray-400">在一个页面清晰查看订单跨多方的流转</p>
        </div>
        <div className="flex space-x-4">
          <div className="hud-panel p-3">
            <div className="text-xs text-gray-400">待处理订单</div>
            <div className="digital-display text-cyber-cyan text-xl">24</div>
          </div>
          <div className="hud-panel p-3">
            <div className="text-xs text-gray-400">今日报关金额</div>
            <div className="digital-display text-emerald-green text-xl">$450k</div>
          </div>
          <div className="hud-panel p-3">
            <div className="text-xs text-gray-400">异常阻断</div>
            <div className="digital-display text-alert-red text-xl">2</div>
          </div>
        </div>
      </div>

      {/* 分栏布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 左侧队列 */}
        <div className="lg:col-span-1 space-y-3">
          {tasks.map(t => (
            <div
              key={t.id}
              className={`p-4 rounded-lg border border-slate-700 bg-slate-800/60 cursor-pointer hover:border-cyber-cyan transition ${selectedTask === t.id ? 'border-cyber-cyan' : ''}`}
              onClick={() => setSelectedTask(t.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-cyber-cyan font-semibold">{t.id}</div>
                <StatusBadge status="processing">待处理</StatusBadge>
              </div>
              <div className="text-white text-sm">{t.title}</div>
              <div className="text-xs text-gray-400 mt-1">{t.route}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {t.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 rounded-full text-xs border border-slate-700 bg-slate-700/40">{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 右侧流程画布 */}
        <div className="lg:col-span-3">
          <HudPanel className="p-6" title="协同流程进度" subtitle="订单 → 支付 → 通关 → 物流 → 入库">
            <div className="relative">
              {/* 连接线 */}
              <div className="absolute top-14 left-0 right-0 h-2 bg-gradient-to-r from-cyber-cyan/40 to-neon-blue/40 rounded-full"></div>
              <div className="grid grid-cols-5 gap-4">
                {/* 订单 */}
                <div className="flex flex-col items-center">
                  <div className="hud-panel w-full p-4 text-center">
                    <div className="text-sm text-gray-400 mb-1">订单</div>
                    <div className="text-white font-semibold">电子合同已签署</div>
                    <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs border border-emerald-green/30 text-emerald-green">✅ CA认证</div>
                  </div>
                </div>
                {/* 支付 */}
                <div className="flex flex-col items-center">
                  <div className="hud-panel w-full p-4 text-center">
                    <div className="text-sm text-gray-400 mb-1">支付</div>
                    <div className="text-white font-semibold">跨境汇款中...</div>
                    <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs border border-cyber-cyan/30 text-cyber-cyan">
                      <CreditCard className="w-3 h-3 mr-1" /> 汇率锁定 7.12
                    </div>
                  </div>
                </div>
                {/* 通关（高亮） */}
                <div className="flex flex-col items-center">
                  <div className="hud-panel w-full p-4 text-center border-cyber-cyan/40">
                    <div className="text-sm text-gray-400 mb-1">通关</div>
                    <div className="text-white font-semibold">扫描中...</div>
                    <div className="mt-2 text-xs text-emerald-green">HS编码 33049900 匹配成功</div>
                    <div className="text-xs text-emerald-green">NMPA备案号校验通过</div>
                    <div className="mt-2 px-2 py-1 rounded bg-cyber-cyan/10 text-cyber-cyan text-xs inline-flex items-center">🤖 AI 正在自动生成报关单 (耗时 0.5s)</div>
                    <div className="mt-3 w-24 h-24 border border-cyber-cyan/30 rounded-full animate-pulse"></div>
                  </div>
                </div>
                {/* 物流 */}
                <div className="flex flex-col items-center">
                  <div className="hud-panel w-full p-4 text-center">
                    <div className="text-sm text-gray-400 mb-1">物流</div>
                    <div className="text-white font-semibold">菜鸟国际仓接单</div>
                    <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs border border-yellow-500/30 text-yellow-400">
                      <Truck className="w-3 h-3 mr-1" /> 在途
                    </div>
                  </div>
                </div>
                {/* 入库（灰度） */}
                <div className="flex flex-col items-center opacity-60">
                  <div className="hud-panel w-full p-4 text-center">
                    <div className="text-sm text-gray-400 mb-1">入库</div>
                    <div className="text-white font-semibold">待入库</div>
                  </div>
                </div>
              </div>
            </div>
          </HudPanel>
        </div>
      </div>

      {/* 右侧 AI 协同助手抽屉 */}
      <div className={`fixed right-0 top-16 bottom-10 w-80 bg-slate-900/80 backdrop-blur-md border-l border-slate-700 transform transition-transform duration-300 ${copilotOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 flex items-center justify-between border-b border-slate-700">
          <div className="text-cyber-cyan font-semibold">智能协同助手</div>
          <button onClick={() => setCopilotOpen(!copilotOpen)} className="glow-button px-2 py-1 text-xs">{copilotOpen ? '收起' : '展开'}</button>
        </div>
        <div className="p-4 space-y-3">
          <div className="text-xs text-gray-400">当前订单</div>
          <div className="digital-display text-white">{selectedTask || '未选择'}</div>
          <div className="hud-panel p-3">
            <div className="text-sm text-emerald-green">HS编码 3304.99 匹配成功，税率计算完毕。</div>
            <div className="text-xs text-gray-400 mt-2">建议：价格申报与成分匹配已通过，可自动申报。</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CollaborationWorkbench

