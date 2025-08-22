export type OptimizeOptions = {
  defaultLanguage?: string
  objective?: 'precision' | 'brevity' | 'creativity' | 'safety' | 'speed'
  reasoning?: 'low' | 'medium' | 'high'
  role?: string
  contentType?: 'text' | 'video' | 'image' | 'audio' | 'presentation'
}

export type OptimizedResult = {
  intent: string
  optimized_prompt: string
  parameters: {
    role: string
    language: string
    objective: string
    reasoning: string
    content_type: string
    format: string
  }
  constraints: string[]
  examples?: string[]
  metadata: {
    original_length: number
    optimized_length: number
    complexity_score: number
    clarity_score: number
  }
}

export function optimizePrompt(
  originalPrompt: string,
  options: OptimizeOptions = {}
): OptimizedResult {
  const {
    defaultLanguage = 'en-US',
    objective = 'precision',
    reasoning = 'medium',
    role = 'Subject-matter expert',
    contentType = 'text'
  } = options

  // Analizar el intent del prompt original
  const intent = analyzeIntent(originalPrompt)
  
  // Generar el prompt optimizado
  const optimizedPrompt = generateOptimizedPrompt(
    originalPrompt,
    intent,
    { defaultLanguage, objective, reasoning, role, contentType }
  )
  
  // Generar constraints basadas en el objetivo
  const constraints = generateConstraints(objective, reasoning, contentType)
  
  // Calcular métricas
  const metadata = calculateMetrics(originalPrompt, optimizedPrompt, objective)
  
  // Generar ejemplos si es apropiado
  const examples = shouldIncludeExamples(originalPrompt, objective) 
    ? generateExamples(intent, contentType) 
    : undefined

  return {
    intent,
    optimized_prompt: optimizedPrompt,
    parameters: {
      role,
      language: defaultLanguage,
      objective,
      reasoning,
      content_type: contentType,
      format: determineFormat(originalPrompt, contentType)
    },
    constraints,
    examples,
    metadata
  }
}

function analyzeIntent(prompt: string): string {
  const prompt_lower = prompt.toLowerCase()
  
  // Patrones comunes de intents
  if (prompt_lower.includes('summar')) return 'Summarization'
  if (prompt_lower.includes('translat')) return 'Translation'
  if (prompt_lower.includes('explain') || prompt_lower.includes('eli5')) return 'Explanation'
  if (prompt_lower.includes('generat') && prompt_lower.includes('code')) return 'Code Generation'
  if (prompt_lower.includes('fix') || prompt_lower.includes('debug')) return 'Code Debugging'
  if (prompt_lower.includes('analyz') || prompt_lower.includes('review')) return 'Analysis'
  if (prompt_lower.includes('write') || prompt_lower.includes('creat')) return 'Content Creation'
  if (prompt_lower.includes('plan') || prompt_lower.includes('strateg')) return 'Planning'
  if (prompt_lower.includes('extract') || prompt_lower.includes('parse')) return 'Data Extraction'
  if (prompt_lower.includes('compar') || prompt_lower.includes('vs')) return 'Comparison'
  if (prompt_lower.includes('optim') || prompt_lower.includes('improv')) return 'Optimization'
  if (prompt_lower.includes('test') && prompt_lower.includes('case')) return 'Test Generation'
  if (prompt_lower.includes('format') || prompt_lower.includes('convert')) return 'Formatting'
  
  return 'General Task'
}

function generateOptimizedPrompt(
  original: string,
  intent: string,
  options: Required<OptimizeOptions>
): string {
  const { role, defaultLanguage, objective, reasoning, contentType } = options
  
  let optimized = ''
  
  // Contexto del rol
  optimized += `You are a ${role.toLowerCase()}. `
  
  // Instrucción principal basada en el intent
  optimized += enhanceMainInstruction(original, intent, objective)
  
  // Especificaciones de formato y contenido
  optimized += addFormatSpecifications(contentType, objective)
  
  // Especificaciones de idioma si no es inglés
  if (!defaultLanguage.startsWith('en')) {
    const langName = getLanguageName(defaultLanguage)
    optimized += ` Respond in ${langName}.`
  }
  
  // Nivel de razonamiento
  if (reasoning === 'high') {
    optimized += ' Provide detailed reasoning and step-by-step thinking.'
  } else if (reasoning === 'medium') {
    optimized += ' Include brief explanations for key decisions.'
  }
  
  // Objetivos específicos
  optimized += addObjectiveConstraints(objective)
  
  return optimized.trim()
}

