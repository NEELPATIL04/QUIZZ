'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight, Info, RotateCcw, Undo2, Redo2 } from 'lucide-react';

interface MatchOption {
    id: string;
    term: string;
    definition: string;
    matchId: string;
}

interface QuestionData {
    id: number;
    title: string;
    description: string;
    options: MatchOption[];
    points: number;
}

interface MatchFollowingChallengeProps {
    question: QuestionData;
    teamNumber: number;
    isController: boolean;
    onSubmit: (answer: any, timeTaken: number, startTime: Date) => Promise<{
        isCorrect: boolean;
        pointsAwarded: number;
        correctCount: number;
        totalCount: number;
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

export default function MatchFollowingChallenge({
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
}: MatchFollowingChallengeProps) {
    const [startTime] = useState(new Date());
    const [elapsedTime, setElapsedTime] = useState(0);
    const [draggedItem, setDraggedItem] = useState<MatchOption | null>(null);

    // State for available definitions (right column)
    const [availableDefinitions, setAvailableDefinitions] = useState<MatchOption[]>([]);

    // State for matches (left column slots)
    // Map of Term ID -> Matched Definition Item
    const [matches, setMatches] = useState<Record<string, MatchOption | null>>({});

    // History for Undo/Redo
    const [history, setHistory] = useState<{
        past: Array<{ matches: Record<string, MatchOption | null>; available: MatchOption[] }>;
        future: Array<{ matches: Record<string, MatchOption | null>; available: MatchOption[] }>;
    }>({ past: [], future: [] });

    const [submitted, setSubmitted] = useState(isSubmitted);
    const [result, setResult] = useState<{ isCorrect: boolean; pointsAwarded: number; correctCount: number; totalCount: number } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialize state
    useEffect(() => {
        const shuffled = [...question.options].sort(() => Math.random() - 0.5);
        setAvailableDefinitions(shuffled);

        const initialMatches: Record<string, MatchOption | null> = {};
        question.options.forEach(opt => {
            initialMatches[opt.id] = null;
        });
        setMatches(initialMatches);
        setHistory({ past: [], future: [] });
    }, [question.id]);

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

    const addToHistory = () => {
        setHistory(prev => ({
            past: [...prev.past, { matches: { ...matches }, available: [...availableDefinitions] }],
            future: []
        }));
    };

    const handleUndo = () => {
        if (history.past.length === 0) return;
        const previous = history.past[history.past.length - 1];
        const newPast = history.past.slice(0, -1);

        setHistory({
            past: newPast,
            future: [{ matches: { ...matches }, available: [...availableDefinitions] }, ...history.future]
        });
        setMatches(previous.matches);
        setAvailableDefinitions(previous.available);
    };

    const handleRedo = () => {
        if (history.future.length === 0) return;
        const next = history.future[0];
        const newFuture = history.future.slice(1);

        setHistory({
            past: [...history.past, { matches: { ...matches }, available: [...availableDefinitions] }],
            future: newFuture
        });
        setMatches(next.matches);
        setAvailableDefinitions(next.available);
    };

    const handleDragStart = (e: React.DragEvent, item: MatchOption, source: 'available' | 'matched') => {
        if (!isController || readOnly || submitted) {
            e.preventDefault();
            return;
        }
        setDraggedItem(item);
        e.dataTransfer.setData('source', source);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isController || readOnly || submitted) return;
    };

    const handleDropOnSlot = (e: React.DragEvent, targetTermId: string) => {
        e.preventDefault();
        if (!draggedItem || !isController || readOnly || submitted) return;

        addToHistory();

        const source = e.dataTransfer.getData('source');

        if (matches[targetTermId]) {
            const existingItem = matches[targetTermId]!;
            if (existingItem.id === draggedItem.id) return;
            setAvailableDefinitions(prev => [...prev, existingItem]);
        }

        if (source === 'available') {
            setAvailableDefinitions(prev => prev.filter(i => i.id !== draggedItem.id));
        } else {
            const oldSlotId = Object.keys(matches).find(key => matches[key]?.id === draggedItem.id);
            if (oldSlotId) {
                setMatches(prev => ({ ...prev, [oldSlotId]: null }));
            }
        }

        setMatches(prev => ({ ...prev, [targetTermId]: draggedItem }));
        setDraggedItem(null);
    };

    const handleDropOnAvailable = (e: React.DragEvent) => {
        e.preventDefault();
        if (!draggedItem || !isController || readOnly || submitted) return;

        const source = e.dataTransfer.getData('source');
        if (source === 'available') return;

        addToHistory();

        const oldSlotId = Object.keys(matches).find(key => matches[key]?.id === draggedItem.id);
        if (oldSlotId) {
            setMatches(prev => ({ ...prev, [oldSlotId]: null }));
        }

        setAvailableDefinitions(prev => [...prev, draggedItem]);
        setDraggedItem(null);
    };

    const handleReset = () => {
        if (!isController || submitted || readOnly) return;
        if (confirm('Reset all matches?')) {
            addToHistory();
            setMatches(Object.keys(matches).reduce((acc, key) => ({ ...acc, [key]: null }), {}));
            setAvailableDefinitions([...question.options].sort(() => Math.random() - 0.5));
        }
    };

    const handleSubmit = async () => {
        if (!isController || readOnly || submitted) return;

        const unmatchedCount = Object.values(matches).filter(v => v === null).length;
        if (unmatchedCount > 0) {
            if (!confirm(`You have ${unmatchedCount} unmatched items. Submit anyway?`)) {
                return;
            }
        }

        setIsSubmitting(true);
        try {
            const answer = Object.entries(matches).reduce((acc, [termId, definitionItem]) => {
                if (definitionItem) {
                    acc[termId] = definitionItem.id;
                }
                return acc;
            }, {} as Record<string, string>);

            const timeTaken = Math.floor((Date.now() - startTime.getTime()) / 1000);
            const result = await onSubmit(answer, timeTaken, startTime);

            setResult(result);
            setSubmitted(true);
        } catch (error) {
            console.error('Submission error:', error);
            alert('Error submitting answer.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Navigation Bar */}
                <Card className="bg-slate-800/50 border-slate-700 mb-4">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <Button
                                onClick={onPrevious}
                                disabled={!hasPreviousQuestion}
                                className="bg-slate-700 hover:bg-slate-600 text-white border-2 border-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4 mr-2" />
                                Previous Question
                            </Button>

                            <div className="flex items-center gap-2 text-white bg-indigo-600 px-4 py-2 rounded-lg shadow-lg">
                                <Clock className="w-5 h-5" />
                                <span className="font-mono text-lg font-bold">{formatTime(elapsedTime)}</span>
                            </div>

                            <Button
                                onClick={onNext}
                                disabled={!hasNextQuestion}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white border-2 border-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                {nextQuestionIsBidRound ? 'Next Question →' : 'Next Question →'}
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

                        <div className="bg-indigo-900/30 border border-indigo-700 rounded-lg p-4 flex items-start gap-3">
                            <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-indigo-200">
                                <strong>Instructions:</strong> Drag definitions from the right column to their matching terms in the left column.
                            </div>
                        </div>

                        {isController && !submitted && !readOnly && (
                            <div className="mt-4 flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleUndo}
                                    disabled={history.past.length === 0}
                                    title="Undo"
                                >
                                    <Undo2 className="w-4 h-4 mr-1" /> Undo
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRedo}
                                    disabled={history.future.length === 0}
                                    title="Redo"
                                >
                                    <Redo2 className="w-4 h-4 mr-1" /> Redo
                                </Button>
                                <div className="w-px h-8 bg-slate-700 mx-2 self-center"></div>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleReset}
                                    className="flex items-center gap-2"
                                >
                                    <RotateCcw className="w-4 h-4" /> Reset All
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Main Interaction Area */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Terms & Drop Zones */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-indigo-300 mb-4 px-2">Column A (Terms)</h2>
                        {question.options.map((option) => {
                            const matchedItem = matches[option.id];
                            const isCorrect = submitted && matchedItem?.matchId === option.matchId;
                            const isWrong = submitted && matchedItem && matchedItem.matchId !== option.matchId;

                            return (
                                <div key={option.id} className="flex items-center gap-4">
                                    {/* Static Term Card */}
                                    <div className="w-1/2 p-4 bg-slate-800 border border-slate-600 rounded-lg text-white font-medium shadow-sm">
                                        {option.id}. {option.term}
                                    </div>

                                    {/* Drop Zone */}
                                    <div
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDropOnSlot(e, option.id)}
                                        className={`
                                            w-1/2 min-h-[64px] rounded-lg border-2 border-dashed transition-all p-1 flex items-center justify-center
                                            ${matchedItem ? 'border-solid' : 'border-slate-600 bg-slate-900/30'}
                                            ${!matchedItem && !submitted ? 'hover:border-indigo-400 hover:bg-indigo-900/20' : ''}
                                            ${isCorrect ? 'border-green-500 bg-green-900/20' : ''}
                                            ${isWrong ? 'border-red-500 bg-red-900/20' : ''}
                                        `}
                                    >
                                        {matchedItem ? (
                                            <div
                                                draggable={isController && !submitted}
                                                onDragStart={(e) => handleDragStart(e, matchedItem, 'matched')}
                                                className={`
                                                    w-full h-full p-3 bg-indigo-600 rounded text-white text-sm shadow-md cursor-grab active:cursor-grabbing
                                                    ${submitted ? 'cursor-default' : ''}
                                                `}
                                            >
                                                {matchedItem.definition}
                                            </div>
                                        ) : (
                                            <span className="text-slate-500 text-sm">Drop here</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Right Column: Available Definitions */}
                    <div className="h-full flex flex-col">
                        <h2 className="text-xl font-bold text-indigo-300 mb-4 px-2">Column B (Definitions)</h2>
                        <div
                            onDragOver={handleDragOver}
                            onDrop={handleDropOnAvailable}
                            className="flex-1 bg-slate-800/30 border-2 border-dashed border-slate-700 rounded-xl p-6 space-y-3 min-h-[400px]"
                        >
                            {availableDefinitions.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-slate-500 italic">
                                    All definitions placed
                                </div>
                            ) : (
                                availableDefinitions.map((item) => (
                                    <div
                                        key={item.id}
                                        draggable={isController && !submitted}
                                        onDragStart={(e) => handleDragStart(e, item, 'available')}
                                        className="p-4 bg-white text-slate-900 rounded-lg shadow-md hover:shadow-lg hover:scale-[1.02] transition-all cursor-grab active:cursor-grabbing border border-slate-200"
                                    >
                                        <span className="font-bold mr-2 text-indigo-700">{item.id}</span>
                                        {item.definition}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Submit Section */}
                {!submitted && !readOnly && isController && (
                    <div className="mt-8 flex justify-center">
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-6 text-xl font-bold rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Matches'}
                        </Button>
                    </div>
                )}

                {/* Results Display */}
                {submitted && result && (
                    <Card className={`mt-8 ${result.isCorrect ? 'bg-green-900/30 border-green-600' : 'bg-orange-900/30 border-orange-600'}`}>
                        <CardContent className="p-6 text-center">
                            <h2 className={`text-3xl font-bold mb-2 ${result.isCorrect ? 'text-green-400' : 'text-orange-400'}`}>
                                {result.isCorrect ? 'Perfect Match!' : 'Good Effort!'}
                            </h2>
                            <p className="text-xl text-white">
                                You matched <span className="font-bold">{result.correctCount}</span> out of {result.totalCount} correctly.
                            </p>
                            <p className="text-slate-300 mt-2">
                                Points Awarded: {result.pointsAwarded}
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
