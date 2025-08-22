// lib/prompt-templates.ts - Plantillas adicionales para mejores resultados

export const PROMPT_TEMPLATES = {
  summarization: {
    precision: "As a {role}, create a comprehensive summary of the following content. Structure your response with: 1) Main thesis/conclusion, 2) Key supporting points with evidence, 3) Methodology or approach used, 4) Implications and next steps. Include specific details and quantitative data where available.",
    brevity: "As a {role}, provide a concise summary in exactly 3 bullet points covering: the main finding, the method used, and the practical implications.",
    creativity: "As a {role}, create an engaging summary that uses analogies and storytelling elements to make complex information accessible while maintaining accuracy."
  },
  
  analysis: {
    precision: "As a {role}, conduct a thorough analysis following this structure: 1) Executive summary, 2) Detailed findings with evidence, 3) Strengths and weaknesses, 4) Risk assessment, 5) Recommendations with implementation steps.",
    brevity: "As a {role}, provide a focused analysis covering only: key strengths, critical weaknesses, and top 3 actionable recommendations.",
    creativity: "As a {role}, analyze this from multiple perspectives including contrarian viewpoints, potential future scenarios, and unconventional solutions."
  },
  
  codeGeneration: {
    precision: "As a {role}, write production-ready code that includes: proper error handling, comprehensive comments, type annotations, unit test examples, and performance considerations. Follow best practices for {language}.",
    brevity: "As a {role}, write clean, minimal code with essential comments only. Focus on functionality and readability.",
    creativity: "As a {role}, explore multiple implementation approaches, suggest modern patterns, and include innovative solutions or optimizations."
  },
  
  translation: {
    precision: "As a {role}, provide an accurate translation that preserves: cultural nuances, technical terminology, tone and style, context-specific meanings. Include brief notes on translation choices for ambiguous terms.",
    brevity: "As a {role}, provide a direct, natural translation focusing on clarity and readability in the target language.",
    creativity: "As a {role}, create a culturally adapted translation that resonates with the target audience while preserving the original intent."
  }
}

// lib/quality-metrics.ts - Sistema de métricas mejorado

export function calculateAdvancedMetrics(originalPrompt: string, optimizedPrompt: string, result: any) {
  const metrics = {
    efficiency: calculateEfficiency(originalPrompt, optimizedPrompt),
    specificity: calculateSpecificity(optimizedPrompt),
    actionability: calculateActionability(optimizedPrompt),
    completeness: calculateCompleteness(optimizedPrompt, result),
    readability: calculateReadability(optimizedPrompt)
  }
  
  return {
    ...metrics,
    overallScore: Math.round((metrics.efficiency + metrics.specificity + metrics.actionability + metrics.completeness + metrics.readability) / 5)
  }
}

function calculateEfficiency(original: string, optimized: string): number {
  const originalWords = original.trim().split(/\s+/).length
  const optimizedWords = optimized.trim().split(/\s+/).length
  const ratio = optimizedWords / originalWords
  
  // Optimal range is 1.2-2.0x the original length
  if (ratio >= 1.2 && ratio <= 2.0) return 100
  if (ratio < 1.2) return Math.max(60, ratio * 83)
  return Math.max(40, 200 - ratio * 50)
}

function calculateSpecificity(prompt: string): number {
  const specificWords = ['specific', 'exactly', 'must', 'should', 'include', 'format', 'structure']
  const actionWords = ['analyze', 'create', 'generate', 'explain', 'summarize', 'compare']
  const constraintWords = ['without', 'avoid', 'focus on', 'prioritize', 'limit to']
  
  let score = 60 // Base score
  
  specificWords.forEach(word => {
    if (prompt.toLowerCase().includes(word)) score += 5
  })
  
  actionWords.forEach(word => {
    if (prompt.toLowerCase().includes(word)) score += 3
  })
  
  constraintWords.forEach(word => {
    if (prompt.toLowerCase().includes(word)) score += 4
  })
  
  return Math.min(100, score)
}

function calculateActionability(prompt: string): number {
  let score = 50
  
  // Check for clear instructions
  if (/\b(create|generate|write|make|build|design)\b/i.test(prompt)) score += 15
  if (/\b(analyze|evaluate|assess|review)\b/i.test(prompt)) score += 15
  if (/\b(list|enumerate|identify|extract)\b/i.test(prompt)) score += 10
  
  // Check for output format specification
  if (/\b(format|structure|table|json|markdown|bullets)\b/i.test(prompt)) score += 10
  
  // Check for role specification
  if (/\b(as a|you are a|acting as)\b/i.test(prompt)) score += 10
  
  return Math.min(100, score)
}

function calculateCompleteness(prompt: string, result: any): number {
  let score = 70
  
  // Check if constraints are provided
  if (result.constraints && result.constraints.length > 0) score += 10
  
  // Check if examples are provided when helpful
  if (result.examples && result.examples.length > 0) score += 10
  
  // Check for context setting
  if (/\b(context|background|scenario|situation)\b/i.test(prompt)) score += 5
  
  // Check for success criteria
  if (/\b(criteria|measure|evaluate|success|quality)\b/i.test(prompt)) score += 5
  
  return Math.min(100, score)
}

