'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Presentation, Monitor } from 'lucide-react';

export default function PresenterLoginPage() {
  const router = useRouter();
  const [presenterName, setPresenterName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoinAsPresenter = async () => {
    if (!presenterName.trim()) {
      alert('Please enter your name');
      return;
    }

    setLoading(true);

    try {
      // Join as presenter
      const response = await fetch('${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/api/presenter/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presenterName: presenterName.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to join as presenter');
      }

      const data = await response.json();

      // Store presenter info in sessionStorage
      sessionStorage.setItem('presenterId', data.presenter.id);
      sessionStorage.setItem('presenterName', presenterName.trim());
      sessionStorage.setItem('presenterNumber', data.presenter.presenterNumber);

      router.push('/presenter/view');
    } catch (error: any) {
      alert(error.message || 'Failed to join as presenter');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-lg border-2 border-white/20 shadow-2xl">
        <CardHeader className="text-center pb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-full">
              <Monitor className="h-12 w-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-4xl font-bold text-white mb-2">
            Presenter View
          </CardTitle>
          <CardDescription className="text-lg text-purple-200">
            Join as presenter to display the quiz
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="presenterName" className="text-white text-lg">
              Your Name
            </Label>
            <Input
              id="presenterName"
              value={presenterName}
              onChange={(e) => setPresenterName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleJoinAsPresenter();
              }}
              placeholder="Enter your name..."
              className="h-12 text-lg bg-white/20 border-white/30 text-white placeholder:text-purple-300"
              autoFocus
            />
          </div>

          <Button
            onClick={handleJoinAsPresenter}
            disabled={loading || !presenterName.trim()}
            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
          >
            {loading ? (
              'Joining...'
            ) : (
              <>
                <Presentation className="mr-2 h-5 w-5" />
                Join as Presenter
              </>
            )}
          </Button>

          <div className="pt-4 text-center">
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="text-purple-200 hover:text-white hover:bg-white/10"
            >
              ← Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
