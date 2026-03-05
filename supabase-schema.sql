-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Quizzes table
CREATE TABLE quizzes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions table
CREATE TABLE questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Answers table
CREATE TABLE answers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quiz sessions table
CREATE TABLE quiz_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  participant_name TEXT,
  score INTEGER DEFAULT 0,
  total_questions INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session answers table
CREATE TABLE session_answers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES quiz_sessions(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  answer_id UUID REFERENCES answers(id) ON DELETE CASCADE NOT NULL,
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX idx_answers_question_id ON answers(question_id);
CREATE INDEX idx_quiz_sessions_quiz_id ON quiz_sessions(quiz_id);
CREATE INDEX idx_session_answers_session_id ON session_answers(session_id);

-- Enable Row Level Security
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quizzes
CREATE POLICY "Users can view public quizzes"
  ON quizzes FOR SELECT
  USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Users can create quizzes"
  ON quizzes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own quizzes"
  ON quizzes FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own quizzes"
  ON quizzes FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for questions
CREATE POLICY "Users can view questions of accessible quizzes"
  ON questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quizzes
      WHERE quizzes.id = questions.quiz_id
      AND (quizzes.is_public = true OR quizzes.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can create questions in their quizzes"
  ON questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quizzes
      WHERE quizzes.id = questions.quiz_id
      AND quizzes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update questions in their quizzes"
  ON questions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM quizzes
      WHERE quizzes.id = questions.quiz_id
      AND quizzes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete questions in their quizzes"
  ON questions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM quizzes
      WHERE quizzes.id = questions.quiz_id
      AND quizzes.user_id = auth.uid()
    )
  );

-- RLS Policies for answers
CREATE POLICY "Users can view answers of accessible questions"
  ON answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM questions
      JOIN quizzes ON quizzes.id = questions.quiz_id
      WHERE questions.id = answers.question_id
      AND (quizzes.is_public = true OR quizzes.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can create answers in their questions"
  ON answers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM questions
      JOIN quizzes ON quizzes.id = questions.quiz_id
      WHERE questions.id = answers.question_id
      AND quizzes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update answers in their questions"
  ON answers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM questions
      JOIN quizzes ON quizzes.id = questions.quiz_id
      WHERE questions.id = answers.question_id
      AND quizzes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete answers in their questions"
  ON answers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM questions
      JOIN quizzes ON quizzes.id = questions.quiz_id
      WHERE questions.id = answers.question_id
      AND quizzes.user_id = auth.uid()
    )
  );

-- RLS Policies for quiz_sessions
CREATE POLICY "Users can view their own sessions and public quiz sessions"
  ON quiz_sessions FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM quizzes
      WHERE quizzes.id = quiz_sessions.quiz_id
      AND quizzes.is_public = true
    )
  );

CREATE POLICY "Users can create sessions"
  ON quiz_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own sessions"
  ON quiz_sessions FOR UPDATE
  USING (user_id = auth.uid());

-- RLS Policies for session_answers
CREATE POLICY "Users can view their own session answers"
  ON session_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quiz_sessions
      WHERE quiz_sessions.id = session_answers.session_id
      AND (quiz_sessions.user_id = auth.uid() OR quiz_sessions.user_id IS NULL)
    )
  );

CREATE POLICY "Users can create session answers"
  ON session_answers FOR INSERT
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON quizzes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
