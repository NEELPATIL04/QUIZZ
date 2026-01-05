'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, User } from 'lucide-react';
import { api } from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    currentUser: { firstName: '', lastName: '', email: '', role: '' },
  });

  useEffect(() => {
    // Check if user is super_admin
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (currentUser.role !== 'super_admin') {
      router.push('/dashboard/questions');
      return;
    }

    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const users = await api.getUsers(token);

        setStats({
          totalUsers: users.length,
          currentUser,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchData();
  }, [router]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {stats.currentUser.firstName}!</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered users in the system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Role</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{stats.currentUser.role?.replace('_', ' ')}</div>
            <p className="text-xs text-muted-foreground">{stats.currentUser.email}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Get started with these common tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Link
              href="/dashboard/users"
              className="block rounded-lg border p-4 hover:bg-muted/50 transition-colors"
            >
              <h3 className="font-semibold">Manage Users</h3>
              <p className="text-sm text-muted-foreground">
                Add, edit, or remove user accounts
              </p>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
