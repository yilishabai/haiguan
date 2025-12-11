import React, { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
// 保持无依赖导入，使用远程资源作为回退

interface LogisticsMapProps {
  height?: number | string
  flows?: Array<{ from: [number, number]; to: [number, number]; tooltip?: string }>
}

export const LogisticsMap: React.FC<LogisticsMapProps> = ({ height = 400, flows = [] }) => {
  const ref = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    let disposed = false

    const init = async () => {
      if (!ref.current) return

      const chart = echarts.init(ref.current, undefined, { renderer: 'canvas' })
      chartRef.current = chart

      try {
        const cached = localStorage.getItem('world_geojson')
        if (cached) {
          try {
            const json = JSON.parse(cached)
            echarts.registerMap('world', json)
          } catch { void 0 }
        }

        if (!echarts.getMap('world')) {
          const worldProviders = [
            'https://geo.datav.aliyun.com/areas/bound/geojson/world.json',
            'https://echarts.apache.org/examples/data/asset/geo/world.json',
            'https://fastly.jsdelivr.net/npm/echarts/map/json/world.json',
            'https://unpkg.com/echarts/map/json/world.json'
          ]
          for (const url of worldProviders) {
            try {
              const resp = await fetch(url, { cache: 'no-cache' })
              if (resp.ok) {
                const worldMap = await resp.json()
                echarts.registerMap('world', worldMap)
                try { localStorage.setItem('world_geojson', JSON.stringify(worldMap)) } catch { void 0 }
                break
              }
            } catch { void 0 }
          }
        }
      } catch { void 0 }

      const beijing = { name: '北京', coord: [116.4074, 39.9042] }
      const shanghai = { name: '上海', coord: [121.4917, 31.2333] }
      const shenzhen = { name: '深圳', coord: [114.0579, 22.5431] }
      const guangzhou = { name: '广州', coord: [113.2644, 23.1291] }
      const chengdu = { name: '成都', coord: [104.0665, 30.5728] }
      const xiAn = { name: '西安', coord: [108.9398, 34.3416] }
      const hangzhou = { name: '杭州', coord: [120.1551, 30.2741] }
      const wuhan = { name: '武汉', coord: [114.3054, 30.5928] }
      const tianjin = { name: '天津', coord: [117.2, 39.085] }

      const hubs = [beijing, shanghai, shenzhen, guangzhou]
      const nodes = [chengdu, xiAn, hangzhou, wuhan, tianjin]

      const defaultLines = nodes.flatMap((o) =>
        hubs.map((d) => ({
          coords: [o.coord, d.coord],
          value: 1,
          tooltip: `${o.name} → ${d.name}`
        }))
      )

      const hubScatter = hubs.map((p) => ({ name: p.name, value: p.coord }))
      const nodeScatter = nodes.map((p) => ({ name: p.name, value: p.coord }))

      const hasWorld = !!echarts.getMap('world')

      let option: echarts.EChartsCoreOption
      if (hasWorld) {
        option = {
          backgroundColor: 'transparent',
          tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(2, 10, 20, 0.9)',
            borderColor: 'rgba(0,240,255,0.3)',
            textStyle: { color: '#E2E8F0' },
            formatter: (params: any) => {
              if (params.seriesType === 'lines' && params.data && params.data.tooltip) {
                return params.data.tooltip
              }
              return `${params.name || ''}`
            }
          },
          geo: {
            map: 'world',
            roam: true,
            itemStyle: {
              areaColor: '#0B1120',
              borderColor: 'rgba(148,163,184,0.2)'
            },
            emphasis: {
              itemStyle: {
                areaColor: '#0f1a33'
              }
            }
          },
          series: [
            {
              type: 'lines',
              coordinateSystem: 'geo',
              zlevel: 2,
              effect: {
                show: true,
                period: 4,
                trailLength: 0.1,
                symbolSize: 4
              },
              lineStyle: {
                color: '#00F0FF',
                width: 1.5,
                opacity: 0.8,
                curveness: 0.05
              },
              progressive: 4000,
              data: defaultLines
            },
            {
              type: 'effectScatter',
              coordinateSystem: 'geo',
              zlevel: 3,
              symbolSize: 6,
              rippleEffect: { brushType: 'stroke' },
              itemStyle: { color: '#2E5CFF' },
              data: nodeScatter
            },
            {
              type: 'effectScatter',
              coordinateSystem: 'geo',
              zlevel: 3,
              symbolSize: 8,
              rippleEffect: { brushType: 'stroke' },
              itemStyle: { color: '#10B981' },
              data: hubScatter
            }
          ]
        }
      } else {
        option = {
          backgroundColor: 'transparent',
          graphic: [
            {
              type: 'text',
              left: 'center',
              top: 'middle',
              style: {
                text: '地图资源加载中或不可用\n已显示占位画布',
                fill: '#94a3b8',
                fontSize: 14
              }
            }
          ]
        }
      }

      try {
        chart.setOption(option)
      } catch { void 0; chart.setOption({ graphic: [{ type: 'text', left: 'center', top: 'middle', style: { text: '地图加载失败', fill: '#94a3b8' } }] }) }

      const handleResize = () => chart.resize()
      window.addEventListener('resize', handleResize)

      if (disposed) {
        chart.dispose()
      }

      return () => {
        window.removeEventListener('resize', handleResize)
        chart.dispose()
        chartRef.current = null
      }
    }

    init()

    return () => {
      disposed = true
      if (chartRef.current) {
        chartRef.current.dispose()
        chartRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return
    const data = (flows||[]).map(f=>({ coords:[f.from, f.to], value:1, tooltip: f.tooltip }))
    try {
      chart.setOption({ series: [{ type: 'lines', coordinateSystem: 'geo', data }] })
    } catch { void 0 }
  }, [flows])

  return (
    <div
      ref={ref}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
      className="rounded-lg border border-slate-700 bg-slate-900/40"
    />
  )
}

export default LogisticsMap
