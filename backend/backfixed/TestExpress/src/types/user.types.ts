export interface User {
  id: string;
  login: string;
  email: string;
  password_hash: string;
  failed_login_attempts: number;
  blocked_until: string | null;
  created_at: string;
  updated_at: string;
}