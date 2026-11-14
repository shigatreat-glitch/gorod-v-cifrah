import { StrictMode, useEffect, useState, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BarChart3, Building2, Check, Clock3, Download, GraduationCap, Info, Layers3, MapPin, Plus, RotateCcw, SlidersHorizontal, Wallet, X } from 'lucide-react'
import { Scatter, RentBars, History } from './charts'
import { type District, type Filters, type Report, campuses, colors, conclusion, defaultFilters, districts, matches, metrics, money, months, number, resolve } from './model'
import '@fontsource/inter/cyrillic-400.css'
import '@fontsource/inter/cyrillic-600.css'
import '@fontsource/inter/cyrillic-700.css'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import './style.css'

function useStored<T,>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback }
    catch { return fallback }
  })
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* Storage may be disabled. */ }
  }, [key, value])
  return [value, setValue] as const
}
const demoFilters = {budget: 65000, minutes: 45, campus: 0}
const demoLabel = 'Демонстрационные данные'
const sortRent = (a: District, b: District) => a.rent - b.rent
function Badge({children}: {children: ReactNode}) {
  return <span className="badge"><span />{children}</span>
}
function Legend() {
  return <div className="chart-legend"><span><i className="dot"/>Подходит</span><span><i className="diamond"/>Вне лимитов</span><span><i className="dash"/>Ограничения</span></div>
}
function Panel({title, subtitle, children}: {title: string; subtitle?: ReactNode; children: ReactNode}) {
  return <section className="panel"><h2>{title}</h2>{subtitle && <div className="muted panel-sub">{subtitle}</div>}{children}</section>
}
function Home() {
  return <>
    <div className="hero shell">
      <div className="hero-copy">
        <div className="location"><MapPin size={15}/> Москва, Россия</div>
        <h1>Где жить, если важны бюджет и <em>время в пути?</em></h1>
        <p>Сравните районы Москвы по аренде и дороге до кампуса. Найдите варианты по бюджету и посмотрите, чем они отличаются.</p>
        <div className="hero-actions"><Link className="button primary" to="/overview">Сравнить районы <ArrowRight size={18}/></Link><Link className="button secondary" to="/data">О данных <ArrowRight size={16}/></Link></div>
      </div>
      <div className="hero-chart">
        <div className="hero-chart-top"><span className="icon-tile"><BarChart3 size={23}/></span><Badge>{demoLabel}</Badge></div>
        <h2>Аренда и время в пути</h2>
        <p>До НИТУ МИСИС · Ленинский проспект</p>
        <Scatter rows={districts} filters={demoFilters} preview />
        <Legend/>
      </div>
    </div>
    <section className="shell snapshot" aria-label="Обзор учебных данных">
      <div><span className="icon-tile"><Building2 size={22}/></span><div><strong>{districts.length}</strong><small>районов Москвы</small></div></div>
      <div><span className="icon-tile teal"><GraduationCap size={23}/></span><div><strong>{campuses.length}</strong><small>кампуса для сравнения</small></div></div>
      <div><span className="icon-tile purple"><Clock3 size={21}/></span><div><strong>{months.length}</strong><small>месяцев истории аренды</small></div></div>
    </section>
  </>
}

