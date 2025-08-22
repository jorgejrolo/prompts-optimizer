'use client'
import { useEffect, useRef, useState } from 'react'
import { optimizePrompt, type OptimizeOptions, type OptimizedResult } from '@/lib/optimizer'
import { LOCALES } from '@/lib/locales'

type Tab = 'json' | 'prompt'
type Dict = Record<string,string>

const ROLES = ['Subject-matter expert','Senior software engineer','Software architect','Data scientist','Data analyst','ML engineer','MLOps engineer','DevOps engineer','Security engineer','Mobile engineer','Frontend engineer','Backend engineer','Full-stack engineer','Product manager','Project manager','Program manager','Scrum master','UX writer','Content strategist','Copywriter','Technical writer','Documentation specialist','Growth marketer','SEO specialist','PPC specialist','Email marketer','Social media manager','PR manager','Legal analyst','Compliance officer','Policy analyst','Educator / teacher','Curriculum designer','Instructional designer','Researcher','Customer support agent','Customer success manager','Sales representative','Sales engineer','Translator','Localization specialist','Financial analyst','Accounting analyst','Operations manager','HR specialist','Recruiter']

const EXAMPLES = [
  { title:'Summarize article', desc:'5 bullets, plain language', text:'Summarize this article in 5 bullet points using practical language that anyone can understand: [paste article here]' },
  { title:'Translate + simplify', desc:'ES ⟶ EN, no jargon', text:'Translate the following Spanish paragraph to English and simplify any technical jargon for a general audience: [paste Spanish text here]' },
  { title:'Content plan', desc:'LinkedIn quarterly plan', text:'Create a quarterly LinkedIn content plan in a Markdown table format with 4 weeks per month and 5 content types per week.' },
  { title:'Fix Python code', desc:'Debug with explanations', text:'Fix this Python function and add 3 brief comments explaining the key changes: [paste Python code here]' },
  { title:'A/B test plan', desc:'KPIs + hypothesis', text:'Create a comprehensive A/B test plan for a landing page redesign, including KPIs, success metrics, and testable hypothesis.' },
  { title:'User stories', desc:'INVEST format table', text:'Generate 8 user stories following INVEST criteria for a mobile to-do app and present them in a Markdown table format.' },
  { title:'Entity extraction', desc:'JSON structured output', text:'Extract all entities (PERSON, ORGANIZATION, DATE, LOCATION) from the following text and return as a structured JSON array: [paste text here]' },
  { title:'Learning roadmap', desc:'TypeScript 4-week plan', text:'Create a detailed week-by-week learning roadmap for mastering TypeScript fundamentals in 4 weeks, including daily goals and practice projects.' },
]

function flagEmoji(code:string){
  const map:Record<string,string>={'en-US':'🇺🇸','en-GB':'🇬🇧','en-CA':'🇨🇦','en-AU':'🇦🇺','es-ES':'🇪🇸','es-MX':'🇲🇽','es-AR':'🇦🇷','es-CL':'🇨🇱','fr-FR':'🇫🇷','fr-CA':'🇨🇦','de-DE':'🇩🇪','it-IT':'🇮🇹','pt-PT':'🇵🇹','pt-BR':'🇧🇷','nl-NL':'🇳🇱','sv-SE':'🇸🇪','no-NO':'🇳🇴','da-DK':'🇩🇰','fi-FI':'🇫🇮','pl-PL':'🇵🇱','cs-CZ':'🇨🇿','sk-SK':'🇸🇰','ro-RO':'🇷🇴','hu-HU':'🇭🇺','ru-RU':'🇷🇺','uk-UA':'🇺🇦','tr-TR':'🇹🇷','ar-SA':'🇸🇦','he-IL':'🇮🇱','hi-IN':'🇮🇳','bn-BD':'🇧🇩','ur-PK':'🇵🇰','id-ID':'🇮🇩','ms-MY':'🇲🇾','th-TH':'🇹🇭','vi-VN':'🇻🇳','zh-CN':'🇨🇳','zh-TW':'🇹🇼','ja-JP':'🇯🇵','ko-KR':'🇰🇷'}; return map[code] || '🏳️'}

