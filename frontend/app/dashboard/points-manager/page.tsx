'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { Loader2, Calculator, Save, Monitor, AlertTriangle, CheckCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TeamData {
    id: string;
    teamNumber: number;
    teamName: string;
    score: number;
}

interface BidAnalytics {
    teamId: string;
    teamName: string;
    teamNumber: number;
    preBidScore: number;
    totalBidAmount: number;
    totalWon: number;
    totalLost: number;
    netBidChange: number;
    currentScore: number;
}

import McqResultsTable from '@/components/McqResultsTable';

export default function PointsManagerPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [teams, setTeams] = useState<TeamData[]>([]);
    const [config, setConfig] = useState<any>(null);
    const [scoreboardVisible, setScoreboardVisible] = useState(false);
    const [bidTableVisible, setBidTableVisible] = useState(false);

    // Toggle Loading States
    const [isTogglingScoreboard, setIsTogglingScoreboard] = useState(false);
    const [isTogglingBidTable, setIsTogglingBidTable] = useState(false);

    // Validation State
    const [isValidating, setIsValidating] = useState(false);
    const [validationResult, setValidationResult] = useState<any>(null);

    // Edit Score State
    const [editingTeam, setEditingTeam] = useState<TeamData | null>(null);
    const [newScore, setNewScore] = useState(0);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Bid Analytics State
    const [bidAnalytics, setBidAnalytics] = useState<BidAnalytics[]>([]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const [teamsData, configData] = await Promise.all([
                api.getAdminTeams(token),
                api.getQuizConfig(token)
            ]);

            setTeams(teamsData.sort((a: any, b: any) => b.score - a.score)); // Sort by score DESC
            setConfig(configData);

            // Only update if we are not currently toggling to avoid jitter
            if (!isTogglingScoreboard) {
                setScoreboardVisible(configData.isScoreboardVisible);
            }
            if (!isTogglingBidTable) {
                if (configData.hasOwnProperty('isBidResultsVisible')) {
                    setBidTableVisible(configData.isBidResultsVisible);
                }
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBidAnalytics = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const data = await api.getBidRoundAnalytics(token);
            setBidAnalytics(data);
        } catch (e) { console.error(e); }
    };

    const handleToggleBidRoundTable = async () => {
        if (isTogglingBidTable) return;
        setIsTogglingBidTable(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const newBidTableState = !bidTableVisible;

            // Optimistic update
            if (newBidTableState) {
                setScoreboardVisible(false);
                setBidTableVisible(true);
            } else {
                setBidTableVisible(false);
            }

            if (newBidTableState) {
                // Reveal Bid Table -> Hide Scoreboard
                await api.toggleScoreboard(token, false);
            }

            // Toggle Bid Table - Backend now handles ID resolution if visible=true
            await api.toggleBidResults(token, newBidTableState);

        } catch (error) {
            console.error('Toggle bid table error:', error);
            alert('Failed to toggle bid table');
            setBidTableVisible(bidTableVisible); // Revert
        } finally {
            setIsTogglingBidTable(false);
        }
    };

    const handleToggleScoreboard = async () => {
        if (isTogglingScoreboard) return;
        setIsTogglingScoreboard(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const newScoreboardState = !scoreboardVisible;

            // Optimistic update
            if (newScoreboardState) {
                setBidTableVisible(false);
                setScoreboardVisible(true);
            } else {
                setScoreboardVisible(false);
            }

            if (newScoreboardState) {
                // Reveal Scoreboard -> Hide Bid Table
                // We use the new API method. Passing visible=false is enough.
                await api.toggleBidResults(token, false);
            }

            await api.toggleScoreboard(token, newScoreboardState);

        } catch (error) {
            console.error('Toggle error:', error);
            alert('Failed to toggle scoreboard');
            setScoreboardVisible(scoreboardVisible); // Revert
        } finally {
            setIsTogglingScoreboard(false);
        }
    };

    const handleValidateScores = async () => {
        setIsValidating(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const result = await api.validateTeamScores(token);
            setValidationResult(result);
            fetchData(); // Refresh teams to show fixed scores

            setTimeout(() => setValidationResult(null), 5000); // Clear after 5s
        } catch (error) {
            console.error('Validation error:', error);
            alert('Failed to validate scores');
        } finally {
            setIsValidating(false);
        }
    };

    const handleEditScore = (team: TeamData) => {
        setEditingTeam(team);
        setNewScore(team.score);
        setIsEditModalOpen(true);
    };

    const handleSaveScore = async () => {
        if (!editingTeam) return;
        try {
            const token = localStorage.getItem('token');
            if (token) {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '${process.env.NEXT_PUBLIC_API_URL}'}/quiz/teams/${editingTeam.id}/score`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ score: newScore }),
                });

                if (!response.ok) {
                    console.error("Failed to update score directly");
                    alert('Failed to update score');
                } else {
                    fetchData();
                    setIsEditModalOpen(false);
                }
            }
        } catch (error) {
            console.error('Update score error:', error);
            alert('Failed to update score');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Points Team Manager</h1>
                    <p className="text-muted-foreground">Manage ongoing scores and scoreboard visibility</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Button
                        variant={bidTableVisible ? "destructive" : "outline"}
                        onClick={handleToggleBidRoundTable}
                        disabled={isTogglingBidTable || isTogglingScoreboard}
                        className={`w-full md:w-auto ${!bidTableVisible ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200' : ''}`}
                    >
                        {isTogglingBidTable ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Monitor className="w-4 h-4 mr-2" />}
                        {bidTableVisible ? 'Hide Bid Table' : 'Reveal Bid Round Table'}
                    </Button>
                    <Button
                        variant={scoreboardVisible ? "destructive" : "default"}
                        onClick={handleToggleScoreboard}
                        disabled={isTogglingScoreboard || isTogglingBidTable}
                        className="w-full md:w-auto"
                    >
                        {isTogglingScoreboard ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Monitor className="w-4 h-4 mr-2" />}
                        {scoreboardVisible ? 'Hide Scoreboard' : 'Reveal Scoreboard'}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleValidateScores}
                        disabled={isValidating}
                        className="w-full md:w-auto"
                    >
                        {isValidating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Calculator className="w-4 h-4 mr-2" />}
                        Validate & Fix Scores
                    </Button>
                </div>
            </div>

            {/* ... validation block ... */}
            {validationResult && (
                <div className={`p-4 rounded-lg border ${validationResult.fixedCount > 0 ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
                    <div className="flex items-center gap-2 font-bold mb-1">
                        {validationResult.fixedCount > 0 ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                        {validationResult.message}
                    </div>
                    {validationResult.fixedCount > 0 && (
                        <p className="text-sm">
                            Fixed {validationResult.fixedCount} discrepancies.
                            {validationResult.discrepancies.map((d: any, i: number) => (
                                <span key={i} className="block ml-6 mt-1">• {d.teamName}: {d.oldScore} → {d.newScore}</span>
                            ))}
                        </p>
                    )}
                </div>
            )}

            <Tabs defaultValue="live" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="live">Live Scoreboard</TabsTrigger>
                    <TabsTrigger value="analysis" onClick={fetchBidAnalytics}>Bid Round Analysis</TabsTrigger>
                </TabsList>

                <TabsContent value="live">
                    <Card>
                        <CardHeader>
                            <CardTitle>Live Team Scores</CardTitle>
                            <CardDescription>Real-time point totals.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-20">Rank</TableHead>
                                            <TableHead>Team Name</TableHead>
                                            <TableHead className="text-right">Total Score</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {teams.map((team, index) => (
                                            <TableRow key={team.id}>
                                                <TableCell className="font-bold text-muted-foreground">#{index + 1}</TableCell>
                                                <TableCell>
                                                    <span className="font-semibold block">Team {team.teamNumber}</span>
                                                    <span className="text-xs text-muted-foreground">{team.teamName}</span>
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-xl font-bold text-indigo-600">
                                                    {team.score}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button size="sm" variant="outline" onClick={() => handleEditScore(team)}>
                                                        Edit Score
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="analysis">
                    <Card>
                        <CardHeader>
                            <CardTitle>Bid Round Performance Analytics</CardTitle>
                            <CardDescription>Detailed breakdown of financial moves during the bid round.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Rank</TableHead>
                                            <TableHead>Team</TableHead>
                                            <TableHead className="text-right">Starting Score</TableHead>
                                            <TableHead className="text-right">Total Invested</TableHead>
                                            <TableHead className="text-right text-green-500">Total Won</TableHead>
                                            <TableHead className="text-right text-red-500">Total Lost</TableHead>
                                            <TableHead className="text-right">Net Change</TableHead>
                                            <TableHead className="text-right font-bold">Current Score</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {bidAnalytics.sort((a, b) => b.currentScore - a.currentScore).map((team, idx) => (
                                            <TableRow key={team.teamId}>
                                                <TableCell>{idx + 1}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">Team {team.teamNumber}</span>
                                                        <span className="text-xs text-muted-foreground">{team.teamName}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">{team.preBidScore}</TableCell>
                                                <TableCell className="text-right text-slate-500">{team.totalBidAmount}</TableCell>
                                                <TableCell className="text-right text-green-600 font-medium">+{team.totalWon}</TableCell>
                                                <TableCell className="text-right text-red-600 font-medium">-{team.totalLost}</TableCell>
                                                <TableCell className={`text-right font-bold ${team.netBidChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {team.netBidChange > 0 ? '+' : ''}{team.netBidChange}
                                                </TableCell>
                                                <TableCell className="text-right font-black text-xl">{team.currentScore}</TableCell>
                                            </TableRow>
                                        ))}
                                        {bidAnalytics.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                                                    No bid data available yet. Click tab to refresh.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Score: {editingTeam?.teamName}</DialogTitle>
                        <DialogDescription>
                            Override the total score manually.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">New Total Score</label>
                            <div className="flex gap-2">
                                <Button variant="outline" size="icon" onClick={() => setNewScore(s => s - 10)}>-10</Button>
                                <Button variant="outline" size="icon" onClick={() => setNewScore(s => s - 50)}>-50</Button>
                                <Input type="number" value={newScore} onChange={(e) => setNewScore(Number(e.target.value))} className="text-center" />
                                <Button variant="outline" size="icon" onClick={() => setNewScore(s => s + 10)}>+10</Button>
                                <Button variant="outline" size="icon" onClick={() => setNewScore(s => s + 50)}>+50</Button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveScore}><Save className="w-4 h-4 mr-2" /> Save Score</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