function enhanceMainInstruction(original: string, intent: string, objective: string): string {
  let enhanced = original
  
  // Hacer la instrucción más específica y clara
  if (objective === 'precision') {
    enhanced = enhanced.replace(/summarize/gi, 'create a precise summary of')
    enhanced = enhanced.replace(/explain/gi, 'provide a detailed explanation of')
    enhanced = enhanced.replace(/analyze/gi, 'conduct a thorough analysis of')
  } else if (objective === 'brevity') {
    enhanced = enhanced.replace(/summarize/gi, 'briefly summarize')
    enhanced = enhanced.replace(/explain/gi, 'concisely explain')
    enhanced = enhanced.replace(/create/gi, 'generate a concise')
  }
  
  return enhanced + ' '
}

function addFormatSpecifications(contentType: string, objective: string): string {
  let specs = ''
  
  switch (contentType) {
    case 'text':
      if (objective === 'brevity') {
        specs += 'Use bullet points or numbered lists when appropriate. '
      } else {
        specs += 'Structure your response with clear headings and paragraphs. '
      }
      break
    case 'video':
      specs += 'Include timestamps, scene descriptions, and visual elements. '
      break
    case 'image':
      specs += 'Describe visual elements, composition, colors, and style details. '
      break
    case 'audio':
      specs += 'Include audio cues, timing, and sound descriptions. '
      break
    case 'presentation':
      specs += 'Structure as slides with titles, bullet points, and speaker notes. '
      break
  }
  
  return specs
}

function addObjectiveConstraints(objective: string): string {
  switch (objective) {
    case 'precision':
      return ' Be accurate and include specific details and examples.'
    case 'brevity':
      return ' Keep responses concise and focus on essential information only.'
    case 'creativity':
      return ' Use creative approaches and consider multiple perspectives.'
    case 'safety':
      return ' Prioritize safety considerations and include relevant warnings.'
    case 'speed':
      return ' Provide quick, actionable responses without unnecessary elaboration.'
    default:
      return ''
  }
}

function generateConstraints(objective: string, reasoning: string, contentType: string): string[] {
  const constraints = []
  
  // Constraints basadas en objetivo
  switch (objective) {
    case 'precision':
      constraints.push('Must include specific examples and evidence')
      constraints.push('Verify factual accuracy')
      constraints.push('Use precise terminology')
      break
    case 'brevity':
      constraints.push('Maximum 200 words unless specified otherwise')
      constraints.push('Use bullet points for lists')
      constraints.push('Avoid redundant information')
      break
    case 'creativity':
      constraints.push('Explore multiple solutions or perspectives')
      constraints.push('Use analogies and metaphors when helpful')
      constraints.push('Think outside conventional approaches')
      break
    case 'safety':
      constraints.push('Include safety warnings when applicable')
      constraints.push('Avoid potentially harmful instructions')
      constraints.push('Consider ethical implications')
      break
    case 'speed':
      constraints.push('Prioritize actionable information')
      constraints.push('Use simple, direct language')
      constraints.push('Avoid deep theoretical explanations')
      break
  }
  
  // Constraints basadas en tipo de contenido
  switch (contentType) {
    case 'video':
      constraints.push('Include visual and audio descriptions')
      constraints.push('Consider pacing and timing')
      break
    case 'image':
      constraints.push('Describe visual elements in detail')
      constraints.push('Consider composition and aesthetics')
      break
    case 'presentation':
      constraints.push('Structure information for slides')
      constraints.push('Include speaker notes when relevant')
      break
  }
  
  return constraints
}

