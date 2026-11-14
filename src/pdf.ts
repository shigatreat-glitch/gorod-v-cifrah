import { jsPDF } from 'jspdf'
import fontUrl from './assets/ReportSans.ttf?url'
import { campuses, colors, conclusion, metrics, months, type District } from './model'

export async function saveReport(rows: District[], campus: number) {
  const response = await fetch(fontUrl)
  if (!response.ok) throw new Error('Не удалось загрузить шрифт PDF')
  const bytes = new Uint8Array(await response.arrayBuffer())
  let binary = ''
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i+8192))
  const doc = new jsPDF({putOnlyUsedFonts: true, compress: true})
  doc.addFileToVFS('ReportSans.ttf', btoa(binary))
  doc.addFont('ReportSans.ttf', 'ReportSans', 'normal')
  doc.setFont('ReportSans')
  doc.setProperties({title: 'Город в цифрах — персональный отчёт'})
  const ink = '#14233c'
  const muted = '#536581'
  function label(text: string, x: number, y: number, size = 10, color = ink) {
    doc.setTextColor(color)
    doc.setFontSize(size)
    doc.text(text,x,y)
  }
  function paragraph(text: string, x: number, y: number, width: number) {
    doc.setFontSize(10)
    doc.setTextColor(ink)
    doc.text(doc.splitTextToSize(text,width),x,y)
  }
  doc.setFillColor('#245be8')
  doc.rect(0,0,210,4,'F')
  label('Город в цифрах',14,17,10,'#245be8')
  label('Персональный отчёт',14,29,23)
  label('Демонстрационные данные',14,37,10,'#0b877e')
  label(campuses[campus],14,44,10,muted)
  doc.setFillColor('#edf2fb')
  doc.roundedRect(14,49,182,11,2,2,'F')
  const columns = [14,64,101,133,162]
  const headings = ['Район','Аренда, ₽/мес.','До кампуса','До метро','Зел. зоны']
  headings.forEach((h,i) => label(h,columns[i]+2,56,8,muted))
  rows.forEach((d,i) => {
    const y = 67 + 8*i
    label(d.name,16,y,9)
    metrics.forEach((m,j) => label(m.format(m.value(d,campus)),columns[j+1]+2,y,9))
  })
  const insightY = 71 + rows.length*8
  label('Вывод',14,insightY,13)
  paragraph(conclusion(rows,campus),14,insightY+7,178)
  const chartY = 126
  metrics.forEach((m,index) => {
    const x = index % 2 ? 108 : 14
    const y = chartY + Math.floor(index/2)*43
    label(m.name + ' · ' + m.unit,x,y,11)
    rows.forEach((d,i) => {
      const value = m.value(d,campus)
      const rowY = y+7+i*10
      label(d.name,x,rowY,7)
      label(m.format(value),x+57,rowY,7,muted)
      doc.setFillColor('#e6ebf3')
      doc.roundedRect(x,rowY+1.5,81,2,1,1,'F')
      doc.setFillColor(colors[i])
      doc.roundedRect(x,rowY+1.5,81*value/m.max,2,1,1,'F')
    })
  })
  label('История аренды, ₽/мес.',14,214,12)
  const low = Math.floor(Math.min(...rows.flatMap(d => d.history))/5000)*5000
  const high = Math.ceil(Math.max(...rows.flatMap(d => d.history))/5000)*5000
  const left = 35, right = 193, top = 223, bottom = 257
  for (let i=0;i<4;i++) {
    const y = bottom-i*(bottom-top)/3
    label(Math.round((low+i*(high-low)/3)/1000) + ' тыс.',14,y+1,7,muted)
    doc.setDrawColor('#e6ebf3')
    doc.setLineWidth(.2)
    doc.line(left,y,right,y)
  }
  rows.forEach((d,i) => {
    doc.setDrawColor(colors[i])
    doc.setFillColor(colors[i])
    doc.setLineWidth(.65)
    const points = d.history.map((v,j) => [left+j*(right-left)/11,bottom-(v-low)/(high-low)*(bottom-top)])
    points.forEach(([x,y],j) => {
      if (j) doc.line(points[j-1][0],points[j-1][1],x,y)
      doc.circle(x,y,.75,'F')
    })
    const legendX = 14+i*61
    doc.circle(legendX+1,274,.9,'F')
    label(d.name,legendX+4,275,8)
  })
  ;[0,3,6,9,11].forEach(i => label(months[i],left+i*(right-left)/11-5,264,7,muted))
  label('Учебный проект · Визуализация данных',14,289,8,muted)
  doc.save('gorod-v-cifrah-report.pdf')
}
