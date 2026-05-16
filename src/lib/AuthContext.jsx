import { createContext, useContext } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut, redirectToSignIn } = useClerk();

  const logout = (shouldRedirect = true) => {
    signOut(shouldRedirect ? { redirectUrl: window.location.origin } : undefined);
  };

  const navigateToLogin = () => {
    redirectToSignIn({ redirectUrl: window.location.href });
  };

  return (
    <AuthContext.Provider value={{
      user: isSignedIn ? {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        full_name: user.fullName,
        role: user.publicMetadata?.role || 'fse',
        avatar_url: user.imageUrl,
      } : null,
      isAuthenticated: !!isSignedIn,
      isLoadingAuth: !isLoaded,
      isLoadingPublicSettings: false,
      authError: null,
      appPublicSettings: null,
      logout,
      navigateToLogin,
      checkAppState: () => {},
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
