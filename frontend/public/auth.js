window.Auth = (function () {

  async function getSession() {
    const { data, error } = await window.supabase.auth.getSession();
    if (error) return null;
    return data.session;
  }

  async function requireAuth() {

    // 🔥 SE LOGIN DISABILITATO → PASSA
    if (!window.LOGIN_ENABLED) {
      console.log("⚡ Login disabled");
      return;
    }

    const session = await getSession();

    if (!session) {
      window.location.href = "/login.html";
      return;
    }

    return session;
  }

  async function redirectIfLoggedIn() {

    // 🔥 SE LOGIN DISABILITATO → VAI DIRETTO
    if (!window.LOGIN_ENABLED) {
      window.location.href = "/host.html";
      return;
    }

    const session = await getSession();

    if (session) {
      window.location.href = "/host.html";
    }
  }

  async function logout() {
    await window.supabase.auth.signOut();
    window.location.href = "/login.html";
  }

  return {
    requireAuth,
    redirectIfLoggedIn,
    logout
  };

})();
