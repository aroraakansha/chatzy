export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  imageUrl?: string;
  avatarUrl?: string;
  profileImage?: string;
  photoUrl?: string;
};

export type AuthSession = {
  user: AuthUser;
  token: string;
};
