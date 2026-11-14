import { useEffect, useRef } from 'react'
import { init, use, type EChartsCoreOption } from 'echarts/core'
import { ScatterChart, BarChart, LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, MarkLineComponent, LegendComponent, AriaComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { type District, type Filters, colors, matches, money, months, number } from './model'
use([ScatterChart, BarChart, LineChart, GridComponent, TooltipComponent, MarkLineComponent, LegendComponent, AriaComponent, CanvasRenderer])

type ChartEvent = { dataIndex: number; seriesType?: string }
function Chart({option, label, height, onPick}: {option: EChartsCoreOption; label: string; height: number; onPick?: (e: ChartEvent) => void}) {
  const element = useRef<HTMLDivElement>(null)
  const instance = useRef<ReturnType<typeof init> | null>(null)
  useEffect(() => {
    const el = element.current!
    const chart = init(el)
    instance.current = chart
    const observer = new ResizeObserver(() => chart.resize())
    observer.observe(el)
    return () => { observer.disconnect(); chart.dispose(); instance.current = null }
  }, [])
  useEffect(() => {
    const chart = instance.current!
    chart.setOption(option, {notMerge: true})
    if (onPick) chart.on('click', onPick)
    return () => { if (onPick) chart.off('click', onPick) }
  }, [option, onPick])
  return <div ref={element} role="img" aria-label={label} style={{ height, width: '100%' }} />
}

const gridColor = '#e6ebf3'
const axisText = '#536581'
const axisLabel = {color: axisText, fontSize: 12}
const splitLine = {lineStyle: {color: gridColor}}
const general = {
  textStyle: {fontFamily: 'Inter, sans-serif', color: axisText},
  aria: {enabled: true, label: {enabled: false}},
  tooltip: {confine: true, backgroundColor: '#fff', borderColor: gridColor, textStyle: {color: '#14233C'}},
}
const tickMoney = (value: number) => number(value / 1000) + ' тыс.'

export function Scatter({rows, filters, active, onPick, preview = false}: {rows: District[]; filters: Filters; active?: string; onPick?: (id: string) => void; preview?: boolean}) {
  const option = {
    ...general,
    grid: {left: 59, right: 20, top: 40, bottom: 58},
    tooltip: {...general.tooltip, formatter: ({dataIndex}: ChartEvent) => {
      const d = rows[dataIndex]
      return d ? `<b>${d.name}</b><br>${money(d.rent)} / мес.<br>${d.travel[filters.campus]} мин до кампуса` : ''
    }},
    xAxis: {type: 'value', min: 0, max: Math.max(70, filters.minutes), name: 'До кампуса, мин', nameLocation: 'middle', nameGap: 34, nameTextStyle: axisLabel, axisLabel, splitLine},
    yAxis: {type: 'value', min: Math.min(45000, filters.budget), max: Math.max(90000, filters.budget), name: 'Аренда, ₽/мес.', nameTextStyle: {...axisLabel, align: 'left'}, axisLabel: {...axisLabel, formatter: tickMoney}, splitLine},
    series: [{
      type: 'scatter',
      data: rows.map(d => {
        const fit = matches(d, filters)
        return {
          value: [d.travel[filters.campus], d.rent],
          symbol: fit ? 'circle' : 'diamond',
          symbolSize: active === d.id ? 19 : fit ? 13 : 11,
          itemStyle: {color: active === d.id ? '#245BE8' : fit ? '#0B877E' : '#8ca0be', opacity: 1, borderColor: '#fff', borderWidth: 2},
        }
      }),
      markLine: {silent: true, symbol: 'none', label: {show: false}, lineStyle: {color: '#5579e0', type: 'dashed', opacity: .78, width: 1.5}, data: [{xAxis: filters.minutes}, {yAxis: filters.budget}]},
    }],
  }
  return <Chart option={option} height={preview ? 289 : 334} label="Диаграмма рассеяния стоимости аренды и времени до кампуса" onPick={onPick ? e => { if (e.seriesType === 'scatter' && rows[e.dataIndex]) onPick(rows[e.dataIndex].id) } : undefined} />
}

export function RentBars({rows, active, onPick}: {rows: District[]; active: string; onPick: (id: string) => void}) {
  return <Chart label="Стоимость аренды по подходящим районам" height={Math.max(334, rows.length * 25 + 58)} onPick={e => { if (rows[e.dataIndex]) onPick(rows[e.dataIndex].id) }} option={{
    ...general,
    tooltip: {...general.tooltip, formatter: ({dataIndex}: ChartEvent) => rows[dataIndex] ? `${rows[dataIndex].name}<br><b>${money(rows[dataIndex].rent)} / мес.</b>` : ''},
    grid: {left: 108, right: 16, top: 10, bottom: 49},
    xAxis: {type: 'value', max: 90000, splitNumber: 3, name: 'Аренда, ₽/мес.', nameLocation: 'middle', nameGap: 32, axisLabel: {...axisLabel, formatter: tickMoney}, splitLine},
    yAxis: {type: 'category', inverse: true, data: rows.map(d => d.name), axisTick: {show: false}, axisLine: {show: false}, axisLabel: {...axisLabel, width: 101, overflow: 'truncate', interval: 0}},
    series: [{type: 'bar', barMaxWidth: 17, data: rows.map(d => ({value: d.rent, itemStyle: {color: d.id === active ? '#245BE8' : '#0B877E', borderRadius: [0, 5, 5, 0]}}))}],
  }} />
}

export function History({rows}: {rows: District[]}) {
  return <Chart label="Динамика месячной аренды по выбранным районам" height={325} option={{
    ...general,
    tooltip: {...general.tooltip, trigger: 'axis', valueFormatter: (v: number) => money(v)},
    legend: {bottom: 0, type: 'scroll', textStyle: axisLabel},
    grid: {left: 62, right: 23, top: 36, bottom: 63},
    xAxis: {type: 'category', data: months, axisLabel: {...axisLabel, hideOverlap: true}},
    yAxis: {type: 'value', min: (e: {min: number}) => Math.floor(e.min / 5000) * 5000 - 1000, name: 'Аренда, ₽/мес.', nameTextStyle: {...axisLabel, align: 'left'}, splitLine, axisLabel: {...axisLabel, formatter: tickMoney}},
    color: colors,
    series: rows.map((d,i) => ({name: d.name, type: 'line', symbol: ['circle', 'rect', 'diamond'][i], symbolSize: 7, lineStyle: {width: 2.5, type: ['solid', 'dashed', 'dotted'][i]}, data: d.history})),
  }} />
}
