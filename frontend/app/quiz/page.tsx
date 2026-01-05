'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';

export default function QuizSelectionPage() {
  const router = useRouter();
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [memberName, setMemberName] = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    fetchTeams();

    // Check for team parameter in URL
    const params = new URLSearchParams(window.location.search);
    const teamParam = params.get('team');
    if (teamParam) {
      setSelectedTeam(teamParam);
    }
  }, []);

  const fetchTeams = async () => {
    try {
      const data = await api.getPublicTeams();
      setTeams(data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = async () => {
    if (!selectedTeam) {
      alert('Please select a team');
      return;
    }

    if (!memberName.trim()) {
      alert('Please enter your name');
      return;
    }

    setJoining(true);

    try {
      // Join the team
      const response = await fetch('http://localhost:5000/api/public/teams/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamNumber: parseInt(selectedTeam),
          memberName: memberName.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to join team');
      }

      const data = await response.json();

      // Store team number and member info in sessionStorage
      sessionStorage.setItem('teamNumber', selectedTeam);
      sessionStorage.setItem('memberId', data.member.id);
      sessionStorage.setItem('memberName', memberName.trim());

      router.push('/quiz/team');
    } catch (error: any) {
      alert(error.message || 'Failed to join team');
    } finally {
      setJoining(false);
    }
  };

  const handlePresenterView = () => {
    router.push('/quiz/presenter');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-2xl space-y-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Quizz Competition</CardTitle>
            <CardDescription>Select your team to get started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {teams.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No teams available yet. Please contact the administrator.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="memberName">Your Name</Label>
                  <Input
                    id="memberName"
                    placeholder="Enter your name..."
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    disabled={joining}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teamSelect">Select Your Team</Label>
                  <Select value={selectedTeam} onValueChange={setSelectedTeam} disabled={joining}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a team..." />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team: any) => (
                        <SelectItem key={team.id} value={team.teamNumber.toString()}>
                          Team {team.teamNumber} - {team.teamName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleStartQuiz} className="w-full" size="lg" disabled={joining}>
                  {joining ? 'Joining Team...' : 'Join Team & Start Quiz'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={handlePresenterView}
              variant="outline"
              className="w-full"
            >
              Open Presenter View
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              For displaying questions on screen
            </p>
          </CardContent>
        </Card>

        <div className="text-center">
          <a
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Admin Login
          </a>
        </div>
      </div>
    </div>
  );
}