function calculateReadability(prompt: string): number {
  const sentences = prompt.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const words = prompt.trim().split(/\s+/)
  const avgWordsPerSentence = words.length / sentences.length
  
  let score = 80
  
  // Optimal sentence length is 15-25 words
  if (avgWordsPerSentence >= 15 && avgWordsPerSentence <= 25) {
    score += 20
  } else if (avgWordsPerSentence < 15) {
    score += Math.max(0, 20 - (15 - avgWordsPerSentence) * 2)
  } else {
    score -= Math.min(20, (avgWordsPerSentence - 25) * 2)
  }
  
  return Math.min(100, Math.max(0, score))
}

// lib/prompt-validator.ts - Validación de prompts

export function validatePrompt(prompt: string): {
  isValid: boolean
  warnings: string[]
  suggestions: string[]
  score: number
} {
  const warnings: string[] = []
  const suggestions: string[] = []
  let score = 100
  
  // Check minimum length
  if (prompt.trim().length < 10) {
    warnings.push('Prompt is too short')
    suggestions.push('Add more specific details about what you want to achieve')
    score -= 30
  }
  
  // Check for vague language
  const vaguePhrases = ['something', 'anything', 'some kind of', 'whatever', 'maybe']
  vaguePhrases.forEach(phrase => {
    if (prompt.toLowerCase().includes(phrase)) {
      warnings.push(`Avoid vague language: "${phrase}"`)
      suggestions.push('Be more specific about your requirements')
      score -= 10
    }
  })
  
  // Check for action words
  if (!/\b(create|generate|write|analyze|explain|summarize|make|build|design|list|compare)\b/i.test(prompt)) {
    warnings.push('No clear action specified')
    suggestions.push('Start with a clear action verb (create, analyze, explain, etc.)')
    score -= 15
  }
  
  // Check for excessive length
  if (prompt.length > 2000) {
    warnings.push('Prompt might be too long')
    suggestions.push('Consider breaking down into smaller, more focused requests')
    score -= 10
  }
  
  // Check for context
  if (prompt.length > 50 && !/\b(context|background|for|about|regarding)\b/i.test(prompt)) {
    suggestions.push('Consider adding context or background information')
    score -= 5
  }
  
  return {
    isValid: warnings.length === 0,
    warnings,
    suggestions,
    score: Math.max(0, score)
  }
}

// components/PromptAnalytics.tsx - Componente de analíticas

import React from 'react'

interface PromptAnalyticsProps {
  originalPrompt: string
  optimizedResult: any
  onClose: () => void
}

export function PromptAnalytics({ originalPrompt, optimizedResult, onClose }: PromptAnalyticsProps) {
  const analytics = React.useMemo(() => {
    const validation = validatePrompt(originalPrompt)
    const metrics = calculateAdvancedMetrics(originalPrompt, optimizedResult.optimized_prompt, optimizedResult)
    
    return { validation, metrics }
  }, [originalPrompt, optimizedResult])
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400 bg-green-500/20'
    if (score >= 60) return 'text-yellow-400 bg-yellow-500/20'
    return 'text-red-400 bg-red-500/20'
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-100 flex items-center justify-center p-4">
      <div className="bg-[color:var(--c-card)] border border-[color:var(--c-border)] rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            📊 Prompt Analytics
          </h3>
          <button onClick={onClose} className="b-pill">✕ Close</button>
        </div>
        
        {/* Overall Score */}
        <div className="mb-6 text-center">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-2xl font-bold ${getScoreColor(analytics.metrics.overallScore)}`}>
            {analytics.metrics.overallScore}/100
          </div>
          <div className="text-sm text-[color:var(--c-muted)] mt-2">Overall Quality Score</div>
        </div>
        
        {/* Metrics Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {Object.entries(analytics.metrics).filter(([key]) => key !== 'overallScore').map(([key, value]) => (
            <div key={key} className="bg-[color:var(--c-surface)] rounded-xl p-3 border border-[color:var(--c-border)]">
              <div className={`text-lg font-bold ${getScoreColor(value as number)}`}>{value}/100</div>
              <div className="text-xs text-[color:var(--c-muted)] capitalize">{key}</div>
            </div>
          ))}
        </div>
        
        {/* Validation Results */}
        {analytics.validation.warnings.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold text-orange-400 mb-2">⚠️ Warnings</h4>
            <ul className="space-y-1">
              {analytics.validation.warnings.map((warning, i) => (
                <li key={i} className="text-sm text-orange-300 flex items-start gap-2">
                  <span className="text-orange-400 mt-0.5">•</span>
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {analytics.validation.suggestions.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold text-blue-400 mb-2">💡 Suggestions</h4>
            <ul className="space-y-1">
              {analytics.validation.suggestions.map((suggestion, i) => (
                <li key={i} className="text-sm text-blue-300 flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Improvement Tips */}
        <div className="bg-[color:var(--c-surface)] rounded-xl p-4 border border-[color:var(--c-border)]">
          <h4 className="font-semibold text-green-400 mb-2">🚀 Quick Tips</h4>
          <ul className="text-sm space-y-1 text-[color:var(--c-muted)]">
            <li>• Use specific action verbs (analyze, create, generate)</li>
            <li>• Include desired output format (table, bullets, JSON)</li>
            <li>• Specify your role or expertise level needed</li>
            <li>• Add constraints to avoid unwanted content</li>
            <li>• Include examples when helpful</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
