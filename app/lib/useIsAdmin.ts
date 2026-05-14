import { useAuth } from "./auth";

export function useIsAdmin(): boolean {
  const { user } = useAuth();
  return user?.is_admin === true;
}
