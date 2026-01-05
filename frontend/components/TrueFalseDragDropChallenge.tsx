'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight, Info, Undo2, Redo2, RotateCcw } from 'lucide-react';

interface CodeBlock {
  id: string;
  code: string;
  correctAnswer: boolean;
}

interface QuestionData {
  id: number;
  title: string;
  description: string;
  hints?: string[];
  codeBlocks: CodeBlock[];
  points: number;
}

interface TrueFalseDragDropChallengeProps {
  question: QuestionData;
  teamNumber: number;
  isController: boolean;
  onSubmit: (answer: any, timeTaken: number, startTime: Date) => Promise<{
    isCorrect: boolean;
    pointsAwarded: number;
  }>;
  readOnly?: boolean;
  showAnswer?: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNextQuestion?: boolean;
  hasPreviousQuestion?: boolean;
  isSubmitted?: boolean;
  nextQuestionIsBidRound?: boolean;
}

export default function TrueFalseDragDropChallenge({
  question,
  teamNumber,
  isController,
  onSubmit,
  readOnly = false,
  showAnswer = false,
  onNext,
  onPrevious,
  hasNextQuestion = false,
  hasPreviousQuestion = false,
  isSubmitted = false,
  nextQuestionIsBidRound = false,
}: TrueFalseDragDropChallengeProps) {
  const [startTime] = useState(new Date());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [draggedBlock, setDraggedBlock] = useState<CodeBlock | null>(null);
  const [dragOverZone, setDragOverZone] = useState<'available' | 'true' | 'false' | null>(null);

  // Initialize state
  const [availableBlocks, setAvailableBlocks] = useState<CodeBlock[]>(question.codeBlocks);
  const [trueBlocks, setTrueBlocks] = useState<CodeBlock[]>([]);
  const [falseBlocks, setFalseBlocks] = useState<CodeBlock[]>([]);

  const [submitted, setSubmitted] = useState(isSubmitted);
  const [result, setResult] = useState<{ isCorrect: boolean; pointsAwarded: number; correctCount: number; totalCount: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // History for undo/redo
  interface HistoryState {
    available: CodeBlock[];
    trueBlocks: CodeBlock[];
    falseBlocks: CodeBlock[];
  }

  const initialState: HistoryState = {
    available: question.codeBlocks,
    trueBlocks: [],
    falseBlocks: [],
  };

  const [history, setHistory] = useState<HistoryState[]>([initialState]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Timer
  useEffect(() => {
    if (submitted || readOnly) return;
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, submitted, readOnly]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // History management
  const saveToHistory = (available: CodeBlock[], trueB: CodeBlock[], falseB: CodeBlock[]) => {
    const newState: HistoryState = {
      available,
      trueBlocks: trueB,
      falseBlocks: falseB,
    };

    // Remove any future history if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);

    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0 && !submitted && !readOnly && isController) {
      const newIndex = historyIndex - 1;
      const state = history[newIndex];
      setAvailableBlocks(state.available);
      setTrueBlocks(state.trueBlocks);
      setFalseBlocks(state.falseBlocks);
      setHistoryIndex(newIndex);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1 && !submitted && !readOnly && isController) {
      const newIndex = historyIndex + 1;
      const state = history[newIndex];
      setAvailableBlocks(state.available);
      setTrueBlocks(state.trueBlocks);
      setFalseBlocks(state.falseBlocks);
      setHistoryIndex(newIndex);
    }
  };

  const handleReset = () => {
    if (!submitted && !readOnly && isController) {
      const confirmed = confirm('Are you sure you want to reset all blocks to their initial positions?');
      if (confirmed) {
        setAvailableBlocks(question.codeBlocks);
        setTrueBlocks([]);
        setFalseBlocks([]);
        setHistory([initialState]);
        setHistoryIndex(0);
      }
    }
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, block: CodeBlock, source: 'available' | 'true' | 'false') => {
    if (!isController || readOnly || submitted) {
      e.preventDefault();
      return;
    }
    setDraggedBlock(block);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('source', source);
  };

  const handleDragOver = (e: React.DragEvent, zone: 'available' | 'true' | 'false') => {
    e.preventDefault();
    e.stopPropagation();
    if (!isController || readOnly || submitted) return;
    setDragOverZone(zone);
  };

  const handleDragLeave = () => {
    setDragOverZone(null);
  };

  const handleDrop = (e: React.DragEvent, targetZone: 'available' | 'true' | 'false') => {
    e.preventDefault();
    e.stopPropagation();
    if (!isController || readOnly || submitted || !draggedBlock) return;

    const source = e.dataTransfer.getData('source') as 'available' | 'true' | 'false';

    // If dropping in the same zone, do nothing
    if (source === targetZone) {
      setDraggedBlock(null);
      setDragOverZone(null);
      return;
    }

    // Calculate new state
    let newAvailable = [...availableBlocks];
    let newTrue = [...trueBlocks];
    let newFalse = [...falseBlocks];

    // Remove from source
    if (source === 'available') {
      newAvailable = newAvailable.filter(b => b.id !== draggedBlock.id);
    } else if (source === 'true') {
      newTrue = newTrue.filter(b => b.id !== draggedBlock.id);
    } else if (source === 'false') {
      newFalse = newFalse.filter(b => b.id !== draggedBlock.id);
    }

    // Add to target
    if (targetZone === 'available') {
      newAvailable = [...newAvailable, draggedBlock];
    } else if (targetZone === 'true') {
      newTrue = [...newTrue, draggedBlock];
    } else if (targetZone === 'false') {
      newFalse = [...newFalse, draggedBlock];
    }

    // Update state
    setAvailableBlocks(newAvailable);
    setTrueBlocks(newTrue);
    setFalseBlocks(newFalse);

    // Save to history
    saveToHistory(newAvailable, newTrue, newFalse);

    setDraggedBlock(null);
    setDragOverZone(null);
  };

  const handleSubmit = async () => {
    if (!isController || readOnly || submitted) return;

    // Check if all blocks are placed
    if (availableBlocks.length > 0) {
      alert('Please place all code blocks in either True or False zones before submitting!');
      return;
    }

    setIsSubmitting(true);
    try {
      const answer = {
        trueBlocks: trueBlocks.map(b => b.id),
        falseBlocks: falseBlocks.map(b => b.id),
      };

      const timeTaken = Math.floor((Date.now() - startTime.getTime()) / 1000);
      const result = await onSubmit(answer, timeTaken, startTime);

      setResult(result);
      setSubmitted(true);
    } catch (error) {
      console.error('Submission error:', error);
      alert('Error submitting answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBlockColor = (block: CodeBlock) => {
    if (!submitted && !showAnswer) return 'bg-slate-700 border-slate-600';

    // Show if placed correctly or incorrectly
    const isInTrue = trueBlocks.some(b => b.id === block.id);
    const isInFalse = falseBlocks.some(b => b.id === block.id);

    if (isInTrue && block.correctAnswer === true) return 'bg-green-700 border-green-600';
    if (isInFalse && block.correctAnswer === false) return 'bg-green-700 border-green-600';
    return 'bg-red-700 border-red-600';
  };

  const renderCodeBlock = (block: CodeBlock, source: 'available' | 'true' | 'false') => {
    const isDragging = draggedBlock?.id === block.id;
    const canDrag = isController && !readOnly && !submitted;

    return (
      <div
        key={block.id}
        draggable={canDrag}
        onDragStart={(e) => handleDragStart(e, block, source)}
        className={`
          ${getBlockColor(block)}
          border-2 rounded-lg p-4 mb-3 cursor-move transition-all
          ${isDragging ? 'opacity-40 scale-95' : 'opacity-100 scale-100'}
          ${canDrag ? 'hover:shadow-lg hover:scale-105' : 'cursor-not-allowed'}
          max-w-full
        `}
      >
        <div className="overflow-x-auto max-w-full">
          <pre className="text-xs text-white font-mono whitespace-pre break-words" style={{ maxWidth: '100%', overflowWrap: 'break-word' }}>
            {block.code}
          </pre>
        </div>
        {(submitted || showAnswer) && (
          <div className="mt-2 pt-2 border-t border-slate-600">
            <span className="text-xs font-semibold text-white">
              Correct Answer: {block.correctAnswer ? 'TRUE' : 'FALSE'}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.8);
        }
      `}} />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <div className="max-w-7xl mx-auto">

        {/* Navigation Bar at Top */}
        <Card className="bg-slate-800/50 border-slate-700 mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button
                onClick={onPrevious}
                disabled={!hasPreviousQuestion}
                className="bg-slate-700 hover:bg-slate-600 text-white border-2 border-slate-600 disabled:opacity-30 disabled:cursor-not-allowed disabled:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous Question
              </Button>

              <div className="flex items-center gap-2 text-white bg-purple-600 px-4 py-2 rounded-lg shadow-lg">
                <Clock className="w-5 h-5" />
                <span className="font-mono text-lg font-bold">{formatTime(elapsedTime)}</span>
              </div>

              <Button
                onClick={onNext}
                disabled={!hasNextQuestion}
                className="bg-purple-600 hover:bg-purple-700 text-white border-2 border-purple-500 disabled:opacity-30 disabled:cursor-not-allowed disabled:bg-slate-800"
              >
                {nextQuestionIsBidRound ? 'Continue to Bid Round' : 'Next Question'}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Header */}
        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-2">{question.title}</h1>
                <p className="text-slate-300">{question.description}</p>
              </div>
              <div className="text-right ml-4">
                <div className="text-sm text-slate-400">Team {teamNumber}</div>
                <div className="text-lg font-bold text-white">{question.points} points</div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-200">
                  <strong>Instructions:</strong> Drag each code block to either the TRUE or FALSE zone based on what value will be logged to the console.
                  All blocks must be placed before submitting. <strong>Partial marks awarded</strong> - you get points for each correct placement out of {question.points} total points.
                </div>
              </div>
            </div>

            {/* Controller Actions */}
            {isController && !submitted && !readOnly && (
              <div className="mt-4 pt-4 border-t border-slate-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={handleUndo}
                      disabled={historyIndex === 0}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-slate-700"
                    >
                      <Undo2 className="w-4 h-4 mr-2" />
                      Undo
                    </Button>
                    <Button
                      onClick={handleRedo}
                      disabled={historyIndex === history.length - 1}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-slate-700"
                    >
                      <Redo2 className="w-4 h-4 mr-2" />
                      Redo
                    </Button>
                    <Button
                      onClick={handleReset}
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white font-medium"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                  <span className="text-sm text-slate-300 font-medium px-3 py-1 bg-slate-700 rounded-md">
                    🎮 Controller Actions
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Left Side - Available Code Blocks */}
          <div className="flex flex-col" style={{ height: '680px' }}>
            <Card className="bg-slate-800/50 border-slate-700 h-full flex flex-col">
              <CardContent className="p-6 flex flex-col h-full">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 flex-shrink-0">
                  <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm">
                    {availableBlocks.length}
                  </span>
                  Code Blocks to Sort
                </h2>
                <div
                  onDragOver={(e) => handleDragOver(e, 'available')}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, 'available')}
                  className={`
                    flex-1 overflow-y-auto custom-scrollbar border-2 border-dashed rounded-lg p-4
                    ${dragOverZone === 'available' ? 'border-purple-500 bg-purple-900/20' : 'border-slate-600 bg-slate-900/20'}
                  `}
                >
                  {availableBlocks.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-500">
                      <p className="text-center">
                        {submitted || readOnly
                          ? 'All blocks have been sorted'
                          : 'Drag all blocks to True or False zones'}
                      </p>
                    </div>
                  ) : (
                    availableBlocks.map(block => renderCodeBlock(block, 'available'))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - True and False Zones */}
          <div className="flex flex-col gap-4" style={{ height: '680px' }}>
            {/* TRUE Zone */}
            <Card className="bg-green-900/20 border-green-700 flex-1 flex flex-col overflow-hidden">
              <CardContent className="p-6 flex flex-col h-full">
                <h2 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2 flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                  TRUE
                  <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm ml-auto">
                    {trueBlocks.length}
                  </span>
                </h2>
                <div
                  onDragOver={(e) => handleDragOver(e, 'true')}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, 'true')}
                  className={`
                    flex-1 overflow-y-auto custom-scrollbar border-2 border-dashed rounded-lg p-4
                    ${dragOverZone === 'true' ? 'border-green-400 bg-green-900/30' : 'border-green-700 bg-green-900/10'}
                  `}
                >
                  {trueBlocks.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-green-600">
                      <p>Drop TRUE code blocks here</p>
                    </div>
                  ) : (
                    trueBlocks.map(block => renderCodeBlock(block, 'true'))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* FALSE Zone */}
            <Card className="bg-red-900/20 border-red-700 flex-1 flex flex-col overflow-hidden">
              <CardContent className="p-6 flex flex-col h-full">
                <h2 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2 flex-shrink-0">
                  <XCircle className="w-6 h-6" />
                  FALSE
                  <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm ml-auto">
                    {falseBlocks.length}
                  </span>
                </h2>
                <div
                  onDragOver={(e) => handleDragOver(e, 'false')}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, 'false')}
                  className={`
                    flex-1 overflow-y-auto custom-scrollbar border-2 border-dashed rounded-lg p-4
                    ${dragOverZone === 'false' ? 'border-red-400 bg-red-900/30' : 'border-red-700 bg-red-900/10'}
                  `}
                >
                  {falseBlocks.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-red-600">
                      <p>Drop FALSE code blocks here</p>
                    </div>
                  ) : (
                    falseBlocks.map(block => renderCodeBlock(block, 'false'))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Result Display */}
        {result && (
          <Card className={`mb-6 ${result.isCorrect ? 'bg-green-900/30 border-green-700' : result.pointsAwarded > 0 ? 'bg-yellow-900/30 border-yellow-700' : 'bg-red-900/30 border-red-700'}`}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                {result.isCorrect ? (
                  <CheckCircle2 className="w-12 h-12 text-green-400" />
                ) : (
                  <XCircle className="w-12 h-12 text-red-400" />
                )}
                <div className="flex-1">
                  <h3 className={`text-2xl font-bold ${result.isCorrect ? 'text-green-400' : result.pointsAwarded > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {result.isCorrect ? 'Perfect! All Correct!' : result.pointsAwarded > 0 ? 'Partial Credit' : 'Incorrect'}
                  </h3>
                  <p className="text-white mt-1">
                    Correct Placements: <span className="font-bold">{result.correctCount}</span> / {result.totalCount}
                  </p>
                  <p className="text-white mt-1">
                    Points Awarded: <span className="font-bold">{result.pointsAwarded}</span> / {question.points}
                  </p>
                  <p className="text-sm text-slate-300 mt-2">
                    {result.isCorrect
                      ? 'Excellent work! You placed all code blocks correctly.'
                      : `You earned ${Math.round((result.pointsAwarded / question.points) * 100)}% of the available points.`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        {!submitted && !readOnly && isController && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-center">
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || availableBlocks.length > 0}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-12 py-6 text-lg font-bold"
                  size="lg"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Answer'}
                </Button>
              </div>
              {availableBlocks.length > 0 && (
                <p className="text-center text-amber-400 text-sm mt-3">
                  ⚠️ Please place all {availableBlocks.length} remaining block(s) before submitting
                </p>
              )}
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </>
  );
}
