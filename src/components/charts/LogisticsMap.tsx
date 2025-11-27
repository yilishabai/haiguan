import React, { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import worldUrl from 'echarts-countries-js/new-world.geojson?url'

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
        const providers = [
          'https://cdnjs.cloudflare.com/ajax/libs/echarts/5.4.3/map/json/world.json',
          worldUrl
        ]
        for (const url of providers) {
          try {
            const resp = await fetch(url)
            if (resp.ok) {
              const world = await resp.json()
              echarts.registerMap('world', world)
              break
            }
          } catch (_) {}
        }
      } catch (e) {}

      const china = { name: 'China', coord: [116.4074, 39.9042] }
      const shanghai = { name: 'Shanghai Port', coord: [121.4917, 31.2333] }
      const ningbo = { name: 'Ningbo Port', coord: [121.549, 29.868] }
      const shenzhen = { name: 'Shenzhen Port', coord: [114.0579, 22.5431] }
      const tianjin = { name: 'Tianjin Port', coord: [117.200, 39.085] }

      const rotterdam = { name: 'Rotterdam', coord: [4.4777, 51.9244], tag: 'Shipping: Beauty Products' }
      const hamburg = { name: 'Hamburg', coord: [9.9937, 53.5511], tag: 'Customs: Liquor' }
      const tokyo = { name: 'Tokyo', coord: [139.6917, 35.6895], tag: 'Shipping: Appliances' }
      const osaka = { name: 'Osaka', coord: [135.5022, 34.6937], tag: 'Shipping: Beauty Products' }

      const destinations = [shanghai, ningbo, shenzhen, tianjin]
      const origins = [rotterdam, hamburg, tokyo, osaka]

      const defaultLines = origins.flatMap((o) =>
        destinations.map((d) => ({
          coords: [o.coord, d.coord],
          value: 1,
          tooltip: `${o.tag} → ${d.name}`
        }))
      )

      const portScatter = destinations.map((p) => ({ name: p.name, value: p.coord }))
      const originScatter = origins.map((p) => ({ name: p.name, value: p.coord }))

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
                trailLength: 0.2,
                symbolSize: 4
              },
              lineStyle: {
                color: '#00F0FF',
                width: 1.5,
                opacity: 0.8,
                curveness: 0.2
              },
              progressive: 4000,
              data: (flows.length ? flows.map(f=>({ coords:[f.from, f.to], value:1, tooltip: f.tooltip })) : defaultLines)
            },
            {
              type: 'effectScatter',
              coordinateSystem: 'geo',
              zlevel: 3,
              symbolSize: 6,
              rippleEffect: { brushType: 'stroke' },
              itemStyle: { color: '#2E5CFF' },
              data: originScatter
            },
            {
              type: 'effectScatter',
              coordinateSystem: 'geo',
              zlevel: 3,
              symbolSize: 8,
              rippleEffect: { brushType: 'stroke' },
              itemStyle: { color: '#10B981' },
              data: portScatter
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
      } catch (_) {
        chart.setOption({ graphic: [{ type: 'text', left: 'center', top: 'middle', style: { text: '地图加载失败', fill: '#94a3b8' } }] })
      }

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

  return (
    <div
      ref={ref}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
      className="rounded-lg border border-slate-700 bg-slate-900/40"
    />
  )
}

export default LogisticsMap

