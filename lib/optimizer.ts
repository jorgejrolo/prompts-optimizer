// lib/optimizer.ts - Versión simplificada para evitar errores de build

export interface OptimizeOptions {
  defaultLanguage?: string
  objective?: 'precision' | 'brevity' | 'creativity' | 'safety' | 'speed'
  reasoning?: 'low' | 'medium' | 'high'
  role?: string
  contentType?: 'text' | 'video' | 'image' | 'audio' | 'presentation'
}

export interface OptimizedResult {
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
  
  // Calcular métricas básicas
  const metadata = {
    original_length: originalPrompt.length,
    optimized_length: optimizedPrompt.length,
    complexity_score: Math.min(100, Math.max(20, 60 + originalPrompt.split(' ').length)),
    clarity_score: Math.min(100, Math.max(40, 70 + (optimizedPrompt.includes('specific') ? 10 : 0)))
  }
  
  // Generar ejemplos si es apropiado
  const examples = shouldIncludeExamples(originalPrompt, objective) 
    ? generateExamples(intent) 
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
  const promptLower = prompt.toLowerCase()
  
  if (promptLower.includes('summar')) return 'Summarization'
  if (promptLower.includes('translat')) return 'Translation'
  if (promptLower.includes('explain') || promptLower.includes('eli5')) return 'Explanation'
  if (promptLower.includes('code') || promptLower.includes('function')) return 'Code Generation'
  if (promptLower.includes('fix') || promptLower.includes('debug')) return 'Code Debugging'
  if (promptLower.includes('analyz') || promptLower.includes('review')) return 'Analysis'
  if (promptLower.includes('write') || promptLower.includes('creat')) return 'Content Creation'
  if (promptLower.includes('plan') || promptLower.includes('strateg')) return 'Planning'
  if (promptLower.includes('extract') || promptLower.includes('parse')) return 'Data Extraction'
  if (promptLower.includes('compar') || promptLower.includes('vs')) return 'Comparison'
  
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
  
  // Instrucción principal mejorada
  optimized += enhanceMainInstruction(original, intent, objective)
  
  // Especificaciones de formato
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
  const constraints: string[] = []
  
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

function generateExamples(intent: string): string[] {
  const examples: string[] = []
  
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
  
  return examples
}

function shouldIncludeExamples(prompt: string, objective: string): boolean {
  const hasRequestForExamples = /example|sample|instance/i.test(prompt)
  const isPrecisionObjective = objective === 'precision'
  return hasRequestForExamples || isPrecisionObjective
}

function determineFormat(prompt: string, contentType: string): string {
  const promptLower = prompt.toLowerCase()
  
  if (promptLower.includes('json')) return 'JSON'
  if (promptLower.includes('markdown') || promptLower.includes('table')) return 'Markdown'
  if (promptLower.includes('bullet') || promptLower.includes('list')) return 'Bullet Points'
  if (promptLower.includes('paragraph')) return 'Paragraphs'
  
  // Default based on content type
  switch (contentType) {
    case 'presentation': return 'Slide Format'
    case 'video': return 'Script Format'
    case 'image': return 'Visual Description'
    default: return 'Structured Text'
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
    'ru-RU': 'Russian', 'uk-UA': 'Ukrainian',
    'zh-CN': 'Chinese (Simplified)', 'zh-TW': 'Chinese (Traditional)',
    'ja-JP': 'Japanese', 'ko-KR': 'Korean'
  }
  
  return languageMap[code] || 'English'
}
