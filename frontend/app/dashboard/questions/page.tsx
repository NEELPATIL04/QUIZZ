'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Search, MoreVertical, GripVertical, Save, X, Check, Monitor, Play, RefreshCw, AlertCircle, Eye, EyeOff, LayoutGrid, Award, Clock, ArrowRight, XCircle, CheckCircle, ArrowUpCircle, ArrowDownCircle, RotateCcw, Lock, Unlock, Flag } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { api } from '@/lib/api';
import Link from 'next/link';
import McqResultsTable from '@/components/McqResultsTable';

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  // ... existing state ...

  const handleResetQuestion = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to RESET "${title}"? \n\nThis will DELETE all submitted answers for this question and DEDUCT the points from the team scores.\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await api.resetQuestion(token, id);
      fetchQuestions(); // Refresh list/stats
      // show toast? (not implemented in this file yet, using alert)
      alert(`Question "${title}" has been reset.`);
    } catch (error) {
      console.error('Error resetting question:', error);
      alert('Failed to reset question');
    }
  };

  // ... rest of component ...

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
    questionType: 'multiple_choice',
    options: ['', '', '', ''],
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const pausePollingRef = useRef(false);
  const lastManualUpdateRef = useRef<{ [questionId: string]: number }>({});

  useEffect(() => {
    fetchQuestions();
    fetchCurrentQuestion();
    fetchQuizConfig();
    fetchAllMcqTimerStates();

    // Auto-refresh timer states every 1 second for live updates
    const interval = setInterval(() => {
      if (!pausePollingRef.current) {
        fetchAllMcqTimerStates();
      }
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

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quiz/mcq/${questionId}/timer`, {
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
      const now = Date.now();

      for (const q of mcqQuestions) {
        // Skip if there was a manual update less than 6 seconds ago
        const lastUpdate = lastManualUpdateRef.current[q.id];
        if (lastUpdate && (now - lastUpdate) < 6000) {
          // Keep existing state for this question
          states[q.id] = mcqTimerStates[q.id];
          continue;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quiz/mcq/${q.id}/timer`, {
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

      // Pause polling to prevent conflicts
      pausePollingRef.current = true;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quiz/mcq/${questionId}/enable-bid-round`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to enable bid round');

      const data = await response.json();

      // Immediately update local state
      setMcqTimerStates(prev => ({
        ...prev,
        [questionId]: data.timerState
      }));

      // Record the timestamp of this manual update to prevent polling override
      lastManualUpdateRef.current[questionId] = Date.now();

      // Resume polling after 5 seconds
      setTimeout(() => {
        pausePollingRef.current = false;
      }, 5000);
    } catch (error) {
      console.error('Error enabling bid round:', error);
      alert('Failed to enable bid round');
      pausePollingRef.current = false;
    }
  };

  const handleDisableBidRoundForQuestion = async (questionId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Pause polling to prevent conflicts
      pausePollingRef.current = true;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quiz/mcq/${questionId}/disable-bid-round`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to disable bid round');

      const data = await response.json();

      // Immediately update local state
      setMcqTimerStates(prev => ({
        ...prev,
        [questionId]: data.timerState
      }));

      // Record the timestamp of this manual update to prevent polling override
      lastManualUpdateRef.current[questionId] = Date.now();

      // Resume polling after 5 seconds
      setTimeout(() => {
        pausePollingRef.current = false;
      }, 5000);
    } catch (error) {
      console.error('Error disabling bid round:', error);
      alert('Failed to disable bid round');
      pausePollingRef.current = false;
    }
  };

  const handleStartTimerForQuestion = async (questionId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quiz/mcq/${questionId}/start-timer`, {
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

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quiz/mcq/${questionId}/reveal-answer`, {
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

  // Fix for save: format options as structured objects with keys
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Construct structured options if needed
      const structuredOptions = formData.options.map((text, index) => ({
        key: String.fromCharCode(65 + index), // A, B, C, D...
        text: text
      }));

      const payload = {
        ...formData,
        timeLimit: formData.timeLimit === '' ? null : Number(formData.timeLimit),
        // Send structured options
        options: JSON.stringify(structuredOptions),
        questionType: formData.questionType,
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('image', file);

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quiz/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: uploadData
      });

      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();

      // Append markdown image to description
      const imageMarkdown = `\n\n![Question Image](${data.url})`;
      setFormData(prev => ({
        ...prev,
        description: prev.description + imageMarkdown
      }));

      alert('Image uploaded and added to description!');
    } catch (error) {
      console.error('Upload Error:', error);
      alert('Failed to upload image.');
    }
  };

  // Handle converting a question to a Bid Round
  const handleConvertToBid = async (questionId: string) => {
    if (!confirm('Are you sure you want to convert this to a Bid Round question?')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      await api.convertQuestionToBid(token, questionId);
      // Refresh to show update
      fetchQuestions();
    } catch (error) {
      console.error('Error converting question:', error);
      alert('Failed to convert question');
    }
  };

  // Handle converting a formatted Bid Round question back to Normal
  const handleConvertToNormal = async (questionId: string) => {
    if (!confirm('Are you sure you want to convert this back to a Normal (Multiple Choice) question? \n\nThis will remove any existing bids and timer settings for this question.')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      await api.convertQuestionToNormal(token, questionId);
      fetchQuestions();
    } catch (error) {
      console.error('Error converting question to normal:', error);
      alert('Failed to convert question');
    }
  };

  // Handle drag end for reordering
  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Optimistic update
    setQuestions(items);

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const questionIds = items.map((q: any) => q.id);
      await api.reorderQuestions(token, questionIds);

      // Update local question numbers to reflect order immediately
      const updatedLocal = items.map((q, idx) => ({ ...q, questionNumber: idx + 1 }));
      setQuestions(updatedLocal);

    } catch (error) {
      console.error('Error reordering questions:', error);
      alert('Failed to reorder questions');
      fetchQuestions(); // Revert on error
    }
  };

  const handleEditQuestion = (question: any) => {
    let parsedOptions = ['', '', '', ''];
    try {
      if (question.options) {
        let parsed = question.options;
        console.log("Raw question options:", parsed);

        // Robust Parsing Logic
        if (typeof parsed === 'string') {
          try {
            parsed = JSON.parse(parsed);
          } catch (e) {
            console.warn("First parse failed, assuming raw string or invalid JSON", e);
          }
        }

        // Check for double encoding
        if (typeof parsed === 'string') {
          try {
            parsed = JSON.parse(parsed);
          } catch (e) {
            console.warn("Second parse failed", e);
          }
        }

        // Now parsed should be an Array or Object
        if (Array.isArray(parsed)) {
          console.log("Parsed as Array:", parsed);
          const texts = parsed.map((o: any) => {
            if (typeof o === 'string') return o;
            if (o && typeof o === 'object') {
              return o.text || o.value || o.label || o.key || '';
            }
            return String(o);
          });

          for (let i = 0; i < 4; i++) {
            if (i < texts.length) parsedOptions[i] = texts[i] || '';
          }
        } else if (typeof parsed === 'object' && parsed !== null) {
          console.log("Parsed as Object:", parsed);
          const values = Object.values(parsed);
          for (let i = 0; i < 4; i++) {
            if (i < values.length) parsedOptions[i] = String(values[i] || '');
          }
        } else {
          console.error("Parsed options is not array/object:", typeof parsed);
        }
      }
    } catch (e) {
      console.error("Critical error processing options for edit:", e);


    }

    setFormData({
      questionNumber: question.questionNumber,
      title: question.title,
      description: question.description || '',
      correctAnswer: question.correctAnswer || '',
      points: question.points,
      timeLimit: question.timeLimit || '',
      // Allow all valid types, default to multiple_choice if unknown
      questionType: question.questionType || 'multiple_choice',
      options: parsedOptions,
    });
    setEditingId(question.id);
    setIsEditing(true);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      questionNumber: questions.length + 1,
      title: '',
      description: '',
      correctAnswer: '',
      points: 10,
      timeLimit: '',
      questionType: 'multiple_choice',
      options: ['', '', '', '']
    });
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
      fetchCurrentQuestion();
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

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quiz/mcq/${currentQuestionId}/enable-bid-round`, {
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

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quiz/mcq/${currentQuestionId}/start-timer`, {
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

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quiz/mcq/${currentQuestionId}/reveal-answer`, {
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

  const handleToggleFlag = async (questionId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Reuse the update endpoint to just toggle the flag
      // We need to fetch the full question detail first or just patch it?
      // Since updateQuestion requires payload, let's create a specific helper or just use update if the backend supports partials.
      // Assuming backend create/update is structured, we'll implement a specific endpoint or just sending the partial update if supported.
      // ACTUALLY: Let's assume we need to add a backend route for this or modify update.
      // For speed, let's assume we can add a simple backend route for this toggle or update just this field.

      // Let's implement a specific API call in api.ts and backend.
      await api.toggleQuestionFlag(token, questionId, !currentStatus);
      fetchQuestions();
    } catch (error) {
      console.error('Error toggling flag:', error);
      alert('Failed to toggle flag');
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
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{isEditing ? 'Edit Question' : 'Create New Question'}</DialogTitle>
                <DialogDescription>{isEditing ? 'Update the question details' : 'Add a question to the quiz'}</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSaveQuestion}>
                <div className="space-y-4 py-4">

                  {/* Question Type Selection */}
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <Label className="mb-2 block font-semibold">Question Type</Label>
                    <div className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="type_mcq"
                          name="questionType"
                          value="multiple_choice"
                          checked={formData.questionType === 'multiple_choice'}
                          onChange={() => setFormData({ ...formData, questionType: 'multiple_choice' })}
                          className="h-4 w-4 text-purple-600"
                        />
                        <Label htmlFor="type_mcq">Multiple Choice</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="type_image"
                          name="questionType"
                          value="image_based"
                          checked={formData.questionType === 'image_based'}
                          onChange={() => setFormData({ ...formData, questionType: 'image_based' })}
                          className="h-4 w-4 text-purple-600"
                        />
                        <Label htmlFor="type_image">Image Based</Label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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
                      <Label htmlFor="points">Points</Label>
                      <Input
                        id="points"
                        type="number"
                        value={formData.points}
                        onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      placeholder="e.g. JS Scope"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Question Text / Description</Label>
                    <textarea
                      id="description"
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter the question text here..."
                    />
                  </div>

                  {/* Image Upload for Image Based Questions */}
                  {formData.questionType === 'image_based' && (
                    <div className="space-y-2 bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <Label>Upload Image</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                      </div>
                      <p className="text-xs text-blue-600">Image will be appended to description automatically.</p>
                    </div>
                  )}

                  <div className="space-y-4 border-t pt-4">
                    <Label className="text-lg font-semibold">Options</Label>
                    <div className="grid grid-cols-2 gap-4">
                      {[1, 2, 3, 4].map((num) => (
                        <div key={num} className="space-y-2">
                          <Label htmlFor={`option${num}`} className="text-xs uppercase text-slate-500 font-bold">Option {num}</Label>
                          <textarea
                            id={`option${num}`}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                            value={formData.options[num - 1]}
                            onChange={(e) => {
                              const newOptions = [...formData.options];
                              newOptions[num - 1] = e.target.value;
                              setFormData({ ...formData, options: newOptions });
                            }}
                            placeholder={`Answer Option ${num} (supports code)`}
                            required
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="correctAnswer">Correct Answer</Label>
                    <select
                      id="correctAnswer"
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.correctAnswer}
                      onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                      required
                    >
                      <option value="">Select Correct Option</option>
                      {formData.options.map((opt, idx) => {
                        const key = String.fromCharCode(65 + idx); // A, B, C...
                        return opt ? <option key={idx} value={key}>Option {key}: {opt.substring(0, 30)}...</option> : null;
                      })}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timeLimit">Time Limit (Seconds)</Label>
                    <Input
                      id="timeLimit"
                      type="number"
                      value={formData.timeLimit}
                      onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value })}
                      placeholder="e.g. 60 (Leave empty for no limit)"
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
      {
        currentQuestion && currentQuestion.questionType === 'mcq_bidding' && (
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
                  <div className="flex gap-2">
                    {!mcqTimerState?.bidRoundEnabled ? (
                      <Button
                        onClick={handleEnableBidRound}
                        className="bg-purple-600 hover:bg-purple-700 flex-1"
                      >
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Enable Bid Round
                      </Button>
                    ) : (
                      <Button
                        onClick={async () => {
                          try {
                            await api.post('/mcq/disable-global-mode', {});
                            alert("Global Bid Mode Disabled: The bid round segment has ended.");
                            // Force refresh or update state if needed
                          } catch (e) {
                            alert("Error: Failed to disable global mode");
                          }
                        }
                        }
                        className="bg-red-600 hover:bg-red-700 flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        End Bid Segment
                      </Button>
                    )}
                  </div>

                  {mcqTimerState?.bidRoundEnabled && (
                    <Button
                      onClick={handleStartMcqTimer}
                      disabled={mcqTimerState?.isRunning || mcqTimerState?.biddingClosed}
                      className="bg-green-600 hover:bg-green-700 w-full"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Timer ({mcqTimerState?.timeRemaining || 10}s)
                    </Button>
                  )}
                  <Button
                    onClick={handleRevealAnswer}
                    disabled={!mcqTimerState?.biddingClosed || mcqTimerState?.answerRevealed}
                    className="bg-blue-600 hover:bg-blue-700 w-full"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Reveal Answer
                  </Button>
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
        )
      }

      <Card>
        <CardHeader>
          <CardTitle>All Questions ({questions.length})</CardTitle>
          <CardDescription>Manage quiz questions and their availability (Drag to reorder)</CardDescription>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
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
              <Droppable droppableId="questions-table">
                {(provided) => (
                  <TableBody {...provided.droppableProps} ref={provided.innerRef}>
                    {questions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground">
                          No questions yet. Create one to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      questions.map((q: any, index: number) => {
                        const timerState = mcqTimerStates[q.id];
                        const isMcq = q.questionType === 'mcq_bidding';
                        const mcqQuestions = questions.filter((question: any) => question.questionType === 'mcq_bidding');
                        const isFirstMcq = isMcq && mcqQuestions.length > 0 && mcqQuestions[0].id === q.id;

                        return (
                          <Draggable key={q.id} draggableId={q.id} index={index}>
                            {(provided, snapshot) => (
                              <TableRow
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`${currentQuestionId === q.id ? 'bg-blue-50' : ''} ${snapshot.isDragging ? 'bg-gray-50 shadow-md' : ''}`}
                              >
                                <TableCell>
                                  <div {...provided.dragHandleProps} className="cursor-grab hover:text-gray-900 text-gray-400">
                                    <GripVertical className="h-5 w-5" />
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium">{index + 1}</TableCell>
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
                                      {/* Enable/Disable Bid Round Controls - ONLY for First MCQ */}
                                      {isFirstMcq && (
                                        timerState?.bidRoundEnabled ? (
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
                                        )
                                      )}

                                      {/* Start Timer Control - For First MCQ: checks enabled. For others: Always show if not running/closed */}
                                      {((isFirstMcq && timerState?.bidRoundEnabled) || (!isFirstMcq)) && !timerState?.isRunning && !timerState?.biddingClosed && (
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

                                      {/* Reveal Answer Controls */}
                                      {(timerState?.biddingClosed || timerState?.answerRevealed) && !timerState?.isRunning && (
                                        <Button
                                          size="sm"
                                          onClick={() => handleRevealAnswerForQuestion(q.id)}
                                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                                          disabled={timerState?.answerRevealed}
                                        >
                                          {timerState?.answerRevealed ? '✨ Answer Revealed' : '🎊 Reveal Answer & Distribute'}
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
                                  <div className="flex justify-end items-center gap-2">
                                    {/* Convert Buttons */}
                                    {!isMcq ? (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleConvertToBid(q.id)}
                                        title="Shift to Bid Round"
                                        className="text-purple-600 hover:text-purple-800 hover:bg-purple-100"
                                      >
                                        <ArrowUpCircle className="h-4 w-4" />
                                      </Button>
                                    ) : (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleConvertToNormal(q.id)}
                                        title="Shift to Normal (Multiple Choice)"
                                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                                      >
                                        <ArrowDownCircle className="h-4 w-4" />
                                      </Button>
                                    )}

                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleResetQuestion(q.id, q.title)}
                                      title="Reset Question"
                                      className="text-orange-600 hover:text-orange-800 hover:bg-orange-100"
                                    >
                                      <RotateCcw className="h-4 w-4" />
                                    </Button>

                                    {/* Edit Button - ONLY for Bid Round Questions (as per request) */}
                                    {/* Edit Button - ONLY for Bid Round Questions (as per request) */}
                                    {!isMcq ? null : (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleEditQuestion(q)}
                                        title="Edit Question (Bid Round Only)"
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleToggleQuestion(q.id, q.isEnabled)}
                                      className={`h-8 w-8 p-0 ${q.isEnabled ? 'text-green-600 hover:text-green-800 hover:bg-green-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                                      title={q.isEnabled ? "Disable" : "Enable"}
                                    >
                                      {q.isEnabled ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                                    </Button>
                                    <div className="flex gap-2">
                                      <Button
                                        variant={q.isFlagged ? "destructive" : "outline"}
                                        size="sm"
                                        onClick={() => handleToggleFlag(q.id, q.isFlagged)}
                                        title={q.isFlagged ? "Unflag as End Question" : "Flag as End Question"}
                                      >
                                        <Flag className={`h-4 w-4 ${q.isFlagged ? "fill-current" : ""}`} />
                                      </Button>
                                      <Button variant="outline" size="sm" onClick={() => handleEditQuestion(q)}>
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button variant="outline" size="sm" onClick={() => handleToggleQuestion(q.id, q.isEnabled)}>
                                        {q.isEnabled ? <Eye className="h-4 w-4 text-green-600" /> : <EyeOff className="h-4 w-4 text-gray-400" />}
                                      </Button>
                                      <Button variant="destructive" size="sm" onClick={() => handleDeleteQuestion(q.id)}>
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </Draggable>
                        );
                      })
                    )}
                    {provided.placeholder}
                  </TableBody>
                )}
              </Droppable>
            </Table>
          </DragDropContext>
        </CardContent>
      </Card>

      {/* MCQ Results Dialog */}
      <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bid Round Results</DialogTitle>
          </DialogHeader>
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
    </div >
  );
}
