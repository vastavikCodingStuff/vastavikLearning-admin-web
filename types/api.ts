// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  success: boolean;
  access_token: string;
  refresh_token: string;
  user_id: string;
  name: string;
  email: string;
  role: "student" | "admin";
}

export interface AdminUser {
  user_id: string;
  name: string;
  email: string;
  role: "admin";
}

// ─── Students ────────────────────────────────────────────────────────────────

export interface StudentProfile {
  uid: string;
  name: string;
  email: string;
  role: "student" | "admin";
  board: "ICSE" | "CBSE" | string;
  preferred_language: "Java" | "Python" | "JavaScript" | "SQL" | string;
  is_premium: boolean;
  subscription_expires_at: string | null;
  streak_count: number;
  lessons_completed: number;
  created_at: string;
  // Additional detail fields
  class_grade?: string;
  school?: string;
  enrolled_course?: string | null;
  enrolled_course_id?: string | null;
  payment_details?: PaymentDetail[];
}

export interface PaymentDetail {
  order_id: string;
  plan_id: string;
  amount: number;
  currency: "INR";
  status: "pending" | "success" | "failed";
  gateway_transaction_id: string;
  timestamp: string;
}

// ─── Courses ──────────────────────────────────────────────────────────────────

export interface Course {
  id: string;
  title: string;
  description: string;
  icon_name: string;
  color: number;
  order: number;
  is_published: boolean;
}

export interface CoursePart {
  part_id: string;
  title: string;
  description: string;
  order: number;
  subparts: CourseSubpart[];
}

export interface CourseSubpart {
  subpart_id: string;
  title: string;
  lesson_id: string;
}

export interface CourseCurriculum {
  course_id: string;
  parts: CoursePart[];
}

// ─── Video Lessons ────────────────────────────────────────────────────────────

export type VideoType = "screen_recording" | "whiteboard" | "short";

export interface VideoLesson {
  id: string;
  title: string;
  description: string;
  video_type: VideoType;
  youtube_url: string;
  youtube_video_id: string;
  duration_sec: number;
  whiteboard_image_url: string;
  code_sample: string;
  notes: string;
  is_premium: boolean;
  order: number;
  course_id?: string;
  part_id?: string;
}

// ─── Practice Content ─────────────────────────────────────────────────────────

export interface QuizQuestion {
  id: string;
  set_id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  subject: string;
  difficulty: "easy" | "medium" | "hard";
  created_at: string;
}

export interface QuizSet {
  id: string;
  title: string;
  subject: string;
  course_id?: string;
  question_count: number;
  created_at: string;
}

export interface CodingExercise {
  id: string;
  title: string;
  description: string;
  language: "java" | "python" | "javascript" | "sql" | "cpp";
  starter_code: string;
  solution_code: string;
  test_cases: TestCase[];
  difficulty: "easy" | "medium" | "hard";
  created_at: string;
}

export interface TestCase {
  input: string;
  expected_output: string;
}

export interface MCQQuestion {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  subject: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  created_at: string;
}

export interface PYQ {
  id: string;
  board: "ICSE" | "CBSE";
  year: string;
  subject: string;
  question: string;
  solution: string;
  marks: number;
}

export interface PredictOutputSet {
  id: string;
  set_number?: number;
  title: string;
  topic: string;
  question_count?: string;
  difficulty: "easy" | "medium" | "hard" | "Easy" | "Medium" | "Hard";
  code_snippet: string;
  expected_output?: string;
  source?: "sir" | "ai";
  created_at?: string;
}

// ─── AI Chat ─────────────────────────────────────────────────────────────────

export interface AIChatSession {
  session_id: string;
  uid: string;
  student_name: string;
  model_used: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface AIChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  model?: string;
}

// ─── Code Execution Logs ──────────────────────────────────────────────────────

export interface CodeExecutionLog {
  id: string;
  uid: string;
  student_name: string;
  language: string;
  source_code: string;
  stdout: string;
  stderr: string;
  status_description: string;
  execution_time: string;
  memory_kb: number;
  created_at: string;
}

// ─── Student Notes ────────────────────────────────────────────────────────────

export interface StudentNote {
  id: string;
  uid: string;
  student_name: string;
  title: string;
  content: string;
  tag: string;
  created_at: string;
}

// ─── Bug Reports ──────────────────────────────────────────────────────────────

export type BugReportStatus = "open" | "in_progress" | "resolved" | "wont_fix";

export interface BugReport {
  id: string;
  ticket_id: string; // "VBUG-12345"
  uid: string;
  student_name: string;
  title: string;
  description: string;
  category: string;
  device_diagnostics: string;
  media_urls: string[];
  status: BugReportStatus;
  created_at: string;
  resolved_at?: string;
}

// ─── Completion Stats ─────────────────────────────────────────────────────────

export interface CompletionStat {
  uid: string;
  student_name: string;
  course_id: string;
  course_title: string;
  total_parts: number;
  completed_parts: number;
  completion_percent: number;
  last_activity: string;
}

export interface CourseCompletionOverview {
  course_id: string;
  course_title: string;
  enrolled_students: number;
  avg_completion_percent: number;
  fully_completed_count: number;
}

// ─── Growth ───────────────────────────────────────────────────────────────────

export interface GrowthOverview {
  total_referral_codes: number;
  total_shares: number;
  total_referral_rewards_paid: number;
  total_share_rewards_paid: number;
  referral_reward_cap: number;
  share_reward_cap: number;
  referral_reward_inr: number;
  share_reward_inr: number;
}

export interface GrowthReferral {
  code: string;
  uid: string;
  user_name: string;
  user_email: string;
  created_at: string;
  rewarded_count: number;
  pending_count: number;
}

export interface GrowthShare {
  token: string;
  uid: string;
  user_name: string;
  user_email: string;
  status: string;
  clicks: number;
  created_at: string;
  rewarded_at: string | null;
}

export interface GrowthDevice {
  uid: string;
  user_name: string;
  user_email: string;
  active_device_id: string | null;
  active_device_name: string | null;
  active_platform: string | null;
  bound_at: string | null;
  last_seen_at: string | null;
}

export interface GrowthDeviceEvent {
  uid: string;
  event: string;
  device_id: string;
  prev_device_id: string | null;
  platform: string;
  flagged: boolean;
  ts: string;
}

// ─── Admin System ─────────────────────────────────────────────────────────────

export type RouteStatus = Record<string, boolean>;

export interface HealthResponse {
  status: string;
  uptime_seconds: number;
  route_status: RouteStatus;
  environment: string;
}

export interface AppUpdateInfo {
  version_name: string;
  version_code: number;
  download_url: string;
  changelog: string;
  is_force_update: boolean;
  published_at: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface ApiError {
  status: string;
  error: string;
  message: string;
}
