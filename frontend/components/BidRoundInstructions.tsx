'use client';

import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Timer, Coins, Trophy, AlertCircle, Target, DollarSign, CheckCircle2, XCircle, Info } from 'lucide-react';

export default function BidRoundInstructions() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-900 via-cyan-900 to-blue-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="inline-block bg-purple-600 text-white px-4 py-1.5 rounded-md text-sm font-semibold">
              MCQ Bidding
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Bid Round Instructions
          </h1>
          <p className="text-lg text-cyan-200">
            Strategic question answering with point wagering
          </p>
        </div>

        {/* Overview */}
        <Card className="bg-white/95 border border-slate-200 shadow-lg mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-2.5 rounded-lg">
                <Info className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-2">How It Works</h2>
                <p className="text-slate-600 leading-relaxed">
                  In the bid round, teams answer multiple-choice questions and wager points on their answer.
                  Correct answers win a share of the pool, while incorrect answers lose the wagered points.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Step 1 */}
          <Card className="bg-white/95 border border-slate-200 shadow">
            <CardContent className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="bg-yellow-100 p-2 rounded">
                  <TrendingUp className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-0.5">STEP 1</p>
                  <h3 className="text-sm font-semibold text-slate-900">Check Score</h3>
                </div>
              </div>
              <p className="text-xs text-slate-600">
                Review your current points before placing bids
              </p>
            </CardContent>
          </Card>

          {/* Step 2 */}
          <Card className="bg-white/95 border border-slate-200 shadow">
            <CardContent className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="bg-blue-100 p-2 rounded">
                  <Target className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-0.5">STEP 2</p>
                  <h3 className="text-sm font-semibold text-slate-900">Select Answer</h3>
                </div>
              </div>
              <p className="text-xs text-slate-600">
                Choose option A, B, C, or D that you believe is correct
              </p>
            </CardContent>
          </Card>

          {/* Step 3 */}
          <Card className="bg-white/95 border border-slate-200 shadow">
            <CardContent className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="bg-green-100 p-2 rounded">
                  <Coins className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-0.5">STEP 3</p>
                  <h3 className="text-sm font-semibold text-slate-900">Place Bid</h3>
                </div>
              </div>
              <p className="text-xs text-slate-600">
                Enter points to wager on your answer
              </p>
            </CardContent>
          </Card>

          {/* Step 4 */}
          <Card className="bg-white/95 border border-slate-200 shadow">
            <CardContent className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="bg-red-100 p-2 rounded">
                  <Timer className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-0.5">STEP 4</p>
                  <h3 className="text-sm font-semibold text-slate-900">Submit Fast</h3>
                </div>
              </div>
              <p className="text-xs text-slate-600">
                You have <strong>10 seconds</strong> to submit your bid
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Point Distribution */}
        <Card className="bg-white/95 border border-slate-200 shadow-lg mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="bg-purple-100 p-2 rounded">
                <Trophy className="h-5 w-5 text-purple-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Point Distribution</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              {/* Wrong Answer */}
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <h3 className="text-sm font-semibold text-red-900">Incorrect Answer</h3>
                </div>
                <p className="text-xs text-slate-700">
                  Lose the wagered points. Points go into the prize pool.
                </p>
              </div>

              {/* Correct Answer */}
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <h3 className="text-sm font-semibold text-green-900">Correct Answer</h3>
                </div>
                <p className="text-xs text-slate-700">
                  Win a proportional share of the prize pool based on your bid.
                </p>
              </div>

              {/* Prize Pool */}
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-yellow-600" />
                  <h3 className="text-sm font-semibold text-yellow-900">Prize Pool</h3>
                </div>
                <p className="text-xs text-slate-700">
                  Higher bids earn larger shares of the redistributed points.
                </p>
              </div>
            </div>

            {/* Note */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
              <p className="text-xs text-slate-700">
                <strong>Note:</strong> If all teams answer correctly, no points are redistributed. Strategic bidding is essential!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Waiting Status */}
        <Card className="bg-white/95 border border-slate-200 shadow-lg">
          <CardContent className="py-8 text-center">
            <div className="bg-cyan-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Timer className="h-8 w-8 text-cyan-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Waiting for Admin to Start
            </h3>
            <p className="text-slate-600">
              The bid round will begin when the admin starts the timer
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
