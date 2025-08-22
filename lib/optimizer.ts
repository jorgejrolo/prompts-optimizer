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

export function optimizePrompt(originalPrompt: string, options: OptimizeOptions = {}): OptimizedResult {
  const {
    defaultLanguage = 'en-US',
    objective = 'precision',
    reasoning = 'medium',
    role = 'Subject-matter expert',
    contentType = 'text'
  } = options

  const intent = analyzeIntent(originalPrompt)
  const optimizedPrompt = createOptimizedPrompt(originalPrompt, role, objective, reasoning, defaultLanguage)
  const constraints = createConstraints(objective, contentType)
  const examples = objective === 'precision' ? createExamples(intent) : undefined
  
  return {
    intent,
    optimized_prompt: optimizedPrompt,
    parameters: {
      role,
      language: defaultLanguage,
      objective,
      reasoning,
      content_type: contentType,
      format: detectFormat(originalPrompt)
    },
    constraints,
    examples,
    metadata: {
      original_length: originalPrompt.length,
      optimized_length: optimizedPrompt.length,
      complexity_score: Math.min(100, Math.max(20, originalPrompt.split(' ').length * 2)),
      clarity_score: Math.min(100, Math.max(40, 80 - (originalPrompt.includes('?') ? 5 : 0)))
    }
  }
}

function analyzeIntent(prompt: string): string {
  const p = prompt.toLowerCase()
  if (p.includes('summar')) return 'Summarization'
  if (p.includes('translat')) return 'Translation'
  if (p.includes('explain')) return 'Explanation'
  if (p.includes('code')) return 'Code Generation'
  if (p.includes('analyz')) return 'Analysis'
  if (p.includes('write') || p.includes('creat')) return 'Content Creation'
  return 'General Task'
}

function createOptimizedPrompt(original: string, role: string, objective: string, reasoning: string, language: string): string {
  let optimized = `You are a ${role.toLowerCase()}. `
  
  let enhanced = original
  if (objective === 'precision') {
    enhanced = enhanced.replace(/summarize/gi, 'create a detailed summary of')
    enhanced = enhanced.replace(/explain/gi, 'provide a comprehensive explanation of')
  } else if (objective === 'brevity') {
    enhanced = enhanced.replace(/summarize/gi, 'briefly summarize')
    enhanced = enhanced.replace(/explain/gi, 'concisely explain')
  }
  
  optimized += enhanced
  
  if (!language.startsWith('en')) {
    const langNames: Record<string, string> = {
      'es-ES': 'Spanish', 'es-MX': 'Spanish', 'fr-FR': 'French', 'de-DE': 'German', 'it-IT': 'Italian'
    }
    optimized += ` Respond in ${langNames[language] || 'the specified language'}.`
  }
  
  if (reasoning === 'high') {
    optimized += ' Provide step-by-step reasoning.'
  } else if (reasoning === 'medium') {
    optimized += ' Include brief explanations.'
  }
  
  switch (objective) {
    case 'precision':
      optimized += ' Be accurate and include specific details.'
      break
    case 'brevity':
      optimized += ' Keep the response concise and focused.'
      break
    case 'creativity':
      optimized += ' Use creative approaches and multiple perspectives.'
      break
    case 'safety':
      optimized += ' Consider safety and ethical implications.'
      break
    case 'speed':
      optimized += ' Provide quick, actionable responses.'
      break
  }
  
  return optimized.trim()
}

function createConstraints(objective: string, contentType: string): string[] {
  const constraints: string[] = []
  
  switch (objective) {
    case 'precision':
      constraints.push('Include specific examples and evidence')
      constraints.push('Use precise terminology')
      break
    case 'brevity':
      constraints.push('Maximum 200 words unless specified')
      constraints.push('Focus on essential information')
      break
    case 'creativity':
      constraints.push('Explore multiple approaches')
      constraints.push('Use analogies when helpful')
      break
    case 'safety':
      constraints.push('Include safety warnings when applicable')
      constraints.push('Consider ethical implications')
      break
    case 'speed':
      constraints.push('Prioritize actionable information')
      constraints.push('Use simple, direct language')
      break
  }
  
  if (contentType === 'video') {
    constraints.push('Include visual and audio descriptions')
  }
  
  return constraints
}

function createExamples(intent: string): string[] {
  switch (intent) {
    case 'Summarization':
      return ['Key point 1: Main conclusion', 'Key point 2: Supporting evidence']
    case 'Code Generation':
      return ['// Example with clear naming', 'function processData(input) { return result; }']
    case 'Analysis':
      return ['Strengths: [positive aspects]', 'Weaknesses: [areas for improvement]']
    default:
      return []
  }
}

function detectFormat(prompt: string): string {
  const p = prompt.toLowerCase()
  if (p.includes('json')) return 'JSON'
  if (p.includes('table')) return 'Table'
  if (p.includes('bullet')) return 'Bullet Points'
  return 'Text'
}
