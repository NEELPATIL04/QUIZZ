'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clock, TrendingUp, AlertTriangle, Trophy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import BidRoundInstructions from './BidRoundInstructions';
import McqResultsTable from './McqResultsTable';

interface McqQuestion {
  id: string;
  questionNumber: number;
  title: string;
  description: string;
  options: { key: string; text: string }[];
  points: number;
}

interface McqBiddingChallengeProps {
  question: McqQuestion;
  teamNumber: number;
  teamScore: number;
  isController: boolean;
  onBidSubmitted?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onExitBidRound?: () => void;
  hasNextQuestion?: boolean;
  hasPreviousQuestion?: boolean;
  nextQuestionIsBidRound?: boolean;
  isFirstBidQuestion?: boolean;
  isLastBidQuestion?: boolean;
  isBidRound?: boolean;
  bidRoundState?: {
    hasEnteredBidRound: boolean;
    questionBeforeBidRound: number | null;
    lastActiveBidQuestion: number | null;
  };
  mcqTimerState?: any;
}

export default function McqBiddingChallenge({
  question,
  teamNumber,
  teamScore,
  isController,
  onBidSubmitted,
  onNext,
  onPrevious,
  onExitBidRound,
  hasNextQuestion,
  hasPreviousQuestion,
  nextQuestionIsBidRound = false,
  isFirstBidQuestion = false,
  isLastBidQuestion = false,
  isBidRound = true,
  bidRoundState,
  mcqTimerState: externalTimerState,
}: McqBiddingChallengeProps) {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [bidAmount, setBidAmount] = useState<number>(100);
  const [timerState, setTimerState] = useState<any>(externalTimerState || null);
  const [bidSubmitted, setBidSubmitted] = useState(false);
  const [submittedBid, setSubmittedBid] = useState<any>(null);
  const [mcqResults, setMcqResults] = useState<any>(null);

  const [isLoading, setIsLoading] = useState(true);

  // Update timerState when externalTimerState changes
  useEffect(() => {
    if (externalTimerState) {
      setTimerState(externalTimerState);
    }
  }, [externalTimerState]);

  useEffect(() => {
    // Poll for timer state
    const initFetch = async () => {
      await fetchTimerState();
      setIsLoading(false);
    };
    initFetch();

    const interval = setInterval(fetchTimerState, 1000); // Poll every second (relaxed from 500ms to reduce load, since immediate fetch handles the start)
    return () => clearInterval(interval);
  }, [question.id]);

  const fetchTimerState = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/mcq/${question.id}/timer`, {
        cache: 'no-store'
      });
      const data = await response.json();
      if (data.timerState) {
        setTimerState(data.timerState);

        // If answer is revealed, fetch results
        if (data.timerState.answerRevealed && !mcqResults) {
          fetchResults();
        }
      }
    } catch (error) {
      // Error fetching timer state
    }
  };

  const fetchResults = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/mcq/${question.id}/results`, {
        cache: 'no-store'
      });
      const data = await response.json();
      setMcqResults(data);
    } catch (error) {
      // Error fetching results
    }
  };

  const handleSubmitBid = async () => {
    if (!selectedOption || bidAmount <= 0) {
      alert('Please select an option and enter a valid bid amount');
      return;
    }

    if (bidAmount > teamScore) {
      alert('Insufficient points!');
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/mcq/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamNumber,
          questionId: question.id,
          selectedOption,
          bidAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit bid');
      }

      setBidSubmitted(true);
      setSubmittedBid({ selectedOption, bidAmount });

      if (onBidSubmitted) {
        onBidSubmitted();
      }

      alert('Bid submitted successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to submit bid');
    }
  };

  const canBid = !bidSubmitted && timerState && timerState.bidRoundEnabled && timerState.isRunning && !timerState.biddingClosed;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // REMOVED: Early return for BidRoundInstructions. 
  // We want to show the question context even if bid round is not yet enabled.
  // The 'Waiting for admin' card below will handle the status.

  // Don't show instructions here - let the parent component handle it
  // This component should ONLY show when bid round is enabled

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-900 via-cyan-900 to-blue-900 p-8">
      {/* Header with Navigation */}
      <div className="mb-6 flex flex-col gap-4 w-full">
        {/* Top Row: Navigation Buttons & Score */}
        <div className="flex items-center justify-between w-full">
          {/* Left: Previous Button - Fixed Width */}
          <div className="flex justify-start items-center gap-3">
            {/* Previous button (when there's a previous question and we're not on first) */}
            {hasPreviousQuestion && onPrevious && !isFirstBidQuestion && (
              <Button
                onClick={onPrevious}
                size="sm"
                variant="outline"
                className="bg-purple-700/80 hover:bg-purple-600 text-white font-semibold px-4 py-2 text-sm border-purple-500"
              >
                ← Previous
              </Button>
            )}
          </div>

          {/* Right: Next Buttons + Score */}
          <div className="flex justify-end items-center gap-3">
            {/* Exit Bid Round button (always on first question) */}
            {isFirstBidQuestion && onExitBidRound && (
              <Button
                onClick={onExitBidRound}
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 text-sm"
              >
                ← Exit Bid Round
              </Button>
            )}

            {/* Next Question button (when there's a next bid round question) */}
            {hasNextQuestion && onNext && nextQuestionIsBidRound && (
              <Button
                onClick={onNext}
                size="sm"
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold px-4 py-2 text-sm"
              >
                Next Question →
              </Button>
            )}

            {/* Exit Bid Round button on last question (when no more bid round questions ahead) */}
            {(!nextQuestionIsBidRound || !hasNextQuestion) && !isFirstBidQuestion && onExitBidRound && (
              <Button
                onClick={onExitBidRound}
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 text-sm"
              >
                Exit Bid Round →
              </Button>
            )}

            {/* Team Score */}
            <Card className="bg-white/95 border border-slate-200 shadow-sm">
              <CardContent className="py-1 px-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold leading-none">Score</p>
                    <p className="text-sm font-bold text-slate-900 leading-none">{teamScore}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Row: Title (Centered) */}
        <div className="flex-1 flex flex-col items-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="inline-block bg-purple-600 text-white px-3 py-1 rounded-md text-xs font-semibold">
              Question {question.questionNumber}
            </span>
            <span className="inline-block bg-blue-600 text-white px-3 py-1 rounded-md text-xs font-semibold">
              MCQ Bidding
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white text-center">Team {teamNumber}</h1>
        </div>
      </div>

      {/* Timer Display */}
      {timerState && timerState.isRunning && (
        <div className="mb-6 flex justify-center">
          <div className="bg-red-600 px-8 py-4 rounded-lg border-2 border-red-400 shadow-lg">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-white" />
              <div>
                <p className="text-red-100 text-xs">Time Remaining</p>
                <p className="text-4xl font-mono font-bold text-white">
                  {timerState.timeRemaining}s
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout: Question/Options (Left) + Leaderboard (Right) */}
      <div className="grid grid-cols-3 gap-6 w-full">

        {/* LEFT SIDE: Question + Options */}
        <div className="col-span-2 space-y-4">

          {/* Question Box */}
          <Card className="bg-white/95 border border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-3">{question.title}</h2>
              <div className="prose prose-slate max-w-none [&>img]:max-w-md [&>img]:max-h-96 [&>img]:object-contain [&>img]:rounded-lg [&>img]:border [&>img]:border-slate-300">
                <ReactMarkdown
                  components={{
                    pre: ({ node, ...props }: any) => <div className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-slate-50 border border-slate-700 my-4" {...props} />,
                    code: ({ node, ...props }: any) => <code className="bg-slate-100 text-pink-600 px-1 py-0.5 rounded font-mono text-sm border border-slate-200" {...props} />,
                    p: ({ node, ...props }: any) => <p className="text-slate-700 leading-relaxed mb-4" {...props} />,
                    img: ({ node, ...props }: any) => <img className="max-w-md max-h-96 object-contain rounded-lg border border-slate-300" {...props} />
                  }}
                >
                  {question.description}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>

          {/* Status Messages */}
          {(!timerState || !timerState.bidRoundEnabled) && (
            <Card className="bg-cyan-50 border border-cyan-300">
              <CardContent className="py-4 text-center">
                <div className="animate-pulse flex flex-col items-center">
                  <AlertTriangle className="h-8 w-8 text-cyan-600 mb-2" />
                  <p className="text-lg font-semibold text-cyan-800">
                    Waiting for Admin to Open Bidding...
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {timerState && timerState.bidRoundEnabled && !timerState.isRunning && !timerState.biddingClosed && (
            <Card className="bg-yellow-50 border border-yellow-300">
              <CardContent className="py-4 text-center">
                <AlertTriangle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-lg font-semibold text-yellow-800">
                  Waiting for admin to start the timer...
                </p>
              </CardContent>
            </Card>
          )}

          {bidSubmitted && (
            <Card className="bg-green-50 border border-green-300">
              <CardContent className="py-4 text-center">
                <p className="text-lg font-semibold text-green-800">
                  ✓ Bid Submitted: {submittedBid?.selectedOption} ({submittedBid?.bidAmount} pts)
                </p>
              </CardContent>
            </Card>
          )}

          {timerState?.biddingClosed && !timerState?.answerRevealed && (
            <Card className="bg-blue-50 border border-blue-300">
              <CardContent className="py-4 text-center">
                <p className="text-lg font-semibold text-blue-800">
                  Bidding Closed - Waiting for answer reveal...
                </p>
              </CardContent>
            </Card>
          )}

          {/* Options */}
          <div className="space-y-3">
            {question.options.map((option) => {
              const isCorrect = timerState?.answerRevealed && mcqResults?.correctAnswer === option.key;
              const isSelected = selectedOption === option.key;

              return (
                <Card
                  key={option.key}
                  className={`cursor-pointer transition-all duration-200 ${isCorrect
                    ? 'bg-green-50 border-4 border-green-500 shadow-lg'
                    : isSelected
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-white border border-slate-200 hover:border-blue-400'
                    } ${!canBid && !timerState?.answerRevealed ? 'opacity-60 cursor-not-allowed' : ''}`}
                  onClick={() => canBid && setSelectedOption(option.key)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={`text-2xl font-bold w-10 h-10 rounded-full flex items-center justify-center ${isCorrect
                        ? 'bg-green-500 text-white'
                        : isSelected
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-100 text-slate-700'
                        }`}>
                        {option.key}
                      </div>
                      <pre className={`flex-1 text-base font-mono whitespace-pre-wrap m-0 ${isCorrect
                        ? 'text-green-900 font-semibold'
                        : 'text-slate-800'
                        }`}>
                        {option.text}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Bidding Controls - Only for Controllers */}
          {isController && !bidSubmitted && timerState && !timerState.biddingClosed && (
            <Card className="bg-slate-800 border border-slate-600">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-white mb-4 text-center">
                  Place Your Bid
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-white text-sm mb-2 font-semibold">
                      Bid Amount (Points)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max={teamScore}
                      value={bidAmount}
                      onChange={(e) => setBidAmount(parseInt(e.target.value) || 0)}
                      className="h-12 text-xl text-center font-bold bg-slate-700 border-slate-500 text-white"
                      disabled={bidSubmitted || (timerState && timerState.biddingClosed)}
                    />
                    <p className="text-slate-400 text-xs mt-1 text-center">
                      Available: {teamScore} points
                    </p>
                  </div>

                  <Button
                    onClick={handleSubmitBid}
                    disabled={!selectedOption || bidAmount <= 0 || bidAmount > teamScore}
                    className="w-full h-12 text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    Submit Bid
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!isController && (
            <Card className="bg-slate-100 border border-slate-300">
              <CardContent className="py-6 text-center">
                <p className="text-slate-700 text-base">
                  ⏳ Waiting for controller to place bid...
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT SIDE: Leaderboard */}
        <div className="col-span-1">
          <Card className={`bg-white/95 border border-slate-200 shadow-lg h-full ${!timerState?.answerRevealed ? 'relative overflow-hidden' : ''
            }`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-bold text-slate-900">Leaderboard</h3>
              </div>

              {/* Blurred Before Reveal */}
              {!timerState?.answerRevealed ? (
                <div className="relative">
                  <div className="blur-md opacity-50 select-none pointer-events-none">
                    <div className="space-y-2">
                      <div className="h-8 bg-slate-200 rounded"></div>
                      <div className="h-6 bg-slate-100 rounded"></div>
                      <div className="h-6 bg-slate-100 rounded"></div>
                      <div className="h-6 bg-slate-100 rounded"></div>
                      <div className="h-6 bg-slate-100 rounded"></div>
                      <div className="h-6 bg-slate-100 rounded"></div>
                    </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-slate-900/80 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                      Waiting for reveal...
                    </div>
                  </div>
                </div>
              ) : (
                <McqResultsTable
                  correctAnswer={mcqResults?.correctAnswer || ''}
                  teamResults={mcqResults?.teamResults || []}
                  totalLostPoints={mcqResults?.totalLostPoints || 0}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
