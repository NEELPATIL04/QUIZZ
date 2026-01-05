
'use client';

import { useState } from 'react';
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
}: MultipleChoiceChallengeProps) {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(isSubmittedProp);
    const [startTime] = useState(new Date());

    const handleSubmit = async () => {
        if (!selectedOption) return;

        // Time taken calculation
        const timeTaken = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);

        try {
            await onSubmit(selectedOption, timeTaken, startTime);
            setIsSubmitted(true);
        } catch (error) {
            console.error('Submit error:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-900 to-cyan-900 p-6">
            {/* Header with Navigation */}
            <div className="mb-6 flex items-center justify-between">
                {/* Left: Next Question Button */}
                <div>
                    {hasNextQuestion && onNext && (
                        <Button
                            onClick={onNext}
                            size="lg"
                            className={nextQuestionIsBidRound
                                ? "bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-white font-bold px-8 py-3 text-base animate-pulse"
                                : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold px-8 py-3 text-base"
                            }
                        >
                            {nextQuestionIsBidRound ? "🎯 Enter Bid Round →" : "Next Question →"}
                        </Button>
                    )}
                </div>

                {/* Center: Title */}
                <div className="flex-1 text-center">
                    <Badge variant="outline" className="mb-2 text-white border-white/20">
                        Question {question.questionNumber}
                    </Badge>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        {question.title}
                    </h1>
                    <p className="text-blue-200 text-lg">Select the correct output</p>
                </div>

                {/* Right: Previous Button */}
                <div className="flex items-center gap-2">
                    {hasPreviousQuestion && onPrevious && (
                        <Button
                            onClick={onPrevious}
                            size="lg"
                            variant="outline"
                            className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-8 py-3 text-base border-slate-500"
                        >
                            ← Previous
                        </Button>
                    )}
                </div>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Code Snippet / Description */}
                <Card className="bg-slate-900 border border-slate-700 shadow-xl overflow-hidden">
                    <CardContent className="p-6">
                        <div className="prose prose-invert max-w-none">
                            <ReactMarkdown
                                components={{
                                    pre: ({ node, ...props }: any) => <div className="bg-slate-950 p-4 rounded-lg overflow-x-auto border border-slate-800 text-slate-50 whitespace-pre-wrap" {...props} />,
                                    code: ({ node, ...props }: any) => <code className="text-blue-300 font-mono text-sm" {...props} />,
                                    p: ({ node, ...props }: any) => <p className="text-slate-200 mb-4" {...props} />
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
                                        {question.options.map((option) => (
                                            <div
                                                key={option.key}
                                                onClick={() => isController && !isSubmitted && setSelectedOption(option.key)}
                                                className={`
                          relative p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 group
                          ${isController && !isSubmitted ? 'cursor-pointer hover:bg-white/5' : 'cursor-default opacity-80'}
                          ${selectedOption === option.key
                                                        ? 'border-blue-500 bg-blue-500/20'
                                                        : 'border-slate-700 bg-slate-800/50'}
                        `}
                                            >
                                                <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold border-2 transition-colors
                          ${selectedOption === option.key
                                                        ? 'bg-blue-500 border-blue-500 text-white'
                                                        : 'border-slate-600 text-slate-400 group-hover:border-slate-500'}
                        `}>
                                                    {option.key}
                                                </div>
                                                <div className="flex-1 font-mono text-slate-200">
                                                    {option.text}
                                                </div>
                                                {selectedOption === option.key && (
                                                    <div className="absolute right-4 text-blue-400">
                                                        <CheckCircle className="h-6 w-6" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {isController && (
                                        <Button
                                            onClick={handleSubmit}
                                            disabled={!selectedOption || isSubmitted}
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
