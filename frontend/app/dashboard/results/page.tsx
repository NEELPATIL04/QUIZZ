'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Clock, CheckCircle, XCircle } from 'lucide-react';
import { api } from '@/lib/api';

interface TeamResult {
  teamId: string;
  teamNumber: number;
  teamName: string;
  score: number;
  totalTimeTaken: number;
  rank: number;
  answers: Array<{
    questionId: string;
    answer: string;
    isCorrect: boolean;
    pointsAwarded: number;
    timeTaken: number;
    timeStarted: string;
    timeCompleted: string;
    submittedAt: string;
  }>;
}

export default function ResultsPage() {
  const [results, setResults] = useState<TeamResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
    // Poll every 10 seconds
    const interval = setInterval(fetchResults, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchResults = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const data = await api.getTeamResults(token);
      setResults(data);
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-900';
      case 3:
        return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) {
      return <Trophy className="w-5 h-5" />;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading results...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quiz Results</h1>
        <p className="text-muted-foreground">Team rankings and performance</p>
      </div>

      {/* Leaderboard Card */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-600" />
            Leaderboard
          </CardTitle>
          <CardDescription>
            Teams ranked by score and completion time
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {results.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No results yet. Teams haven't submitted any answers.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Rank</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Total Time</TableHead>
                  <TableHead>Answers</TableHead>
                  <TableHead>Correct/Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result) => (
                  <TableRow key={result.teamId} className="hover:bg-slate-50">
                    <TableCell>
                      <div
                        className={`
                          inline-flex items-center justify-center gap-2
                          px-3 py-2 rounded-lg font-bold
                          ${getRankColor(result.rank)}
                        `}
                      >
                        {getRankIcon(result.rank)}
                        #{result.rank}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-lg">
                        Team {result.teamNumber}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {result.teamName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-2xl font-bold text-blue-600">
                        {result.score}
                      </div>
                      <div className="text-xs text-muted-foreground">points</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span className="font-mono font-semibold">
                          {formatTime(result.totalTimeTaken)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {result.answers.map((ans, idx) => (
                          <div
                            key={idx}
                            className={`
                              w-8 h-8 rounded-full flex items-center justify-center
                              ${ans.isCorrect
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                              }
                            `}
                            title={`Question ${idx + 1}: ${ans.isCorrect ? 'Correct' : 'Incorrect'}`}
                          >
                            {ans.isCorrect ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">
                        {result.answers.filter(a => a.isCorrect).length}/{result.answers.length}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detailed Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Detailed Results</h2>
          {results.map((result) => (
            <Card key={result.teamId}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Team {result.teamNumber} - {result.teamName}</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    Rank #{result.rank}
                  </span>
                </CardTitle>
                <CardDescription>
                  Score: {result.score} points | Total Time: {formatTime(result.totalTimeTaken)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {result.answers.length === 0 ? (
                  <p className="text-muted-foreground">No answers submitted yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Question</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Points</TableHead>
                        <TableHead>Time Taken</TableHead>
                        <TableHead>Submitted At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.answers.map((ans, idx) => (
                        <TableRow key={ans.questionId}>
                          <TableCell>Question {idx + 1}</TableCell>
                          <TableCell>
                            <span
                              className={`
                                inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                                ${ans.isCorrect
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                                }
                              `}
                            >
                              {ans.isCorrect ? (
                                <>
                                  <CheckCircle className="w-3 h-3" />
                                  Correct
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3" />
                                  Incorrect
                                </>
                              )}
                            </span>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {ans.pointsAwarded} pts
                          </TableCell>
                          <TableCell className="font-mono">
                            {formatTime(ans.timeTaken)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(ans.submittedAt).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
