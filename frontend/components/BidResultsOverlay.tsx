import { Trophy, Medal, Crown, TrendingUp } from 'lucide-react';

interface TeamResult {
    teamId: string;
    teamNumber: number;
    teamName: string;
    totalBidAmount: number;
    totalWon: number;
    totalLost: number;
    netBidChange: number;
    preBidScore: number;
    currentScore: number;
}

interface BidResultsOverlayProps {
    teamResults: TeamResult[];
    totalLostPoints: number;
    questionNumber?: number;
}

export default function BidResultsOverlay({ teamResults, totalLostPoints, questionNumber }: BidResultsOverlayProps) {
    // Sort logic should happen in parent or here. Assuming data is passed.
    // Ensure we handle empty data gracefully.
    const sortedResults = [...(teamResults || [])].sort((a, b) => b.currentScore - a.currentScore);

    return (
        <div className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-500">
            {/* Main Container */}
            <div className="w-full max-w-6xl flex flex-col max-h-[90vh] bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10">

                {/* Header Section */}
                <div className="relative overflow-hidden bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 p-6 text-center shrink-0 border-b border-white/10">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                    <div className="relative z-10 flex flex-col items-center gap-2">
                        <div className="flex items-center gap-3">
                            <Crown className="w-8 h-8 text-yellow-400 fill-yellow-400 animate-pulse" />
                            <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-white tracking-tight drop-shadow-sm">
                                BID ROUND RESULTS
                            </h1>
                            <Crown className="w-8 h-8 text-yellow-400 fill-yellow-400 animate-pulse" />
                        </div>
                        <div className="flex items-center gap-3 text-indigo-200">
                            <div className="bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10 flex items-center gap-2">
                                <TrendingUp className="w-3 h-3" />
                                <span className="text-xs font-bold uppercase tracking-widest">
                                    Total Pool: {totalLostPoints} pts
                                </span>
                            </div>
                            {questionNumber && (
                                <div className="bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                                    <span className="text-xs font-bold uppercase tracking-widest">
                                        Till Q{questionNumber}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table Header */}
                <div className="bg-slate-800/80 border-b border-white/5 px-6 py-3 shrink-0 grid grid-cols-12 gap-2 items-center text-center">
                    <div className="col-span-1 text-slate-400 text-[10px] font-bold uppercase tracking-widest">Rank</div>
                    <div className="col-span-3 text-left text-slate-400 text-[10px] font-bold uppercase tracking-widest pl-2">Team</div>
                    <div className="col-span-2 text-right text-slate-400 text-[10px] font-bold uppercase tracking-widest">Start Score</div>
                    <div className="col-span-1 text-right text-slate-400 text-[10px] font-bold uppercase tracking-widest">Bid</div>
                    <div className="col-span-1 text-right text-green-500 text-[10px] font-bold uppercase tracking-widest">Won</div>
                    <div className="col-span-1 text-right text-red-500 text-[10px] font-bold uppercase tracking-widest">Lost</div>
                    <div className="col-span-1 text-right text-slate-400 text-[10px] font-bold uppercase tracking-widest">Net</div>
                    <div className="col-span-2 text-right text-indigo-300 text-[10px] font-bold uppercase tracking-widest pr-2">Current</div>
                </div>

                {/* Scrollable List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950/50 p-4 space-y-2">
                    {sortedResults.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-4 text-slate-500">
                            <p className="text-sm">No bid data available.</p>
                        </div>
                    ) : (
                        sortedResults.map((result, index) => {
                            const isTop3 = index < 3;
                            const rankColor =
                                index === 0 ? 'bg-gradient-to-r from-yellow-500/10 to-yellow-900/5 border-yellow-500/40 text-yellow-500' :
                                    index === 1 ? 'bg-gradient-to-r from-slate-300/10 to-slate-700/5 border-slate-400/40 text-slate-300' :
                                        index === 2 ? 'bg-gradient-to-r from-amber-600/10 to-amber-800/5 border-amber-600/40 text-amber-500' :
                                            'bg-slate-800/30 border-slate-700/40 text-slate-400';

                            const rankIcon =
                                index === 0 ? <Trophy className="w-4 h-4 fill-yellow-400 text-yellow-400" /> :
                                    index === 1 ? <Medal className="w-4 h-4 fill-slate-300 text-slate-300" /> :
                                        index === 2 ? <Medal className="w-4 h-4 fill-amber-600 text-amber-600" /> :
                                            <span className="font-mono text-sm font-bold opacity-50">#{index + 1}</span>;

                            // Calculate derivative values if not provided directly
                            // Map properly to new keys
                            const startingScore = result.preBidScore;
                            const bidAmount = result.totalBidAmount;
                            const wonAmount = result.totalWon;
                            const lostAmount = result.totalLost;
                            const netChange = result.netBidChange;

                            return (
                                <div
                                    key={result.teamId}
                                    className={`
                                        group relative grid grid-cols-12 gap-2 items-center p-3 rounded-lg border text-sm
                                        transition-all duration-300 hover:scale-[1.005] hover:bg-slate-800
                                        ${index === 0 ? 'ring-1 ring-yellow-500/20 shadow-lg z-10' : ''}
                                        ${isTop3 ? 'border-l-4' : 'border-l-2 border-transparent'}
                                        ${rankColor}
                                    `}
                                >
                                    {/* Rank */}
                                    <div className="col-span-1 flex items-center justify-center">
                                        {rankIcon}
                                    </div>

                                    {/* Team */}
                                    <div className="col-span-3 flex flex-col justify-center pl-2">
                                        <span className={`text-lg font-bold tracking-tight ${isTop3 ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                                            Team {result.teamNumber}
                                        </span>
                                        <span className="text-[10px] uppercase tracking-wider font-semibold opacity-60 truncate">
                                            {result.teamName}
                                        </span>
                                    </div>

                                    {/* Starting Score */}
                                    <div className="col-span-2 text-right font-mono text-slate-500">
                                        {startingScore}
                                    </div>

                                    {/* Bid Amount */}
                                    <div className="col-span-1 text-right font-mono text-slate-400">
                                        {bidAmount}
                                    </div>

                                    {/* Won */}
                                    <div className="col-span-1 text-right font-mono font-bold text-green-500">
                                        {wonAmount > 0 ? `+${wonAmount}` : '0'}
                                    </div>

                                    {/* Lost */}
                                    <div className="col-span-1 text-right font-mono font-bold text-red-500">
                                        {lostAmount > 0 ? `-${lostAmount}` : '0'}
                                    </div>

                                    {/* Net Change */}
                                    <div className={`col-span-1 text-right font-mono font-bold ${netChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {netChange > 0 ? '+' : ''}{netChange}
                                    </div>

                                    {/* Current Score */}
                                    <div className="col-span-2 text-right pr-2">
                                        <div className="flex flex-col items-end">
                                            <span className={`text-2xl font-black tabular-nums tracking-tighter leading-none ${index === 0 ? 'text-yellow-400' :
                                                index === 1 ? 'text-white' :
                                                    index === 2 ? 'text-amber-500' : 'text-indigo-200'
                                                }`}>
                                                {result.currentScore}
                                            </span>
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
