import { pgTable, uuid, varchar, integer, timestamp, boolean, text, pgEnum, jsonb } from 'drizzle-orm/pg-core';

// Team member role enum
export const teamMemberRoleEnum = pgEnum('team_member_role', ['controller', 'viewer']);

// Question type enum
export const questionTypeEnum = pgEnum('question_type', ['git_challenge', 'html_css_challenge', 'js_engine_challenge', 'broken_html_challenge', 'mcq_bidding', 'multiple_choice', 'text_answer', 'true_false_drag_drop', 'match_following', 'image_based']);

// Quiz configuration table
export const quizConfig = pgTable('quiz_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  numberOfTeams: integer('number_of_teams').notNull().default(0),
  teamSize: integer('team_size').notNull().default(0),
  controllersPerTeam: integer('controllers_per_team').notNull().default(1),
  numberOfPresenters: integer('number_of_presenters').notNull().default(1), // Total presenters in system
  currentQuestionId: uuid('current_question_id'), // For presenter - tracks which question is currently active
  showAnswers: boolean('show_answers').notNull().default(false), // Controls answer reveal
  isActive: boolean('is_active').notNull().default(false),
  isScoreboardVisible: boolean('is_scoreboard_visible').notNull().default(false),
  isBidResultsVisible: boolean('is_bid_results_visible').notNull().default(false), // Controls bid table reveal
  isBidQuestionActive: boolean('is_bid_question_active').notNull().default(false), // Global switch for bid round segment
  activeBidQuestionId: uuid('active_bid_question_id'), // Which question's results to show
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Teams table
export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamNumber: integer('team_number').notNull().unique(),
  teamName: varchar('team_name', { length: 100 }),
  currentQuestionId: uuid('current_question_id'),
  score: integer('score').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Questions table
export const questions = pgTable('questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  questionNumber: integer('question_number').notNull().unique(),
  questionType: questionTypeEnum('question_type').notNull().default('text_answer'),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  story: text('story'), // For git_challenge type - the story to display
  options: text('options'), // JSON array of options
  correctAnswer: text('correct_answer'), // JSON for git_challenge (array of commands), text for others
  availableCommands: text('available_commands'), // JSON array of commands for git_challenge
  completedCommands: text('completed_commands'), // JSON array of already completed commands
  // HTML/CSS Challenge fields
  providedHtml: text('provided_html'), // Pre-defined HTML structure
  providedCss: text('provided_css'), // Pre-defined CSS
  targetSelector: varchar('target_selector', { length: 200 }), // Selector to target for CSS challenge
  idealCss: text('ideal_css'), // The expected CSS properties/values for validation
  requiredProperties: text('required_properties'), // JSON array of required CSS properties

  // JS Engineering Challenge fields
  scoringCriteria: text('scoring_criteria'), // JSON defining how to score (e.g. test cases)

  // Broken HTML Challenge fields
  initialTree: text('initial_tree'), // JSON representation of the broken DOM tree
  treeStructure: text('tree_structure'), // JSON representation of the expected DOM tree structure (for validation)
  correctTree: text('correct_tree'), // JSON representation of the correct DOM tree (for reference)

  hints: text('hints'), // JSON array of hints
  points: integer('points').notNull().default(10),
  isEnabled: boolean('is_enabled').notNull().default(true),
  isFlagged: boolean('is_flagged').notNull().default(false), // Marks this question as the "End Quiz" trigger
  timeLimit: integer('time_limit'), // Time limit in seconds
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Team members table (for tracking roles within teams)
export const teamMembers = pgTable('team_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  memberNumber: integer('member_number').notNull(), // 1, 2, 3, etc.
  memberName: varchar('member_name', { length: 255 }), // Player name
  role: teamMemberRoleEnum('role').notNull().default('viewer'),
  sessionId: varchar('session_id', { length: 255 }), // For tracking active sessions
  isActive: boolean('is_active').notNull().default(false), // Has joined
  lastActiveAt: timestamp('last_active_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Team answers table
export const teamAnswers = pgTable('team_answers', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  questionId: uuid('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  answer: text('answer'), // JSON array for git_challenge, text for others
  isCorrect: boolean('is_correct'),
  pointsAwarded: integer('points_awarded').default(0),
  timeStarted: timestamp('time_started'), // When team started the question
  timeCompleted: timestamp('time_completed'), // When team submitted the answer
  timeTaken: integer('time_taken'), // Time in seconds
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
});

// Presenters table
export const presenters = pgTable('presenters', {
  id: uuid('id').primaryKey().defaultRandom(),
  presenterNumber: integer('presenter_number').notNull().unique(),
  presenterName: varchar('presenter_name', { length: 255 }),
  sessionId: varchar('session_id', { length: 255 }),
  isActive: boolean('is_active').notNull().default(false),
  lastActiveAt: timestamp('last_active_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// MCQ Bids table (for bidding round questions)
export const mcqBids = pgTable('mcq_bids', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  questionId: uuid('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  selectedOption: varchar('selected_option', { length: 10 }).notNull(), // 'A', 'B', 'C', 'D'
  bidAmount: integer('bid_amount').notNull(), // Points bid on this option
  isCorrect: boolean('is_correct'), // Set after answer reveal
  pointsAwarded: integer('points_awarded').default(0), // Points won/lost
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
});

// MCQ Timer state table (tracks timer for bidding questions)
export const mcqTimerState = pgTable('mcq_timer_state', {
  id: uuid('id').primaryKey().defaultRandom(),
  questionId: uuid('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }).unique(),
  bidRoundEnabled: boolean('bid_round_enabled').notNull().default(false), // Admin enables bid round
  isRunning: boolean('is_running').notNull().default(false),
  timeRemaining: integer('time_remaining').notNull().default(10), // Seconds
  startedAt: timestamp('started_at'),
  biddingClosed: boolean('bidding_closed').notNull().default(false),
  answerRevealed: boolean('answer_revealed').notNull().default(false),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Types
export type QuizConfig = typeof quizConfig.$inferSelect;
export type NewQuizConfig = typeof quizConfig.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type TeamAnswer = typeof teamAnswers.$inferSelect;
export type NewTeamAnswer = typeof teamAnswers.$inferInsert;
export type Presenter = typeof presenters.$inferSelect;
export type NewPresenter = typeof presenters.$inferInsert;
export type McqBid = typeof mcqBids.$inferSelect;
export type NewMcqBid = typeof mcqBids.$inferInsert;
export type McqTimerState = typeof mcqTimerState.$inferSelect;
export type NewMcqTimerState = typeof mcqTimerState.$inferInsert;
