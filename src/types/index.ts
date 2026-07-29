export interface ProblemAttempt {
  id: string
  day_number: number
  problem_title: string
  problem_topic: string
  difficulty: string
  status: string
  time_spent_seconds: number
  accuracy: number
  code_content: string
  language: string
  solved_at: string | null
  created_at: string
}

export interface StudySession {
  id: string
  day_number: number
  block_name: string
  topic: string
  planned_duration_minutes: number
  actual_duration_seconds: number
  started_at: string | null
  ended_at: string | null
  completed: boolean
  created_at: string
}

export interface FocusLog {
  id: string
  day_number: number
  session_start: string | null
  session_end: string | null
  total_seconds: number
  focused_seconds: number
  distracted_seconds: number
  away_seconds: number
  focus_score: number
  created_at: string
}

export interface WeakTopic {
  id: string
  topic_name: string
  topic_category: string
  notes: string
  severity: string
  reminder_enabled: boolean
  last_reminded: string | null
  resolved: boolean
  created_at: string
}

export interface DailyNote {
  id: string
  day_number: number
  note_text: string
  energy_level: number
  created_at: string
  updated_at: string
}

export interface StudyRecording {
  id: string
  day_number: number
  block_name: string
  topic: string
  duration_seconds: number
  note: string
  file_name: string
  created_at: string
}
