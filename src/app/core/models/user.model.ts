export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'freelancer' | 'manager';
  dailyGoalHours: number;
}

export interface AuthSession {
  token: string;
  user: Omit<User, 'password'>;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  dailyGoalHours: number;
}
