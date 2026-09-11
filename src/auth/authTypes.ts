export interface UserAccount {
  id: string;
  email: string;
  username: string;
  avatar: string;
  provider: 'email' | 'google';
  createdAt: number;
}

export interface SignUpData {
  username: string;
  email: string;
  password: string;
  avatar: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthState {
  user: UserAccount | null;
  isLoading: boolean;
  error: string | null;
  isCloudEnabled: boolean;
}
