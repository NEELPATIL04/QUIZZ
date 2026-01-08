'use client';

import { useEffect, useState, useRef } from 'react';
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
import BidRoundInstructions from '@/components/BidRoundInstructions';

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

  // Use ref to track current question index for closures
  const currentQuestionIndexRef = useRef(currentQuestionIndex);

  useEffect(() => {
    currentQuestionIndexRef.current = currentQuestionIndex;
  }, [currentQuestionIndex]);

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

  const [globalActiveQuestionId, setGlobalActiveQuestionId] = useState<string | null>(null);
  const [bidRoundState, setBidRoundState] = useState<{
    hasEnteredBidRound: boolean;
    questionBeforeBidRound: number | null;
    lastActiveBidQuestion: number | null;
  }>({
    hasEnteredBidRound: false,
    questionBeforeBidRound: null,
    lastActiveBidQuestion: null,
  });

  // Load bid round state from sessionStorage on mount
  useEffect(() => {
    if (teamNumber !== null) {
      const savedState = sessionStorage.getItem(`bidRoundState_${teamNumber}`);
      if (savedState) {
        try {
          setBidRoundState(JSON.parse(savedState));
        } catch (e) {
          console.error('Error parsing bid round state:', e);
        }
      }
    }
  }, [teamNumber]);

  // Save bid round state to sessionStorage whenever it changes
  useEffect(() => {
    if (teamNumber !== null) {
      sessionStorage.setItem(`bidRoundState_${teamNumber}`, JSON.stringify(bidRoundState));
    }
  }, [bidRoundState, teamNumber]);

  useEffect(() => {
    if (!teamNumber) return;
    const interval = setInterval(() => {
      fetchQuestions();
      fetchTeamScore(teamNumber);

      // Poll for global current question to auto-jump
      api.getCurrentQuestion().then((currentQData) => {
        if (currentQData && currentQData.id) {
          setGlobalActiveQuestionId(currentQData.id); // Store global active ID
          setQuestions((currentQuestions) => {
            const index = currentQuestions.findIndex(q => q.id === currentQData.id);
            if (index !== -1) {
              // CRITICAL FIX: Don't auto-sync for bid round questions
              // Check BOTH the current question AND the target question
              const currentQ = currentQuestions[currentQuestionIndexRef.current];
              const targetQ = currentQuestions[index];
              const isCurrentBidRound = currentQ && currentQ.questionType === 'mcq_bidding';
              const isTargetBidRound = targetQ && targetQ.questionType === 'mcq_bidding';

              // Only auto-sync if NEITHER current NOR target is a bid round question
              // This prevents jumping TO bid rounds and jumping FROM bid rounds
              if (!isCurrentBidRound && !isTargetBidRound) {
                setCurrentQuestionIndex((prev) => {
                  if (prev !== index) return index;
                  return prev;
                });
              }
            }
            return currentQuestions;
          });
        } else {
          setGlobalActiveQuestionId(null);
        }
      }).catch(err => console.error("Error polling current question", err));
    }, 2000);
    return () => clearInterval(interval);
  }, [teamNumber, questions, currentQuestionIndex]);

  // Separate effect for fetching MCQ timer state
  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex < questions.length) {
      const q = questions[currentQuestionIndex];
      if (q && q.questionType === 'mcq_bidding') {
        // DON'T clear timer state immediately - keep showing previous state until new one loads
        // This prevents flickering

        // Fetch immediately when question changes
        fetchMcqTimerState(q.id);

        // Then poll every 2 seconds
        const interval = setInterval(() => {
          fetchMcqTimerState(q.id);
        }, 2000);

        return () => clearInterval(interval);
      } else {
        // Not a bid round question, clear the timer state
        setMcqTimerState(null);
      }
    }
  }, [currentQuestionIndex, questions]);

  const fetchMcqTimerState = async (questionId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/mcq/${questionId}/timer`, {
        cache: 'no-store'
      });
      const data = await response.json();
      const newTimerState = data.timerState;

      // Update state only if something actually changed
      setMcqTimerState((prevState: any) => {
        // If no new state, return previous to avoid re-render
        if (!newTimerState) return prevState;

        // Check if this is for a different question - only update if it's the current one
        if (prevState && prevState.questionId !== questionId) {
          // Different question, update
          return { ...newTimerState, questionId };
        }

        // Same question - check if anything actually changed
        if (prevState &&
          prevState.bidRoundEnabled === newTimerState.bidRoundEnabled &&
          prevState.isRunning === newTimerState.isRunning &&
          prevState.timeRemaining === newTimerState.timeRemaining &&
          prevState.biddingClosed === newTimerState.biddingClosed &&
          prevState.answerRevealed === newTimerState.answerRevealed) {
          // Nothing changed, return previous state to prevent re-render
          return prevState;
        }

        // Check if bid round was disabled while we're in a bid round question
        if (prevState && prevState.questionId === questionId &&
          prevState.bidRoundEnabled && newTimerState && !newTimerState.bidRoundEnabled) {
          // Bid round was just disabled - save the current question as last active using ref
          setBidRoundState(prevBidState => {
            if (prevBidState.hasEnteredBidRound) {
              return {
                ...prevBidState,
                lastActiveBidQuestion: currentQuestionIndexRef.current,
              };
            }
            return prevBidState;
          });
        }

        // Something changed, return new state with questionId
        return { ...newTimerState, questionId };
      });
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/teams/${teamNum}/members`);
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

      // Check if it looks like JSON (starts with [ or { or ")
      const trimmed = value.trim();
      if (trimmed.startsWith('[') || trimmed.startsWith('{') || trimmed.startsWith('"')) {
        try {
          const parsed = JSON.parse(value);
          // Handle double-encoded JSON (common issue)
          // Check if result is still a string that looks like JSON
          if (typeof parsed === 'string') {
            const trimmedParsed = parsed.trim();
            if (trimmedParsed.startsWith('[') || trimmedParsed.startsWith('{') || trimmedParsed.startsWith('"')) {
              try {
                return JSON.parse(parsed);
              } catch {
                return parsed; // Return first parse if second fails
              }
            }
          }

          return parsed;
        } catch (e) {
          console.error("safeJsonParse Failed:", e, "Value:", value);
          // Try one last desperate parse if it looks like a string wrapped in quotes but JSON.parse failed?
          // No, usually that means malformed JSON.
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

          if (q.questionNumber === 7) {
            console.log("DEBUG Q7 Raw Options:", q.options);
            console.log("DEBUG Q7 Parsed Options:", parsedOptions);
            console.log("DEBUG Q7 Transformed:", transformOptions(parsedOptions));
          }

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
            // Keep correctAnswer as string for multi-select detection to work
            correctAnswer: q.correctAnswer,
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
      return;
    }

    if (currentQuestionIndex < questions.length - 1) {
      const nextQuestion = questions[currentQuestionIndex + 1];

      // Check if current question is a bid round question
      const isCurrentBidRound = currentQ?.questionType === 'mcq_bidding';
      const isNextBidRound = nextQuestion?.questionType === 'mcq_bidding';

      if (isNextBidRound && !bidRoundState.hasEnteredBidRound) {
        // Entering bid round for the first time - save current question
        setBidRoundState({
          hasEnteredBidRound: true,
          questionBeforeBidRound: currentQuestionIndex,
          lastActiveBidQuestion: currentQuestionIndex + 1,
        });
      } else if (isNextBidRound && bidRoundState.hasEnteredBidRound) {
        // Moving within bid round - update last active
        setBidRoundState(prev => ({
          ...prev,
          lastActiveBidQuestion: currentQuestionIndex + 1,
        }));
      }

      setCurrentQuestionIndex(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      const currentQ = questions[currentQuestionIndex];
      const prevQuestion = questions[currentQuestionIndex - 1];

      // Check if we're in a bid round and updating the last active question
      const isCurrentBidRound = currentQ?.questionType === 'mcq_bidding';
      const isPrevBidRound = prevQuestion?.questionType === 'mcq_bidding';

      if (isPrevBidRound && bidRoundState.hasEnteredBidRound) {
        // Moving within bid round - update last active
        setBidRoundState(prev => ({
          ...prev,
          lastActiveBidQuestion: currentQuestionIndex - 1,
        }));
      }

      setCurrentQuestionIndex(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleExitBidRound = () => {
    const currentQ = questions[currentQuestionIndex];
    const isCurrentBidRound = currentQ?.questionType === 'mcq_bidding';

    if (!isCurrentBidRound) return;

    // Find the first and last bid round questions
    const firstBidRoundIndex = questions.findIndex(q => q.questionType === 'mcq_bidding');
    const lastBidRoundIndex = questions.map(q => q.questionType === 'mcq_bidding').lastIndexOf(true);

    const isFirstBidQuestion = currentQuestionIndex === firstBidRoundIndex;
    const isLastBidQuestion = currentQuestionIndex === lastBidRoundIndex;

    if (isFirstBidQuestion) {
      // Exit from FIRST question - go back to question BEFORE bid round (Q14)
      if (bidRoundState.questionBeforeBidRound !== null) {
        setCurrentQuestionIndex(bidRoundState.questionBeforeBidRound);
      } else {
        // Fallback: find the question just before the first bid round
        const prevIndex = firstBidRoundIndex - 1;
        if (prevIndex >= 0) {
          setCurrentQuestionIndex(prevIndex);
        }
      }
      // Reset bid round state
      setBidRoundState({
        hasEnteredBidRound: false,
        questionBeforeBidRound: null,
        lastActiveBidQuestion: null,
      });
    } else if (isLastBidQuestion) {
      // Exit from LAST question - go to next question AFTER bid round (Q18)
      const nextNonBidRoundIndex = questions.findIndex((q, idx) =>
        idx > currentQuestionIndex && q.questionType !== 'mcq_bidding'
      );

      if (nextNonBidRoundIndex !== -1) {
        setCurrentQuestionIndex(nextNonBidRoundIndex);
      }
      // Reset bid round state
      setBidRoundState({
        hasEnteredBidRound: false,
        questionBeforeBidRound: null,
        lastActiveBidQuestion: null,
      });
    }
    // If on middle question (Q16), exit button shouldn't appear, so do nothing

    window.scrollTo(0, 0);
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
    const isCurrentBidRound = currentQuestion?.questionType === 'mcq_bidding';

    // Determine if this is the first or last bid round question
    const firstBidRoundIndex = questions.findIndex(q => q.questionType === 'mcq_bidding');
    const lastBidRoundIndex = questions.reduce((lastIdx, q, idx) =>
      q.questionType === 'mcq_bidding' ? idx : lastIdx, -1);

    const isFirstBidQuestion = currentQuestionIndex === firstBidRoundIndex;
    const isLastBidQuestion = currentQuestionIndex === lastBidRoundIndex;

    return {
      teamNumber: teamNumber!,
      isController: memberRole === 'controller',
      onNext: handleNextQuestion,
      hasNextQuestion: true, // We want the button to appear. If end of quiz, handleNextQuestion triggers end screen.
      nextQuestionIsBidRound: isNextQuestionBidRound,
      onPrevious: handlePreviousQuestion,
      hasPreviousQuestion: currentQuestionIndex > 0,
      onExitBidRound: handleExitBidRound,
      isFirstBidQuestion,
      isLastBidQuestion,
      isBidRound: isCurrentBidRound,
      bidRoundState,
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

  // Check if we should show instructions page for bid round
  // Show instructions ONLY when bid rounds are DISABLED (bidRoundEnabled = false)
  // Once enabled, all bid round questions show directly without instructions between them
  if (currentQuestion.questionType === 'mcq_bidding') {
    if (!mcqTimerState) {
      // Still loading timer state - show spinner
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      );
    }

    // If bid round is DISABLED, show instructions page
    if (!mcqTimerState.bidRoundEnabled) {
      return <BidRoundInstructions />;
    }

    // If bid round is ENABLED, continue to show the actual question below
  }

  return (
    <>
      {currentQuestion.questionType === 'git_challenge' ? (
        <GitQuizInterface question={currentQuestion} {...commonProps} />
      ) : currentQuestion.questionType === 'html_css_challenge' ? (
        <HtmlCssChallenge question={currentQuestion} {...commonProps} />
      ) : currentQuestion.questionType === 'js_engine_challenge' ? (
        <JsEngineChallenge question={currentQuestion} {...commonProps} teamScore={teamScore} />
      ) : currentQuestion.questionType === 'mcq_bidding' ? (
        <McqBiddingChallenge question={currentQuestion} {...commonProps} teamScore={teamScore} mcqTimerState={mcqTimerState} />
      ) : currentQuestion.questionType === 'broken_html_challenge' ? (
        <HtmlTreeBuilderFinal question={currentQuestion} {...commonProps} />
      ) : currentQuestion.questionType === 'true_false_drag_drop' ? (
        <TrueFalseDragDropChallenge question={currentQuestion} {...commonProps} />
      ) : currentQuestion.questionType === 'match_following' ? (
        <MatchFollowingChallenge question={currentQuestion} {...commonProps} />
      ) : (
        <MultipleChoiceChallenge
          question={currentQuestion}
          {...commonProps}
          isMultiSelect={(() => {
            try {
              if (!currentQuestion.correctAnswer) return false;
              const parsed = JSON.parse(currentQuestion.correctAnswer);
              return Array.isArray(parsed) && parsed.length > 1;
            } catch (e) {
              return false;
            }
          })()}
        />
      )}
    </>
  );
}
