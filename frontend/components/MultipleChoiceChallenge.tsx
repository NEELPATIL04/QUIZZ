
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Option {
    key: string;
    text: string;
}

interface MultipleChoiceChallengeProps {
    question: {
        id: string;
        questionNumber: number;
        title: string;
        description: string;
        options: Option[];
        points: number;
    };
    teamNumber: number;
    isController: boolean;
    onSubmit: (answer: string, timeTaken: number, startTime: Date) => Promise<{ isCorrect: boolean; pointsAwarded: number }>;
    onNext?: () => void;
    onPrevious?: () => void;
    hasNextQuestion?: boolean;
    hasPreviousQuestion?: boolean;
    nextQuestionIsBidRound?: boolean;

    isSubmitted?: boolean;
    isMultiSelect?: boolean;
}

export default function MultipleChoiceChallenge({
    question,
    teamNumber,
    isController,
    onSubmit,
    onNext,
    onPrevious,
    hasNextQuestion,
    hasPreviousQuestion,
    nextQuestionIsBidRound = false,
    isSubmitted: isSubmittedProp = false,
    isMultiSelect = false,
}: MultipleChoiceChallengeProps) {
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    // Keep legacy single select state for backward compat or derived from array?
    // Let's use array for everything internally effectively.

    // Derived state for single/multi
    const isOptionSelected = (key: string) => selectedOptions.includes(key);

    const handleOptionClick = (key: string) => {
        if (isSubmitted) return;

        if (isMultiSelect) {
            setSelectedOptions(prev =>
                prev.includes(key)
                    ? prev.filter(k => k !== key)
                    : [...prev, key]
            );
        } else {
            setSelectedOptions([key]);
        }
    };
    const [isSubmitted, setIsSubmitted] = useState(isSubmittedProp);
    const [startTime, setStartTime] = useState(new Date());

    // Reset state when question changes
    useEffect(() => {
        setIsSubmitted(isSubmittedProp);
        setSelectedOptions([]);
        setStartTime(new Date());
    }, [question.id, isSubmittedProp]);

    const handleSubmit = async () => {
        if (selectedOptions.length === 0) return;

        // Time taken calculation
        const timeTaken = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);

        try {
            // Send keys directly (A, B, C, D) instead of option texts
            // This matches how correctAnswer is stored in the database
            const answerPayload = isMultiSelect
                ? JSON.stringify(selectedOptions)
                : selectedOptions[0]; // Send "A" directly if single select

            await onSubmit(answerPayload, timeTaken, startTime);
            setIsSubmitted(true);
        } catch (error) {
            // Submit error
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-900 to-cyan-900 p-6">
            {/* Header with Navigation */}
            <div className="mb-6 flex flex-col gap-4">
                {/* Top Row: Navigation Buttons */}
                <div className="flex items-center justify-between w-full">
                    {/* Left: Previous Button - Fixed Width */}
                    <div className="flex justify-start">
                        {hasPreviousQuestion && onPrevious && (
                            <Button
                                onClick={onPrevious}
                                size="sm"
                                variant="outline"
                                className="bg-slate-700/80 hover:bg-slate-600 text-white font-semibold px-4 py-2 text-sm border-slate-500"
                            >
                                ← Previous
                            </Button>
                        )}
                    </div>

                    {/* Right: Next Question Button */}
                    <div className="flex justify-end">
                        {hasNextQuestion && onNext && (
                            <Button
                                onClick={onNext}
                                size="sm"
                                className={nextQuestionIsBidRound
                                    ? "bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-white font-bold px-4 py-2 text-sm animate-pulse"
                                    : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold px-4 py-2 text-sm"
                                }
                            >
                                {nextQuestionIsBidRound ? "Bid Round →" : "Next →"}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Bottom Row: Title (Centered) */}
                <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Badge variant="outline" className="text-white border-white/20">
                            Question {question.questionNumber}
                        </Badge>
                        {isMultiSelect && (
                            <Badge variant="secondary" className="bg-purple-500 text-white border-none">
                                Multi-Select
                            </Badge>
                        )}
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                        {question.title}
                    </h1>
                    <p className="text-blue-200 text-base">Select the correct output</p>
                </div>
            </div>

            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Code Snippet / Description */}
                <Card className="bg-slate-900 border border-slate-700 shadow-xl overflow-hidden">
                    <CardContent className="p-6">
                        <div className="prose prose-invert max-w-none text-slate-100 [&>img]:mt-6 [&>img]:rounded-lg [&>img]:border [&>img]:border-white/10 [&>img]:max-w-md [&>img]:max-h-96 [&>img]:object-contain">
                            <ReactMarkdown
                                components={{
                                    pre: ({ node, children, ...props }: any) => (
                                        <pre className="bg-slate-950 p-4 rounded-lg overflow-x-auto border border-slate-800 my-4 font-mono text-sm" {...props}>
                                            {children}
                                        </pre>
                                    ),
                                    code: ({ node, inline, className, children, ...props }: any) => {
                                        // Check if this is inline code or a code block
                                        if (inline) {
                                            return <code className="bg-slate-800 text-blue-300 px-1.5 py-0.5 rounded font-mono text-sm" {...props}>{children}</code>;
                                        }
                                        // Code block - preserve whitespace and line breaks
                                        return <code className="text-green-300 font-mono text-sm whitespace-pre-wrap break-words" {...props}>{children}</code>;
                                    },
                                    p: ({ node, ...props }: any) => <p className="text-slate-100 leading-relaxed mb-4 whitespace-pre-wrap" {...props} />,
                                    li: ({ node, ...props }: any) => <li className="text-slate-100 ml-4" {...props} />,
                                    strong: ({ node, ...props }: any) => <strong className="text-white font-bold" {...props} />,
                                    img: ({ node, src, ...props }: any) => {
                                        // Convert relative image URLs to absolute backend URLs
                                        const imageSrc = src?.startsWith('/images')
                                            ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${src}`
                                            : src;
                                        return <img src={imageSrc} {...props} />;
                                    },
                                }}
                            >
                                {question.description}
                            </ReactMarkdown>
                        </div>
                    </CardContent>
                </Card>

                {/* Options */}
                <div className="space-y-4">
                    <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
                        <CardContent className="p-6 space-y-4">
                            {isSubmitted ? (
                                <div className="text-center py-8">
                                    <div className="inline-flex items-center justify-center p-4 bg-green-500/20 rounded-full mb-4">
                                        <CheckCircle className="h-12 w-12 text-green-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Answer Submitted!</h3>
                                    <p className="text-slate-300">Wait for the presenter to reveal the answer.</p>
                                </div>
                            ) : (
                                <>
                                    {!isController && (
                                        <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-3 text-center mb-4">
                                            <p className="text-yellow-200 text-sm">Waiting for controller to select an answer...</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 gap-3">
                                        {question.options.map((option, index) => (
                                            <button
                                                key={`${question.id}-option-${index}-${option.key}`}
                                                onClick={() => handleOptionClick(option.key)}
                                                disabled={isSubmitted || !isController}
                                                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 relative overflow-hidden group
                                ${isOptionSelected(option.key)
                                                        ? 'border-blue-400 bg-blue-900/30 shadow-[0_0_15px_rgba(96,165,250,0.3)]'
                                                        : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                                                    }
                                ${!isController || isSubmitted ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}
                            `}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors
                                    ${isOptionSelected(option.key)
                                                            ? 'border-blue-400 bg-blue-400 text-white'
                                                            : 'border-white/30 text-white/50 group-hover:border-white/50'
                                                        }
                                `}>
                                                        {isMultiSelect ? (
                                                            // Checkbox style for multi
                                                            <div className={`w-4 h-4 rounded-sm ${isOptionSelected(option.key) ? 'bg-white' : ''}`} />
                                                        ) : (
                                                            // Radio style for single
                                                            <span className="font-bold">{option.key}</span>
                                                        )}
                                                    </div>
                                                    <pre className="flex-1 font-mono text-slate-200 whitespace-pre-wrap m-0">
                                                        {option.text}
                                                    </pre>
                                                    {isOptionSelected(option.key) && (
                                                        <div className="absolute right-4 text-blue-400">
                                                            <CheckCircle className="h-6 w-6" />
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    {isController && (
                                        <Button
                                            onClick={handleSubmit}
                                            disabled={selectedOptions.length === 0 || isSubmitted}
                                            className="w-full mt-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-6 text-lg shadow-lg shadow-blue-900/20"
                                        >
                                            Submit Answer
                                        </Button>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
