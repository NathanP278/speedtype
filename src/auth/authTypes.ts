export interface CombatTelemetry {
  switchType: 'cherry_blue' | 'cherry_brown' | 'cherry_red' | 'topre' | 'laptop_scissor' | 'membrane';
  keyboardLayout: 'qwerty' | 'colemak' | 'dvorak' | 'ortholinear' | 'other';
  combatGoal: 'speed_demon' | 'zero_typos' | 'climb_ladder' | 'flow_state';
  preferredTier: 'relaxed' | 'equal' | 'challenger' | 'boss';
}

export interface UserAccount {
  id: string;
  email: string;
  username: string;
  avatar: string;
  displayName?: string;
  callSign?: string;
  telemetry?: CombatTelemetry;
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
  telemetry?: CombatTelemetry;
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
