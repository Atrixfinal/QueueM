export interface User {
  id: string;
  name: string;
  phone: string;
  role: 'user' | 'admin' | 'staff' | 'guest';
  sex?: 'male' | 'female' | 'other';
  blood_group?: string;
  medical_conditions?: string;
  allergies?: string;
  location_home?: string;
  location_current?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface RegisterPayload {
  name: string;
  phone: string;
  password: string;
  sex?: string;
  blood_group?: string;
  medical_conditions?: string;
  allergies?: string;
  location_home?: string;
}

export interface LoginPayload {
  phone: string;
  password: string;
}

export interface GuestOTPPayload {
  phone: string;
  location_current?: string;
}

export interface VerifyOTPPayload {
  phone: string;
  otp: string;
}
