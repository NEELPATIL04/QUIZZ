'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { CheckCircle, XCircle, Lock, Clock } from 'lucide-react';
import GitQuizInterface from '@/components/GitQuizInterface';
import HtmlCssChallenge from '@/components/HtmlCssChallenge';
import JsEngineChallenge from '@/components/JsEngineChallenge';
import McqBiddingChallenge from '@/components/McqBiddingChallenge';
import HtmlTreeBuilderFinal from '@/components/HtmlTreeBuilderFinal';
import TrueFalseDragDropChallenge from '@/components/TrueFalseDragDropChallenge';
import MultipleChoiceChallenge from '@/components/MultipleChoiceChallenge';
import MatchFollowingChallenge from '@/components/MatchFollowingChallenge';

export default function TeamQuizPage() {
  const router = useRouter();
  const [teamNumber, setTeamNumber] = useState<number | null>(null);
  const [teamScore, setTeamScore] = useState<number>(0);
  const [memberRole, setMemberRole] = useState<string>('viewer');
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [submittedAnswers, setSubmittedAnswers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [isQuizEnded, setIsQuizEnded] = useState(false);
  const [winnerTeam, setWinnerTeam] = useState<any>(null);
  const [mcqTimerState, setMcqTimerState] = useState<any>(null);

  useEffect(() => {
    const storedTeamNumber = sessionStorage.getItem('teamNumber');
    const storedMemberId = sessionStorage.getItem('memberId');

    if (!storedTeamNumber || !storedMemberId) {
      router.push('/quiz');
      return;
    }

    const tNum = parseInt(storedTeamNumber);
    setTeamNumber(tNum);

    const savedIndex = sessionStorage.getItem(`currentQuestionIndex_${tNum}`);
    if (savedIndex) {
      setCurrentQuestionIndex(parseInt(savedIndex));
    }

    fetchMemberRole(tNum, storedMemberId);
    fetchQuestions();
    fetchTeamScore(tNum);
  }, []);

  useEffect(() => {
    if (teamNumber !== null) {
      sessionStorage.setItem(`currentQuestionIndex_${teamNumber}`, currentQuestionIndex.toString());
    }
  }, [currentQuestionIndex, teamNumber]);

  useEffect(() => {
    if (!teamNumber) return;
    const interval = setInterval(() => {
      fetchQuestions();
      fetchTeamScore(teamNumber);
      // Fetch MCQ timer state if current question is mcq_bidding
      if (questions.length > 0 && currentQuestionIndex < questions.length) {
        const q = questions[currentQuestionIndex];
        if (q && q.questionType === 'mcq_bidding') {
          fetchMcqTimerState(q.id);
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [teamNumber, questions, currentQuestionIndex]);

  // Redirect to instructions if MCQ bid round is disabled
  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex < questions.length) {
      const currentQ = questions[currentQuestionIndex];
      if (currentQ && currentQ.questionType === 'mcq_bidding') {
        if (mcqTimerState && !mcqTimerState.bidRoundEnabled) {
          router.push(`/quiz/bid-instructions?questionId=${currentQ.id}`);
        }
      }
    }
  }, [mcqTimerState, questions, currentQuestionIndex, router]);

  const fetchMcqTimerState = async (questionId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/quiz/mcq/${questionId}/timer`, {
        cache: 'no-store'
      });
      const data = await response.json();
      setMcqTimerState(data.timerState);
    } catch (error) {
      console.error('Error fetching MCQ timer state:', error);
    }
  };

  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex < questions.length) {
      const q = questions[currentQuestionIndex];
      if (q && q.timeLimit && !submittedAnswers.has(q.id)) {
        setTimerSeconds(q.timeLimit);
        setTimerRunning(false);
      } else {
        setTimerSeconds(null);
        setTimerRunning(false);
      }
    }
  }, [currentQuestionIndex, questions.length]);

  useEffect(() => {
    if (!timerRunning || timerSeconds === null) return;
    if (timerSeconds <= 0) {
      setTimerRunning(false);
      return;
    }
    const interval = setInterval(() => {
      setTimerSeconds((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  const fetchMemberRole = async (teamNum: number, memberId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/public/teams/${teamNum}/members`);
      const members = await response.json();
      const member = members.find((m: any) => m.id === memberId);
      if (member) {
        setMemberRole(member.role);
      }
    } catch (error) {
      console.error('Error fetching member role:', error);
    }
  };

  const safeJsonParse = (value: any, fallback: any) => {
    // Handle null, undefined, or string representations of them
    if (!value || value === 'undefined' || value === 'null') return fallback;

    // If already parsed, return as-is
    if (typeof value === 'object') return value;

    // If it's a string, try to parse it
    if (typeof value === 'string') {
      // Empty string
      if (value.trim() === '') return fallback;

      // Check if it looks like JSON (starts with [ or {)
      const trimmed = value.trim();
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        try {
          return JSON.parse(value);
        } catch {
          return fallback;
        }
      }

      // Plain text - return fallback for safety
      return fallback;
    }

    return value;
  };

  const transformOptions = (options: any) => {
    if (!options || !Array.isArray(options)) return [];

    // If already in correct format (has key and text properties)
    if (options.length > 0 && typeof options[0] === 'object' && 'key' in options[0] && 'text' in options[0]) {
      return options;
    }

    // Transform string array to option objects
    if (options.length > 0 && typeof options[0] === 'string') {
      return options.map((text: string, index: number) => ({
        key: String.fromCharCode(65 + index), // A, B, C, D...
        text: text
      }));
    }

    return options;
  };

  const fetchQuestions = async () => {
    try {
      const data = await api.getEnabledQuestions();
      const parsedData = data.map((q: any) => {
        try {
          const parsedOptions = safeJsonParse(q.options, []);
          return {
            ...q,
            options: transformOptions(parsedOptions),
            hints: safeJsonParse(q.hints, []),
            scoringCriteria: safeJsonParse(q.scoringCriteria, {}),
            initialTree: safeJsonParse(q.initialTree, null),
            treeStructure: safeJsonParse(q.treeStructure, null),
            correctTree: safeJsonParse(q.correctTree, null),
            requiredProperties: safeJsonParse(q.requiredProperties, []),
            availableCommands: safeJsonParse(q.availableCommands, []),
            completedCommands: safeJsonParse(q.completedCommands, []),
            correctAnswer: safeJsonParse(q.correctAnswer, []),
            availableBlocks: safeJsonParse(q.initialTree, []),
            codeBlocks: q.questionType === 'true_false_drag_drop' ? safeJsonParse(q.initialTree, []) : safeJsonParse(q.codeBlocks, []),
            originalHtml: q.story || '',
          };
        } catch (e) {
          console.error("Failed to parse question data", q.id, e);
          return q;
        }
      });
      const sortedData = parsedData.sort((a: any, b: any) => a.questionNumber - b.questionNumber);
      setQuestions(sortedData);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamScore = async (tNum?: number) => {
    const targetTeamNumber = tNum ?? teamNumber;
    if (!targetTeamNumber) return;
    try {
      const teams = await api.getPublicTeams();
      const team = teams.find((t: any) => t.teamNumber === targetTeamNumber);
      if (team) {
        setTeamScore(team.score);
      }
    } catch (error) {
      console.error('Error fetching team score:', error);
    }
  };

  const fetchWinner = async () => {
    try {
      const teams = await api.getPublicTeams();
      const sorted = teams.sort((a: any, b: any) => b.score - a.score);
      if (sorted.length > 0) {
        setWinnerTeam(sorted[0]);
      }
    } catch (e) {
      console.error("Failed to fetch winner", e);
    }
  };

  const handleNextQuestion = () => {
    const currentQ = questions[currentQuestionIndex];
    if (currentQ?.isFlagged) {
      setIsQuizEnded(true);
      fetchWinner();
    } else if (currentQuestionIndex < questions.length - 1) {
      const nextQ = questions[currentQuestionIndex + 1];

      // If next question is MCQ bidding, go to instructions page
      if (nextQ && nextQ.questionType === 'mcq_bidding') {
        router.push(`/quiz/bid-instructions?questionId=${nextQ.id}`);
      } else {
        setCurrentQuestionIndex(prev => prev + 1);
        window.scrollTo(0, 0);
      }
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  if (isQuizEnded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4 text-white overflow-hidden relative">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-2 h-2 bg-yellow-500 rounded-full animate-bounce delay-100"></div>
          <div className="absolute top-0 right-1/4 w-3 h-3 bg-red-500 rounded-full animate-pulse delay-200"></div>
        </div>

        <Card className="w-full max-w-2xl bg-white/10 backdrop-blur-xl border-white/20 text-center p-12">
          <div className="mb-8 animate-bounce">
            <span className="text-6xl">🏆</span>
          </div>
          <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">
            Quiz Completed!
          </h1>
          <p className="text-xl text-gray-200 mb-12">
            Thank you for participating.
          </p>

          {winnerTeam && (
            <div className="bg-white/10 rounded-2xl p-8 border border-yellow-500/30 shadow-[0_0_50px_rgba(234,179,8,0.2)]">
              <p className="text-sm uppercase tracking-widest text-yellow-400 mb-2">The Winner Is</p>
              <h2 className="text-4xl font-black text-white mb-2">{winnerTeam.teamName}</h2>
              <p className="text-2xl text-yellow-300 font-bold">{winnerTeam.score} pts</p>
            </div>
          )}
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <p className="text-slate-600">Waiting for questions...</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) return <div>Invalid Question Index</div>;

  const getCommonProps = () => {
    // Check if next question is first MCQ bidding question
    const nextQuestion = questions[currentQuestionIndex + 1];
    const isNextQuestionBidRound = nextQuestion && nextQuestion.questionType === 'mcq_bidding';

    return {
      teamNumber: teamNumber!,
      isController: memberRole === 'controller',
      onNext: handleNextQuestion,
      hasNextQuestion: true, // We want the button to appear. If end of quiz, handleNextQuestion triggers end screen.
      nextQuestionIsBidRound: isNextQuestionBidRound,
      onPrevious: handlePreviousQuestion,
      hasPreviousQuestion: currentQuestionIndex > 0,
      onSubmit: async (answer: any, timeTaken?: number, startTime?: number | Date) => {
        try {
          const result = await api.submitAnswer(
            teamNumber!,
            currentQuestion.id,
            answer,
            timeTaken,
            startTime
          );
          setSubmittedAnswers(new Set([...submittedAnswers, currentQuestion.id]));
          return {
            isCorrect: result.isCorrect,
            pointsAwarded: result.pointsAwarded,
            correctCount: result.correctCount,
            totalCount: result.totalCount
          }
        } catch (e: any) {
          throw new Error(e.message || "Failed to submit");
        }
      }
    };
  };

  const commonProps = getCommonProps();

  return (
    <>
      {currentQuestion.questionType === 'git_challenge' ? (
        <GitQuizInterface question={currentQuestion} {...commonProps} />
      ) : currentQuestion.questionType === 'html_css_challenge' ? (
        <HtmlCssChallenge question={currentQuestion} {...commonProps} />
      ) : currentQuestion.questionType === 'js_engine_challenge' ? (
        <JsEngineChallenge question={currentQuestion} {...commonProps} />
      ) : currentQuestion.questionType === 'mcq_bidding' ? (
        <McqBiddingChallenge question={currentQuestion} {...commonProps} teamScore={teamScore} />
      ) : currentQuestion.questionType === 'broken_html_challenge' ? (
        <HtmlTreeBuilderFinal question={currentQuestion} {...commonProps} />
      ) : currentQuestion.questionType === 'true_false_drag_drop' ? (
        <TrueFalseDragDropChallenge question={currentQuestion} {...commonProps} />
      ) : currentQuestion.questionType === 'match_following' ? (
        <MatchFollowingChallenge question={currentQuestion} {...commonProps} />
      ) : (
        <MultipleChoiceChallenge question={currentQuestion} {...commonProps} />
      )}
    </>
  );
}
