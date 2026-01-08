'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { Users, UserPlus, Trash2, Link as LinkIcon, Copy, CheckCircle, Crown } from 'lucide-react';

export default function TeamManagementPage() {
  const router = useRouter();
  const [config, setConfig] = useState({
    numberOfTeams: 0,
    teamSize: 0,
    controllersPerTeam: 1,
    numberOfPresenters: 1,
  });
  const [teams, setTeams] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<{ [key: string]: any[] }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addMemberDialog, setAddMemberDialog] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [copiedLink, setCopiedLink] = useState('');
  const [editingScore, setEditingScore] = useState<string | null>(null);
  const [newScore, setNewScore] = useState<number>(0);

  useEffect(() => {
    // Check if user is super_admin
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (currentUser.role !== 'super_admin') {
      router.push('/dashboard/questions');
      return;
    }

    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const [configData, teamsData] = await Promise.all([
        api.getQuizConfig(token),
        api.getAdminTeams(token),
      ]);

      setConfig(configData);
      setTeams(teamsData);

      // Fetch members for each team
      const membersData: { [key: string]: any[] } = {};
      for (const team of teamsData) {
        const members = await fetch(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/api/public/teams/${team.teamNumber}/members`).then(r => r.json());
        membersData[team.id] = members;
      }
      setTeamMembers(membersData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await api.updateQuizConfig(token, config);
      alert('Configuration saved successfully!');
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleInitializeTeams = async () => {
    if (!confirm('This will reset all existing teams. Are you sure?')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await api.initializeTeams(token);
      alert('Teams initialized successfully!');
      fetchData();
    } catch (error) {
      console.error('Error initializing teams:', error);
      alert('Failed to initialize teams');
    }
  };

  const handleAddMember = async () => {
    if (!selectedTeam || !newMemberName.trim()) {
      alert('Please select a team and enter member name');
      return;
    }

    try {
      const teamNumber = teams.find(t => t.id === selectedTeam)?.teamNumber;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/api/public/teams/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamNumber,
          memberName: newMemberName.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add member');
      }

      setAddMemberDialog(false);
      setNewMemberName('');
      setSelectedTeam('');
      fetchData();
      alert('Member added successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (teamId: string, memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await fetch(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/api/quiz/team-members/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      fetchData();
      alert('Member removed successfully!');
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member');
    }
  };

  const handleDeleteTeam = async (teamId: string, teamNumber: number) => {
    if (!confirm(`Are you sure you want to delete Team ${teamNumber}? This will remove all members and cannot be undone.`)) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await fetch(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/api/quiz/teams/${teamId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      fetchData();
      alert('Team deleted successfully!');
    } catch (error) {
      console.error('Error deleting team:', error);
      alert('Failed to delete team');
    }
  };

  const generateJoinLink = (teamNumber: number) => {
    return `${window.location.origin}/quiz?team=${teamNumber}`;
  };

  const copyJoinLink = (teamNumber: number) => {
    const link = generateJoinLink(teamNumber);
    navigator.clipboard.writeText(link);
    setCopiedLink(link);
    setTimeout(() => setCopiedLink(''), 2000);
  };

  const handleUpdateScore = async (teamId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/api/quiz/teams/${teamId}/score`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ score: newScore })
      });

      if (!response.ok) throw new Error('Failed to update score');

      setEditingScore(null);
      fetchData();
      alert('Score updated successfully!');
    } catch (error) {
      console.error('Error updating score:', error);
      alert('Failed to update score');
    }
  };

  const handleResetAllScores = async () => {
    if (!confirm('Are you sure you want to reset all team scores to 0 points?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/api/quiz/teams/reset-scores`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to reset scores');

      fetchData();
      alert('All team scores reset to 0 points!');
    } catch (error) {
      console.error('Error resetting scores:', error);
      alert('Failed to reset scores');
    }
  };

  const viewersPerTeam = config.teamSize - config.controllersPerTeam;

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Team Management</h1>
        <p className="text-muted-foreground">Configure teams and manage members</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quiz Configuration</CardTitle>
          <CardDescription>Set up the number of teams and team sizes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numberOfTeams">Number of Teams</Label>
              <Input
                id="numberOfTeams"
                type="number"
                min="0"
                value={config.numberOfTeams}
                onChange={(e) => setConfig({ ...config, numberOfTeams: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teamSize">Team Size</Label>
              <Input
                id="teamSize"
                type="number"
                min="1"
                value={config.teamSize}
                onChange={(e) => setConfig({ ...config, teamSize: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="controllersPerTeam">Controllers per Team</Label>
              <Input
                id="controllersPerTeam"
                type="number"
                min="1"
                max={config.teamSize}
                value={config.controllersPerTeam}
                onChange={(e) => setConfig({ ...config, controllersPerTeam: Math.min(parseInt(e.target.value) || 1, config.teamSize) })}
              />
              <p className="text-xs text-muted-foreground">
                Viewers: {viewersPerTeam >= 0 ? viewersPerTeam : 0}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSaveConfig} disabled={saving}>
              {saving ? 'Saving...' : 'Save Configuration'}
            </Button>
            <Button onClick={handleInitializeTeams} variant="destructive">
              Initialize Teams
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Teams and Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Teams & Members</CardTitle>
              <CardDescription>Manage team members and view join links</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleResetAllScores} variant="outline">
                Reset All Scores to 700
              </Button>
              <Dialog open={addMemberDialog} onOpenChange={setAddMemberDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Team Member</DialogTitle>
                    <DialogDescription>Add a new member to a team</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="memberName">Member Name</Label>
                      <Input
                        id="memberName"
                        placeholder="Enter member name..."
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="teamSelect">Select Team</Label>
                      <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a team..." />
                        </SelectTrigger>
                        <SelectContent>
                          {teams.map((team) => {
                            const members = teamMembers[team.id] || [];
                            const activeMembers = members.filter(m => m.isActive).length;
                            const isFull = activeMembers >= config.teamSize;

                            return (
                              <SelectItem key={team.id} value={team.id} disabled={isFull}>
                                Team {team.teamNumber} - {team.teamName} ({activeMembers}/{config.teamSize})
                                {isFull && ' - FULL'}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddMemberDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddMember}>Add Member</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {teams.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No teams yet. Configure and initialize teams above.
            </div>
          ) : (
            <div className="space-y-6">
              {teams.map((team) => {
                const members = teamMembers[team.id] || [];
                const activeMembers = members.filter(m => m.isActive);

                return (
                  <Card key={team.id} className="border-2">
                    <CardHeader className="bg-slate-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5 text-blue-600" />
                          <div>
                            <CardTitle className="text-xl">
                              Team {team.teamNumber} - {team.teamName}
                            </CardTitle>
                            <CardDescription>
                              {activeMembers.length} / {config.teamSize} members
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {/* Score Display/Edit */}
                          {editingScore === team.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={newScore}
                                onChange={(e) => setNewScore(parseInt(e.target.value) || 0)}
                                className="w-24"
                                min="0"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleUpdateScore(team.id)}
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingScore(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div
                              onClick={() => {
                                setEditingScore(team.id);
                                setNewScore(team.score);
                              }}
                              className="cursor-pointer hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors border-2 border-blue-200"
                            >
                              <div className="text-center">
                                <p className="text-xs text-muted-foreground">Score</p>
                                <p className="text-2xl font-bold text-blue-600">{team.score}</p>
                                <p className="text-xs text-muted-foreground">Click to edit</p>
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyJoinLink(team.teamNumber)}
                            >
                              {copiedLink === generateJoinLink(team.teamNumber) ? (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copy Join Link
                                </>
                              )}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteTeam(team.id, team.teamNumber)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Team
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {activeMembers.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">
                          No members yet. Share the join link or add members manually.
                        </p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>#</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Joined</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {activeMembers.map((member) => (
                              <TableRow key={member.id}>
                                <TableCell className="font-medium">{member.memberNumber}</TableCell>
                                <TableCell className="font-semibold">{member.memberName}</TableCell>
                                <TableCell>
                                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${member.role === 'controller'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {member.role === 'controller' && <Crown className="h-3 w-3" />}
                                    {member.role}
                                  </span>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {new Date(member.createdAt).toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveMember(team.id, member.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}

                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <LinkIcon className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">Join Link:</span>
                        </div>
                        <code className="text-xs text-blue-700 break-all">
                          {generateJoinLink(team.teamNumber)}
                        </code>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
