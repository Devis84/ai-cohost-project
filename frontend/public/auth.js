window.Auth = (function () {

  function isLoginEnabled() {
    const val = localStorage.getItem("LOGIN_ENABLED");
    return val === null ? true : val === "true";
  }

  async function getSession() {
    if (!window.supabase) return null;

    const { data, error } = await window.supabase.auth.getSession();

    if (error) {
      console.error("Session error:", error);
      return null;
    }

    return data.session;
  }

  async function requireAuth() {
    // 🔥 QUI IL TOGGLE
    if (!isLoginEnabled()) {
      console.log("Auth bypassed (login OFF)");
      return null;
    }

    const session = await getSession();

    if (!session) {
      window.location.href = "/login.html";
      return;
    }

    return session;
  }

  async function redirectIfLoggedIn() {
    if (!isLoginEnabled()) return;

    const session = await getSession();

    if (session) {
      window.location.href = "/host.html";
    }
  }

  return {
    requireAuth,
    redirectIfLoggedIn,
    getSession
  };
})();
