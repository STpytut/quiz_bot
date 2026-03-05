export interface GeneratedQuestion {
  text: string
  answers: {
    text: string
    is_correct: boolean
  }[]
}

export interface GeneratedQuiz {
  questions: GeneratedQuestion[]
}

export interface QuizGeneratorState {
  text: string
  questionCount: number
  generatedQuiz: GeneratedQuiz | null
  isGenerating: boolean
  error: string | null
}

export type InputMethod = 'text' | 'file'
