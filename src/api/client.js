async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(text || `Request failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

function createEntity(endpoint) {
  return {
    list: (_sort, _limit) => apiFetch(`/api/${endpoint}`),
    create: (data) => apiFetch(`/api/${endpoint}`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiFetch(`/api/${endpoint}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiFetch(`/api/${endpoint}/${id}`, { method: 'DELETE' }),
    get: (id) => apiFetch(`/api/${endpoint}/${id}`),
    filter: (filters) => apiFetch(`/api/${endpoint}?${new URLSearchParams(filters)}`),
  };
}

let _clerkSignOut = null;
export function registerClerkSignOut(fn) {
  _clerkSignOut = fn;
}

export const base44 = {
  entities: {
    Part: createEntity('parts'),
    Manual: createEntity('manuals'),
    ActivityLog: createEntity('activity-logs'),
    SearchLog: createEntity('search-logs'),
    StagingUpload: createEntity('staging-uploads'),
    PartVerification: createEntity('part-verifications'),
  },

  integrations: {
    Core: {
      InvokeLLM: (params) =>
        apiFetch('/api/llm', { method: 'POST', body: JSON.stringify(params) }),

      UploadFile: async ({ file }) => {
        const { uploadUrl, fileUrl } = await apiFetch('/api/upload-url', {
          method: 'POST',
          body: JSON.stringify({ filename: file.name, contentType: file.type }),
        });
        await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        });
        return { file_url: fileUrl };
      },
    },
  },

  agents: {
    createConversation: (opts) =>
      apiFetch('/api/conversations', { method: 'POST', body: JSON.stringify(opts) }),

    getConversation: (id) => apiFetch(`/api/conversations/${id}`),

    addMessage: (conversation, message) => {
      const id = typeof conversation === 'object' ? conversation.id : conversation;
      return apiFetch(`/api/conversations/${id}/messages`, {
        method: 'POST',
        body: JSON.stringify(message),
      });
    },

    subscribeToConversation: (id, callback) => {
      let active = true;
      let lastMessageCount = 0;

      (async () => {
        while (active) {
          try {
            const data = await apiFetch(`/api/conversations/${id}`);
            const msgCount = (data.messages || []).length;
            if (msgCount !== lastMessageCount) {
              lastMessageCount = msgCount;
              callback(data);
            }
          } catch {}
          await new Promise((r) => setTimeout(r, 2000));
        }
      })();

      return () => { active = false; };
    },

    getWhatsAppConnectURL: () => null,
  },

  auth: {
    me: () => Promise.resolve(null),
    logout: () => {
      if (_clerkSignOut) _clerkSignOut();
    },
    redirectToLogin: () => {
      window.location.href = '/sign-in';
    },
  },

  functions: {
    invoke: (name, data) =>
      apiFetch('/api/invoke', { method: 'POST', body: JSON.stringify({ name, data }) }),
  },

  appLogs: {
    logUserInApp: () => Promise.resolve(),
  },
};
