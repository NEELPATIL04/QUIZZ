const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt?: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export const api = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    return response.json();
  },

  async logout(): Promise<void> {
    const response = await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Logout failed');
    }
  },

  async getMe(token: string): Promise<User> {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to get user');
    }

    return response.json();
  },

  async getUsers(token: string): Promise<User[]> {
    const response = await fetch(`${API_URL}/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to get users');
    }

    return response.json();
  },

  async createUser(token: string, userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
  }): Promise<{ message: string; user: User }> {
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create user');
    }

    return response.json();
  },

  async deleteUser(token: string, userId: string): Promise<void> {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to delete user');
    }
  },

  // Quiz management
  async getQuizConfig(token: string) {
    const response = await fetch(`${API_URL}/quiz/config`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to get quiz config');
    return response.json();
  },

  async updateQuizConfig(token: string, config: any) {
    const response = await fetch(`${API_URL}/quiz/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify(config),
    });
    if (!response.ok) throw new Error('Failed to update quiz config');
    return response.json();
  },

  async initializeTeams(token: string) {
    const response = await fetch(`${API_URL}/quiz/teams/initialize`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to initialize teams');
    return response.json();
  },

  async getAdminTeams(token: string) {
    const response = await fetch(`${API_URL}/quiz/teams`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to get teams');
    return response.json();
  },

  async getQuestions(token: string) {
    const response = await fetch(`${API_URL}/quiz/questions`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to get questions');
    return response.json();
  },

  async createQuestion(token: string, question: any) {
    const response = await fetch(`${API_URL}/quiz/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify(question),
    });
    if (!response.ok) throw new Error('Failed to create question');
    return response.json();
  },

  async updateQuestion(token: string, questionId: string, question: any) {
    const response = await fetch(`${API_URL}/quiz/questions/${questionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify(question),
    });
    if (!response.ok) throw new Error('Failed to update question');
    return response.json();
  },

  async toggleQuestion(token: string, questionId: string, isEnabled: boolean) {
    const response = await fetch(`${API_URL}/quiz/questions/${questionId}/toggle`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify({ isEnabled }),
    });
    if (!response.ok) throw new Error('Failed to toggle question');
    return response.json();
  },

  async deleteQuestion(token: string, questionId: string) {
    const response = await fetch(`${API_URL}/quiz/questions/${questionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to delete question');
  },

  async resetQuestion(token: string, questionId: string) {
    const response = await fetch(`${API_URL}/quiz/questions/${questionId}/reset`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to reset question');
    return response.json();
  },

  // Public APIs (no auth)
  async getPublicTeams() {
    const response = await fetch(`${API_URL}/public/teams`);
    if (!response.ok) throw new Error('Failed to get teams');
    return response.json();
  },

  async getEnabledQuestions() {
    const response = await fetch(`${API_URL}/public/questions/enabled`);
    if (!response.ok) throw new Error('Failed to get questions');
    return response.json();
  },

  async submitAnswer(teamNumber: number, questionId: string, answer: string | string[], timeTaken?: number, timeStarted?: Date) {
    const response = await fetch(`${API_URL}/public/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamNumber, questionId, answer, timeTaken, timeStarted }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit answer');
    }
    return response.json();
  },

  async getCurrentQuestion() {
    const response = await fetch(`${API_URL}/public/questions/current`);
    if (!response.ok) throw new Error('Failed to get current question');
    return response.json();
  },

  async setCurrentQuestion(token: string, questionId: string | null) {
    const response = await fetch(`${API_URL}/quiz/current-question`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify({ questionId }),
    });
    if (!response.ok) throw new Error('Failed to set current question');
    return response.json();
  },

  async getCurrentQuestionId(token: string) {
    const response = await fetch(`${API_URL}/quiz/current-question-id`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to get current question ID');
    return response.json();
  },

  async toggleShowAnswers(token: string, showAnswers: boolean) {
    const response = await fetch(`${API_URL}/quiz/toggle-show-answers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify({ showAnswers }),
    });
    if (!response.ok) throw new Error('Failed to toggle show answers');
    return response.json();
  },

  async getTeamResults(token: string) {
    const response = await fetch(`${API_URL}/quiz/results`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to get team results');
    return response.json();
  },

  async getQuestionResults(token: string, questionId: string) {
    const response = await fetch(`${API_URL}/quiz/questions/${questionId}/results`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to get question results');
    return response.json();
  },

  async updateTeamAnswerScore(token: string, answerId: string, pointsAwarded: number) {
    const response = await fetch(`${API_URL}/quiz/team-answers/${answerId}/score`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify({ pointsAwarded }),
    });
    if (!response.ok) throw new Error('Failed to update answer score');
    return response.json();
  },

  async toggleScoreboard(token: string, isVisible: boolean) {
    const response = await fetch(`${API_URL}/quiz/scoreboard/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify({ isVisible }),
    });
    if (!response.ok) throw new Error('Failed to toggle scoreboard');
    return response.json();
  },

  async validateTeamScores(token: string) {
    const response = await fetch(`${API_URL}/quiz/scores/validate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to validate scores');
    return response.json();
  },

  async getBidRoundAnalytics(token: string) {
    const response = await fetch(`${API_URL}/quiz/analytics/bid-round`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to get bid analytics');
    return response.json();
  },
};
