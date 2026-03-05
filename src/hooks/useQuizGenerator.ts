import { useState, useCallback } from 'react'
import { parseFile, truncateText } from '../utils/fileParser'
import { generateQuizFromText } from '../utils/openRouterClient'
import type { GeneratedQuiz, InputMethod } from '../types/quizGenerator'

export function useQuizGenerator() {
  const [text, setText] = useState('')
  const [questionCount, setQuestionCount] = useState(5)
  const [generatedQuiz, setGeneratedQuiz] = useState<GeneratedQuiz | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inputMethod, setInputMethod] = useState<InputMethod>('text')

  const handleFileUpload = useCallback(async (file: File) => {
    setError(null)
    setGeneratedQuiz(null)
    
    try {
      const fileContent = await parseFile(file)
      const truncatedText = truncateText(fileContent, 10000)
      setText(truncatedText)
      setInputMethod('file')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка при чтении файла'
      setError(message)
    }
  }, [])

  const handleTextChange = useCallback((newText: string) => {
    setText(newText)
    setError(null)
    setGeneratedQuiz(null)
    setInputMethod('text')
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!text.trim()) {
      setError('Пожалуйста, введите текст или загрузите файл')
      return
    }

    if (text.length < 100) {
      setError('Текст слишком короткий для генерации викторины (минимум 100 символов)')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const quiz = await generateQuizFromText(text, questionCount)
      setGeneratedQuiz(quiz)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка при генерации викторины'
      setError(message)
      setGeneratedQuiz(null)
    } finally {
      setIsGenerating(false)
    }
  }, [text, questionCount])

  const updateGeneratedQuestion = useCallback((
    questionIndex: number,
    updates: Partial<GeneratedQuiz['questions'][0]>
  ) => {
    if (!generatedQuiz) return

    const updatedQuestions = [...generatedQuiz.questions]
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      ...updates,
    }

    setGeneratedQuiz({
      ...generatedQuiz,
      questions: updatedQuestions,
    })
  }, [generatedQuiz])

  const updateGeneratedAnswer = useCallback((
    questionIndex: number,
    answerIndex: number,
    updates: Partial<GeneratedQuiz['questions'][0]['answers'][0]>
  ) => {
    if (!generatedQuiz) return

    const updatedQuestions = [...generatedQuiz.questions]
    const updatedAnswers = [...updatedQuestions[questionIndex].answers]
    updatedAnswers[answerIndex] = {
      ...updatedAnswers[answerIndex],
      ...updates,
    }

    if (updates.is_correct === true) {
      updatedAnswers.forEach((answer, index) => {
        if (index !== answerIndex) {
          answer.is_correct = false
        }
      })
    }

    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      answers: updatedAnswers,
    }

    setGeneratedQuiz({
      ...generatedQuiz,
      questions: updatedQuestions,
    })
  }, [generatedQuiz])

  const reset = useCallback(() => {
    setText('')
    setGeneratedQuiz(null)
    setError(null)
    setQuestionCount(5)
    setInputMethod('text')
  }, [])

  return {
    text,
    questionCount,
    generatedQuiz,
    isGenerating,
    error,
    inputMethod,
    setQuestionCount,
    handleFileUpload,
    handleTextChange,
    handleGenerate,
    updateGeneratedQuestion,
    updateGeneratedAnswer,
    reset,
  }
}
