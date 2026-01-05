'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { Presentation, Lock, Eye, EyeOff } from 'lucide-react';
import GitBashTerminal from '@/components/GitBashTerminal';

export default function PresenterPage() {
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentQuestion();
    fetchQuizConfig();

    // Poll for current question and config every 3 seconds
    const interval = setInterval(() => {
      fetchCurrentQuestion();
      fetchQuizConfig();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchCurrentQuestion = async () => {
    try {
      const data = await api.getCurrentQuestion();
      setCurrentQuestion(data);
    } catch (error) {
      console.error('Error fetching current question:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizConfig = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/public/config');
      const data = await response.json();
      setShowAnswers(data.showAnswers || false);
    } catch (error) {
      console.error('Error fetching quiz config:', error);
    }
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
                        {currentQuestion.description}
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
                        onCommandExecute={() => {}}
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
