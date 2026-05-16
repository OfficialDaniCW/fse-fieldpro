import { useUser } from '@clerk/clerk-react';

export function useCurrentUser() {
  const { user, isLoaded } = useUser();

  const role = user?.publicMetadata?.role || 'fse';
  const isAdmin = role === 'admin';
  const isManager = role === 'manager';
  const isFSE = !isAdmin && !isManager;
  const canEdit = isAdmin || isManager;

  return {
    user: user ? {
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress,
      full_name: user.fullName,
      role,
      avatar_url: user.imageUrl,
    } : null,
    loading: !isLoaded,
    isAdmin,
    isManager,
    isFSE,
    canEdit,
  };
}