function DistrictTable({rows, campus, active, onPick, action}: {rows: District[]; campus: number; active?: string; onPick?: (id: string) => void; action?: (d: District) => ReactNode}) {
  return <div className="table-scroll" tabIndex={0} role="region" aria-label="Таблица показателей районов"><table>
    <thead><tr><th scope="col">Район</th>{metrics.map(m => <th key={m.key} scope="col">{m.name}, {m.unit}</th>)}{action && <th scope="col">Сравнение</th>}</tr></thead>
    <tbody>{rows.map((d,i) => <tr key={d.id} className={d.id === active ? 'selected-row' : undefined}>
      <th scope="row">{onPick ? <button className="text-button" aria-pressed={d.id === active} onClick={() => onPick(d.id)}>{d.name}</button> : <><i className="series-dot" style={{background: colors[i]}}/>{d.name}</>}</th>
      {metrics.map(m => <td key={m.key}>{number(m.value(d,campus))}</td>)}
      {action && <td>{action(d)}</td>}
    </tr>)}</tbody>
  </table></div>
}
function Overview({filters, setFilters, ids, toggle}: {filters: Filters; setFilters: (f: Filters) => void; ids: string[]; toggle: (id: string) => void}) {
  const [active, setActive] = useState('')
  const rows = districts.filter(d => matches(d, filters)).sort(sortRent)
  const current = districts.find(d => d.id === active)
  const reset = () => { setFilters(defaultFilters); setActive('') }
  const pick = (id: string) => setActive(id)
  const add = (d: District, compact = false) => {
    const included = ids.includes(d.id)
    return <button className={compact ? 'small-button' : 'button primary'} disabled={!included && ids.length >= 3} aria-pressed={included} aria-label={(included ? 'Убрать из сравнения: ' : 'Добавить к сравнению: ') + d.name} onClick={() => toggle(d.id)}>
      {included ? <Check size={16}/> : <Plus size={16}/>} {included ? (compact ? 'Добавлен' : 'Убрать из сравнения') : (compact ? 'Добавить' : 'Добавить к сравнению')}
    </button>
  }
  return <div className="shell page">
    <div className="page-heading"><div><h1>Обзор районов</h1><p>Задайте условия и подберите районы для сравнения.</p></div><Badge>{demoLabel}</Badge></div>
    <section className="panel filters" aria-label="Фильтры районов">
      <div className="filter-title"><h2><SlidersHorizontal size={19}/> Фильтры</h2><button className="text-button reset" onClick={reset}><RotateCcw size={16}/> Сбросить фильтры</button></div>
      <div className="filter-fields">
        <label><span><Wallet size={16}/> Максимальная аренда, ₽</span><input type="number" min={0} max={200000} step={500} value={filters.budget || ''} onChange={e => setFilters({...filters,budget: Math.min(200000, Math.max(0, Number(e.target.value)))})}/></label>
        <label><span><Clock3 size={16}/> Максимум в пути, мин</span><input type="number" min={0} max={120} value={filters.minutes || ''} onChange={e => setFilters({...filters,minutes: Math.min(120, Math.max(0, Number(e.target.value)))})}/></label>
        <label><span><GraduationCap size={17}/> Кампус</span><select value={filters.campus} onChange={e => setFilters({...filters,campus: Number(e.target.value)})}>{campuses.map((c,i) => <option value={i} key={c}>{c}</option>)}</select></label>
      </div>
    </section>
    <div className="result-head"><strong aria-live="polite">Подходят: {rows.length} из {districts.length}</strong><Link className="button secondary" to="/compare"><Layers3 size={17}/> Сравнение ({ids.length}/3) <ArrowRight size={16}/></Link></div>
    <div className="chart-grid">
      <Panel title="Аренда и время в пути" subtitle="Выберите точку, чтобы посмотреть показатели района.">
        <Scatter rows={districts} filters={filters} active={active} onPick={pick}/><Legend/>
      </Panel>
      <Panel title="Аренда в подходящих районах" subtitle="От самой низкой стоимости к самой высокой.">
        {rows.length ? <RentBars rows={rows} active={active} onPick={pick}/> : <div className="empty"><h3>Подходящих районов нет</h3><p>Увеличьте бюджет или допустимое время в пути.</p><button className="button primary" onClick={reset}>Сбросить фильтры</button></div>}
      </Panel>
    </div>
    {current && <section className="panel detail" aria-live="polite"><div><h2>{current.name}</h2><p className="muted">{matches(current,filters) ? 'Соответствует вашим условиям' : 'Выходит за выбранные ограничения'}</p></div><div className="detail-metrics">{metrics.map(m => <div key={m.key}><small>{m.name}</small><strong>{m.format(m.value(current,filters.campus))}</strong></div>)}</div>{add(current)}</section>}
    <Panel title="Результаты по районам" subtitle={ids.length >= 3 ? 'Выбрано 3 района. Уберите один вариант, чтобы добавить другой.' : 'Добавьте до трёх районов для сравнения.'}>
      {rows.length || current ? <DistrictTable rows={current && !matches(current, filters) ? [...rows,current] : rows} campus={filters.campus} active={active} onPick={pick} action={d => add(d,true)}/> : <p className="muted">Нет результатов по текущим условиям.</p>}
    </Panel>
    {rows.length < districts.length && <details className="panel data-details"><summary>Все точки диаграммы в таблице</summary><DistrictTable rows={[...districts].sort(sortRent)} campus={filters.campus} active={active} onPick={pick}/></details>}
  </div>
}
function ComparisonContent({rows, campus}: {rows: District[]; campus: number}) {
  return <>
    <Panel title="Показатели районов"><DistrictTable rows={rows} campus={campus}/>
      <div className="insight"><Info size={19}/><div><strong>Что видно из сравнения</strong><p>{conclusion(rows,campus)}</p></div></div>
    </Panel>
    <div className="metric-grid">{metrics.map(m => <Panel key={m.key} title={m.name} subtitle={m.unit}>
      {rows.map((d,i) => {
        const v = m.value(d,campus)
        return <div className="bar-item" key={d.id}><div><span>{d.name}</span><strong>{m.format(v)}</strong></div><div className="bar-track"><span style={{width: `${100*v/m.max}%`, background: colors[i]}}/></div></div>
      })}
    </Panel>)}</div>
    <Panel title="Как менялась аренда" subtitle="Стоимость однокомнатной квартиры за 12 месяцев.">
      <History rows={rows}/>
      <details><summary>Данные графика в таблице</summary><div className="table-scroll" tabIndex={0} role="region" aria-label="История аренды"><table><thead><tr><th scope="col">Месяц</th>{rows.map(d => <th scope="col" key={d.id}>{d.name}, ₽/мес.</th>)}</tr></thead><tbody>{months.map((month,i) => <tr key={month}><th scope="row">{month}</th>{rows.map(d => <td key={d.id}>{number(d.history[i])}</td>)}</tr>)}</tbody></table></div></details>
    </Panel>
  </>
}

