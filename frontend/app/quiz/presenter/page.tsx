'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { Presentation, Lock, Eye, EyeOff } from 'lucide-react';
import GitBashTerminal from '@/components/GitBashTerminal';
import ScoreboardOverlay from '@/components/ScoreboardOverlay';
import BidResultsOverlay from '@/components/BidResultsOverlay';
import BidRoundInstructions from '@/components/BidRoundInstructions';

export default function PresenterPage() {
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [showBidResults, setShowBidResults] = useState(false);
  const [bidResults, setBidResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const scrollPositionRef = useRef(0);
  const isRestoringScrollRef = useRef(false);

  useEffect(() => {
    fetchCurrentQuestion();
    fetchQuizConfig();

    // Save scroll position before each poll
    const handleScroll = () => {
      scrollPositionRef.current = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll);

    // Poll for current question and config every 3 seconds
    const interval = setInterval(() => {
      fetchCurrentQuestion();
      fetchQuizConfig();
    }, 3000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const fetchCurrentQuestion = async () => {
    try {
      const data = await api.getCurrentQuestion();
      setCurrentQuestion((prevQuestion: any) => {
        // Only restore scroll if question hasn't changed
        if (prevQuestion?.id === data?.id) {
          // Lock scroll restoration flag
          isRestoringScrollRef.current = true;

          // Use multiple methods to ensure scroll position is maintained
          const savedScroll = scrollPositionRef.current;

          // Immediate restoration
          window.scrollTo(0, savedScroll);

          // Delayed restoration to override any browser auto-scroll
          requestAnimationFrame(() => {
            window.scrollTo(0, savedScroll);

            // Final restoration after render
            setTimeout(() => {
              window.scrollTo(0, savedScroll);
              isRestoringScrollRef.current = false;
            }, 50);
          });
        }
        return data;
      });
    } catch (error) {
      console.error('Error fetching current question:', error);
    } finally {
      setLoading(false);
    }
  };

  // Prevent any scroll attempts during updates
  useEffect(() => {
    const preventAutoScroll = (e: Event) => {
      if (isRestoringScrollRef.current) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('scroll', preventAutoScroll, { passive: false, capture: true });
    return () => window.removeEventListener('scroll', preventAutoScroll, { capture: true });
  }, []);

  const fetchQuizConfig = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/api/public/config`);
      const data = await response.json();
      setShowAnswers(data.showAnswers || false);
      setShowScoreboard(data.isScoreboardVisible || false);

      // Handle Bid Results Toggle
      if (data.isBidResultsVisible) {
        // Fetch if not already visible or if we want to poll/refresh
        if (!showBidResults) {
          fetchBidResults();
        }
        setShowBidResults(true);
      } else {
        setShowBidResults(false);
      }

    } catch (error) {
      console.error('Error fetching quiz config:', error);
    }
  };

  const fetchBidResults = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/api/public/analytics/bid-round`);
      if (res.ok) {
        const data = await res.json();
        console.log('Bid Analytics Data:', data);

        let results: any[] = [];
        let latestQ: number | undefined = undefined;

        if (Array.isArray(data)) {
          results = data;
        } else {
          results = data.teamResults || [];
          latestQ = data.meta?.latestQuestionNumber;
        }

        // Calculate total pool
        const totalPool = results.reduce((sum: number, team: any) => sum + (team.totalLost || 0), 0);

        setBidResults({
          teamResults: results,
          totalLostPoints: totalPool,
          questionNumber: latestQ
        });
      }
    } catch (e) { console.error(e); }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="text-lg text-white">Loading presenter view...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      {showScoreboard && <ScoreboardOverlay />}

      {/* Bid Results Overlay */}
      {showBidResults && bidResults && (
        <BidResultsOverlay
          teamResults={bidResults.teamResults || []}
          totalLostPoints={bidResults.totalLostPoints || 0}
          questionNumber={bidResults.questionNumber}
        />
      )}

      <div className="max-w-7xl mx-auto space-y-8">

        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <Presentation className="h-12 w-12 text-white" />
            <h1 className="text-5xl font-bold text-white">Quizz Competition</h1>
          </div>
          <p className="text-xl text-gray-300">Presenter View</p>
          <div className="flex items-center justify-center gap-2 mt-4">
            {showAnswers ? (
              <div className="flex items-center gap-2 bg-green-500/20 text-green-300 px-4 py-2 rounded-lg border border-green-500">
                <Eye className="h-5 w-5" />
                <span className="font-semibold">Answers Visible</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-slate-700/50 text-gray-400 px-4 py-2 rounded-lg border border-slate-600">
                <EyeOff className="h-5 w-5" />
                <span className="font-semibold">Answers Hidden</span>
              </div>
            )}
          </div>
        </div>

        {!currentQuestion ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="py-24 text-center">
              <Lock className="h-16 w-16 mx-auto text-gray-400 mb-6" />
              <p className="text-2xl font-medium text-white">No Active Question</p>
              <p className="text-lg text-gray-400 mt-3">
                Waiting for admin to set the current question...
              </p>
            </CardContent>
          </Card>
        ) : currentQuestion.showInstructions ? (
          <BidRoundInstructions
            questionNumber={currentQuestion.question.questionNumber}
            questionTitle={currentQuestion.question.title}
            questionDescription={currentQuestion.question.description}
            questionOptions={currentQuestion.question.options}
          />
        ) : (
          <div className="space-y-6">
            {/* Question Card */}
            <Card className="bg-gradient-to-br from-blue-600 to-purple-600 border-0 text-white shadow-2xl">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="inline-flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm px-6 py-3 text-4xl font-bold">
                        Q{currentQuestion.questionNumber}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-yellow-400 text-yellow-900 px-6 py-3 text-2xl font-bold">
                        {currentQuestion.points} Points
                      </span>
                    </div>
                    <CardTitle className="text-5xl font-bold leading-tight mb-4">
                      {currentQuestion.title}
                    </CardTitle>
                    {currentQuestion.description && (
                      <CardDescription className="text-blue-100 text-2xl mt-4">
                        {(() => {
                          const desc = currentQuestion.description;
                          // Check if description contains code blocks (```)
                          if (desc.includes('```')) {
                            const parts = desc.split(/(```[\s\S]*?```)/g);
                            return (
                              <div className="space-y-4">
                                {parts.map((part: string, idx: number) => {
                                  if (part.startsWith('```')) {
                                    // Extract language and code
                                    const match = part.match(/```(\w*)\n([\s\S]*?)```/);
                                    if (match) {
                                      const [, language, code] = match;
                                      return (
                                        <div key={idx} className="bg-slate-900 rounded-lg p-4 border-2 border-blue-400">
                                          {language && (
                                            <div className="text-sm text-blue-300 mb-2 font-mono">{language}</div>
                                          )}
                                          <pre className="text-lg font-mono text-green-300 overflow-x-auto">
                                            <code>{code.trim()}</code>
                                          </pre>
                                        </div>
                                      );
                                    }
                                  }
                                  // Regular text
                                  return part.trim() ? <div key={idx}>{part.trim()}</div> : null;
                                })}
                              </div>
                            );
                          }
                          // No code blocks, render as normal
                          return <div className="whitespace-pre-wrap">{desc}</div>;
                        })()}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {currentQuestion.questionType === 'git_challenge' && currentQuestion.story && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
                    <h3 className="text-2xl font-bold mb-4">The Story</h3>
                    <p className="text-lg text-blue-100 whitespace-pre-wrap leading-relaxed">
                      {currentQuestion.story}
                    </p>
                  </div>
                )}
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                  <p className="text-xl text-blue-100 uppercase tracking-wide font-semibold text-center">
                    Teams: Submit your answers now!
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Answer Section - Only shown when showAnswers is true */}
            {showAnswers && (
              <Card className="bg-gradient-to-br from-green-600 to-emerald-600 border-0 text-white shadow-2xl animate-fadeIn">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Eye className="h-8 w-8" />
                    <CardTitle className="text-3xl font-bold">Correct Answer</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {currentQuestion.questionType === 'git_challenge' ? (
                    <div>
                      <GitBashTerminal
                        availableCommands={
                          currentQuestion.availableCommands
                            ? JSON.parse(currentQuestion.availableCommands).map((cmd: string, idx: number) => ({
                              id: `cmd-${idx}`,
                              command: cmd,
                              description: '',
                            }))
                            : []
                        }
                        completedCommands={
                          currentQuestion.completedCommands && currentQuestion.correctAnswer
                            ? [
                              ...JSON.parse(currentQuestion.completedCommands).map((cmd: string) => ({
                                command: cmd,
                                output: '',
                              })),
                              ...JSON.parse(currentQuestion.correctAnswer).map((cmd: string) => ({
                                command: cmd,
                                output: '',
                              })),
                            ]
                            : []
                        }
                        onCommandExecute={() => { }}
                        readOnly={true}
                      />
                      <div className="mt-6 space-y-3">
                        <h4 className="text-2xl font-bold">Command Sequence:</h4>
                        {currentQuestion.correctAnswer &&
                          JSON.parse(currentQuestion.correctAnswer).map((cmd: string, idx: number) => (
                            <div
                              key={idx}
                              className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border-2 border-white/30"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-2xl font-bold">#{idx + 1}</span>
                                <code className="text-xl font-mono">{cmd}</code>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : currentQuestion.questionType === 'html_css_challenge' ? (
                    <div>
                      <h4 className="text-2xl font-bold mb-4">Ideal CSS Solution:</h4>
                      <div className="bg-slate-900 rounded-lg p-6 border-2 border-white/30">
                        <pre className="text-lg font-mono text-green-300 overflow-x-auto whitespace-pre-wrap">
                          <code>{currentQuestion.idealCss || currentQuestion.correctAnswer || 'No solution available'}</code>
                        </pre>
                      </div>
                      {currentQuestion.targetSelector && (
                        <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-lg p-4 border-2 border-white/30">
                          <p className="text-xl">
                            <span className="font-bold">Target Selector:</span>{' '}
                            <code className="text-yellow-300 font-mono">{currentQuestion.targetSelector}</code>
                          </p>
                        </div>
                      )}
                    </div>
                  ) : currentQuestion.questionType === 'js_engine_challenge' ? (
                    <div>
                      {(() => {
                        try {
                          const solution = JSON.parse(currentQuestion.correctAnswer || '{}');
                          const placements = solution.expectedPlacements || {};
                          const output = solution.expectedOutput || [];

                          return (
                            <div className="space-y-6">
                              <div>
                                <h4 className="text-2xl font-bold mb-4">Expected Code Placements:</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {Object.entries(placements).map(([blockId, placement]: [string, any]) => (
                                    <div key={blockId} className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border-2 border-white/30">
                                      <div className="flex items-center justify-between">
                                        <span className="text-lg font-bold">Block {blockId}</span>
                                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${placement === 'executed' ? 'bg-blue-500' :
                                          placement === 'microtask' ? 'bg-purple-500' :
                                            placement === 'macrotask' ? 'bg-orange-500' :
                                              'bg-gray-500'
                                          }`}>
                                          {placement === 'executed' ? '⚡ Executed' :
                                            placement === 'microtask' ? '🔮 Microtask Queue' :
                                              placement === 'macrotask' ? '⏰ Macrotask Queue' :
                                                placement}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {output.length > 0 && (
                                <div>
                                  <h4 className="text-2xl font-bold mb-4">Expected Console Output:</h4>
                                  <div className="bg-slate-900 rounded-lg p-6 border-2 border-white/30">
                                    <div className="space-y-2">
                                      {output.map((line: string, idx: number) => (
                                        <div key={idx} className="flex items-center gap-3">
                                          <span className="text-green-400 font-bold">{idx + 1}.</span>
                                          <code className="text-lg font-mono text-green-300">{line}</code>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        } catch (e) {
                          return (
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-8 border-2 border-white/30">
                              <p className="text-xl font-mono text-center">
                                {currentQuestion.correctAnswer}
                              </p>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  ) : currentQuestion.questionType === 'multiple_choice' ? (
                    <div>
                      {(() => {
                        try {
                          const options = JSON.parse(currentQuestion.options || '[]');
                          let correctAnswers: string[] = [];

                          try {
                            const parsed = JSON.parse(currentQuestion.correctAnswer);
                            correctAnswers = Array.isArray(parsed) ? parsed : [parsed];
                          } catch {
                            correctAnswers = [currentQuestion.correctAnswer];
                          }

                          return (
                            <div>
                              <h4 className="text-2xl font-bold mb-4">Correct Answer{correctAnswers.length > 1 ? 's' : ''}:</h4>
                              <div className="space-y-3">
                                {options.map((option: any) => {
                                  const isCorrect = correctAnswers.includes(option.key);
                                  if (!isCorrect) return null;

                                  return (
                                    <div key={option.key} className="bg-green-600 rounded-lg p-6 border-2 border-green-400">
                                      <div className="flex items-start gap-4">
                                        <span className="text-4xl font-bold text-white">{option.key}.</span>
                                        <p className="text-2xl text-white flex-1">{option.text}</p>
                                        <span className="text-3xl">✓</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        } catch (e) {
                          return (
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-8 border-2 border-white/30">
                              <p className="text-3xl font-mono font-bold text-center">
                                {currentQuestion.correctAnswer}
                              </p>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  ) : currentQuestion.questionType === 'broken_html_challenge' ? (
                    <div>
                      <h4 className="text-2xl font-bold mb-4">Correct HTML Tree Structure:</h4>
                      <div className="bg-slate-900 rounded-lg p-6 border-2 border-white/30">
                        <pre className="text-sm font-mono text-green-300 overflow-x-auto whitespace-pre-wrap">
                          <code>{JSON.stringify(JSON.parse(currentQuestion.correctTree || '{}'), null, 2)}</code>
                        </pre>
                      </div>
                      {currentQuestion.story && (
                        <div className="mt-4">
                          <h4 className="text-xl font-bold mb-3">Original HTML:</h4>
                          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border-2 border-white/30">
                            <pre className="text-sm font-mono text-blue-200 overflow-x-auto whitespace-pre-wrap">
                              <code>{currentQuestion.story}</code>
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : currentQuestion.questionType === 'true_false_drag_drop' ? (
                    <div>
                      {(() => {
                        try {
                          const blocks = JSON.parse(currentQuestion.initialTree || '[]');
                          return (
                            <div>
                              <h4 className="text-2xl font-bold mb-4">Correct Answers:</h4>
                              <div className="space-y-4">
                                {blocks.map((block: any, idx: number) => (
                                  <div key={block.id} className={`rounded-lg p-4 border-2 ${block.correctAnswer ? 'bg-green-600/20 border-green-400' : 'bg-red-600/20 border-red-400'
                                    }`}>
                                    <div className="flex items-center justify-between mb-3">
                                      <span className="text-xl font-bold">Block {idx + 1}</span>
                                      <span className={`px-4 py-2 rounded-full text-lg font-bold ${block.correctAnswer ? 'bg-green-500' : 'bg-red-500'
                                        }`}>
                                        {block.correctAnswer ? '✓ TRUE' : '✗ FALSE'}
                                      </span>
                                    </div>
                                    <pre className="text-sm font-mono text-white bg-slate-900 p-3 rounded overflow-x-auto">
                                      <code>{block.code}</code>
                                    </pre>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        } catch (e) {
                          return (
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-8 border-2 border-white/30">
                              <p className="text-xl font-mono text-center">{currentQuestion.correctAnswer}</p>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  ) : currentQuestion.questionType === 'match_following' ? (
                    <div>
                      {(() => {
                        try {
                          const options = JSON.parse(currentQuestion.options || '[]');
                          return (
                            <div>
                              <h4 className="text-2xl font-bold mb-4">Correct Matches:</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {options.map((option: any) => (
                                  <div key={option.id} className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-5 border-2 border-purple-400">
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-2xl font-bold">{option.id}.</span>
                                        <span className="text-xl font-semibold">{option.term}</span>
                                      </div>
                                      <div className="flex items-center gap-2 pl-8">
                                        <span className="text-yellow-300 text-xl">→</span>
                                        <span className="text-lg text-blue-100">{option.definition}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        } catch (e) {
                          return (
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-8 border-2 border-white/30">
                              <p className="text-xl font-mono text-center">{currentQuestion.correctAnswer}</p>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  ) : (
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-8 border-2 border-white/30">
                      <p className="text-3xl font-mono font-bold text-center">
                        {currentQuestion.correctAnswer}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <div className="text-center">
          <p className="text-sm text-gray-400">
            This view auto-updates • Current question and answers controlled by admin
          </p>
        </div>
      </div>
    </div>
  );
}
