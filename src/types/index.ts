export interface Database {
  public: {
    Tables: {
      quizzes: {
        Row: Quiz
        Insert: Omit<Quiz, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Quiz, 'id' | 'created_at' | 'updated_at'>>
      }
      questions: {
        Row: Question
        Insert: Omit<Question, 'id' | 'created_at'>
        Update: Partial<Omit<Question, 'id' | 'created_at'>>
      }
      answers: {
        Row: Answer
        Insert: Omit<Answer, 'id' | 'created_at'>
        Update: Partial<Omit<Answer, 'id' | 'created_at'>>
      }
      quiz_sessions: {
        Row: QuizSession
        Insert: Omit<QuizSession, 'id' | 'created_at'>
        Update: Partial<Omit<QuizSession, 'id' | 'created_at'>>
      }
      session_answers: {
        Row: SessionAnswer
        Insert: Omit<SessionAnswer, 'id' | 'created_at'>
        Update: Partial<Omit<SessionAnswer, 'id' | 'created_at'>>
      }
    }
  }
}

export interface Quiz {
  id: string
  title: string
  description: string | null
  user_id: string
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface Question {
  id: string
  quiz_id: string
  text: string
  order_index: number
  created_at: string
}

export interface Answer {
  id: string
  question_id: string
  text: string
  is_correct: boolean
  order_index: number
  created_at: string
}

export interface QuizSession {
  id: string
  quiz_id: string
  user_id: string | null
  participant_name: string | null
  score: number
  total_questions: number
  completed_at: string | null
  created_at: string
}

export interface SessionAnswer {
  id: string
  session_id: string
  question_id: string
  answer_id: string
  is_correct: boolean
  created_at: string
}

export interface QuizWithDetails extends Quiz {
  questions: QuestionWithAnswers[]
  user?: {
    email: string
  }
}

export interface QuestionWithAnswers extends Question {
  answers: Answer[]
}

export interface CreateQuizInput {
  title: string
  description?: string
  is_public: boolean
  questions: CreateQuestionInput[]
}

export interface CreateQuestionInput {
  text: string
  order_index: number
  answers: CreateAnswerInput[]
}

export interface CreateAnswerInput {
  text: string
  is_correct: boolean
  order_index: number
}

export interface QuizStats {
  total_sessions: number
  average_score: number
  completion_rate: number
  question_stats: QuestionStats[]
  participants: ParticipantResult[]
}

export interface QuestionStats {
  question_id: string
  question_text: string
  correct_answers: number
  total_answers: number
  percentage: number
}

export interface ParticipantResult {
  id: string
  participant_name: string | null
  score: number
  total_questions: number
  percentage: number
  completed_at: string | null
  created_at: string
}
