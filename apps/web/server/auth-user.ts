export interface SessionUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  banned: boolean;
}

export interface AuthUserShape {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role?: string | null;
  banned?: boolean | null;
}

export function sessionUserFromAuthUser(raw: AuthUserShape): SessionUser {
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    image: raw.image ?? null,
    role: raw.role ?? "user",
    banned: raw.banned === true,
  };
}

export function isActiveSessionUser(user: SessionUser | null | undefined): user is SessionUser {
  return !!user && !user.banned;
}

export function toTrpcUser(user: SessionUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
