'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Lock, Unlock, Monitor, Eye, EyeOff, ExternalLink, Play, AlertCircle, CheckCircle, Pencil } from 'lucide-react';
import { api } from '@/lib/api';
import Link from 'next/link';
import McqResultsTable from '@/components/McqResultsTable';

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mcqTimerState, setMcqTimerState] = useState<any>(null);
  const [mcqTimerStates, setMcqTimerStates] = useState<{ [key: string]: any }>({});
  const [mcqResults, setMcqResults] = useState<any>(null);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [formData, setFormData] = useState({
    questionNumber: 1,
    title: '',
    description: '',
    correctAnswer: '',
    points: 10,
    timeLimit: '' as string | number,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestions();
    fetchCurrentQuestion();
    fetchQuizConfig();
    fetchAllMcqTimerStates();

    // Auto-refresh timer states every 1 second for live updates
    const interval = setInterval(() => {
      fetchAllMcqTimerStates();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchQuestions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const data = await api.getQuestions(token);
      // Sort questions by question number
      const sortedData = data.sort((a: any, b: any) => a.questionNumber - b.questionNumber);
      setQuestions(sortedData);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const fetchCurrentQuestion = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const data = await api.getCurrentQuestionId(token);
      setCurrentQuestionId(data.currentQuestionId || null);

      // If there's a current question, fetch its details
      if (data.currentQuestionId) {
        const allQuestions = await api.getQuestions(token);
        const question = allQuestions.find((q: any) => q.id === data.currentQuestionId);
        setCurrentQuestion(question || null);

        // If it's an MCQ question, fetch timer state
        if (question && question.questionType === 'mcq_bidding') {
          fetchMcqTimerState(data.currentQuestionId);
        }
      } else {
        setCurrentQuestion(null);
        setMcqTimerState(null);
      }
    } catch (error) {
      console.error('Error fetching current question:', error);
    }
  };

  const fetchMcqTimerState = async (questionId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/quiz/mcq/${questionId}/timer`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setMcqTimerState(data.timerState);
    } catch (error) {
      console.error('Error fetching MCQ timer state:', error);
    }
  };

  const fetchAllMcqTimerStates = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const allQuestions = await api.getQuestions(token);
      const mcqQuestions = allQuestions.filter((q: any) => q.questionType === 'mcq_bidding');

      const states: { [key: string]: any } = {};
      for (const q of mcqQuestions) {
        const response = await fetch(`http://localhost:5000/api/quiz/mcq/${q.id}/timer`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        states[q.id] = data.timerState;
      }

      setMcqTimerStates(states);
    } catch (error) {
      console.error('Error fetching all MCQ timer states:', error);
    }
  };

  const handleEnableBidRoundForQuestion = async (questionId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/quiz/mcq/${questionId}/enable-bid-round`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to enable bid round');

      // Refresh timer states
      fetchAllMcqTimerStates();

      // If this is the current question, also update current state
      if (questionId === currentQuestionId) {
        fetchMcqTimerState(questionId);
      }
    } catch (error) {
      console.error('Error enabling bid round:', error);
      alert('Failed to enable bid round');
    }
  };

  const handleDisableBidRoundForQuestion = async (questionId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/quiz/mcq/${questionId}/disable-bid-round`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to disable bid round');

      // Refresh timer states
      fetchAllMcqTimerStates();

      // If this is the current question, also update current state
      if (questionId === currentQuestionId) {
        fetchMcqTimerState(questionId);
      }
    } catch (error) {
      console.error('Error disabling bid round:', error);
      alert('Failed to disable bid round');
    }
  };

  const handleStartTimerForQuestion = async (questionId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/quiz/mcq/${questionId}/start-timer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to start timer');

      // Refresh timer states
      fetchAllMcqTimerStates();

      // If this is the current question, also update current state
      if (questionId === currentQuestionId) {
        fetchMcqTimerState(questionId);
      }
    } catch (error) {
      console.error('Error starting timer:', error);
      alert('Failed to start timer');
    }
  };

  const handleRevealAnswerForQuestion = async (questionId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/quiz/mcq/${questionId}/reveal-answer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to reveal answer');

      const data = await response.json();

      // Show results dialog with the data
      setMcqResults(data);
      setShowResultsDialog(true);

      // Refresh timer states
      fetchAllMcqTimerStates();

      // If this is the current question, also update current state
      if (questionId === currentQuestionId) {
        fetchMcqTimerState(questionId);
      }
    } catch (error) {
      console.error('Error revealing answer:', error);
      alert('Failed to reveal answer');
    }
  };

  const fetchQuizConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const data = await api.getQuizConfig(token);
      setShowAnswers(data.showAnswers || false);
    } catch (error) {
      console.error('Error fetching quiz config:', error);
    }
  };

  const handleToggleShowAnswers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await api.toggleShowAnswers(token, !showAnswers);
      setShowAnswers(!showAnswers);
    } catch (error) {
      console.error('Error toggling show answers:', error);
      alert('Failed to toggle show answers');
    }
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const payload = {
        ...formData,
        timeLimit: formData.timeLimit === '' ? null : Number(formData.timeLimit),
      };

      if (isEditing && editingId) {
        await api.updateQuestion(token, editingId, payload);
      } else {
        await api.createQuestion(token, payload);
      }

      setDialogOpen(false);
      resetForm();
      fetchQuestions();
    } catch (error) {
      console.error('Error saving question:', error);
      alert('Failed to save question');
    }
  };

  const handleEditQuestion = (question: any) => {
    setFormData({
      questionNumber: question.questionNumber,
      title: question.title,
      description: question.description || '',
      correctAnswer: question.correctAnswer || '',
      points: question.points,
      timeLimit: question.timeLimit || '',
    });
    setEditingId(question.id);
    setIsEditing(true);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ questionNumber: 1, title: '', description: '', correctAnswer: '', points: 10, timeLimit: '' });
    setIsEditing(false);
    setEditingId(null);
  };

  const handleToggleQuestion = async (questionId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await api.toggleQuestion(token, questionId, !currentStatus);
      fetchQuestions();
    } catch (error) {
      console.error('Error toggling question:', error);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await api.deleteQuestion(token, questionId);
      fetchQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };

  const handleSetCurrentQuestion = async (questionId: string | null) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await api.setCurrentQuestion(token, questionId);
      setCurrentQuestionId(questionId);
      fetchCurrentQuestion(); // Refresh to load question details
    } catch (error) {
      console.error('Error setting current question:', error);
      alert('Failed to set current question');
    }
  };

  const handleEnableBidRound = async () => {
    if (!currentQuestionId) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/quiz/mcq/${currentQuestionId}/enable-bid-round`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to enable bid round');

      fetchMcqTimerState(currentQuestionId);
    } catch (error) {
      console.error('Error enabling bid round:', error);
      alert('Failed to enable bid round');
    }
  };

  const handleStartMcqTimer = async () => {
    if (!currentQuestionId) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/quiz/mcq/${currentQuestionId}/start-timer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to start timer');

      fetchMcqTimerState(currentQuestionId);

      // Poll for timer updates
      const interval = setInterval(() => {
        fetchMcqTimerState(currentQuestionId);
      }, 1000);

      // Clear interval after 15 seconds
      setTimeout(() => clearInterval(interval), 15000);
    } catch (error) {
      console.error('Error starting MCQ timer:', error);
      alert('Failed to start timer');
    }
  };

  const handleRevealAnswer = async () => {
    if (!currentQuestionId) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/quiz/mcq/${currentQuestionId}/reveal-answer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to reveal answer');

      fetchMcqTimerState(currentQuestionId);
      fetchQuestions(); // Refresh to show updated scores
    } catch (error) {
      console.error('Error revealing answer:', error);
      alert('Failed to reveal answer');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Question Management</h1>
          <p className="text-muted-foreground">Create and manage quiz questions</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant={showAnswers ? 'default' : 'outline'}
            onClick={handleToggleShowAnswers}
          >
            {showAnswers ? (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Hide Answers
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Show Answers
              </>
            )}
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}><Plus className="h-4 w-4 mr-2" />Add Question</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{isEditing ? 'Edit Question' : 'Create New Question'}</DialogTitle>
                <DialogDescription>{isEditing ? 'Update the question details' : 'Add a question to the quiz'}</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSaveQuestion}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="questionNumber">Question Number</Label>
                    <Input
                      id="questionNumber"
                      type="number"
                      value={formData.questionNumber}
                      onChange={(e) => setFormData({ ...formData, questionNumber: parseInt(e.target.value) || 1 })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="correctAnswer">Correct Answer</Label>
                    <Input
                      id="correctAnswer"
                      value={formData.correctAnswer}
                      onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="points">Points</Label>
                    <Input
                      id="points"
                      type="number"
                      value={formData.points}
                      onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 10 })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeLimit">Time Limit (seconds, optional)</Label>
                    <Input
                      id="timeLimit"
                      type="number"
                      value={formData.timeLimit}
                      onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value })}
                      placeholder="No limit"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit">{isEditing ? 'Update Question' : 'Create Question'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* MCQ Bidding Control Panel */}
      {currentQuestion && currentQuestion.questionType === 'mcq_bidding' && (
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Monitor className="h-6 w-6" />
              MCQ Bidding Controls - Question {currentQuestion.questionNumber}
            </CardTitle>
            <CardDescription className="text-purple-700">
              {currentQuestion.title}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {/* Status Display */}
              <div className="flex-1 grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border border-purple-200">
                  <p className="text-sm text-gray-600 mb-1">Timer Status</p>
                  <p className="text-lg font-bold text-purple-900">
                    {mcqTimerState?.isRunning ? (
                      <span className="text-orange-600">Running ({mcqTimerState.timeRemaining}s)</span>
                    ) : mcqTimerState?.biddingClosed ? (
                      <span className="text-red-600">Closed</span>
                    ) : (
                      <span className="text-gray-600">Not Started</span>
                    )}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-purple-200">
                  <p className="text-sm text-gray-600 mb-1">Bidding Status</p>
                  <p className="text-lg font-bold text-purple-900">
                    {mcqTimerState?.biddingClosed ? (
                      <span className="text-red-600">Closed</span>
                    ) : (
                      <span className="text-green-600">Open</span>
                    )}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-purple-200">
                  <p className="text-sm text-gray-600 mb-1">Answer Status</p>
                  <p className="text-lg font-bold text-purple-900">
                    {mcqTimerState?.answerRevealed ? (
                      <span className="text-green-600">Revealed</span>
                    ) : (
                      <span className="text-gray-600">Hidden</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex flex-col gap-2">
                {!mcqTimerState?.bidRoundEnabled ? (
                  <Button
                    onClick={handleEnableBidRound}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Enable Bid Round
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleStartMcqTimer}
                      disabled={mcqTimerState?.isRunning || mcqTimerState?.biddingClosed}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Timer (10s)
                    </Button>
                    <Button
                      onClick={handleRevealAnswer}
                      disabled={!mcqTimerState?.biddingClosed || mcqTimerState?.answerRevealed}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Reveal Answer
                    </Button>
                  </>
                )}
              </div>
            </div>

            {mcqTimerState?.answerRevealed && (
              <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded-lg">
                <p className="text-green-900 font-semibold">
                  ✅ Correct Answer: {currentQuestion.correctAnswer}
                </p>
                <p className="text-sm text-green-700 mt-1">
                  Points have been distributed to teams based on their bids.
                </p>
                <p className="text-xs text-green-600 mt-2 italic">
                  💡 If all teams bid correctly, no points change (no pot to redistribute).
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Questions ({questions.length})</CardTitle>
          <CardDescription>Manage quiz questions and their availability</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Q#</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Bid Round</TableHead>
                <TableHead>Presenter</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No questions yet. Create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                questions.map((q: any, index: number) => {
                  const timerState = mcqTimerStates[q.id];
                  const isMcq = q.questionType === 'mcq_bidding';
                  // Check if this is the first MCQ question
                  const mcqQuestions = questions.filter((question: any) => question.questionType === 'mcq_bidding');
                  const isFirstMcq = isMcq && mcqQuestions.length > 0 && mcqQuestions[0].id === q.id;

                  return (
                    <TableRow key={q.id} className={currentQuestionId === q.id ? 'bg-blue-50' : ''}>
                      <TableCell className="font-medium">{q.questionNumber}</TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/preview/${q.id}`}
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        >
                          {q.title}
                          <Eye className="h-3 w-3" />
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${isMcq ? 'bg-purple-100 text-purple-800' :
                          q.questionType === 'git_challenge' ? 'bg-blue-100 text-blue-800' :
                            q.questionType === 'html_css_challenge' ? 'bg-green-100 text-green-800' :
                              q.questionType === 'js_engine_challenge' ? 'bg-yellow-100 text-yellow-800' :
                                q.questionType === 'broken_html_challenge' ? 'bg-emerald-100 text-emerald-800' :
                                  q.questionType === 'true_false_drag_drop' ? 'bg-cyan-100 text-cyan-800' :
                                    'bg-gray-100 text-gray-800'
                          }`}>
                          {isMcq ? 'MCQ Bidding' :
                            q.questionType === 'git_challenge' ? 'Git Challenge' :
                              q.questionType === 'html_css_challenge' ? 'HTML/CSS Challenge' :
                                q.questionType === 'js_engine_challenge' ? 'JS Engine Challenge' :
                                  q.questionType === 'broken_html_challenge' ? 'Broken HTML Challenge' :
                                    q.questionType === 'true_false_drag_drop' ? 'True/False Drag Drop' :
                                      q.questionType || 'Standard'}
                        </span>
                      </TableCell>
                      <TableCell>{q.points}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${q.isEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                          {q.isEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {isMcq ? (
                          <div className="flex flex-col gap-1.5">
                            {/* For FIRST MCQ only: Enable/Disable Bid Round */}
                            {isFirstMcq && (
                              <>
                                {timerState?.bidRoundEnabled ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDisableBidRoundForQuestion(q.id)}
                                    className="bg-green-50 border-green-300 text-green-800 hover:bg-green-100 text-xs"
                                  >
                                    ✅ Active (Click to Disable)
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => handleEnableBidRoundForQuestion(q.id)}
                                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
                                  >
                                    🎯 Enable Bid Round
                                  </Button>
                                )}

                                {/* Start Timer - only show if bid round is enabled */}
                                {timerState?.bidRoundEnabled && !timerState?.isRunning && !timerState?.biddingClosed && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleStartTimerForQuestion(q.id)}
                                    className="bg-orange-600 hover:bg-orange-700 text-white text-xs"
                                  >
                                    ⏱️ Start Timer
                                  </Button>
                                )}

                                {/* Timer Running Indicator */}
                                {timerState?.isRunning && (
                                  <span className="text-xs text-orange-600 font-medium animate-pulse">
                                    ⏱️ Timer: {timerState.timeRemaining}s
                                  </span>
                                )}
                              </>
                            )}

                            {/* For ALL MCQ: Bidding Closed - Waiting for Reveal */}
                            {timerState?.biddingClosed && !timerState?.answerRevealed && !timerState?.isRunning && (
                              <>
                                <span className="text-xs text-yellow-600 font-medium">
                                  🔒 Bidding Closed
                                </span>
                                <Button
                                  size="sm"
                                  onClick={() => handleRevealAnswerForQuestion(q.id)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                                >
                                  🎊 Reveal Answer & Distribute Points
                                </Button>
                              </>
                            )}

                            {/* For ALL MCQ: Answer Revealed Indicator */}
                            {timerState?.answerRevealed && (
                              <span className="text-xs text-blue-600 font-medium">
                                ✨ Answer Revealed
                              </span>
                            )}

                            {/* For non-first MCQ: Just show Reveal Answer button if not revealed */}
                            {!isFirstMcq && !timerState?.answerRevealed && (
                              <Button
                                size="sm"
                                onClick={() => handleRevealAnswerForQuestion(q.id)}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                              >
                                🎊 Reveal Answer
                              </Button>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {currentQuestionId === q.id ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-800 px-2.5 py-0.5 text-xs font-medium">
                              <Monitor className="h-3 w-3 mr-1" />Current
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSetCurrentQuestion(null)}
                            >
                              Clear
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetCurrentQuestion(q.id)}
                          >
                            Set as Current
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleQuestion(q.id, q.isEnabled)}
                        >
                          {q.isEnabled ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteQuestion(q.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditQuestion(q)}
                        >
                          <Pencil className="h-4 w-4 text-blue-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MCQ Results Dialog */}
      <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          {mcqResults && mcqResults.teamResults && (
            <McqResultsTable
              correctAnswer={mcqResults.correctAnswer}
              teamResults={mcqResults.teamResults}
              totalLostPoints={mcqResults.totalLostPoints}
            />
          )}
          <DialogFooter>
            <Button onClick={() => setShowResultsDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
