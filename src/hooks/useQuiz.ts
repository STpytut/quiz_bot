import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type {
  QuizWithDetails,
  CreateQuizInput,
  QuizSession,
  SessionAnswer,
  QuizStats,
  QuestionStats,
  ParticipantResult,
} from '../types'

export function useQuiz() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPublicQuizzes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('quizzes')
        .select(`
          *,
          questions (count)
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      return { data, error: null }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch quizzes'
      setError(message)
      return { data: null, error: message }
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchUserQuizzes = useCallback(async (userId: string) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('quizzes')
        .select(`
          *,
          questions (count)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      return { data, error: null }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch quizzes'
      setError(message)
      return { data: null, error: message }
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchQuizById = useCallback(async (quizId: string) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('quizzes')
        .select(`
          *,
          questions (
            *,
            answers (*)
          )
        `)
        .eq('id', quizId)
        .single()

      if (fetchError) throw fetchError

      const quizWithDetails: QuizWithDetails = {
        ...data,
        questions: data.questions.map((q: any) => ({
          ...q,
          answers: q.answers.sort((a: any, b: any) => a.order_index - b.order_index),
        })).sort((a: any, b: any) => a.order_index - b.order_index),
      }

      return { data: quizWithDetails, error: null }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch quiz'
      setError(message)
      return { data: null, error: message }
    } finally {
      setLoading(false)
    }
  }, [])

  const createQuiz = useCallback(async (input: CreateQuizInput, userId: string) => {
    setLoading(true)
    setError(null)
    try {
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          title: input.title,
          description: input.description,
          is_public: input.is_public,
          user_id: userId,
        })
        .select()
        .single()

      if (quizError) throw quizError

      for (const questionInput of input.questions) {
        const { data: question, error: questionError } = await supabase
          .from('questions')
          .insert({
            quiz_id: quiz.id,
            text: questionInput.text,
            order_index: questionInput.order_index,
          })
          .select()
          .single()

        if (questionError) throw questionError

        const { error: answersError } = await supabase
          .from('answers')
          .insert(
            questionInput.answers.map((answer) => ({
              question_id: question.id,
              text: answer.text,
              is_correct: answer.is_correct,
              order_index: answer.order_index,
            }))
          )

        if (answersError) throw answersError
      }

      return { data: quiz, error: null }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create quiz'
      setError(message)
      return { data: null, error: message }
    } finally {
      setLoading(false)
    }
  }, [])

  const updateQuiz = useCallback(async (quizId: string, input: Partial<CreateQuizInput>) => {
    setLoading(true)
    setError(null)
    try {
      if (input.title || input.description || input.is_public !== undefined) {
        const { error: quizError } = await supabase
          .from('quizzes')
          .update({
            title: input.title,
            description: input.description,
            is_public: input.is_public,
          })
          .eq('id', quizId)

        if (quizError) throw quizError
      }

      if (input.questions) {
        const { error: deleteQuestionsError } = await supabase
          .from('questions')
          .delete()
          .eq('quiz_id', quizId)

        if (deleteQuestionsError) throw deleteQuestionsError

        for (const questionInput of input.questions) {
          const { data: question, error: questionError } = await supabase
            .from('questions')
            .insert({
              quiz_id: quizId,
              text: questionInput.text,
              order_index: questionInput.order_index,
            })
            .select()
            .single()

          if (questionError) throw questionError

          const { error: answersError } = await supabase
            .from('answers')
            .insert(
              questionInput.answers.map((answer) => ({
                question_id: question.id,
                text: answer.text,
                is_correct: answer.is_correct,
                order_index: answer.order_index,
              }))
            )

          if (answersError) throw answersError
        }
      }

      return { error: null }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update quiz'
      setError(message)
      return { error: message }
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteQuiz = useCallback(async (quizId: string) => {
    setLoading(true)
    setError(null)
    try {
      const { error: deleteError } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId)

      if (deleteError) throw deleteError
      return { error: null }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete quiz'
      setError(message)
      return { error: message }
    } finally {
      setLoading(false)
    }
  }, [])

  const createSession = useCallback(async (quizId: string, userId: string | null, participantName?: string) => {
    setLoading(true)
    setError(null)
    try {
      const { data: quiz } = await supabase
        .from('quizzes')
        .select('questions (count)')
        .eq('id', quizId)
        .single()

      const totalQuestions = quiz?.questions?.[0]?.count || 0

      const { data, error: sessionError } = await supabase
        .from('quiz_sessions')
        .insert({
          quiz_id: quizId,
          user_id: userId,
          participant_name: participantName || null,
          total_questions: totalQuestions,
          score: 0,
        })
        .select()
        .single()

      if (sessionError) throw sessionError
      return { data, error: null }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create session'
      setError(message)
      return { data: null, error: message }
    } finally {
      setLoading(false)
    }
  }, [])

  const submitAnswer = useCallback(async (
    sessionId: string,
    questionId: string,
    answerId: string,
    isCorrect: boolean
  ) => {
    setLoading(true)
    setError(null)
    try {
      const { error: answerError } = await supabase
        .from('session_answers')
        .insert({
          session_id: sessionId,
          question_id: questionId,
          answer_id: answerId,
          is_correct: isCorrect,
        })

      if (answerError) throw answerError

      if (isCorrect) {
        const { data: session } = await supabase
          .from('quiz_sessions')
          .select('score')
          .eq('id', sessionId)
          .single()

        if (session) {
          await supabase
            .from('quiz_sessions')
            .update({ score: (session.score || 0) + 1 })
            .eq('id', sessionId)
        }
      }

      return { error: null }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit answer'
      setError(message)
      return { error: message }
    } finally {
      setLoading(false)
    }
  }, [])

  const completeSession = useCallback(async (sessionId: string) => {
    setLoading(true)
    setError(null)
    try {
      const { error: completeError } = await supabase
        .from('quiz_sessions')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', sessionId)

      if (completeError) throw completeError
      return { error: null }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete session'
      setError(message)
      return { error: message }
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchQuizStats = useCallback(async (quizId: string): Promise<{ data: QuizStats | null; error: string | null }> => {
    setLoading(true)
    setError(null)
    try {
      const { data: sessions, error: sessionsError } = await supabase
        .from('quiz_sessions')
        .select('*')
        .eq('quiz_id', quizId)
        .not('completed_at', 'is', null)

      if (sessionsError) throw sessionsError

      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('id, text')
        .eq('quiz_id', quizId)
        .order('order_index', { ascending: true })

      if (questionsError) throw questionsError

      const questionStats: QuestionStats[] = await Promise.all(
        questions.map(async (question: { id: string; text: string }) => {
          const { data: answers } = await supabase
            .from('session_answers')
            .select('*')
            .eq('question_id', question.id)

          const correctAnswers = answers?.filter((a: SessionAnswer) => a.is_correct).length || 0
          const totalAnswers = answers?.length || 0

          return {
            question_id: question.id,
            question_text: question.text,
            correct_answers: correctAnswers,
            total_answers: totalAnswers,
            percentage: totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0,
          }
        })
      )

      const totalSessions = sessions?.length || 0
      const averageScore = totalSessions > 0
        ? sessions.reduce((sum: number, s: QuizSession) => sum + (s.score || 0), 0) / totalSessions
        : 0

      const participants: ParticipantResult[] = (sessions || []).map((s: QuizSession) => ({
        id: s.id,
        participant_name: s.participant_name,
        score: s.score,
        total_questions: s.total_questions,
        percentage: s.total_questions > 0 ? (s.score / s.total_questions) * 100 : 0,
        completed_at: s.completed_at,
        created_at: s.created_at,
      })).sort((a, b) => new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime())

      const stats: QuizStats = {
        total_sessions: totalSessions,
        average_score: averageScore,
        completion_rate: 100,
        question_stats: questionStats,
        participants,
      }

      return { data: stats, error: null }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch stats'
      setError(message)
      return { data: null, error: message }
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchSessionAnswers = useCallback(async (sessionId: string) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('session_answers')
        .select('*')
        .eq('session_id', sessionId)

      if (fetchError) throw fetchError
      return { data, error: null }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch session answers'
      setError(message)
      return { data: null, error: message }
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    fetchPublicQuizzes,
    fetchUserQuizzes,
    fetchQuizById,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    createSession,
    submitAnswer,
    completeSession,
    fetchQuizStats,
    fetchSessionAnswers,
  }
}
