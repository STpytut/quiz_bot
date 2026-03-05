import OpenAI from 'openai'

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
  dangerouslyAllowBrowser: true,
  defaultHeaders: {
    'HTTP-Referer': window.location.origin,
    'X-Title': 'QuizMaster',
  },
})

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

export async function generateQuizFromText(
  text: string,
  questionCount: number = 5
): Promise<GeneratedQuiz> {
  const completion = await openai.chat.completions.create({
    model: 'google/gemini-3.1-flash-lite-preview',
    messages: [
      {
        role: 'system',
        content: `Ты - эксперт по созданию образовательных викторин. 
                  Создавай вопросы с 4 вариантами ответа (A, B, C, D).
                  Один из ответов должен быть правильным.
                  Вопросы должны быть четкими, понятными и основанными на предоставленном тексте.
                  Возвращай результат в формате JSON: {"questions": [{"text": "текст вопроса", "answers": [{"text": "текст ответа", "is_correct": true/false}]}]}`
      },
      {
        role: 'user',
        content: `Создай викторину из ${questionCount} вопросов по следующему тексту. 
                  Вопросы должны проверять понимание ключевых концепций.
                  Каждый вопрос должен иметь ровно 4 варианта ответа, из которых только один правильный.
                  
                  Текст:
                  ${text}`
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  })

  const content = completion.choices[0].message.content
  if (!content) {
    throw new Error('Не удалось сгенерировать викторину')
  }

  try {
    const quiz = JSON.parse(content) as GeneratedQuiz
    
    if (!quiz.questions || !Array.isArray(quiz.questions)) {
      throw new Error('Неверный формат ответа')
    }

    quiz.questions.forEach((q, index) => {
      if (!q.text || !Array.isArray(q.answers) || q.answers.length !== 4) {
        throw new Error(`Неверный формат вопроса ${index + 1}`)
      }
      
      const correctCount = q.answers.filter(a => a.is_correct).length
      if (correctCount !== 1) {
        throw new Error(`Вопрос ${index + 1} должен иметь ровно один правильный ответ`)
      }
    })

    return quiz
  } catch (error) {
    throw new Error('Ошибка при парсинге ответа AI: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'))
  }
}

export async function validateOpenRouterKey(): Promise<boolean> {
  try {
    await openai.models.list()
    return true
  } catch {
    return false
  }
}
