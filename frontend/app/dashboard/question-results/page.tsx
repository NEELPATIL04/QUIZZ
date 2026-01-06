'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { api, User } from '@/lib/api';
import { Loader2, Edit2, Search } from 'lucide-react';


interface Question {
    id: string;
    questionNumber: number;
    title: string;
    description: string;
    points: number;
    questionType: string;
}

interface QuestionResult {
    answerId: string;
    teamId: string;
    teamName: string;
    teamNumber: number;
    answer: string;
    isCorrect: boolean;
    pointsAwarded: number;
    timeTaken: number;
    submittedAt: string;
    bidAmount?: number;
}

export default function QuestionResultsPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [selectedQuestionId, setSelectedQuestionId] = useState<string>('');
    const [results, setResults] = useState<QuestionResult[]>([]);
    const [loadingResults, setLoadingResults] = useState(false);

    // Edit Score Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedResult, setSelectedResult] = useState<QuestionResult | null>(null);
    const [newScore, setNewScore] = useState<number>(0);
    const [savingScore, setSavingScore] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                const storedUser = localStorage.getItem('user');
                const token = localStorage.getItem('token');

                if (!storedUser || !token) {
                    router.push('/login');
                    return;
                }

                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);

                if (parsedUser.role !== 'admin' && parsedUser.role !== 'super_admin') {
                    router.push('/dashboard');
                    return;
                }

                // Fetch questions
                const questionsData = await api.getQuestions(token);
                // Sort by question number
                questionsData.sort((a: any, b: any) => a.questionNumber - b.questionNumber);
                setQuestions(questionsData);

            } catch (error) {
                console.error('Auth verification failed:', error);
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [router]);

    // Fetch results when a question is selected
    useEffect(() => {
        if (!selectedQuestionId) return;

        const fetchResults = async () => {
            setLoadingResults(true);
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    const data = await api.getQuestionResults(token, selectedQuestionId);
                    setResults(data);
                }
            } catch (error) {
                console.error('Failed to fetch results:', error);
                alert('Failed to load results for this question.');
            } finally {
                setLoadingResults(false);
            }
        };

        fetchResults();
    }, [selectedQuestionId]);

    const handleEditScore = (result: QuestionResult) => {
        setSelectedResult(result);
        setNewScore(result.pointsAwarded || 0);
        setIsEditModalOpen(true);
    };

    const handleSaveScore = async () => {
        if (!selectedResult || !user) return;

        setSavingScore(true);
        try {
            const token = localStorage.getItem('token');
            if (token) {
                await api.updateTeamAnswerScore(token, selectedResult.answerId, newScore);

                // Refresh results locally
                setResults(prev => prev.map(r =>
                    r.answerId === selectedResult.answerId
                        ? { ...r, pointsAwarded: newScore }
                        : r
                ));

                setIsEditModalOpen(false);
            }
        } catch (error) {
            console.error('Failed to update score:', error);
            alert('Failed to update score.');
        } finally {
            setSavingScore(false);
        }
    };

    const isBidRound = questions.find(q => q.id === selectedQuestionId)?.questionType === 'mcq_bidding';

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Question Results Analysis</h1>
                <p className="text-muted-foreground">Review and edit scores per question</p>
            </div>

            <div className="max-w-full mx-auto space-y-6">

                {/* Question Selector */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Search className="w-5 h-5 text-muted-foreground" />
                            Select Question
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Select
                            value={selectedQuestionId}
                            onValueChange={setSelectedQuestionId}
                        >
                            <SelectTrigger className="w-full md:w-[400px]">
                                <SelectValue placeholder="Choose a question..." />
                            </SelectTrigger>
                            <SelectContent>
                                {questions.map((q) => (
                                    <SelectItem key={q.id} value={q.id}>
                                        Q{q.questionNumber}: {q.title.substring(0, 50)}{q.title.length > 50 ? '...' : ''} ({q.points}pts) {q.questionType === 'mcq_bidding' ? '(Bid)' : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                {/* Results Table */}
                {selectedQuestionId && (
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Results Overview {isBidRound && <span className="ml-2 px-2 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded-full border border-indigo-200">BID ROUND</span>}</CardTitle>
                                <div className="text-sm text-muted-foreground">
                                    {results.length} submissions found
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loadingResults ? (
                                <div className="flex justify-center py-10">
                                    <Loader2 className="w-8 h-8 animate-spin" />
                                </div>
                            ) : results.length === 0 ? (
                                <div className="text-center py-10 text-muted-foreground italic">
                                    No answers submitted for this question yet.
                                </div>
                            ) : (
                                <div className="rounded-md border overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Team</TableHead>
                                                <TableHead>Answer Preview</TableHead>
                                                {!isBidRound && <TableHead>Time Taken</TableHead>}
                                                <TableHead>Status</TableHead>
                                                {isBidRound && <TableHead className="text-right">Bid Amount</TableHead>}
                                                {isBidRound && <TableHead className="text-right">Return %</TableHead>}
                                                <TableHead className="text-right">{isBidRound ? 'Profit/Loss' : 'Points'}</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {results.map((result) => (
                                                <TableRow key={result.answerId}>
                                                    <TableCell className="font-medium">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold">Team {result.teamNumber}</span>
                                                            <span className="text-xs text-muted-foreground">{result.teamName}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="max-w-[200px] truncate" title={String(result.answer)}>
                                                        {typeof result.answer === 'object' ? JSON.stringify(result.answer) : String(result.answer)}
                                                    </TableCell>
                                                    {!isBidRound && (
                                                        <TableCell>
                                                            {result.timeTaken}s
                                                        </TableCell>
                                                    )}
                                                    <TableCell>
                                                        {result.isCorrect ? (
                                                            <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold border border-green-200">Correct</span>
                                                        ) : (
                                                            <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold border border-red-200">Incorrect</span>
                                                        )}
                                                    </TableCell>
                                                    {isBidRound && (
                                                        <TableCell className="text-right font-mono">
                                                            {result.bidAmount}
                                                        </TableCell>
                                                    )}
                                                    {isBidRound && (
                                                        <TableCell className="text-right font-mono">
                                                            {result.bidAmount && result.bidAmount > 0
                                                                ? ((result.pointsAwarded / result.bidAmount) * 100).toFixed(0) + '%'
                                                                : '0%'}
                                                        </TableCell>
                                                    )}
                                                    <TableCell className={`text-right font-mono text-lg font-bold ${isBidRound ? (result.pointsAwarded >= 0 ? 'text-green-600' : 'text-red-600') : ''}`}>
                                                        {isBidRound && result.pointsAwarded > 0 ? '+' : ''}{result.pointsAwarded}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEditScore(result)}
                                                            className="hover:bg-slate-100"
                                                        >
                                                            <Edit2 className="w-4 h-4 mr-1" /> Edit
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Edit Score Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Score for Team {selectedResult?.teamNumber}</DialogTitle>
                        <DialogDescription>
                            Manually declare points for this question. This will automatically update the team's total score.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Points Awarded</label>
                            <Input
                                type="number"
                                value={newScore}
                                onChange={(e) => setNewScore(Number(e.target.value))}
                            />
                            <p className="text-xs text-muted-foreground">
                                Negative values are allowed. Current score: {selectedResult?.pointsAwarded}
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsEditModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveScore}
                            disabled={savingScore}
                        >
                            {savingScore ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
