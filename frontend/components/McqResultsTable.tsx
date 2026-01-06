'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface TeamResult {
  teamId: string;
  teamNumber: number;
  teamName: string;
  selectedOption: string;
  bidAmount: number;
  isCorrect: boolean;
  pointsAwarded: number; // This is the Net Change (positive or negative)
  currentScore: number;  // The score AFTER all calculations
}

interface McqResultsTableProps {
  correctAnswer: string;
  teamResults: TeamResult[];
  totalLostPoints: number;
}

export default function McqResultsTable({ correctAnswer, teamResults, totalLostPoints }: McqResultsTableProps) {
  // Sort teams by Current Score (descending)
  const sortedResults = [...teamResults].sort((a, b) => b.currentScore - a.currentScore);

  return (
    <div className="space-y-3">
      {/* Correct Answer Display */}
      <div className="bg-green-50 border border-green-300 rounded-lg p-4 text-center shadow-sm">
        <p className="text-sm text-green-700 font-semibold uppercase tracking-wider mb-1">Correct Answer</p>
        <p className="text-4xl font-extrabold text-green-700">{correctAnswer}</p>
      </div>

      {/* Results Table */}
      <div className="overflow-hidden rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="w-16 font-bold text-slate-700">Rank</TableHead>
              <TableHead className="font-bold text-slate-700">Team</TableHead>
              <TableHead className="text-right font-bold text-slate-700">Starting Score</TableHead>
              <TableHead className="text-right font-bold text-slate-700">Bid Amount</TableHead>
              <TableHead className="text-right font-bold text-green-600">Total Won</TableHead>
              <TableHead className="text-right font-bold text-red-600">Total Lost</TableHead>
              <TableHead className="text-right font-bold text-slate-700">Net Change</TableHead>
              <TableHead className="text-right font-bold text-slate-900">Current Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedResults.map((result, index) => {
              // Calculate Starting Score: Current - Net Change
              // If pointsAwarded is null, treat as 0
              const netChange = result.pointsAwarded || 0;
              const startingScore = result.currentScore - netChange;

              const isWin = netChange > 0;
              const isLoss = netChange < 0; // Or just check if !isCorrect
              const lostAmount = isLoss ? Math.abs(netChange) : 0;
              const wonAmount = isWin ? netChange : 0;

              return (
                <TableRow
                  key={result.teamId}
                  className={`
                    ${index === 0 ? 'bg-yellow-50/50' : ''}
                    ${result.teamNumber === -1 ? 'bg-slate-100' : ''} 
                    hover:bg-slate-50
                  `}
                >
                  {/* Rank */}
                  <TableCell className="font-medium text-slate-500">
                    {index === 0 ? <span className="text-xl">🥇</span> :
                      index === 1 ? <span className="text-xl">🥈</span> :
                        index === 2 ? <span className="text-xl">🥉</span> :
                          <span className="ml-2">#{index + 1}</span>
                    }
                  </TableCell>

                  {/* Team */}
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">Team {result.teamNumber}</span>
                      <span className="text-xs text-muted-foreground">{result.teamName}</span>
                    </div>
                  </TableCell>

                  {/* Starting Score */}
                  <TableCell className="text-right font-mono text-slate-600">
                    {startingScore}
                  </TableCell>

                  {/* Bid Amount */}
                  <TableCell className="text-right font-mono text-slate-500">
                    {result.bidAmount}
                  </TableCell>

                  {/* Total Won */}
                  <TableCell className="text-right font-mono font-medium text-green-600">
                    {wonAmount > 0 ? `+${wonAmount}` : '-'}
                  </TableCell>

                  {/* Total Lost */}
                  <TableCell className="text-right font-mono font-medium text-red-600">
                    {lostAmount > 0 ? `-${lostAmount}` : '-'}
                  </TableCell>

                  {/* Net Change */}
                  <TableCell className={`text-right font-mono font-bold ${netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {netChange > 0 ? '+' : ''}{netChange}
                  </TableCell>

                  {/* Current Score */}
                  <TableCell className="text-right font-mono text-xl font-bold text-indigo-900 bg-indigo-50/50">
                    {result.currentScore}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pool Info */}
      <div className="flex justify-end mt-4">
        <div className="bg-slate-900 text-white rounded-lg px-6 py-3 shadow-lg">
          <p className="text-sm uppercase tracking-widest text-slate-400 font-semibold mb-1">Total Pool Pot</p>
          <p className="text-3xl font-bold text-yellow-400">{totalLostPoints} pts</p>
        </div>
      </div>
    </div>
  );
}
