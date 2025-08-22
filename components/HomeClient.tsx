'use client'
import { useEffect, useRef, useState } from 'react'
import { optimizePrompt, type OptimizeOptions, type OptimizedResult } from '@/lib/optimizer'
import { LOCALES } from '@/lib/locales'

type Tab = 'json' | 'prompt'
type Dict = Record<string,string>

const ROLES = ['Subject-matter expert','Senior software engineer','Software architect','Data scientist','Data analyst','ML engineer','MLOps engineer','DevOps engineer','Security engineer','Mobile engineer','Frontend engineer','Backend engineer','Full-stack engineer','Product manager','Project manager','Program manager','Scrum master','UX writer','Content strategist','Copywriter','Technical writer','Documentation specialist','Growth marketer','SEO specialist','PPC specialist','Email marketer','Social media manager','PR manager','Legal analyst','Compliance officer','Policy analyst','Educator / teacher','Curriculum designer','Instructional designer','Researcher','Customer support agent','Customer success manager','Sales representative','Sales engineer','Translator','Localization specialist','Financial analyst','Accounting analyst','Operations manager','HR specialist','Recruiter']

const EXAMPLES = [
  { title:'Summarize article', desc:'5 bullets, plain language', text:'Summarize this article in 5 bullet points, practical tone: ...' },
  { title:'Translate + simplify', desc:'ES ⟶ EN, no jargon', text:'Translate the following paragraph to English and simplify jargon: ...' },
  { title:'Content plan', desc:'LinkedIn table Q plan', text:'Create a quarterly LinkedIn content plan in a Markdown table (4 rows, 5 columns).' },
  { title:'Fix Python', desc:'Explain changes briefly', text:'Fix this Python function and add 3 short comments: ...' },
  { title:'A/B test plan', desc:'KPIs + hypothesis', text:'Create an A/B test plan for a landing page with KPIs and hypothesis.' },
  { title:'User stories', desc:'INVEST format', text:'Generate user stories (INVEST) for a to-do app, output as a Markdown table.' },
  { title:'Entity extraction', desc:'JSON array output', text:'Extract entities (PERSON, ORG, DATE) from the text and return as JSON array.' },
  { title:'Learning roadmap', desc:'TypeScript basics', text:'Make a week-by-week learning roadmap for TypeScript basics.' },
]

function flagEmoji(code: string): string {
  const map: Record<string,string> = {'en-US':'🇺🇸','en-GB':'🇬🇧','en-CA':'🇨🇦','en-AU':'🇦🇺','es-ES':'🇪🇸','es-MX':'🇲🇽','es-AR':'🇦🇷','es-CL':'🇨🇱','fr-FR':'🇫🇷','fr-CA':'🇨🇦','de-DE':'🇩🇪','it-IT':'🇮🇹','pt-PT':'🇵🇹','pt-BR':'🇧🇷','nl-NL':'🇳🇱','sv-SE':'🇸🇪','no-NO':'🇳🇴','da-DK':'🇩🇰','fi-FI':'🇫🇮','pl-PL':'🇵🇱','cs-CZ':'🇨🇿','sk-SK':'🇸🇰','ro-RO':'🇷🇴','hu-HU':'🇭🇺','ru-RU':'🇷🇺','uk-UA':'🇺🇦','tr-TR':'🇹🇷','ar-SA':'🇸🇦','he-IL':'🇮🇱','hi-IN':'🇮🇳','bn-BD':'🇧🇩','ur-PK':'🇵🇰','id-ID':'🇮🇩','ms-MY':'🇲🇾','th-TH':'🇹🇭','vi-VN':'🇻🇳','zh-CN':'🇨🇳','zh-TW':'🇹🇼','ja-JP':'🇯🇵','ko-KR':'🇰🇷'}
  return map[code] || '🏳️'
}