const reportKey = (r: Report) => [r.campus, ...r.ids].join('~')
function Compare({rows, campus, toggle, reports}: {rows: District[]; campus: number; toggle: (id: string) => void; reports: Record<string, Report>}) {
  const key = reportKey({ids: rows.map(d => d.id),campus})
  return <div className="shell page"><Link className="back-link" to="/overview"><ArrowLeft size={17}/> К обзору районов</Link>
    <div className="page-heading"><div><h1>Сравнение районов</h1><p>{campuses[campus]}</p></div><Badge>{demoLabel}</Badge></div>
    {rows.length ? <>
      <div className="selection">{rows.map((d,i) => <button className="district-chip" key={d.id} onClick={() => toggle(d.id)} aria-label={'Убрать из сравнения: ' + d.name}><i className="series-dot" style={{background: colors[i]}}/>{d.name}<X size={16}/></button>)}</div>
      <ComparisonContent rows={rows} campus={campus}/>
      <section className="panel offer"><div><h2>Персональный отчёт</h2><p className="muted">Показатели, диаграммы и вывод по вашему выбору в PDF.</p></div>
        <Link className="button primary" to={reports[key] ? '/report/' + key : '/checkout'}>{reports[key] ? 'Открыть отчёт' : 'Получить отчёт за 199 ₽'} <ArrowRight size={17}/></Link></section>
    </> : <section className="panel empty"><h2>Выберите районы для сравнения</h2><p>Добавьте от одного до трёх районов в обзоре.</p><Link className="button primary" to="/overview">Перейти к обзору <ArrowRight size={17}/></Link></section>}
    {Object.keys(reports).length > 0 && <Panel title="Сохранённые отчёты"><ul className="report-links">{Object.entries(reports).map(([id,r]) => <li key={id}><Link to={'/report/'+id}>{resolve(r.ids).map(d => d.name).join(', ')} <small>· {campuses[r.campus]}</small></Link></li>)}</ul></Panel>}
  </div>
}