function generateExamples(intent: string, contentType: string): string[] {
  const examples = []
  
  switch (intent) {
    case 'Summarization':
      examples.push('Key point 1: Main finding or conclusion')
      examples.push('Key point 2: Supporting evidence or method')
      examples.push('Key point 3: Implications or next steps')
      break
    case 'Code Generation':
      examples.push('// Example function with clear naming')
      examples.push('function calculateTotal(items) { return items.reduce(...) }')
      break
    case 'Analysis':
      examples.push('Strengths: [specific positive aspects]')
      examples.push('Weaknesses: [areas for improvement]')
      examples.push('Recommendations: [actionable next steps]')
      break
  }
  
  return examples.length > 0 ? examples : []
}

function shouldIncludeExamples(prompt: string, objective: string): boolean {
  const hasRequestForExamples = /example|sample|instance/i.test(prompt)
  const isPrecisionObjective = objective === 'precision'
  return hasRequestForExamples || isPrecisionObjective
}

function determineFormat(prompt: string, contentType: string): string {
  const prompt_lower = prompt.toLowerCase()
  
  if (prompt_lower.includes('json')) return 'JSON'
  if (prompt_lower.includes('markdown') || prompt_lower.includes('table')) return 'Markdown'
  if (prompt_lower.includes('bullet') || prompt_lower.includes('list')) return 'Bullet Points'
  if (prompt_lower.includes('paragraph')) return 'Paragraphs'
  
  // Default based on content type
  switch (contentType) {
    case 'presentation': return 'Slide Format'
    case 'video': return 'Script Format'
    case 'image': return 'Visual Description'
    default: return 'Structured Text'
  }
}

function calculateMetrics(original: string, optimized: string, objective: string): {
  original_length: number
  optimized_length: number
  complexity_score: number
  clarity_score: number
} {
  const originalLength = original.length
  const optimizedLength = optimized.length
  
  // Calcular complejidad basada en número de instrucciones y palabras técnicas
  const complexityScore = Math.min(100, Math.max(0, 
    (optimized.split(/[.!?]+/).length * 10) + 
    (optimized.match(/\b(analyze|synthesize|evaluate|compare|contrast)\b/gi)?.length || 0) * 15
  ))
  
  // Calcular claridad basada en estructura y palabras de acción
  const clarityScore = Math.min(100, Math.max(0,
    80 + 
    (optimized.match(/\b(must|should|will|please)\b/gi)?.length || 0) * 5 -
    (optimized.match(/\b(maybe|perhaps|possibly|might)\b/gi)?.length || 0) * 5
  ))
  
  return {
    original_length: originalLength,
    optimized_length: optimizedLength,
    complexity_score: Math.round(complexityScore),
    clarity_score: Math.round(clarityScore)
  }
}

function getLanguageName(code: string): string {
  const languageMap: Record<string, string> = {
    'es-ES': 'Spanish', 'es-MX': 'Spanish', 'es-AR': 'Spanish', 'es-CL': 'Spanish',
    'fr-FR': 'French', 'fr-CA': 'French',
    'de-DE': 'German',
    'it-IT': 'Italian',
    'pt-PT': 'Portuguese', 'pt-BR': 'Portuguese',
    'nl-NL': 'Dutch',
    'sv-SE': 'Swedish', 'no-NO': 'Norwegian', 'da-DK': 'Danish', 'fi-FI': 'Finnish',
    'pl-PL': 'Polish', 'cs-CZ': 'Czech', 'sk-SK': 'Slovak', 'ro-RO': 'Romanian', 'hu-HU': 'Hungarian',
    'ru-RU': 'Russian', 'uk-UA': 'Ukrainian',
    'tr-TR': 'Turkish',
    'ar-SA': 'Arabic', 'he-IL': 'Hebrew',
    'hi-IN': 'Hindi', 'bn-BD': 'Bengali', 'ur-PK': 'Urdu',
    'id-ID': 'Indonesian', 'ms-MY': 'Malay', 'th-TH': 'Thai', 'vi-VN': 'Vietnamese',
    'zh-CN': 'Chinese (Simplified)', 'zh-TW': 'Chinese (Traditional)',
    'ja-JP': 'Japanese', 'ko-KR': 'Korean'
  }
  
  return languageMap[code] || 'English'
}
