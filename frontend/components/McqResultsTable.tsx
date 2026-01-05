'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TeamResult {
  teamId: string;
  teamNumber: number;
  teamName: string;
  selectedOption: string;
  bidAmount: number;
  isCorrect: boolean;
  pointsChange: number;
  scoreBefore: number;
  scoreAfter: number;
}

interface McqResultsTableProps {
  correctAnswer: string;
  teamResults: TeamResult[];
  totalLostPoints: number;
}

export default function McqResultsTable({ correctAnswer, teamResults, totalLostPoints }: McqResultsTableProps) {
  // Sort teams by final score (descending)
  const sortedResults = [...teamResults].sort((a, b) => b.scoreAfter - a.scoreAfter);

  return (
    <div className="space-y-3">
      {/* Correct Answer Display */}
      <div className="bg-green-50 border border-green-300 rounded-lg p-2 text-center">
        <p className="text-xs text-green-700 font-semibold">Correct Answer</p>
        <p className="text-2xl font-bold text-green-900">{correctAnswer}</p>
      </div>

      {/* Results Table */}
      <div className="overflow-auto max-h-96">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-100">
              <TableHead className="text-xs font-bold">Team</TableHead>
              <TableHead className="text-xs font-bold text-center">Before</TableHead>
              <TableHead className="text-xs font-bold text-center">After</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedResults.map((result, index) => (
              <TableRow
                key={result.teamId}
                className={`${
                  index === 0
                    ? 'bg-yellow-50 border-l-4 border-yellow-500'
                    : result.isCorrect
                    ? 'bg-green-50'
                    : 'bg-red-50'
                }`}
              >
                {/* Team Number */}
                <TableCell className="py-2">
                  <div className="flex items-center gap-1">
                    {index === 0 && <span className="text-yellow-600">🏆</span>}
                    <span className="font-semibold text-sm">Team {result.teamNumber}</span>
                  </div>
                </TableCell>

                {/* Score Before */}
                <TableCell className="text-center py-2">
                  <span className="text-sm font-semibold text-slate-700">
                    {result.scoreBefore}
                  </span>
                </TableCell>

                {/* Score After */}
                <TableCell className="text-center py-2">
                  <div className="flex items-center justify-center gap-1">
                    {result.pointsChange > 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : result.pointsChange < 0 ? (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    ) : null}
                    <span className={`text-sm font-bold ${
                      result.pointsChange > 0
                        ? 'text-green-600'
                        : result.pointsChange < 0
                        ? 'text-red-600'
                        : 'text-slate-700'
                    }`}>
                      {result.scoreAfter}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pool Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
        <p className="text-xs text-center text-slate-700">
          <span className="font-semibold">Pool:</span> {totalLostPoints} pts
        </p>
      </div>
    </div>
  );
}
