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

export default function TeamQuizPage() {
  const router = useRouter();
  const [teamNumber, setTeamNumber] = useState<number | null>(null);
  const [teamScore, setTeamScore] = useState<number>(700); // Starting score
  const [memberRole, setMemberRole] = useState<string>('viewer');
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [submittedAnswers, setSubmittedAnswers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    const storedTeamNumber = sessionStorage.getItem('teamNumber');
    const storedMemberId = sessionStorage.getItem('memberId');

    if (!storedTeamNumber || !storedMemberId) {
      router.push('/quiz');
      return;
    }

    setTeamNumber(parseInt(storedTeamNumber));

    // Fetch member role
    fetchMemberRole(parseInt(storedTeamNumber), storedMemberId);
    fetchQuestions();
    fetchTeamScore();

    const interval = setInterval(() => {
      fetchQuestions();
      fetchTeamScore();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Timer: Reset on question change
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
  }, [currentQuestionIndex, questions, submittedAnswers]);

  // Timer: Countdown
  useEffect(() => {
    if (!timerRunning || timerSeconds === null) return;

    if (timerSeconds <= 0) {
      setTimerRunning(false);
      // Auto submit
      const q = questions[currentQuestionIndex];
      /* handleInteraction(); // Ensure any pending state updates - actually no, time up means stop */
      if (q && !submittedAnswers.has(q.id)) {
        handleSubmitAnswer(q.id, true); // Pass force flag
      }
      return;
    }

    const interval = setInterval(() => {
      setTimerSeconds((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds, currentQuestionIndex, questions, submittedAnswers]);

  const handleInteraction = () => {
    if (
      timerSeconds !== null &&
      !timerRunning &&
      questions.length > 0 &&
      currentQuestionIndex < questions.length &&
      !submittedAnswers.has(questions[currentQuestionIndex].id)
    ) {
      setTimerRunning(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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

  const fetchQuestions = async () => {
    try {
      const data = await api.getEnabledQuestions();
      // Sort questions by question number
      const sortedData = data.sort((a: any, b: any) => a.questionNumber - b.questionNumber);
      setQuestions(sortedData);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamScore = async () => {
    if (!teamNumber) return;

    try {
      const response = await fetch(`http://localhost:5000/api/public/teams`);
      const teams = await response.json();
      const team = teams.find((t: any) => t.teamNumber === teamNumber);
      if (team) {
        setTeamScore(team.score);
      }
    } catch (error) {
      console.error('Error fetching team score:', error);
    }
  };

  const handleSubmitAnswer = async (questionId: string, forceSubmit = false) => {
    if (!teamNumber || (!forceSubmit && !answers[questionId]?.trim())) {
      if (!forceSubmit) alert('Please enter an answer');
      return;
    }

    // Stop timer
    setTimerRunning(false);

    try {
      const result = await api.submitAnswer(teamNumber, questionId, answers[questionId]);

      setSubmittedAnswers(new Set([...submittedAnswers, questionId]));

      alert(
        result.isCorrect
          ? `Correct! You earned ${result.pointsAwarded} points!`
          : 'Incorrect answer. No points awarded.'
      );

      // Clear the answer input
      setAnswers({ ...answers, [questionId]: '' });
    } catch (error: any) {
      alert(error.message || 'Failed to submit answer');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {questions.length === 0 ? (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Team {teamNumber}</CardTitle>
                <CardDescription>Answer the questions below</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardContent className="py-12 text-center">
                <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No questions available yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Wait for the admin to enable questions
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <>
          <>
            {/* Timer Display */}
            {timerSeconds !== null && questions[currentQuestionIndex] && !submittedAnswers.has(questions[currentQuestionIndex].id) && (
              <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl border-2 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300 ${timerSeconds <= 10 ? 'bg-red-900/90 border-red-500 text-red-100 animate-pulse' : 'bg-slate-900/90 border-blue-500 text-blue-100'
                }`}>
                <div className="flex items-center gap-3">
                  <Clock className={`w-5 h-5 ${timerSeconds <= 10 ? 'text-red-400' : 'text-blue-400'}`} />
                  <div className="font-mono text-xl font-bold">
                    {timerRunning || timerSeconds < (questions[currentQuestionIndex]?.timeLimit || 0) ? formatTime(timerSeconds) : "Start on Interaction"}
                  </div>
                </div>
              </div>
            )}

            {/* Current Question */}
            <div onClickCapture={handleInteraction} onKeyDownCapture={handleInteraction} onTouchStartCapture={handleInteraction}>
              {currentQuestionIndex < questions.length && (() => {
                const q: any = questions[currentQuestionIndex];
                const isSubmitted = submittedAnswers.has(q.id);

                // Git Challenge Question
                if (q.questionType === 'git_challenge') {
                  const gitQuestion = {
                    id: q.id,
                    questionNumber: q.questionNumber,
                    title: q.title,
                    story: q.story || '',
                    availableCommands: q.availableCommands ? JSON.parse(q.availableCommands) : [],
                    completedCommands: q.completedCommands ? JSON.parse(q.completedCommands) : [],
                    correctAnswer: q.correctAnswer ? JSON.parse(q.correctAnswer) : [],
                    points: q.points,
                  };

                  // Check if next question is a bid round
                  const nextQuestion = currentQuestionIndex < questions.length - 1 ? questions[currentQuestionIndex + 1] : null;
                  const nextQuestionIsBidRound = nextQuestion?.questionType === 'mcq_bidding';

                  return (
                    <div key={q.id}>
                      <GitQuizInterface
                        question={gitQuestion}
                        teamNumber={teamNumber!}
                        isController={memberRole === 'controller'}
                        onSubmit={async (answer, timeTaken, startTime) => {
                          try {
                            const result = await api.submitAnswer(
                              teamNumber!,
                              q.id,
                              answer,
                              timeTaken,
                              startTime
                            );
                            setSubmittedAnswers(new Set([...submittedAnswers, q.id]));
                            return {
                              isCorrect: result.isCorrect,
                              pointsAwarded: result.pointsAwarded,
                            };
                          } catch (error: any) {
                            throw new Error(error.message || 'Failed to submit answer');
                          }
                        }}
                        onNext={currentQuestionIndex < questions.length - 1 ? () => setCurrentQuestionIndex(currentQuestionIndex + 1) : undefined}
                        onPrevious={currentQuestionIndex > 0 ? () => setCurrentQuestionIndex(currentQuestionIndex - 1) : undefined}
                        hasNextQuestion={currentQuestionIndex < questions.length - 1}
                        hasPreviousQuestion={currentQuestionIndex > 0}
                        nextQuestionIsBidRound={nextQuestionIsBidRound}
                        isSubmitted={isSubmitted}
                      />
                    </div>
                  );
                }

                // HTML/CSS Challenge Question
                if (q.questionType === 'html_css_challenge') {
                  const htmlCssQuestion = {
                    id: q.id,
                    questionNumber: q.questionNumber,
                    title: q.title,
                    description: q.description || '',
                    providedHtml: q.providedHtml || '',
                    providedCss: q.providedCss || '',
                    targetSelector: q.targetSelector || '',
                    idealCss: q.idealCss || '',
                    requiredProperties: q.requiredProperties ? JSON.parse(q.requiredProperties) : [],
                    scoringCriteria: q.scoringCriteria ? JSON.parse(q.scoringCriteria) : {},
                    points: q.points,
                  };

                  // Check if next question is a bid round
                  const nextQuestion = currentQuestionIndex < questions.length - 1 ? questions[currentQuestionIndex + 1] : null;
                  const nextQuestionIsBidRound = nextQuestion?.questionType === 'mcq_bidding';

                  return (
                    <div key={q.id}>
                      <HtmlCssChallenge
                        question={htmlCssQuestion}
                        teamNumber={teamNumber!}
                        isController={memberRole === 'controller'}
                        onSubmit={async (css, timeTaken, startTime) => {
                          try {
                            const result = await api.submitAnswer(
                              teamNumber!,
                              q.id,
                              css,
                              timeTaken,
                              startTime
                            );
                            setSubmittedAnswers(new Set([...submittedAnswers, q.id]));
                            return {
                              isCorrect: result.isCorrect,
                              pointsAwarded: result.pointsAwarded,
                            };
                          } catch (error: any) {
                            throw new Error(error.message || 'Failed to submit answer');
                          }
                        }}
                        onNext={currentQuestionIndex < questions.length - 1 ? () => setCurrentQuestionIndex(currentQuestionIndex + 1) : undefined}
                        onPrevious={currentQuestionIndex > 0 ? () => setCurrentQuestionIndex(currentQuestionIndex - 1) : undefined}
                        hasNextQuestion={currentQuestionIndex < questions.length - 1}
                        hasPreviousQuestion={currentQuestionIndex > 0}
                        nextQuestionIsBidRound={nextQuestionIsBidRound}
                        isSubmitted={isSubmitted}
                      />
                    </div>
                  );
                }

                // Broken HTML Challenge Question (Tree Builder)
                if (q.questionType === 'broken_html_challenge') {
                  const availableBlocks = q.initialTree ? JSON.parse(q.initialTree) : [];
                  const treeStructure = q.treeStructure ? JSON.parse(q.treeStructure) : { id: 'root', tag: 'div', children: [] };
                  const correctTree = q.correctTree ? JSON.parse(q.correctTree) : { id: 'root', tag: 'div', children: [] };

                  const treeQuestion = {
                    id: q.id,
                    questionNumber: q.questionNumber,
                    title: q.title,
                    description: q.description || '',
                    points: q.points,
                    hints: q.hints ? JSON.parse(q.hints) : [],
                    originalHtml: q.story || '', // The original HTML code to display
                    availableBlocks: availableBlocks as any[], // Explicit cast to avoid type errors
                    treeStructure: treeStructure as any,
                    correctTree: correctTree as any,
                  };

                  // Check if next question is a bid round
                  const nextQuestion = currentQuestionIndex < questions.length - 1 ? questions[currentQuestionIndex + 1] : null;
                  const nextQuestionIsBidRound = nextQuestion?.questionType === 'mcq_bidding';

                  return (
                    <div key={q.id}>
                      <HtmlTreeBuilderFinal
                        question={treeQuestion}
                        teamNumber={teamNumber!}
                        isController={memberRole === 'controller'}
                        onSubmit={async (tree, timeTaken, startTime) => {
                          try {
                            const result = await api.submitAnswer(
                              teamNumber!,
                              q.id,
                              JSON.stringify(tree),
                              timeTaken,
                              startTime
                            );
                            setSubmittedAnswers(new Set([...submittedAnswers, q.id]));
                            return {
                              isCorrect: result.isCorrect,
                              pointsAwarded: result.pointsAwarded,
                            };
                          } catch (error: any) {
                            throw new Error(error.message || 'Failed to submit answer');
                          }
                        }}
                        onNext={currentQuestionIndex < questions.length - 1 ? () => setCurrentQuestionIndex(currentQuestionIndex + 1) : undefined}
                        onPrevious={currentQuestionIndex > 0 ? () => setCurrentQuestionIndex(currentQuestionIndex - 1) : undefined}
                        hasNextQuestion={currentQuestionIndex < questions.length - 1}
                        hasPreviousQuestion={currentQuestionIndex > 0}
                        nextQuestionIsBidRound={nextQuestionIsBidRound}
                        isSubmitted={isSubmitted}
                      />
                    </div>
                  );
                }

                // JS Engine Challenge Question
                if (q.questionType === 'js_engine_challenge') {
                  // Check if next question is a bid round
                  const nextQuestion = currentQuestionIndex < questions.length - 1 ? questions[currentQuestionIndex + 1] : null;
                  const nextQuestionIsBidRound = nextQuestion?.questionType === 'mcq_bidding';

                  return (
                    <div key={q.id}>
                      <JsEngineChallenge
                        question={q}
                        teamNumber={teamNumber!}
                        isController={memberRole === 'controller'}
                        onSubmit={async (answer, timeTaken, startTime) => {
                          try {
                            const result = await api.submitAnswer(
                              teamNumber!,
                              q.id,
                              answer,
                              timeTaken,
                              startTime
                            );
                            setSubmittedAnswers(new Set([...submittedAnswers, q.id]));
                            return {
                              isCorrect: result.isCorrect,
                              pointsAwarded: result.pointsAwarded,
                            };
                          } catch (error: any) {
                            throw new Error(error.message || 'Failed to submit answer');
                          }
                        }}
                        onNext={currentQuestionIndex < questions.length - 1 ? () => setCurrentQuestionIndex(currentQuestionIndex + 1) : undefined}
                        onPrevious={currentQuestionIndex > 0 ? () => setCurrentQuestionIndex(currentQuestionIndex - 1) : undefined}
                        hasNextQuestion={currentQuestionIndex < questions.length - 1}
                        hasPreviousQuestion={currentQuestionIndex > 0}
                        nextQuestionIsBidRound={nextQuestionIsBidRound}
                        isSubmitted={isSubmitted}
                      />
                    </div>
                  );
                }

                // True/False Drag Drop Challenge
                if (q.questionType === 'true_false_drag_drop') {
                  const codeBlocks = q.initialTree ? JSON.parse(q.initialTree) : [];

                  const trueFalseQuestion = {
                    id: q.id,
                    questionNumber: q.questionNumber,
                    title: q.title,
                    description: q.description || '',
                    hints: q.hints ? JSON.parse(q.hints) : [],
                    codeBlocks: codeBlocks,
                    points: q.points,
                  };

                  // Check if next question is a bid round
                  const nextQuestion = currentQuestionIndex < questions.length - 1 ? questions[currentQuestionIndex + 1] : null;
                  const nextQuestionIsBidRound = nextQuestion?.questionType === 'mcq_bidding';

                  return (
                    <div key={q.id}>
                      <TrueFalseDragDropChallenge
                        question={trueFalseQuestion}
                        teamNumber={teamNumber!}
                        isController={memberRole === 'controller'}
                        onSubmit={async (answer, timeTaken, startTime) => {
                          try {
                            const result = await api.submitAnswer(
                              teamNumber!,
                              q.id,
                              JSON.stringify(answer),
                              timeTaken,
                              startTime
                            );
                            setSubmittedAnswers(new Set([...submittedAnswers, q.id]));
                            return {
                              isCorrect: result.isCorrect,
                              pointsAwarded: result.pointsAwarded,
                              correctCount: result.correctCount || 0,
                              totalCount: result.totalCount || codeBlocks.length,
                            };
                          } catch (error: any) {
                            throw new Error(error.message || 'Failed to submit answer');
                          }
                        }}
                        onNext={currentQuestionIndex < questions.length - 1 ? () => setCurrentQuestionIndex(currentQuestionIndex + 1) : undefined}
                        onPrevious={currentQuestionIndex > 0 ? () => setCurrentQuestionIndex(currentQuestionIndex - 1) : undefined}
                        hasNextQuestion={currentQuestionIndex < questions.length - 1}
                        hasPreviousQuestion={currentQuestionIndex > 0}
                        nextQuestionIsBidRound={nextQuestionIsBidRound}
                        isSubmitted={isSubmitted}
                      />
                    </div>
                  );
                }

                // Multiple Choice Question (New)
                if (q.questionType === 'multiple_choice') {
                  const mcqQuestion = {
                    id: q.id,
                    questionNumber: q.questionNumber,
                    title: q.title,
                    description: q.description || '',
                    options: q.options ? JSON.parse(q.options) : [],
                    points: q.points,
                  };

                  // Check if next question is a bid round
                  const nextQuestion = currentQuestionIndex < questions.length - 1 ? questions[currentQuestionIndex + 1] : null;
                  const nextQuestionIsBidRound = nextQuestion?.questionType === 'mcq_bidding';

                  return (
                    <div key={q.id}>
                      <MultipleChoiceChallenge
                        question={mcqQuestion}
                        teamNumber={teamNumber!}
                        isController={memberRole === 'controller'}
                        onSubmit={async (answer, timeTaken, startTime) => {
                          try {
                            const result = await api.submitAnswer(
                              teamNumber!,
                              q.id,
                              answer,
                              timeTaken,
                              startTime
                            );
                            setSubmittedAnswers(new Set([...submittedAnswers, q.id]));
                            return {
                              isCorrect: result.isCorrect,
                              pointsAwarded: result.pointsAwarded,
                            };
                          } catch (error: any) {
                            throw new Error(error.message || 'Failed to submit answer');
                          }
                        }}
                        onNext={currentQuestionIndex < questions.length - 1 ? () => setCurrentQuestionIndex(currentQuestionIndex + 1) : undefined}
                        onPrevious={currentQuestionIndex > 0 ? () => setCurrentQuestionIndex(currentQuestionIndex - 1) : undefined}
                        hasNextQuestion={currentQuestionIndex < questions.length - 1}
                        hasPreviousQuestion={currentQuestionIndex > 0}
                        nextQuestionIsBidRound={nextQuestionIsBidRound}
                        isSubmitted={isSubmitted}
                      />
                    </div>
                  );
                }

                // MCQ Bidding Question
                if (q.questionType === 'mcq_bidding') {
                  const mcqQuestion = {
                    id: q.id,
                    questionNumber: q.questionNumber,
                    title: q.title,
                    description: q.description || '',
                    options: q.options ? JSON.parse(q.options) : [],
                    points: q.points,
                  };

                  return (
                    <div key={q.id}>
                      <McqBiddingChallenge
                        question={mcqQuestion}
                        teamNumber={teamNumber!}
                        teamScore={teamScore}
                        isController={memberRole === 'controller'}
                        onBidSubmitted={() => fetchTeamScore()}
                      />
                    </div>
                  );
                }

                // Regular Text Answer Question
                return (
                  <div key={q.id} className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
                    <div className="max-w-4xl mx-auto space-y-6">
                      <Card>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg">
                                Question {q.questionNumber}
                              </CardTitle>
                              <CardDescription className="mt-2 text-base">
                                {q.title}
                              </CardDescription>
                              {q.description && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  {q.description}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                                {q.points} pts
                              </span>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {isSubmitted ? (
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle className="h-5 w-5" />
                              <span>Answer submitted</span>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor={`answer-${q.id}`}>Your Answer</Label>
                                <Input
                                  id={`answer-${q.id}`}
                                  value={answers[q.id] || ''}
                                  onChange={(e) =>
                                    setAnswers({ ...answers, [q.id]: e.target.value })
                                  }
                                  placeholder="Type your answer..."
                                />
                              </div>
                              <Button onClick={() => handleSubmitAnswer(q.id)}>
                                Submit Answer
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Next Question Button */}
                      <Card>
                        <CardContent className="py-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Question {currentQuestionIndex + 1} of {questions.length}
                              </p>
                            </div>
                            <div className="flex gap-3">
                              <Button variant="outline" onClick={() => router.push('/quiz')}>
                                Change Team
                              </Button>
                              {currentQuestionIndex < questions.length - 1 ? (
                                <Button
                                  onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                                  disabled={!isSubmitted}
                                >
                                  {isSubmitted ? 'Next Question →' : 'Submit answer to continue'}
                                </Button>
                              ) : (
                                <Button disabled variant="outline">
                                  Last Question
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                );
              })()}
            </div>
          </>
        </>
      )}
    </div>
  );
}