export default function HomeClient({ dict, localeUI }: { dict: Dict, localeUI: 'en'|'es' }) {
  const [prompt,setPrompt] = useState('')
  const [goal,setGoal] = useState<NonNullable<OptimizeOptions['objective']>>('precision')
  const [reasoning,setReasoning] = useState<NonNullable<OptimizeOptions['reasoning']>>('medium')
  const [lang,setLang] = useState('en-US')
  const [role,setRole] = useState('Subject-matter expert')
  const [ctype,setCtype] = useState<NonNullable<OptimizeOptions['contentType']>>('text')
  const [out,setOut] = useState<OptimizedResult|null>(null)
  const [tab,setTab] = useState<Tab>('json')
  const [page,setPage] = useState(0)
  const [theme,setTheme] = useState<'dark'|'light'>('dark')
  const [roleQuery,setRoleQuery] = useState('')
  const [toast,setToast] = useState('')
  const [full,setFull] = useState(false)

  const taRef = useRef<HTMLTextAreaElement|null>(null)
  const PER_PAGE = 4
  const maxPage = Math.ceil(EXAMPLES.length/PER_PAGE)-1
  const view = EXAMPLES.slice(page*PER_PAGE,page*PER_PAGE+PER_PAGE)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem('po_state')
      if (!raw) return
      const d = JSON.parse(raw)
      setPrompt(d.prompt ?? '')
      setGoal(d.goal ?? 'precision')
      setReasoning(d.reasoning ?? 'medium')
      setLang(d.lang ?? 'en-US')
      setRole(d.role ?? 'Subject-matter expert')
      setCtype(d.ctype ?? 'text')
    } catch(e) {
      console.warn('Failed to load state:', e)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem('po_state', JSON.stringify({prompt,goal,reasoning,lang,role,ctype}))
  }, [prompt,goal,reasoning,lang,role,ctype])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const savedTheme = localStorage.getItem('po_theme') as 'dark'|'light'|null
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.setAttribute('data-theme', savedTheme)
    }
  }, [])

  function toggleTheme() {
    const t = theme === 'dark' ? 'light' : 'dark'
    setTheme(t)
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', t)
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('po_theme', t)
    }
  }

  function toastMsg(m: string) {
    setToast(m)
    setTimeout(() => setToast(''), 1800)
  }

  function generate() {
    if (!prompt.trim()) {
      toastMsg('Please enter a prompt first')
      return
    }
    try {
      const result = optimizePrompt(prompt, {
        defaultLanguage: lang,
        objective: goal,
        reasoning,
        role,
        contentType: ctype
      })
      setOut(result)
      toastMsg('Generated')
    } catch (error) {
      console.error('Generation failed:', error)
      toastMsg('Error generating')
    }
  }

  function copy(text: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text)
      toastMsg('Copied')
    }
  }

  function copyCurrent() {
    if (!out) return
    copy(tab === 'json' ? JSON.stringify(out, null, 2) : out.optimized_prompt)
  }

  function download(name: string, content: string, type: string) {
    if (typeof window === 'undefined') return
    const blob = new Blob([content], {type})
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = name
    a.click()
    URL.revokeObjectURL(a.href)
    toastMsg('Downloaded')
  }

  function downloadJSON() {
    if (!out) return
    download('prompt-optimizer.json', JSON.stringify(out, null, 2), 'application/json')
  }

  function downloadTxt() {
    if (!out) return
    download('optimized-prompt.txt', out.optimized_prompt, 'text/plain')
  }

  function share() {
    if (typeof window === 'undefined') return
    const enc = (o: any) => btoa(unescape(encodeURIComponent(JSON.stringify(o))))
    const url = window.location.origin + `/${localeUI}#state=` + enc({prompt,goal,reasoning,lang,role,ctype})
    copy(url)
    toastMsg('Link copied')
  }

  const filteredRoles = roleQuery.trim() ? 
    ROLES.filter(r => r.toLowerCase().includes(roleQuery.trim().toLowerCase())) : 
    ROLES
  
  const intent = out?.intent ?? '—'

  return (
    <div>
      <div className="header-blur">
        <div className="mx-auto container-narrow px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src="/icon.svg" className="h-9 w-9 rounded-xl" alt=""/>
            <div>
              <h1 className="text-lg font-semibold">{dict['app_title']}</h1>
              <p className="text-sm small">{dict['subtitle']}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select 
              className="select w-[200px]" 
              value={localeUI} 
              onChange={(e) => {
                if (typeof window === 'undefined') return
                const loc = e.target.value
                document.cookie = `po_locale=${loc}; path=/; max-age=31536000`
                const segs = window.location.pathname.split('/').filter(Boolean)
                segs[0] = loc
                window.location.href = '/' + segs.join('/')
              }}
            >
              <option value="en">🇺🇸 English</option>
              <option value="es">🇪🇸 Español</option>
            </select>
            <button className="b-pill" onClick={toggleTheme}>
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto container-narrow px-4 sm:px-6 lg:px-8 py-6 grid gap-6 md:grid-cols-2">
        <section className="card">
          <h2 className="label uppercase">Input</h2>
          <label className="label" htmlFor="prompt">{dict['original_prompt']}</label>
          <textarea 
            ref={taRef} 
            id="prompt" 
            className="w-full min-h-[220px] resize-y border border-[color:var(--c-border)] rounded-2xl bg-[color:var(--c-surface)] text-[color:var(--c-text)] p-4 text-[15px] outline-none" 
            placeholder="e.g., Summarize this article in 5 bullet points..." 
            value={prompt} 
            onChange={e => setPrompt(e.target.value)}
          />

          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <label className="label">{dict['role']}</label>
              <div className="relative">
                <input 
                  className="select pr-10" 
                  list="roles" 
                  placeholder="Search or type a role" 
                  value={role} 
                  onChange={e => {setRole(e.target.value); setRoleQuery(e.target.value)}} 
                />
                <span className="absolute right-3 top-2.5 opacity-60">🔎</span>
              </div>
              <datalist id="roles">
                {filteredRoles.map(r => (<option key={r} value={r}></option>))}
              </datalist>
              <div className="small mt-1">Selecting a role will shape the optimized prompt.</div>
            </div>
            <div>
              <label className="label">{dict['content_type']}</label>
              <select className="select" value={ctype} onChange={e => setCtype(e.target.value as any)}>
                <option value="text">📝 Text</option>
                <option value="video">🎬 Video</option>
                <option value="image">🖼️ Image</option>
                <option value="audio">🎧 Audio</option>
                <option value="presentation">📑 Presentation</option>
              </select>
            </div>
            <div>
              <label className="label">{dict['language']}</label>
              <select className="select" value={lang} onChange={e => setLang(e.target.value)}>
                {Array.from(new Map(LOCALES.map(l => [l.group, [] as any[]])).keys()).map(g => (
                  <optgroup key={g} label={g}>
                    {LOCALES.filter(l => l.group === g).map(l => (
                      <option key={l.code} value={l.code}>{flagEmoji(l.code)} {l.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{dict['goal']}</label>
              <select className="select" value={goal} onChange={e => setGoal(e.target.value as any)}>
                <option value="precision">Precision</option>
                <option value="brevity">Brevity</option>
                <option value="creativity">Creativity</option>
                <option value="safety">Safety</option>
                <option value="speed">Speed</option>
              </select>
            </div>
            <div>
              <label className="label">{dict['reasoning']}</label>
              <select className="select" value={reasoning} onChange={e => setReasoning(e.target.value as any)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-[color:var(--c-text)]/80">{dict['examples']}</span>
              <div className="flex gap-2">
                <button className="b-pill" onClick={() => setPage(p => (p-1+(maxPage+1))%(maxPage+1))}>&larr;</button>
                <button className="b-pill" onClick={() => setPage(p => (p+1)%(maxPage+1))}>&rarr;</button>
              </div>
            </div>
            <div className="example-track flex gap-2 overflow-x-auto pb-1">
              {view.map((s,i) => (
                <button 
                  key={i} 
                  className="example-card-compact" 
                  onClick={() => {setPrompt(s.text); taRef.current?.focus()}}
                >
                  <span className="example-title">{s.title}</span>
                  <span className="example-desc">{s.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 sticky bottom-0 bg-[color:var(--c-card)]/80 backdrop-blur rounded-xl p-2 flex flex-wrap items-center gap-2 border border-[color:var(--c-border)]">
            <button 
              className="rounded-xl font-bold shadow-sm px-3 py-2" 
              style={{background:'linear-gradient(90deg,#7aa2ff,#a48bff)',color:'#0b0c10',border:'none'}} 
              onClick={generate}
            >
              {dict['generate']}
            </button>
            <button className="b-pill" onClick={share}>{dict['share_link']}</button>
            <button className="b-pill" onClick={() => {setPrompt(''); setOut(null)}}>{dict['reset']}</button>
            <span className="small">All data stays in your browser.</span>
          </div>
        </section>

        <section className="card relative">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="label uppercase mb-0">{dict['output']}</h2>
              <span className="small opacity-80">Intent: <strong>{intent}</strong></span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex bg-[color:var(--c-surface)] border border-[color:var(--c-border)] rounded-2xl p-1 gap-1">
                <button className="tab" aria-selected={tab === 'json'} onClick={() => setTab('json')}>{dict['json']}</button>
                <button className="tab" aria-selected={tab === 'prompt'} onClick={() => setTab('prompt')}>{dict['optimized_prompt']}</button>
              </div>
              <button className="b-pill" onClick={copyCurrent}>Copy</button>
              <button className="b-pill" onClick={downloadJSON} disabled={!out}>Download JSON</button>
              <button className="b-pill" onClick={downloadTxt} disabled={!out}>Download .txt</button>
              <button className="b-pill" onClick={() => setFull(true)} disabled={!out}>Expand</button>
            </div>
          </div>
          <div className="mb-2 flex flex-wrap gap-2 small">
            <span className="chip">Role: {role}</span>
            <span className="chip">Type: {ctype}</span>
            <span className="chip">Lang: {flagEmoji(lang)} {lang}</span>
            <span className="chip">Goal: {goal}</span>
            <span className="chip">Reasoning: {reasoning}</span>
          </div>
          {!out && (
            <div className="border border-[color:var(--c-border)] rounded-xl p-6 text-sm text-[color:var(--c-text)]/80 bg-[color:var(--c-surface)]">
              <div className="font-semibold mb-2">Ready when you are.</div>
              <ul className="list-disc pl-5 space-y-1">
                <li>Paste your prompt or pick an example.</li>
                <li>Set Role, Content type and Answer language.</li>
                <li>Click <strong>Generate</strong> to see JSON and the optimized prompt.</li>
              </ul>
            </div>
          )}
          {out && (
            <pre 
              className="border border-[color:var(--c-border)] rounded-xl p-4 text-[13px] leading-6 max-h-[520px] overflow-auto bg-[color:var(--c-surface)]" 
              style={{whiteSpace:'pre-wrap',wordBreak:'break-word',overflowWrap:'anywhere'}}
            >
              {tab === 'json' ? JSON.stringify(out, null, 2) : out.optimized_prompt}
            </pre>
          )}
          {full && out && (
            <div className="output-full">
              <div className="mb-2 flex items-center justify-between">
                <div className="small opacity-80">Viewing {tab.toUpperCase()}</div>
                <button className="b-pill" onClick={() => setFull(false)}>Close</button>
              </div>
              <pre className="border border-[color:var(--c-border)] rounded-xl p-4 text-[13px] leading-6 h-[calc(100%-48px)] overflow-auto bg-[color:var(--c-surface)]">
                {tab === 'json' ? JSON.stringify(out, null, 2) : out.optimized_prompt}
              </pre>
            </div>
          )}
        </section>
      </div>

      <footer className="mx-auto container-narrow px-4 sm:px-6 lg:px-8 mt-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-sm small">
        <div className="flex items-center gap-2">
          <img src="/icon.svg" alt="" className="h-5 w-5 rounded-md"/>
          <span>{dict['app_title']}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a className="underline-offset-4 hover:underline" href="https://jorgejrolo.com/ia/json-prompts/" target="_blank" rel="noopener">JSON prompts guide</a>
          <a className="underline-offset-4 hover:underline" href="https://cookbook.openai.com/examples/gpt-5/gpt-5_prompting_guide" target="_blank" rel="noopener">Prompting best practices</a>
          <a className="b-pill" href="https://jorgejrolo.com/" target="_blank" rel="noopener">Made with ❤️ by <strong>Jorge J. Rolo</strong></a>
        </div>
      </footer>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
