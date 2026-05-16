// Retained for backward compatibility with any code that imports appParams.
// All Base44-specific configuration has been removed.
export const appParams = {
  appId: null,
  token: null,
  fromUrl: typeof window !== 'undefined' ? window.location.href : '',
  functionsVersion: null,
  appBaseUrl: null,
};