export default function HomeClient({ dict, localeUI }:{ dict: Dict, localeUI: 'en'|'es' }){
  const [prompt,setPrompt]=useState('')
  const [goal,setGoal]=useState<NonNullable<OptimizeOptions['objective']>>('precision')
  const [reasoning,setReasoning]=useState<NonNullable<OptimizeOptions['reasoning']>>('medium')
  const [lang,setLang]=useState('en-US')
  const [role,setRole]=useState('Subject-matter expert')
  const [ctype,setCtype]=useState<NonNullable<OptimizeOptions['contentType']>>('text')
  const [out,setOut]=useState<OptimizedResult|null>(null)
  const [tab,setTab]=useState<Tab>('json')
  const [page,setPage]=useState(0)
  const [theme,setTheme]=useState<'dark'|'light'>(typeof window==='undefined'?'dark':(document.documentElement.getAttribute('data-theme') as any)||'dark')
  const [roleQuery,setRoleQuery]=useState('')
  const [toast,setToast]=useState('')
  const [full,setFull]=useState(false)
  const [loading,setLoading]=useState(false)
  const [showAdvanced,setShowAdvanced]=useState(false)

  const taRef=useRef<HTMLTextAreaElement|null>(null)
  const PER_PAGE=4, maxPage=Math.ceil(EXAMPLES.length/PER_PAGE)-1
  const view=EXAMPLES.slice(page*PER_PAGE,page*PER_PAGE+PER_PAGE)

  useEffect(()=>{try{const raw=localStorage.getItem('po_state');if(!raw)return;const d=JSON.parse(raw);setPrompt(d.prompt??'');setGoal(d.goal??'precision');setReasoning(d.reasoning??'medium');setLang(d.lang??'en-US');setRole(d.role??'Subject-matter expert');setCtype(d.ctype??'text');setShowAdvanced(d.showAdvanced??false)}catch{}},[])
  useEffect(()=>{localStorage.setItem('po_state',JSON.stringify({prompt,goal,reasoning,lang,role,ctype,showAdvanced}))},[prompt,goal,reasoning,lang,role,ctype,showAdvanced])

  useEffect(()=>{
    // Auto-load theme from localStorage
    const savedTheme = localStorage.getItem('po_theme') as 'dark'|'light'|null
    if(savedTheme && savedTheme !== theme){
      setTheme(savedTheme)
      document.documentElement.setAttribute('data-theme', savedTheme)
    }
  }, [])

  function toggleTheme(){const t=theme==='dark'?'light':'dark';setTheme(t);document.documentElement.setAttribute('data-theme',t);localStorage.setItem('po_theme',t)}
  function toastMsg(m:string){setToast(m);window.setTimeout(()=>setToast(''),2200)}
  
  function generate(){
    if(!prompt.trim()){
      toastMsg('Please enter a prompt first')
      taRef.current?.focus()
      return
    }
    setLoading(true)
    // Simular delay para mejor UX
    setTimeout(() => {
      setOut(optimizePrompt(prompt,{defaultLanguage:lang,objective:goal,reasoning,role,contentType:ctype}))
      setLoading(false)
      toastMsg('✨ Generated successfully!')
    }, 800)
  }
  
  function copy(text:string){navigator.clipboard.writeText(text);toastMsg('📋 Copied to clipboard')}
  function copyCurrent(){if(!out)return;copy(tab==='json'?JSON.stringify(out,null,2):out.optimized_prompt)}
  function download(name:string,content:string,type:string){const blob=new Blob([content],{type});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();URL.revokeObjectURL(a.href);toastMsg('⬇️ Downloaded')}
  function downloadJSON(){if(!out)return;download('prompt-optimizer.json',JSON.stringify(out,null,2),'application/json')}
  function downloadTxt(){if(!out)return;download('optimized-prompt.txt',out.optimized_prompt,'text/plain')}
  function share(){const enc=(o:any)=>btoa(unescape(encodeURIComponent(JSON.stringify(o))));const url=location.origin+`/${localeUI}#state=`+enc({prompt,goal,reasoning,lang,role,ctype});navigator.clipboard.writeText(url);toastMsg('🔗 Share link copied')}

  const filteredRoles=roleQuery.trim()?ROLES.filter(r=>r.toLowerCase().includes(roleQuery.trim().toLowerCase())):ROLES
  const intent=out?.intent??'—'
  const wordCount = prompt.trim().split(/\s+/).filter(word => word.length > 0).length

  return(<div className="min-h-screen bg-gradient-to-b from-[color:var(--c-bg)] via-[color:var(--c-surface)] to-[color:var(--c-bg)]">
    <div className="header-blur"><div className="mx-auto container-narrow px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="relative">
          <img src="/icon.svg" className="h-9 w-9 rounded-xl shadow-lg" alt=""/>
          {loading && <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl opacity-75 blur animate-pulse"></div>}
        </div>
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{dict['app_title']}</h1>
          <p className="text-sm small">{dict['subtitle']}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <select className="select min-w-[180px]" value={localeUI} onChange={(e)=>{const loc=e.target.value;document.cookie=`po_locale=${loc}; path=/; max-age=31536000`;const segs=location.pathname.split('/').filter(Boolean);segs[0]=loc;location.href='/'+segs.join('/')}}><option value="en">🇺🇸 English</option><option value="es">🇪🇸 Español</option></select>
        <button className="b-pill hover:bg-blue-500/10 transition-colors" onClick={toggleTheme}>{theme==='dark'?'☀️ Light':'🌙 Dark'}</button>
      </div></div></div>

    <div className="mx-auto container-narrow px-4 sm:px-6 lg:px-8 py-6 grid gap-6 lg:grid-cols-2">
      <section className="card hover:shadow-lg transition-shadow duration-300">
        <div className="flex items-center justify-between mb-4">
          <h2 className="label uppercase text-blue-400">📝 {dict['input']}</h2>
          <div className="text-xs text-[color:var(--c-muted)]">{wordCount} words</div>
        </div>
        
        <label className="label" htmlFor="prompt">{dict['original_prompt']}</label>
        <div className="relative">
          <textarea 
            ref={taRef} 
            id="prompt" 
            className="w-full min-h-[220px] resize-y border border-[color:var(--c-border)] rounded-2xl bg-[color:var(--c-surface)] text-[color:var(--c-text)] p-4 text-[15px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200" 
            placeholder="e.g., Summarize this article in 5 bullet points using simple language..." 
            value={prompt} 
            onChange={e=>setPrompt(e.target.value)}
          />
          {prompt.length > 500 && <div className="absolute bottom-2 right-2 text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded">Long prompt detected</div>}
        </div>

        {/* Basic Settings */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="label">{dict['role']}</label>
            <div className="relative">
              <input 
                className="select pr-10" 
                list="roles" 
                placeholder="Search role..." 
                value={role} 
                onChange={e=>{setRole(e.target.value);setRoleQuery(e.target.value)}} 
              />
              <span className="absolute right-3 top-2.5 opacity-60">🔎</span>
            </div>
            <datalist id="roles">{filteredRoles.map(r=>(<option key={r} value={r}></option>))}</datalist>
          </div>
          
          <div>
            <label className="label">{dict['goal']}</label>
            <select className="select" value={goal} onChange={e=>setGoal(e.target.value as any)}>
              <option value="precision">🎯 Precision</option>
              <option value="brevity">⚡ Brevity</option>
              <option value="creativity">🎨 Creativity</option>
              <option value="safety">🛡️ Safety</option>
              <option value="speed">🚀 Speed</option>
            </select>
          </div>

          <div>
            <label className="label">{dict['language']}</label>
            <select className="select" value={lang} onChange={e=>setLang(e.target.value)}>
              {Array.from(new Map(LOCALES.map(l=>[l.group,[] as any[]])).keys()).map(g=>(
                <optgroup key={g} label={g}>
                  {LOCALES.filter(l=>l.group===g).map(l=>(
                    <option key={l.code} value={l.code}>{flagEmoji(l.code)} {l.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="mt-4">
          <button 
            className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
            onClick={()=>setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? '🔽' : '▶️'} Advanced Settings
          </button>
          
          {showAdvanced && (
            <div className="mt-3 grid gap-4 sm:grid-cols-2 p-4 bg-[color:var(--c-surface)]/50 rounded-xl border border-[color:var(--c-border)]/50">
              <div>
                <label className="label">{dict['content_type']}</label>
                <select className="select" value={ctype} onChange={e=>setCtype(e.target.value as any)}>
                  <option value="text">📝 Text</option>
                  <option value="video">🎬 Video</option>
                  <option value="image">🖼️ Image</option>
                  <option value="audio">🎧 Audio</option>
                  <option value="presentation">📑 Presentation</option>
                </select>
              </div>
              
              <div>
                <label className="label">{dict['reasoning']}</label>
                <select className="select" value={reasoning} onChange={e=>setReasoning(e.target.value as any)}>
                  <option value="low">🟢 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🔴 High</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Examples Section */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-[color:var(--c-text)]/90 flex items-center gap-2">
              ✨ {dict['examples']}
              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">{EXAMPLES.length}</span>
            </span>
            <div className="flex gap-2">
              <button 
                className="b-pill hover:bg-gray-500/20 transition-colors text-xs" 
                onClick={()=>setPage(p=>(p-1+(maxPage+1))%(maxPage+1))}
                disabled={maxPage === 0}
              >
                ← Prev
              </button>
              <span className="text-xs text-[color:var(--c-muted)] px-2 py-1">
                {page + 1} / {maxPage + 1}
              </span>
              <button 
                className="b-pill hover:bg-gray-500/20 transition-colors text-xs" 
                onClick={()=>setPage(p=>(p+1)%(maxPage+1))}
                disabled={maxPage === 0}
              >
                Next →
              </button>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {view.map((s,i)=>(
              <button 
                key={i} 
                className="example-card-compact hover:border-blue-400/50 hover:bg-blue-500/5 transition-all duration-200 text-left group" 
                onClick={()=>{setPrompt(s.text);taRef.current?.focus();toastMsg('📝 Example loaded')}}
              >
                <span className="example-title group-hover:text-blue-400 transition-colors">{s.title}</span>
                <span className="example-desc">{s.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 sticky bottom-4 bg-[color:var(--c-card)]/95 backdrop-blur-md rounded-2xl p-4 flex flex-wrap items-center gap-3 border border-[color:var(--c-border)] shadow-lg">
          <button 
            className="rounded-xl font-bold shadow-lg px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-none transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100" 
            onClick={generate}
            disabled={loading || !prompt.trim()}
          >
            {loading ? '⏳ Generating...' : `🚀 ${dict['generate']}`}
          </button>
          <button className="b-pill hover:bg-blue-500/10 transition-colors" onClick={share}>
            🔗 {dict['share_link']}
          </button>
          <button 
            className="b-pill hover:bg-red-500/10 transition-colors" 
            onClick={()=>{setPrompt('');setOut(null);toastMsg('🗑️ Reset complete')}}
          >
            🗑️ {dict['reset']}
          </button>
          <span className="text-xs text-[color:var(--c-muted)] ml-auto">
            🔒 All data stays in your browser
          </span>
        </div>
      </section>

      {/* Output Section */}
      <section className="card hover:shadow-lg transition-shadow duration-300">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <h2 className="label uppercase text-purple-400 mb-0">⚡ {dict['output']}</h2>
            <span className="text-xs bg-gray-500/20 px-2 py-1 rounded-full">
              Intent: <strong className="text-blue-400">{intent}</strong>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-[color:var(--c-surface)] border border-[color:var(--c-border)] rounded-xl p-1 gap-1">
              <button 
                className={`tab transition-all duration-200 ${tab==='json' ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-gray-500/10'}`} 
                aria-selected={tab==='json'} 
                onClick={()=>setTab('json')}
              >
                📋 {dict['json']}
              </button>
              <button 
                className={`tab transition-all duration-200 ${tab==='prompt' ? 'bg-purple-500/20 text-purple-400' : 'hover:bg-gray-500/10'}`} 
                aria-selected={tab==='prompt'} 
                onClick={()=>setTab('prompt')}
              >
                ✨ {dict['optimized_prompt']}
              </button>
            </div>
            <button className="b-pill hover:bg-green-500/10 transition-colors" onClick={copyCurrent} disabled={!out}>
              📋 Copy
            </button>
            <button className="b-pill hover:bg-blue-500/10 transition-colors" onClick={downloadJSON} disabled={!out}>
              💾 JSON
            </button>
            <button className="b-pill hover:bg-blue-500/10 transition-colors" onClick={downloadTxt} disabled={!out}>
              📄 .txt
            </button>
            <button className="b-pill hover:bg-purple-500/10 transition-colors" onClick={()=>setFull(true)} disabled={!out}>
              🔍 Expand
            </button>
          </div>
        </div>

        {/* Metadata chips */}
        {out && (
          <div className="mb-4 flex flex-wrap gap-2 text-xs">
            <span className="chip bg-blue-500/20 text-blue-400">👤 {role}</span>
            <span className="chip bg-green-500/20 text-green-400">📁 {ctype}</span>
            <span className="chip bg-yellow-500/20 text-yellow-400">{flagEmoji(lang)} {lang}</span>
            <span className="chip bg-purple-500/20 text-purple-400">🎯 {goal}</span>
            <span className="chip bg-red-500/20 text-red-400">🧠 {reasoning}</span>
            {out.metadata && (
              <>
                <span className="chip bg-gray-500/20 text-gray-400">📏 {out.metadata.optimized_length} chars</span>
                <span className="chip bg-orange-500/20 text-orange-400">🔬 {out.metadata.complexity_score}/100</span>
                <span className="chip bg-cyan-500/20 text-cyan-400">✨ {out.metadata.clarity_score}/100</span>
              </>
            )}
          </div>
        )}

        {/* Output Content */}
        {!out && !loading && (
          <div className="border-2 border-dashed border-[color:var(--c-border)] rounded-xl p-8 text-center bg-[color:var(--c-surface)]/30">
            <div className="text-4xl mb-4">🎯</div>
            <div className="font-semibold mb-4 text-lg">Ready to optimize your prompt!</div>
            <ul className="text-sm text-[color:var(--c-text)]/80 space-y-2 text-left max-w-md mx-auto">
              <li className="flex items-center gap-2">📝 Paste your prompt or pick an example</li>
              <li className="flex items-center gap-2">⚙️ Configure role, content type, and language</li>
              <li className="flex items-center gap-2">🚀 Click Generate to see optimized results</li>
            </ul>
          </div>
        )}

        {loading && (
          <div className="border border-[color:var(--c-border)] rounded-xl p-8 text-center bg-[color:var(--c-surface)]">
            <div className="animate-spin text-4xl mb-4">⚡</div>
            <div className="font-semibold mb-2">Optimizing your prompt...</div>
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700 max-w-xs mx-auto">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
            </div>
          </div>
        )}

        {out && !loading && (
          <div className="space-y-4">
            {/* Constraints */}
            {out.constraints && out.constraints.length > 0 && (
              <div className="bg-[color:var(--c-surface)]/50 rounded-xl p-4 border border-[color:var(--c-border)]/50">
                <div className="text-sm font-semibold mb-2 text-yellow-400">🔧 Constraints Applied:</div>
                <ul className="text-xs space-y-1">
                  {out.constraints.map((constraint, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-yellow-400 mt-0.5">•</span>
                      <span className="text-[color:var(--c-muted)]">{constraint}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Main Output */}
            <pre className="border border-[color:var(--c-border)] rounded-xl p-4 text-[13px] leading-6 max-h-[520px] overflow-auto bg-[color:var(--c-surface)] hover:border-blue-400/50 transition-colors duration-200" style={{whiteSpace:'pre-wrap',wordBreak:'break-word',overflowWrap:'anywhere'}}>
              {tab==='json'?JSON.stringify(out,null,2):out.optimized_prompt}
            </pre>

            {/* Examples if available */}
            {out.examples && out.examples.length > 0 && (
              <div className="bg-[color:var(--c-surface)]/50 rounded-xl p-4 border border-[color:var(--c-border)]/50">
                <div className="text-sm font-semibold mb-2 text-green-400">💡 Usage Examples:</div>
                <div className="text-xs space-y-2">
                  {out.examples.map((example, i) => (
                    <div key={i} className="bg-[color:var(--c-card)] p-2 rounded border border-[color:var(--c-border)]/30">
                      <code className="text-green-400">{example}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Full Screen Modal */}
        {full && out && (
          <div className="output-full backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="text-lg font-semibold">Viewing {tab.toUpperCase()}</div>
                <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-sm">Full Screen</span>
              </div>
              <button className="b-pill hover:bg-red-500/10 transition-colors" onClick={()=>setFull(false)}>
                ❌ Close
              </button>
            </div>
            <pre className="border border-[color:var(--c-border)] rounded-xl p-6 text-[14px] leading-7 h-[calc(100%-80px)] overflow-auto bg-[color:var(--c-surface)] resize-none">
              {tab==='json'?JSON.stringify(out,null,2):out.optimized_prompt}
            </pre>
          </div>
        )}
      </section>
    </div>

    {/* Footer */}
    <footer className="mx-auto container-narrow px-4 sm:px-6 lg:px-8 mt-12 mb-8 border-t border-[color:var(--c-border)]/30 pt-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-sm">
        <div className="flex items-center gap-3">
          <img src="/icon.svg" alt="" className="h-8 w-8 rounded-lg shadow"/>
          <div>
            <div className="font-semibold">{dict['app_title']}</div>
            <div className="text-xs text-[color:var(--c-muted)]">Professional prompt optimization</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <a className="text-blue-400 hover:text-blue-300 underline-offset-4 hover:underline transition-colors flex items-center gap-1" href="https://jorgejrolo.com/ia/json-prompts/" target="_blank" rel="noopener">
            📚 JSON prompts guide
          </a>
          <a className="text-blue-400 hover:text-blue-300 underline-offset-4 hover:underline transition-colors flex items-center gap-1" href="https://cookbook.openai.com/examples/gpt-5/gpt-5_prompting_guide" target="_blank" rel="noopener">
            🎯 Prompting best practices
          </a>
          <a className="b-pill bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 border-blue-400/30 transition-all duration-200" href="https://jorgejrolo.com/" target="_blank" rel="noopener">
            Made with ❤️ by <strong>Jorge J. Rolo</strong>
          </a>
        </div>
      </div>
    </footer>

    {/* Toast Notification */}
    {toast && (
      <div className="toast animate-bounce">
        <div className="flex items-center gap-2">
          <span>{toast}</span>
        </div>
      </div>
    )}
  </div>)
