import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface FunnelChartProps {
  data: { stage: string; count: number }[];
  height?: string;
}

const FunnelChart: React.FC<FunnelChartProps> = ({ data, height = '300px' }) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;

    const chart = echarts.init(chartRef.current);

    // Calculate conversion rates for tooltip or label
    // Assuming the first stage is 100%
    const maxVal = data.length > 0 ? data[0].count : 1;

    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{b} : {c}'
      },
      color: ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'],
      series: [
        {
          name: 'Funnel',
          type: 'funnel',
          orient: 'horizontal',
          left: '10%',
          top: '10%',
          width: '80%',
          height: '80%',
          min: 0,
          max: maxVal,
          minSize: '30%',
          maxSize: '100%',
          sort: 'none',
          gap: 10,
          label: {
            show: true,
            position: 'inside',
            formatter: (params: any) => {
              const percent = data[0].count > 0 ? ((params.value / data[0].count) * 100).toFixed(1) + '%' : '0%';
              return `{name|${params.name}}\n{val|${params.value.toLocaleString()}}\n{pct|${percent}}`;
            },
            rich: {
              name: {
                fontSize: 12,
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 16
              },
              val: {
                fontSize: 16,
                fontWeight: 'bold',
                color: '#fff',
                lineHeight: 22
              },
              pct: {
                fontSize: 12,
                color: 'rgba(255,255,255,0.9)',
                backgroundColor: 'rgba(0,0,0,0.2)',
                borderRadius: 4,
                padding: [2, 4],
                lineHeight: 16
              }
            }
          },
          labelLine: {
            show: false
          },
          itemStyle: {
            borderColor: '#1e293b',
            borderWidth: 2,
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowOffsetY: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          },
          emphasis: {
            label: {
              fontSize: 16
            },
            itemStyle: {
              shadowBlur: 20,
              shadowColor: 'rgba(255, 255, 255, 0.3)'
            }
          },
          data: data.map((item, index) => ({
            value: item.count,
            name: item.stage,
            itemStyle: {
              color: [
                '#3b82f6', // Order - Blue
                '#06b6d4', // Payment - Cyan
                '#10b981', // Customs - Green
                '#f59e0b', // Logistics - Amber
                '#ef4444'  // Warehouse - Red
              ][index % 5]
            }
          }))
        }
      ]
    };

    chart.setOption(option);

    const handleResize = () => {
      chart.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [data]);

  return <div ref={chartRef} style={{ width: '100%', height }} />;
};

export default FunnelChart;
