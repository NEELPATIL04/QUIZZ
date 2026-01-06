import { useEffect, useState } from 'react';
import { Trophy, Medal, Crown, TrendingUp } from 'lucide-react';

interface ScoreboardEntry {
    teamNumber: number;
    teamName: string;
    score: number;
}

export default function ScoreboardOverlay({ onClose }: { onClose?: () => void }) {
    const [leaderboard, setLeaderboard] = useState<ScoreboardEntry[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState<{ questionNumber: number } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchScoreboard();
        fetchCurrentQuestion();
        const interval = setInterval(() => {
            fetchScoreboard();
            fetchCurrentQuestion();
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const fetchScoreboard = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/public/scoreboard');
            const data = await response.json();
            setLeaderboard(data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch scoreboard:', error);
        }
    };

    const fetchCurrentQuestion = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/public/questions/current');
            if (response.ok) {
                const data = await response.json();
                setCurrentQuestion(data);
            }
        } catch (error) {
            console.error('Failed to fetch question:', error);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-500">

            {/* Main Container - Reduced width */}
            <div className="w-full max-w-4xl flex flex-col max-h-[85vh] bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10">

                {/* Header Section - Reduced padding and text size */}
                <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 p-6 text-center shrink-0 border-b border-white/10">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                    <div className="relative z-10 flex flex-col items-center gap-2">
                        <div className="flex items-center gap-3">
                            <Crown className="w-8 h-8 text-yellow-400 fill-yellow-400 animate-pulse" />
                            <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-white tracking-tight drop-shadow-sm">
                                LEADERBOARD
                            </h1>
                            <Crown className="w-8 h-8 text-yellow-400 fill-yellow-400 animate-pulse" />
                        </div>
                        <div className="flex items-center gap-2 text-indigo-200 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                            <TrendingUp className="w-3 h-3" />
                            <span className="text-xs font-bold uppercase tracking-widest">
                                {currentQuestion ? `Scores till Question ${currentQuestion.questionNumber}` : 'Live Standings'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Table Header - Compact */}
                <div className="bg-slate-800/80 border-b border-white/5 px-6 py-3 shrink-0 grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest pl-2">Rank</div>
                    <div className="col-span-8 md:col-span-7 text-slate-400 text-[10px] font-bold uppercase tracking-widest">Team Name</div>
                    <div className="hidden md:block col-span-3 text-right text-slate-400 text-[10px] font-bold uppercase tracking-widest pr-2">Total Score</div>
                </div>

                {/* Scrollable List - Compact Rows */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950/50 p-4 space-y-2">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-4 text-slate-500">
                            <div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                            <p className="animate-pulse text-sm">Retrieving scores...</p>
                        </div>
                    ) : (
                        leaderboard.map((team, index) => {
                            const isTop3 = index < 3;
                            const rankColor =
                                index === 0 ? 'bg-gradient-to-r from-yellow-500/10 to-yellow-900/5 border-yellow-500/40 text-yellow-500' :
                                    index === 1 ? 'bg-gradient-to-r from-slate-300/10 to-slate-700/5 border-slate-400/40 text-slate-300' :
                                        index === 2 ? 'bg-gradient-to-r from-amber-600/10 to-amber-800/5 border-amber-600/40 text-amber-500' :
                                            'bg-slate-800/30 border-slate-700/40 text-slate-400';

                            const rankIcon =
                                index === 0 ? <Trophy className="w-5 h-5 fill-yellow-400 text-yellow-400" /> :
                                    index === 1 ? <Medal className="w-5 h-5 fill-slate-300 text-slate-300" /> :
                                        index === 2 ? <Medal className="w-5 h-5 fill-amber-600 text-amber-600" /> :
                                            <span className="font-mono text-lg font-bold opacity-50">#{index + 1}</span>;

                            return (
                                <div
                                    key={team.teamNumber}
                                    className={`
                                        group relative grid grid-cols-12 gap-4 items-center p-3 rounded-lg border
                                        transition-all duration-300 hover:scale-[1.005] hover:bg-slate-800
                                        ${index === 0 ? 'ring-1 ring-yellow-500/20 shadow-lg z-10' : ''}
                                        ${isTop3 ? 'border-l-4' : 'border-l-2 border-transparent'}
                                        ${rankColor}
                                    `}
                                >
                                    {/* Rank Column */}
                                    <div className="col-span-2 flex items-center justify-center w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm mx-auto">
                                        {rankIcon}
                                    </div>

                                    {/* Team Info */}
                                    <div className="col-span-8 md:col-span-7 flex flex-col justify-center">
                                        <span className={`text-xl font-bold tracking-tight ${isTop3 ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                                            Team {team.teamNumber}
                                        </span>
                                        <span className="text-[10px] uppercase tracking-wider font-semibold opacity-60">
                                            {team.teamName}
                                        </span>
                                    </div>

                                    {/* Score */}
                                    <div className="col-span-2 md:col-span-3 text-right pr-2">
                                        <div className="flex flex-col items-end">
                                            <span className={`text-3xl font-black tabular-nums tracking-tighter leading-none ${index === 0 ? 'text-yellow-400' :
                                                index === 1 ? 'text-white' :
                                                    index === 2 ? 'text-amber-500' : 'text-indigo-200'
                                                }`}>
                                                {team.score}
                                            </span>
                                            <span className="text-[9px] font-bold uppercase tracking-widest opacity-50">pts</span>
                                        </div>
                                    </div>

                                    {/* Shine Effect for #1 */}
                                    {index === 0 && (
                                        <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
