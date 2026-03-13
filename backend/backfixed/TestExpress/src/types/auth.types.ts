export interface RegisterDto {
  login: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginDto {
  login: string;
  password: string;
}

export interface RefreshDto {
  refreshToken: string;
}