function toastMsg(m: string) {
    setToast(m)
    setTimeout(() => setToast(''), 2500)
  }

  function updateRecentRoles(selectedRole: string) {
    setRecentRoles(prev => {
      const filtered = prev.filter(r => r !== selectedRole)
      return [selectedRole, ...filtered].slice(0, 5)
    })
  }

  async function generate() {
    if (!prompt.trim()) {
      setError(localeUI === 'es' ? 'Por favor ingresa un prompt primero' : 'Please enter a prompt first')
      setTimeout(() => setError(''), 3000)
      return
    }
    
    setIsGenerating(true)
    setError('')
    setProgress(0)
    
    try {
      // Simular progreso con pasos ToT
      const progressSteps = [15, 30, 50, 70, 90, 100]
      for (const step of progressSteps) {
        setProgress(step)
        await new Promise(resolve => setTimeout(resolve, 300))
      }
      
      const result = optimizePrompt(prompt, {
        defaultLanguage: lang,
        objective: goal,
        reasoning,
        role,
        contentType: ctype
      })
      
      setOut(result)
      updateRecentRoles(role)
      
      // Add to history
      setHistory(prev => [result, ...prev].slice(0, 10))
      
      toastMsg(localeUI === 'es' ? '🌳 ¡Tree of Thoughts completado!' : '🌳 Tree of Thoughts completed!')
    } catch (error) {
      console.error('Generation failed:', error)
      setError(localeUI === 'es' ? 'Error al generar el prompt' : 'Error generating prompt')
    } finally {
      setIsGenerating(false)
      setProgress(0)
    }
  }

  function copy(text: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text)
      toastMsg(localeUI === 'es' ? '📋 Copiado al portapapeles' : '📋 Copied to clipboard')
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
    toastMsg(localeUI === 'es' ? '💾 Archivo descargado' : '💾 File downloaded')
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
    toastMsg(localeUI === 'es' ? '🔗 Enlace copiado' : '🔗 Link copied')
  }

  const filteredRoles = roleQuery.trim() ? 
    ROLES.filter(r => r.toLowerCase().includes(roleQuery.trim().toLowerCase())) : 
    ROLES
  
  const intent = out?.intent ?? '—'

  // Clean paste function
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    const cleanText = text.replace(/\u00A0/g, ' ').trim()
    
    const textarea = e.target as HTMLTextAreaElement
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newValue = prompt.substring(0, start) + cleanText + prompt.substring(end)
    
    setPrompt(newValue)
    
    // Set cursor position after paste
    setTimeout(() => {
      textarea.setSelectionRange(start + cleanText.length, start + cleanText.length)
    }, 0)
  }, [prompt])

  return (
    <div>
      <div className="header-blur">
        <div className="mx-auto container-narrow px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src="/icon.svg" className="h-9 w-9 rounded-xl" alt=""/>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{dict['app_title']}</h1>
                <span className="text-xs bg-gradient-to-r from-cyan-500/20 to-green-500/20 text-cyan-400 px-2 py-1 rounded-full border border-cyan-500/30 font-semibold">
                  🌳 ToT
                </span>
              </div>
              <p className="text-sm small">{dict['subtitle']}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              className="b-pill hover:bg-blue-500/10 transition-colors relative"
              onClick={() => setShowHistory(!showHistory)}
            >
              📚 {localeUI === 'es' ? 'Historial' : 'History'}
              {history.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {history.length}
                </span>
              )}
            </button>
            <select 
              className="select min-w-[160px]" 
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
            <button className="b-pill hover:bg-blue-500/10 transition-colors" onClick={toggleTheme}>
              {theme === 'dark' ? (localeUI === 'es' ? '☀️ Claro' : '☀️ Light') : (localeUI === 'es' ? '🌙 Oscuro' : '🌙 Dark')}
            </button>
          </div>
        </div>
      </div>

      {/* History Sidebar */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex">
          <div className="w-96 bg-[color:var(--c-surface)] border-r border-[color:var(--c-border)] p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">📚 {localeUI === 'es' ? 'Historial' : 'History'}</h2>
              <button 
                className="b-pill hover:bg-red-500/10"
                onClick={() => setShowHistory(false)}
              >
                ❌ {localeUI === 'es' ? 'Cerrar' : 'Close'}
              </button>
            </div>
            {history.length === 0 ? (
              <div className="text-center text-[color:var(--c-muted)] py-8">
                <div className="text-4xl mb-4">📝</div>
                <p>{localeUI === 'es' ? 'No hay historial aún' : 'No history yet'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item, i) => (
                  <div 
                    key={i}
                    className="bg-[color:var(--c-card)] border border-[color:var(--c-border)] rounded-xl p-4 cursor-pointer hover:border-blue-400/50 transition-colors"
                    onClick={() => {
                      setOut(item)
                      setShowHistory(false)
                      toastMsg(localeUI === 'es' ? '📋 Historial cargado' : '📋 History loaded')
                    }}
                  >
                    <div className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
                      {item.intent}
                      {item.tot_analysis && (
                        <span className="text-xs bg-cyan-500/20 text-cyan-400 px-1 py-0.5 rounded">ToT</span>
                      )}
                    </div>
                    <div className="text-xs text-[color:var(--c-muted)] mb-2 line-clamp-2">
                      {item.optimized_prompt.substring(0, 100)}...
                    </div>
                    <div className="flex gap-2 text-xs">
                      <span className="chip bg-gray-500/20 text-gray-400">📏 {out.metadata.optimized_length} chars</span>
                  <span className="chip bg-orange-500/20 text-orange-400">🔬 {out.metadata.complexity_score}/100</span>
                  <span className="chip bg-cyan-500/20 text-cyan-400">✨ {out.metadata.clarity_score}/100</span>
                  {out.tot_analysis && (
                    <span className="chip bg-gradient-to-r from-cyan-500/20 to-green-500/20 text-cyan-400">
                      🌳 ToT {out.metadata.tot_exploration_paths} paths
                    </span>
                  )}
                </>
              )}
            </div>
          )}

          {/* Tree of Thoughts Analysis */}
          {out && out.tot_analysis && (
            <div className="mb-4 bg-[color:var(--c-surface)]/30 rounded-xl p-4 border border-[color:var(--c-border)]/50">
              <div className="text-sm font-semibold mb-3 text-cyan-400 flex items-center gap-2">
                🌳 {localeUI === 'es' ? 'Análisis Tree of Thoughts' : 'Tree of Thoughts Analysis'}
                <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded">
                  {localeUI === 'es' ? 'IA Avanzada' : 'Advanced AI'}
                </span>
              </div>
              
              {/* ToT Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-xs">
                <div className="bg-[color:var(--c-card)] p-2 rounded border border-cyan-500/20">
                  <div className="text-cyan-400 font-semibold">🛤️ {localeUI === 'es' ? 'Caminos' : 'Paths'}</div>
                  <div className="text-lg font-bold">{out.metadata.tot_exploration_paths}</div>
                </div>
                <div className="bg-[color:var(--c-card)] p-2 rounded border border-green-500/20">
                  <div className="text-green-400 font-semibold">🎯 {localeUI === 'es' ? 'Confianza' : 'Confidence'}</div>
                  <div className="text-lg font-bold">{(out.metadata.best_path_confidence * 100).toFixed(0)}%</div>
                </div>
                <div className="bg-[color:var(--c-card)] p-2 rounded border border-purple-500/20">
                  <div className="text-purple-400 font-semibold">🧠 {localeUI === 'es' ? 'Profundidad' : 'Depth'}</div>
                  <div className="text-lg font-bold">{out.metadata.reasoning_depth}</div>
                </div>
                <div className="bg-[color:var(--c-card)] p-2 rounded border border-orange-500/20">
                  <div className="text-orange-400 font-semibold">⚡ {localeUI === 'es' ? 'Calidad' : 'Quality'}</div>
                  <div className="text-lg font-bold">{out.metadata.clarity_score}/100</div>
                </div>
              </div>

              {/* Evaluation Summary */}
              <div className="mb-3">
                <div className="text-xs text-[color:var(--c-muted)] mb-2 font-semibold">
                  📋 {localeUI === 'es' ? 'Resumen de Evaluación:' : 'Evaluation Summary:'}
                </div>
                <div className="text-xs text-[color:var(--c-text)] bg-[color:var(--c-card)] p-3 rounded border border-[color:var(--c-border)]/30">
                  {out.tot_analysis.evaluation_summary}
                </div>
              </div>

              {/* Alternative Approaches */}
              {out.tot_analysis.alternative_approaches.length > 0 && (
                <div>
                  <div className="text-xs text-[color:var(--c-muted)] mb-2 font-semibold">
                    🔄 {localeUI === 'es' ? 'Enfoques Alternativos Explorados:' : 'Alternative Approaches Explored:'}
                  </div>
                  <div className="space-y-1">
                    {out.tot_analysis.alternative_approaches.slice(0, 2).map((approach, i) => (
                      <div key={i} className="text-xs text-[color:var(--c-muted)] bg-[color:var(--c-card)] p-2 rounded border border-[color:var(--c-border)]/20">
                        {approach.length > 100 ? `${approach.substring(0, 100)}...` : approach}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Enhanced Comparison View */}
          {out && prompt && (
            <div className="mb-4 bg-[color:var(--c-surface)]/30 rounded-xl p-4 border border-[color:var(--c-border)]/50">
              <div className="text-sm font-semibold mb-3 text-green-400 flex items-center gap-2">
                📊 {localeUI === 'es' ? 'Comparación Antes/Después' : 'Before/After Comparison'}
                {out.tot_analysis && (
                  <span className="text-xs bg-gradient-to-r from-cyan-500/20 to-green-500/20 text-cyan-400 px-2 py-1 rounded">
                    ToT {localeUI === 'es' ? 'Optimizado' : 'Optimized'}
                  </span>
                )}
              </div>
              <div className="grid gap-4 md:grid-cols-2 text-xs">
                <div>
                  <div className="text-[color:var(--c-muted)] mb-2 flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-500/30 rounded"></span>
                    {localeUI === 'es' ? 'Original' : 'Original'} ({prompt.length} chars, {prompt.trim().split(/\s+/).length} words)
                  </div>
                  <div className="bg-[color:var(--c-card)] p-3 rounded border border-red-500/20 max-h-24 overflow-y-auto">
                    {prompt.substring(0, 200)}{prompt.length > 200 && '...'}
                  </div>
                </div>
                <div>
                  <div className="text-[color:var(--c-muted)] mb-2 flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500/30 rounded"></span>
                    {localeUI === 'es' ? 'Optimizado' : 'Optimized'} ({out.metadata.optimized_length} chars, {out.optimized_prompt.trim().split(/\s+/).length} words)
                  </div>
                  <div className="bg-[color:var(--c-card)] p-3 rounded border border-green-500/20 max-h-24 overflow-y-auto">
                    {out.optimized_prompt.substring(0, 200)}{out.optimized_prompt.length > 200 && '...'}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-center gap-4 text-xs">
                <span className={`px-2 py-1 rounded ${
                  out.metadata.optimized_length > prompt.length 
                    ? 'bg-blue-500/20 text-blue-400' 
                    : 'bg-green-500/20 text-green-400'
                }`}>
                  {out.metadata.optimized_length > prompt.length 
                    ? `+${out.metadata.optimized_length - prompt.length} chars (${localeUI === 'es' ? 'más detallado' : 'more detailed'})`
                    : `${prompt.length - out.metadata.optimized_length} chars ${localeUI === 'es' ? 'reducidos' : 'saved'}`
                  }
                </span>
                {out.tot_analysis && (
                  <span className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-400">
                    🌳 {out.metadata.tot_exploration_paths} {localeUI === 'es' ? 'caminos explorados' : 'paths explored'}
                  </span>
                )}
              </div>
            </div>
          )}

          {!out && !isGenerating && (
            <div className="border-2 border-dashed border-[color:var(--c-border)] rounded-xl p-8 text-center bg-[color:var(--c-surface)]/30">
              <div className="text-4xl mb-4">🌳</div>
              <div className="font-semibold mb-4 text-lg">{localeUI === 'es' ? '¡Tree of Thoughts está listo!' : 'Tree of Thoughts is ready!'}</div>
              <div className="mb-4 text-sm bg-gradient-to-r from-cyan-500/10 to-blue-500/10 px-4 py-3 rounded-lg border border-cyan-500/20">
                <div className="font-semibold text-cyan-400 mb-2">
                  {localeUI === 'es' ? '🧠 IA Avanzada habilitada' : '🧠 Advanced AI enabled'}
                </div>
                <div className="text-xs text-[color:var(--c-muted)]">
                  {localeUI === 'es' 
                    ? 'Este optimizador utiliza Tree of Thoughts para explorar múltiples estrategias de optimización y seleccionar la mejor.'
                    : 'This optimizer uses Tree of Thoughts to explore multiple optimization strategies and select the best one.'
                  }
                </div>
              </div>
              <ul className="text-sm text-[color:var(--c-text)]/80 space-y-2 text-left max-w-md mx-auto">
                <li className="flex items-center gap-2">🌱 {localeUI === 'es' ? 'Explora múltiples caminos de optimización' : 'Explores multiple optimization paths'}</li>
                <li className="flex items-center gap-2">🎯 {localeUI === 'es' ? 'Evalúa confianza de cada estrategia' : 'Evaluates confidence of each strategy'}</li>
                <li className="flex items-center gap-2">🧠 {localeUI === 'es' ? 'Aplica razonamiento deliberativo' : 'Applies deliberate reasoning'}</li>
                <li className="flex items-center gap-2">⚡ {localeUI === 'es' ? 'Selecciona automáticamente la mejor optimización' : 'Automatically selects the best optimization'}</li>
                <li className="flex items-center gap-2">⌨️ {localeUI === 'es' ? 'Usa Ctrl+Enter para generar rápidamente' : 'Use Ctrl+Enter for quick generation'}</li>
              </ul>
            </div>
          )}

          {isGenerating && (
            <div className="border-2 border-dashed border-cyan-400/50 rounded-xl p-8 text-center bg-gradient-to-br from-cyan-500/5 to-blue-500/5">
              <div className="text-4xl mb-4 animate-bounce-gentle">🌳</div>
              <div className="font-semibold mb-4 text-lg text-cyan-400">
                {localeUI === 'es' ? '🌳 Tree of Thoughts procesando...' : '🌳 Tree of Thoughts processing...'}
              </div>
              <div className="text-sm text-[color:var(--c-muted)] space-y-2">
                <div className={`transition-opacity duration-500 ${progress >= 15 ? 'opacity-100' : 'opacity-40'}`}>
                  🌱 {localeUI === 'es' ? 'Generando pensamientos iniciales' : 'Generating initial thoughts'}
                </div>
                <div className={`transition-opacity duration-500 ${progress >= 30 ? 'opacity-100' : 'opacity-40'}`}>
                  🌿 {localeUI === 'es' ? 'Explorando caminos alternativos' : 'Exploring alternative paths'}
                </div>
                <div className={`transition-opacity duration-500 ${progress >= 50 ? 'opacity-100' : 'opacity-40'}`}>
                  🌳 {localeUI === 'es' ? 'Evaluando confianza de cada camino' : 'Evaluating path confidence'}
                </div>
                <div className={`transition-opacity duration-500 ${progress >= 70 ? 'opacity-100' : 'opacity-40'}`}>
                  🎯 {localeUI === 'es' ? 'Seleccionando mejor estrategia' : 'Selecting best strategy'}
                </div>
                <div className={`transition-opacity duration-500 ${progress >= 90 ? 'opacity-100' : 'opacity-40'}`}>
                  ⚡ {localeUI === 'es' ? 'Refinando optimización final' : 'Refining final optimization'}
                </div>
                <div className={`transition-opacity duration-500 ${progress >= 100 ? 'opacity-100' : 'opacity-40'}`}>
                  ✨ {localeUI === 'es' ? 'Aplicando mejoras Tree of Thoughts' : 'Applying Tree of Thoughts enhancements'}
                </div>
              </div>
              
              {progress > 30 && (
                <div className="mt-4 text-xs text-cyan-400 bg-cyan-500/10 px-3 py-2 rounded-lg border border-cyan-500/20">
                  {localeUI === 'es' ? 
                    '💡 Explorando múltiples estrategias de optimización simultáneamente...' : 
                    '💡 Exploring multiple optimization strategies simultaneously...'
                  }
                </div>
              )}
            </div>
          )}

          {out && (
            <div className="space-y-4">
              {out.constraints && out.constraints.length > 0 && (
                <div className="bg-[color:var(--c-surface)]/50 rounded-xl p-4 border border-[color:var(--c-border)]/50">
                  <div className="text-sm font-semibold mb-2 text-yellow-400">🔧 {localeUI === 'es' ? 'Restricciones Aplicadas:' : 'Constraints Applied:'}</div>
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
              
              <pre 
                className="border border-[color:var(--c-border)] rounded-xl p-4 text-[13px] leading-6 max-h-[500px] overflow-auto bg-[color:var(--c-surface)] hover:border-blue-400/50 transition-colors duration-200" 
                style={{whiteSpace:'pre-wrap',wordBreak:'break-word',overflowWrap:'anywhere'}}
              >
                {tab === 'json' ? JSON.stringify(out, null, 2) : out.optimized_prompt}
              </pre>
              
              {out.examples && out.examples.length > 0 && (
                <div className="bg-[color:var(--c-surface)]/50 rounded-xl p-4 border border-[color:var(--c-border)]/50">
                  <div className="text-sm font-semibold mb-2 text-green-400">💡 {localeUI === 'es' ? 'Ejemplos de Uso:' : 'Usage Examples:'}</div>
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

          {full && out && (
            <div className="output-full backdrop-blur-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="text-lg font-semibold">{localeUI === 'es' ? 'Visualizando' : 'Viewing'} {tab.toUpperCase()}</div>
                  <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-sm">{localeUI === 'es' ? 'Pantalla Completa' : 'Full Screen'}</span>
                  {out.tot_analysis && (
                    <span className="bg-gradient-to-r from-cyan-500/20 to-green-500/20 text-cyan-400 px-2 py-1 rounded text-sm border border-cyan-500/30">
                      🌳 ToT Enhanced
                    </span>
                  )}
                </div>
                <button className="b-pill hover:bg-red-500/10 transition-colors" onClick={() => setFull(false)}>
                  ❌ {localeUI === 'es' ? 'Cerrar' : 'Close'}
                </button>
              </div>
              <pre className="border border-[color:var(--c-border)] rounded-xl p-6 text-[14px] leading-7 h-[calc(100%-80px)] overflow-auto bg-[color:var(--c-surface)] resize-none">
                {tab === 'json' ? JSON.stringify(out, null, 2) : out.optimized_prompt}
              </pre>
            </div>
          )}
        </section>
      </div>

      <footer className="mx-auto container-narrow px-4 sm:px-6 lg:px-8 mt-12 mb-8 border-t border-[color:var(--c-border)]/30 pt-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-sm">
          <div className="flex items-center gap-3">
            <img src="/icon.svg" alt="" className="h-8 w-8 rounded-lg shadow"/>
            <div>
              <div className="font-semibold flex items-center gap-2">
                {dict['app_title']}
                <span className="text-xs bg-gradient-to-r from-cyan-500/20 to-green-500/20 text-cyan-400 px-2 py-1 rounded border border-cyan-500/30">
                  🌳 ToT Powered
                </span>
              </div>
              <div className="text-xs text-[color:var(--c-muted)]">{localeUI === 'es' ? 'Optimización avanzada con Tree of Thoughts' : 'Advanced optimization with Tree of Thoughts'}</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <a className="text-blue-400 hover:text-blue-300 underline-offset-4 hover:underline transition-colors flex items-center gap-1" href="https://jorgejrolo.com/ia/json-prompts/" target="_blank" rel="noopener">
              📚 {localeUI === 'es' ? 'Guía de JSON prompts' : 'JSON prompts guide'}
            </a>
            <a className="text-blue-400 hover:text-blue-300 underline-offset-4 hover:underline transition-colors flex items-center gap-1" href="https://www.promptingguide.ai/techniques/tot" target="_blank" rel="noopener">
              🌳 {localeUI === 'es' ? 'Sobre Tree of Thoughts' : 'About Tree of Thoughts'}
            </a>
            <a className="b-pill bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 border-blue-400/30 transition-all duration-200" href="https://jorgejrolo.com/" target="_blank" rel="noopener">
              {localeUI === 'es' ? 'Hecho con' : 'Made with'} ❤️ {localeUI === 'es' ? 'por' : 'by'} <strong>Jorge J. Rolo</strong>
            </a>
          </div>
        </div>
      </footer>

      {/* Enhanced Toast */}
      {toast && (
        <div className="toast animate-slide-in">
          <div className="flex items-center gap-2">
            <span>{toast}</span>
          </div>
        </div>
      )}
    </div>
  )
}">{item.parameters.role}</span>
                      <span className="chip">{item.parameters.objective}</span>
                      {item.tot_analysis && (
                        <span className="chip bg-cyan-500/20 text-cyan-400">
                          🌳 {item.metadata.tot_exploration_paths} paths
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                <button 
                  className="w-full b-pill hover:bg-red-500/10 text-center"
                  onClick={() => {
                    setHistory([])
                    toastMsg(localeUI === 'es' ? '🗑️ Historial limpiado' : '🗑️ History cleared')
                  }}
                >
                  🗑️ {localeUI === 'es' ? 'Limpiar historial' : 'Clear history'}
                </button>
              </div>
            )}
          </div>
          <div className="flex-1" onClick={() => setShowHistory(false)}></div>
        </div>
      )}

      <div className="mx-auto container-narrow px-4 sm:px-6 lg:px-8 py-6 grid gap-6 lg:grid-cols-2">
        <section className="card hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="label uppercase text-blue-400">{dict['input']}</h2>
            <div className="flex items-center gap-3 text-xs text-[color:var(--c-muted)]">
              <span className={`px-2 py-1 rounded ${charCount > 1000 ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                {charCount} chars
              </span>
              <span className="px-2 py-1 rounded bg-green-500/20 text-green-400">
                {wordCount} words
              </span>
              <kbd className="px-2 py-1 bg-[color:var(--c-surface)] border border-[color:var(--c-border)] rounded text-xs">
                Ctrl+Enter
              </kbd>
            </div>
          </div>
          
          <label className="label" htmlFor="prompt">{dict['original_prompt']}</label>
          <div className="relative">
            <textarea 
              ref={taRef} 
              id="prompt" 
              className={`w-full min-h-[200px] resize-none border rounded-2xl bg-[color:var(--c-surface)] text-[color:var(--c-text)] p-4 text-[15px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200 ${
                charCount > 1000 ? 'border-orange-400' : 'border-[color:var(--c-border)]'
              }`}
              placeholder={localeUI === 'es' ? 'Escribe tu prompt aquí... (Ctrl+K para enfocar)' : 'Write your prompt here... (Ctrl+K to focus)'} 
              value={prompt} 
              onChange={e => setPrompt(e.target.value)}
              onPaste={handlePaste}
            />
            {charCount > 1000 && (
              <div className="absolute bottom-2 right-2 text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded">
                ⚠️ {localeUI === 'es' ? 'Prompt muy largo' : 'Very long prompt'}
              </div>
            )}
            {error && (
              <div className="absolute top-full left-0 right-0 mt-2 text-xs bg-red-500/20 text-red-400 px-3 py-2 rounded border border-red-500/30">
                ❌ {error}
              </div>
            )}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {/* Enhanced Role Selector */}
            <div className="sm:col-span-2 lg:col-span-1 xl:col-span-2">
              <label className="label flex items-center justify-between">
                {dict['role']}
                <span className="text-xs font-normal opacity-60">
                  {ROLES.length} {localeUI === 'es' ? 'disponibles' : 'available'}
                </span>
              </label>
              <div className="relative" ref={roleDropdownRef}>
                <button 
                  className="select w-full pr-10 text-left flex items-center justify-between hover:border-blue-400 transition-colors" 
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                >
                  <span className="truncate">{role}</span>
                  <span className="opacity-60 transition-transform duration-200" style={{transform: showRoleDropdown ? 'rotate(180deg)' : 'rotate(0deg)'}}>▼</span>
                </button>
                
                {showRoleDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[color:var(--c-surface)] border border-[color:var(--c-border)] rounded-xl shadow-xl max-h-80 overflow-hidden z-20">
                    <div className="p-3 border-b border-[color:var(--c-border)]">
                      <input 
                        className="w-full px-3 py-2 bg-[color:var(--c-card)] border border-[color:var(--c-border)] rounded-lg text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                        placeholder={localeUI === 'es' ? '🔍 Buscar rol...' : '🔍 Search role...'}
                        value={roleQuery}
                        onChange={e => setRoleQuery(e.target.value)}
                        autoFocus
                      />
                    </div>
                    
                    {/* Recent Roles */}
                    {recentRoles.length > 0 && !roleQuery && (
                      <div className="p-2 border-b border-[color:var(--c-border)]">
                        <div className="text-xs font-semibold text-[color:var(--c-muted)] mb-2 px-2">
                          🕒 {localeUI === 'es' ? 'Recientes' : 'Recent'}
                        </div>
                        {recentRoles.map(r => (
                          <button 
                            key={r} 
                            className="w-full px-3 py-2 text-left text-sm hover:bg-blue-500/10 transition-colors rounded flex items-center gap-2"
                            onClick={() => {
                              setRole(r)
                              setRoleQuery('')
                              setShowRoleDropdown(false)
                            }}
                          >
                            <span className="text-blue-400">⭐</span>
                            {r}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    <div className="max-h-48 overflow-y-auto">
                      {!roleQuery ? (
                        // Show categorized roles
                        Object.entries(ROLE_CATEGORIES).map(([category, roles]) => (
                          <div key={category}>
                            <div className="text-xs font-semibold text-[color:var(--c-muted)] px-3 py-2 bg-[color:var(--c-card)]/50">
                              {category}
                            </div>
                            {roles.map(r => (
                              <button 
                                key={r} 
                                className="w-full px-3 py-2 text-left text-sm hover:bg-[color:var(--c-card)] transition-colors border-l-2 border-transparent hover:border-blue-400"
                                onClick={() => {
                                  setRole(r)
                                  setRoleQuery('')
                                  setShowRoleDropdown(false)
                                }}
                              >
                                {r}
                              </button>
                            ))}
                          </div>
                        ))
                      ) : (
                        // Show filtered results
                        filteredRoles.length > 0 ? filteredRoles.map(r => (
                          <button 
                            key={r} 
                            className="w-full px-3 py-2 text-left text-sm hover:bg-[color:var(--c-card)] transition-colors"
                            onClick={() => {
                              setRole(r)
                              setRoleQuery('')
                              setShowRoleDropdown(false)
                            }}
                          >
                            <span dangerouslySetInnerHTML={{
                              __html: r.replace(new RegExp(`(${roleQuery})`, 'gi'), '<mark class="bg-blue-500/30 text-blue-400">$1</mark>')
                            }} />
                          </button>
                        )) : (
                          <div className="px-3 py-4 text-sm text-[color:var(--c-muted)] text-center">
                            {localeUI === 'es' ? 'No se encontraron roles' : 'No roles found'}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="small mt-1">{localeUI === 'es' ? 'Seleccionar un rol dará forma al prompt optimizado.' : 'Selecting a role will shape the optimized prompt.'}</div>
            </div>
            
            <div>
              <label className="label">{dict['content_type']}</label>
              <select className="select" value={ctype} onChange={e => setCtype(e.target.value as any)}>
                {localizedOptions.contentTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
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
                {localizedOptions.goals.map(g => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">{dict['reasoning']}</label>
              <select className="select" value={reasoning} onChange={e => setReasoning(e.target.value as any)}>
                {localizedOptions.reasoning.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-[color:var(--c-text)]/90 flex items-center gap-2">
                ✨ {dict['examples']}
                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">{EXAMPLES.length}</span>
              </span>
              <div className="flex gap-2">
                <button 
                  className="b-pill hover:bg-gray-500/20 transition-colors text-xs" 
                  onClick={() => setPage(p => (p-1+(maxPage+1))%(maxPage+1))}
                  disabled={maxPage === 0}
                >
                  ← {localeUI === 'es' ? 'Ant' : 'Prev'}
                </button>
                <span className="text-xs text-[color:var(--c-muted)] px-2 py-1">
                  {page + 1} / {maxPage + 1}
                </span>
                <button 
                  className="b-pill hover:bg-gray-500/20 transition-colors text-xs" 
                  onClick={() => setPage(p => (p+1)%(maxPage+1))}
                  disabled={maxPage === 0}
                >
                  {localeUI === 'es' ? 'Sig' : 'Next'} →
                </button>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {view.map((s,i) => (
                <button 
                  key={i} 
                  className="example-card-compact hover:border-blue-400/50 hover:bg-blue-500/5 transition-all duration-200 text-left group" 
                  onClick={() => {
                    setPrompt(s.text)
                    taRef.current?.focus()
                    toastMsg(localeUI === 'es' ? '📝 Ejemplo cargado' : '📝 Example loaded')
                  }}
                >
                  <span className="example-title group-hover:text-blue-400 transition-colors">{s.title}</span>
                  <span className="example-desc">{s.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 sticky bottom-4 bg-[color:var(--c-card)]/95 backdrop-blur-md rounded-2xl p-4 border border-[color:var(--c-border)] shadow-lg">
            {/* Progress Bar */}
            {isGenerating && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-cyan-400">🌳 {localeUI === 'es' ? 'Tree of Thoughts activo...' : 'Tree of Thoughts active...'}</span>
                  <span className="text-[color:var(--c-muted)]">{progress}%</span>
                </div>
                <div className="w-full bg-[color:var(--c-surface)] rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-cyan-500 to-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            <div className="flex flex-wrap items-center gap-3">
              <button 
                className={`rounded-xl font-bold shadow-lg px-6 py-3 border-none transition-all duration-200 transform disabled:opacity-50 disabled:hover:scale-100 ${
                  isGenerating 
                    ? 'bg-gray-500 text-white cursor-not-allowed' 
                    : 'bg-gradient-to-r from-cyan-500 to-green-500 hover:from-cyan-600 hover:to-green-600 text-white hover:scale-105'
                }`}
                onClick={generate}
                disabled={!prompt.trim() || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <span className="animate-spin inline-block mr-2">🌳</span>
                    {localeUI === 'es' ? 'Explorando...' : 'Exploring...'}
                  </>
                ) : (
                  <>
                    🌳 {dict['generate']}
                  </>
                )}
              </button>
              
              <button className="b-pill hover:bg-blue-500/10 transition-colors" onClick={share}>
                🔗 {dict['share_link']}
              </button>
              
              <button 
                className="b-pill hover:bg-red-500/10 transition-colors" 
                onClick={() => {
                  setPrompt('')
                  setOut(null)
                  setError('')
                  toastMsg(localeUI === 'es' ? '🗑️ Reiniciado completamente' : '🗑️ Reset complete')
                }}
              >
                🗑️ {dict['reset']}
              </button>
              
              <span className="text-xs text-[color:var(--c-muted)] ml-auto hidden sm:block">
                🔒 {localeUI === 'es' ? 'Todos los datos permanecen en tu navegador' : 'All data stays in your browser'}
              </span>
            </div>
          </div>
        </section>

        <section className="card hover:shadow-lg transition-shadow duration-300">
          <div className="mb-4 flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <h2 className="label uppercase text-purple-400 mb-0">⚡ {dict['output']}</h2>
              <span className="text-xs bg-gray-500/20 px-2 py-1 rounded-full">
                {localeUI === 'es' ? 'Intención' : 'Intent'}: <strong className="text-blue-400">{intent}</strong>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex bg-[color:var(--c-surface)] border border-[color:var(--c-border)] rounded-xl p-1 gap-1">
                <button 
                  className={`tab transition-all duration-200 ${tab==='json' ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-gray-500/10'}`} 
                  aria-selected={tab==='json'} 
                  onClick={() => setTab('json')}
                >
                  📋 {dict['json']}
                </button>
                <button 
                  className={`tab transition-all duration-200 ${tab==='prompt' ? 'bg-purple-500/20 text-purple-400' : 'hover:bg-gray-500/10'}`} 
                  aria-selected={tab==='prompt'} 
                  onClick={() => setTab('prompt')}
                >
                  ✨ {dict['optimized_prompt']}
                </button>
              </div>
              <button className="b-pill hover:bg-green-500/10 transition-colors" onClick={copyCurrent} disabled={!out}>
                📋 {localeUI === 'es' ? 'Copiar' : 'Copy'}
              </button>
              <button className="b-pill hover:bg-blue-500/10 transition-colors" onClick={downloadJSON} disabled={!out}>
                💾 JSON
              </button>
              <button className="b-pill hover:bg-blue-500/10 transition-colors" onClick={downloadTxt} disabled={!out}>
                📄 .txt
              </button>
              <button className="b-pill hover:bg-purple-500/10 transition-colors" onClick={() => setFull(true)} disabled={!out}>
                🔍 {localeUI === 'es' ? 'Expandir' : 'Expand'}
              </button>
            </div>
          </div>

          {out && (
            <div className="mb-4 flex flex-wrap gap-2 text-xs">
              <span className="chip bg-blue-500/20 text-blue-400">👤 {role}</span>
              <span className="chip bg-green-500/20 text-green-400">📁 {localizedOptions.contentTypes.find(t => t.value === ctype)?.label}</span>
              <span className="chip bg-yellow-500/20 text-yellow-400">{flagEmoji(lang)} {lang}</span>
              <span className="chip bg-purple-500/20 text-purple-400">🎯 {localizedOptions.goals.find(g => g.value === goal)?.label}</span>
              <span className="chip bg-red-500/20 text-red-400">🧠 {localizedOptions.reasoning.find(r => r.value === reasoning)?.label}</span>
              {out.metadata && (
                <>
                  <span className="chip bg-gray-500/20 text-gray-400">📏 {out.metadata.optimized_length} chars</span>
                  <span className="chip'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { optimizePrompt, type OptimizeOptions, type OptimizedResult } from '@/lib/optimizer'
import { LOCALES } from '@/lib/locales'

type Tab = 'json' | 'prompt'
type Dict = Record<string,string>

const ROLES = ['Subject-matter expert','Senior software engineer','Software architect','Data scientist','Data analyst','ML engineer','MLOps engineer','DevOps engineer','Security engineer','Mobile engineer','Frontend engineer','Backend engineer','Full-stack engineer','Product manager','Project manager','Program manager','Scrum master','UX writer','Content strategist','Copywriter','Technical writer','Documentation specialist','Growth marketer','SEO specialist','PPC specialist','Email marketer','Social media manager','PR manager','Legal analyst','Compliance officer','Policy analyst','Educator / teacher','Curriculum designer','Instructional designer','Researcher','Customer support agent','Customer success manager','Sales representative','Sales engineer','Translator','Localization specialist','Financial analyst','Accounting analyst','Operations manager','HR specialist','Recruiter']

// Categorización de roles
const ROLE_CATEGORIES = {
  'Tech & Engineering': ['Subject-matter expert','Senior software engineer','Software architect','Data scientist','Data analyst','ML engineer','MLOps engineer','DevOps engineer','Security engineer','Mobile engineer','Frontend engineer','Backend engineer','Full-stack engineer'],
  'Management & Strategy': ['Product manager','Project manager','Program manager','Scrum master','Operations manager'],
  'Marketing & Growth': ['Growth marketer','SEO specialist','PPC specialist','Email marketer','Social media manager','PR manager'],
  'Content & Design': ['UX writer','Content strategist','Copywriter','Technical writer','Documentation specialist'],
  'Education & Research': ['Educator / teacher','Curriculum designer','Instructional designer','Researcher'],
  'Business & Operations': ['Customer support agent','Customer success manager','Sales representative','Sales engineer','Legal analyst','Compliance officer','Policy analyst','Financial analyst','Accounting analyst','HR specialist','Recruiter'],
  'Translation & Localization': ['Translator','Localization specialist']
}

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

// Auto-resize hook for textarea
function useAutoResize(ref: React.RefObject<HTMLTextAreaElement>, value: string) {
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto'
      ref.current.style.height = Math.max(200, ref.current.scrollHeight) + 'px'
    }
  }, [value, ref])
}

// Función para obtener las opciones traducidas
function getLocalizedOptions(localeUI: 'en'|'es') {
  if (localeUI === 'es') {
    return {
      contentTypes: [
        { value: 'text', label: 'Texto' },
        { value: 'video', label: 'Video' },
        { value: 'image', label: 'Imagen' },
        { value: 'audio', label: 'Audio' },
        { value: 'presentation', label: 'Presentación' }
      ],
      goals: [
        { value: 'precision', label: 'Precisión' },
        { value: 'brevity', label: 'Brevedad' },
        { value: 'creativity', label: 'Creatividad' },
        { value: 'safety', label: 'Seguridad' },
        { value: 'speed', label: 'Velocidad' }
      ],
      reasoning: [
        { value: 'low', label: 'Bajo' },
        { value: 'medium', label: 'Medio' },
        { value: 'high', label: 'Alto' }
      ]
    }
  } else {
    return {
      contentTypes: [
        { value: 'text', label: 'Text' },
        { value: 'video', label: 'Video' },
        { value: 'image', label: 'Image' },
        { value: 'audio', label: 'Audio' },
        { value: 'presentation', label: 'Presentation' }
      ],
      goals: [
        { value: 'precision', label: 'Precision' },
        { value: 'brevity', label: 'Brevity' },
        { value: 'creativity', label: 'Creativity' },
        { value: 'safety', label: 'Safety' },
        { value: 'speed', label: 'Speed' }
      ],
      reasoning: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' }
      ]
    }
  }
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
  const [showRoleDropdown, setShowRoleDropdown] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [recentRoles, setRecentRoles] = useState<string[]>([])
  const [history, setHistory] = useState<OptimizedResult[]>([])
  const [showHistory, setShowHistory] = useState(false)

  const taRef = useRef<HTMLTextAreaElement|null>(null)
  const roleDropdownRef = useRef<HTMLDivElement|null>(null)
  
  // Auto-resize textarea
  useAutoResize(taRef, prompt)
  
  const PER_PAGE = 4
  const maxPage = Math.ceil(EXAMPLES.length/PER_PAGE)-1
  const view = EXAMPLES.slice(page*PER_PAGE,page*PER_PAGE+PER_PAGE)
  const localizedOptions = getLocalizedOptions(localeUI)

  // Character count and word count
  const charCount = prompt.length
  const wordCount = prompt.trim().split(/\s+/).filter(word => word.length > 0).length

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem('po_state')
      if (!raw) return
      const d = JSON.parse(raw)
      setPrompt(d.prompt ?? '')
      setGoal(d.goal ?? 'precision')
      setReasoning(d.reasoning ?? 'medium')
      setLang(d.lang ?? (localeUI === 'es' ? 'es-ES' : 'en-US'))
      setRole(d.role ?? 'Subject-matter expert')
      setCtype(d.ctype ?? 'text')
      setRecentRoles(d.recentRoles ?? [])
      setHistory(d.history ?? [])
    } catch(e) {
      console.warn('Failed to load state:', e)
    }
  }, [localeUI])

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem('po_state', JSON.stringify({
      prompt,goal,reasoning,lang,role,ctype,recentRoles,history
    }))
  }, [prompt,goal,reasoning,lang,role,ctype,recentRoles,history])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const savedTheme = localStorage.getItem('po_theme') as 'dark'|'light'|null
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.setAttribute('data-theme', savedTheme)
    }
  }, [])

  // Click outside to close role dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setShowRoleDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyboard(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'Enter') {
          e.preventDefault()
          if (!isGenerating && prompt.trim()) {
            generate()
          }
        }
        if (e.key === 'k') {
          e.preventDefault()
          taRef.current?.focus()
        }
      }
    }
    document.addEventListener('keydown', handleKeyboard)
    return () => document.removeEventListener('keydown', handleKeyboard)
  }, [isGenerating, prompt])

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
    setTimeout(() => setToast(''),