function Checkout({rows, campus, onPaid}: {rows: District[]; campus: number; onPaid: (r: Report) => void}) {
  const [failed,setFailed] = useState(false)
  const navigate = useNavigate()
  if (!rows.length) return <Navigate replace to="/compare"/>
  function pay() {
    const report = {ids: rows.map(d => d.id),campus}
    onPaid(report)
    navigate('/report/' + reportKey(report), {replace: true})
  }
  return <div className="shell page narrow"><Link className="back-link" to="/compare"><ArrowLeft size={17}/> К сравнению</Link>
    <div className="page-heading"><div><h1>Оплата отчёта</h1><p>Персональное сравнение выбранных районов</p></div></div>
    <section className="panel payment"><Badge>Демонстрационная оплата</Badge><div className="insight"><Info size={19}/><p>Данные карты не требуются. Деньги не списываются.</p></div><h2>Ваш отчёт</h2><ul>{rows.map(d => <li key={d.id}>{d.name}</li>)}</ul><p className="muted">{campuses[campus]}</p>
      <div className="total"><strong>Итого</strong><strong>199 ₽</strong></div>
      {failed && <p className="error" role="alert">Тестовая ошибка оплаты. Повторите попытку или вернитесь к сравнению.</p>}
      <div className="pay-actions"><button className="button primary" onClick={pay}>{failed ? 'Повторить попытку' : 'Оплатить в деморежиме'} <ArrowRight size={17}/></button>
      {!failed && <button className="button secondary" onClick={() => setFailed(true)}>Проверить ошибку</button>}
      <Link className="text-button" to="/compare">Отменить оплату</Link></div>
    </section>
  </div>
}
function ReportPage({reports}: {reports: Record<string, Report>}) {
  const {id} = useParams()
  const report = id && Object.hasOwn(reports, id) ? reports[id] : undefined
  const [status,setStatus] = useState('')
  const [busy,setBusy] = useState(false)
  if (!report) return <div className="shell page"><section className="panel empty"><h1>Отчёт недоступен</h1><p>Пройдите демонстрационную оплату в этом браузере, чтобы открыть отчёт.</p><Link className="button primary" to="/compare">К сравнению</Link></section></div>
  const rows = resolve(report.ids)
  async function download() {
    setBusy(true)
    setStatus('')
    try { const {saveReport} = await import('./pdf'); await saveReport(rows,report!.campus); setStatus('PDF готов к скачиванию.') }
    catch { setStatus('Не удалось подготовить PDF. Повторите попытку.') }
    finally { setBusy(false) }
  }
  return <div className="shell page"><Link className="back-link" to="/compare"><ArrowLeft size={17}/> К сравнению</Link>
    <div className="page-heading"><div><h1>Персональный отчёт</h1><p>{campuses[report.campus]}</p></div><button className="button primary" onClick={download} disabled={busy}><Download size={18}/>{busy ? 'Готовим PDF…' : 'Скачать PDF'}</button></div>
    <div className="report-meta"><Badge>{demoLabel}</Badge><span className="success"><Check size={17}/> Отчёт открыт после демооплаты</span><span role="status">{status}</span></div>
    <ComparisonContent rows={rows} campus={report.campus}/>
  </div>
}
function DataPage() {
  const definitions = [
    ['Аренда · ₽/мес.', 'Условная стоимость аренды однокомнатной квартиры за месяц. История содержит 12 синтетических значений с декабря 2025 по ноябрь 2026 года. Значение за ноябрь используется как текущая стоимость.'],
    ['До кампуса · мин', 'Учебная оценка поездки в один конец от условной жилой точки района до кампуса. Значение моделирует сумму пеших участков, ожидания, поездки в общественном транспорте и пересадок. Для каждой пары «район — кампус» в наборе зафиксировано своё значение. При смене кампуса сайт подставляет соответствующую оценку.'],
    ['До метро · м', 'Условная длина пешего маршрута от той же жилой точки до ближайшего входа в метро.'],
    ['Зелёные зоны · %', 'Учебная оценка доли территории района, которую занимают парки, скверы и другие озеленённые участки.'],
  ]
  return <div className="shell page"><div className="page-heading"><div><h1>О данных</h1><p>Показатели и методика учебного набора.</p></div><Badge>{demoLabel}</Badge></div>
    <Panel title="Учебный набор"><p>Названия районов и кампусов реальные. Все числовые значения синтетические. Данные созданы для демонстрации фильтрации и сравнения, а фактические цены и маршруты зависят от адреса, даты и времени поездки.</p><p>В фильтрах доступны {campuses[0]} и {campuses[1]}. Бюджет и время учитываются включительно.</p></Panel>
    <div className="metric-grid">{definitions.map(([title,description]) => <Panel key={title} title={title}><p>{description}</p></Panel>)}</div>
  </div>
}
function RoutePosition() {
  const {pathname} = useLocation()
  useEffect(() => { window.scrollTo(0,0); document.getElementById('main')?.focus({preventScroll: true}) }, [pathname])
  return null
}
function App() {
  const [filters,setFilters] = useStored('gorod-filters-v1',defaultFilters)
  const [ids,setIds] = useStored<string[]>('gorod-selection-v1',[])
  const [reports,setReports] = useStored<Record<string,Report>>('gorod-reports-v1',{})
  const rows = resolve(ids)
  const toggle = (id: string) => setIds(old => old.includes(id) ? old.filter(v => v !== id) : old.length < 3 ? [...old,id] : old)
  return <>
    <a className="skip" href="#main" onClick={e => {e.preventDefault(); document.getElementById('main')?.focus()}}>К содержанию</a>
    <header><div className="shell topbar"><Link className="brand" to="/"><span><BarChart3 size={22}/></span>Город в цифрах</Link>
      <nav aria-label="Основная навигация"><NavLink to="/overview">Обзор</NavLink><NavLink to="/compare">Сравнение{ids.length > 0 && <small>{ids.length}</small>}</NavLink><NavLink to="/data">О данных</NavLink></nav>
    </div></header>
    <RoutePosition/>
    <main id="main" tabIndex={-1}><Routes>
      <Route path="/" element={<Home/>}/>
      <Route path="/overview" element={<Overview {...{filters,setFilters,ids,toggle}}/>}/>
      <Route path="/compare" element={<Compare {...{rows,toggle,reports}} campus={filters.campus}/>}/>
      <Route path="/checkout" element={<Checkout rows={rows} campus={filters.campus} onPaid={r => setReports(old => ({...old,[reportKey(r)]: r}))}/>}/>
      <Route path="/report/:id" element={<ReportPage reports={reports}/>}/>
      <Route path="/data" element={<DataPage/>}/>
      <Route path="*" element={<Navigate replace to="/"/>}/>
    </Routes></main>
    <footer><div className="shell"><span>Город в цифрах</span><span>Учебный проект · Визуализация данных</span><Link to="/data">О данных</Link></div></footer>
  </>
}
createRoot(document.getElementById('root')!).render(<StrictMode><HashRouter><App/></HashRouter></StrictMode>)
