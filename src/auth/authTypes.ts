export interface UserTelemetry {
  referralSource: 'reddit' | 'twitter_x' | 'discord' | 'youtube' | 'friend' | 'search_engine' | 'other';
  typingExperience: 'beginner' | 'intermediate' | 'expert' | 'competitive';
  primaryDevice: 'mechanical_keyboard' | 'laptop' | 'ergonomic' | 'standard';
  dailyTargetMinutes: '10_mins' | '20_mins' | '45_mins' | '60_plus';
}

export interface UserAccount {
  id: string;
  email: string;
  username: string;
  avatar: string;
  displayName?: string;
  callSign?: string;
  telemetry?: UserTelemetry;
  onboardingComplete: boolean;
  provider: 'email' | 'google';
  createdAt: number;
}

export interface SignUpData {
  username: string;
  email: string;
  password?: string;
  avatar: string;
  displayName?: string;
  callSign?: string;
  telemetry?: UserTelemetry;
}

export interface SignInData {
  email: string;
  password?: string;
}

export interface AuthState {
  user: UserAccount | null;
  isLoading: boolean;
  error: string | null;
  isCloudEnabled: boolean;
}
