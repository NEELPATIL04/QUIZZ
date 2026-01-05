CREATE TYPE "public"."team_member_role" AS ENUM('controller', 'viewer');--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_number" integer NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"options" text,
	"correct_answer" text,
	"points" integer DEFAULT 10 NOT NULL,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "questions_question_number_unique" UNIQUE("question_number")
);
--> statement-breakpoint
CREATE TABLE "quiz_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number_of_teams" integer DEFAULT 0 NOT NULL,
	"team_size" integer DEFAULT 0 NOT NULL,
	"controllers_per_team" integer DEFAULT 1 NOT NULL,
	"current_question_id" uuid,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"answer" text,
	"is_correct" boolean,
	"points_awarded" integer DEFAULT 0,
	"submitted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"member_number" integer NOT NULL,
	"role" "team_member_role" DEFAULT 'viewer' NOT NULL,
	"session_id" varchar(255),
	"last_active_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_number" integer NOT NULL,
	"team_name" varchar(100),
	"current_question_id" uuid,
	"score" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "teams_team_number_unique" UNIQUE("team_number")
);
--> statement-breakpoint
ALTER TABLE "team_answers" ADD CONSTRAINT "team_answers_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_answers" ADD CONSTRAINT "team_answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;