'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor, Clock } from 'lucide-react';

interface Question {
  id: string;
  questionNumber: number;
  questionType: string;
  title: string;
  description?: string;
  options?: string;
  correctAnswer?: string;
  points: number;
}

interface TimerState {
  isRunning: boolean;
  timeRemaining: number;
  biddingClosed: boolean;
  answerRevealed: boolean;
  bidRoundEnabled?: boolean;
}

interface Bid {
  id: string;
  teamId: string;
  selectedOption: string;
  bidAmount: number;
  teamNumber: number;
  teamName: string;
}

export default function PresenterViewPage() {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [timerState, setTimerState] = useState<TimerState | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if presenter is logged in
    const presenterId = sessionStorage.getItem('presenterId');
    if (!presenterId) {
      router.push('/presenter');
      return;
    }

    // Initial fetch
    fetchCurrentQuestion();

    // Poll for updates every 2 seconds
    const interval = setInterval(fetchCurrentQuestion, 2000);

    return () => clearInterval(interval);
  }, [router]);

  const fetchCurrentQuestion = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/api/presenter/current-question`);
      const data = await response.json();

      setCurrentQuestion(data.question);
      setTimerState(data.timerState);
      setBids(data.bids || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching current question:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading presenter view...</div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 flex items-center justify-center p-6">
        <Card className="bg-white/10 backdrop-blur-lg border-2 border-white/20">
          <CardContent className="py-12 text-center">
            <Monitor className="h-16 w-16 text-purple-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2">
              Waiting for Question
            </h2>
            <p className="text-purple-200 text-lg">
              The admin will set the current question soon...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render MCQ Bidding Question
  if (currentQuestion.questionType === 'mcq_bidding') {
    // Check if we should show instructions instead of the question
    // The API returns showInstructions: true if bidRoundEnabled is false
    // We cast to any because the interface definition above didn't include it yet
    const showInstructions = (currentQuestion as any).showInstructions || (timerState === null || (timerState && !timerState.bidRoundEnabled));

    if (showInstructions) {
      return (
        <div className="min-h-screen bg-slate-900">
          <div className="p-8">
            {/* Use the shared component but without navigation buttons since this is a passive view */}
            <div className="bg-white rounded-xl overflow-hidden shadow-2xl max-w-6xl mx-auto">
              <div className="p-12 text-center bg-gradient-to-r from-blue-900 to-indigo-900">
                <h1 className="text-5xl font-bold text-white mb-6">Bid Round Instructions</h1>
                <p className="text-2xl text-blue-200">Please wait for the admin to start the round...</p>
              </div>
              <div className="p-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-blue-100 p-3 rounded-full"><span className="text-2xl">💰</span></div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-800">Your Score is Your Budget</h3>
                        <p className="text-xl text-slate-600">Use points from Q1-Q15 to bid.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="bg-green-100 p-3 rounded-full"><span className="text-2xl">✅</span></div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-800">Correct Answers Win</h3>
                        <p className="text-xl text-slate-600">Keep your bid + share the lost pool.</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-red-100 p-3 rounded-full"><span className="text-2xl">❌</span></div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-800">Wrong Answers Lose</h3>
                        <p className="text-xl text-slate-600">You lose the points you wagered.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="bg-yellow-100 p-3 rounded-full"><span className="text-2xl">⏱️</span></div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-800">10 Seconds</h3>
                        <p className="text-xl text-slate-600">Decide and submit your bid fast!</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const options = currentQuestion.options ? JSON.parse(currentQuestion.options) : [];

    // Calculate bid distribution by option
    const bidsByOption: { [key: string]: { bids: Bid[], total: number } } = {};
    options.forEach((opt: any) => {
      bidsByOption[opt.key] = { bids: [], total: 0 };
    });

    bids.forEach(bid => {
      if (bidsByOption[bid.selectedOption]) {
        bidsByOption[bid.selectedOption].bids.push(bid);
        bidsByOption[bid.selectedOption].total += bid.bidAmount;
      }
    });

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Monitor className="h-12 w-12 text-purple-400" />
            <h1 className="text-5xl font-bold text-white">
              Question {currentQuestion.questionNumber}
            </h1>
          </div>
          <p className="text-2xl text-purple-200">{currentQuestion.points} points</p>
        </div>

        {/* Timer Display */}
        {timerState && timerState.isRunning && (
          <div className="mb-8 flex justify-center">
            <div className="bg-red-600 px-12 py-6 rounded-2xl border-4 border-red-400 shadow-2xl">
              <div className="flex items-center gap-4">
                <Clock className="h-10 w-10 text-white animate-pulse" />
                <span className="text-6xl font-mono font-bold text-white">
                  {timerState.timeRemaining}s
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Question */}
        <Card className="bg-gradient-to-br from-indigo-800 to-purple-800 border-4 border-purple-500 shadow-2xl mb-8">
          <CardHeader>
            <CardTitle className="text-4xl font-bold text-white text-center">
              {currentQuestion.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl text-purple-100 text-center leading-relaxed">
              {currentQuestion.description}
            </p>
          </CardContent>
        </Card>

        {/* Options Grid */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {options.map((option: any) => {
            const optionBids = bidsByOption[option.key]?.bids || [];
            const totalBidAmount = bidsByOption[option.key]?.total || 0;
            const isCorrect = timerState?.answerRevealed && option.key === currentQuestion.correctAnswer;

            return (
              <Card
                key={option.key}
                className={`transition-all duration-300 border-4 ${isCorrect
                  ? 'bg-gradient-to-br from-green-600 to-emerald-600 border-green-400 shadow-2xl scale-105'
                  : 'bg-gradient-to-br from-slate-700 to-slate-800 border-slate-500'
                  }`}
              >
                <CardContent className="p-8">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`text-5xl font-bold ${isCorrect ? 'text-white' : 'text-purple-400'
                      }`}>
                      {option.key}.
                    </div>
                    <pre className={`text-2xl flex-1 font-mono whitespace-pre-wrap m-0 ${isCorrect ? 'text-white font-bold' : 'text-white'
                      }`}>
                      {option.text}
                    </pre>
                  </div>

                  {/* Bid Display (shown after bidding closes) */}
                  {timerState?.biddingClosed && optionBids.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-white/20">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-lg font-semibold text-purple-200">
                          Teams: {optionBids.length}
                        </span>
                        <span className="text-2xl font-bold text-yellow-300">
                          Total Bid: {totalBidAmount} pts
                        </span>
                      </div>
                      <div className="space-y-2">
                        {optionBids.map(bid => (
                          <div
                            key={bid.id}
                            className="bg-black/30 px-4 py-2 rounded-lg flex justify-between items-center"
                          >
                            <span className="text-white font-medium">
                              Team {bid.teamNumber}
                            </span>
                            <span className="text-yellow-300 font-bold">
                              {bid.bidAmount} pts
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Status Messages */}
        {timerState?.biddingClosed && !timerState?.answerRevealed && (
          <div className="text-center">
            <Card className="bg-yellow-600 border-4 border-yellow-400 inline-block">
              <CardContent className="py-6 px-12">
                <p className="text-3xl font-bold text-white">
                  ⏳ Bidding Closed - Waiting for Answer Reveal...
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {timerState?.answerRevealed && (
          <div className="text-center">
            <Card className="bg-gradient-to-r from-green-600 to-emerald-600 border-4 border-green-400 inline-block">
              <CardContent className="py-6 px-12">
                <p className="text-4xl font-bold text-white mb-2">
                  ✅ Correct Answer: {currentQuestion.correctAnswer}
                </p>
                <p className="text-xl text-green-100">
                  Points have been distributed!
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // Render other question types
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 p-8">
      <div className="mb-8 text-center">
        <h1 className="text-5xl font-bold text-white mb-4">
          Question {currentQuestion.questionNumber}: {currentQuestion.title}
        </h1>
        <p className="text-2xl text-purple-200">{currentQuestion.points} points</p>
      </div>

      <Card className="bg-white/10 backdrop-blur-lg border-2 border-white/20">
        <CardContent className="py-12 text-center">
          <p className="text-2xl text-white">
            {currentQuestion.description || 'Question is active...'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
