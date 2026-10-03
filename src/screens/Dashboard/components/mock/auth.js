export function setMockAdminAuth(admin) {
  try {
    localStorage.setItem("auth", JSON.stringify({
      id: admin.id,
      username: admin.username,
      role: admin.role,
      token: admin.token,
    }));
    return true;
  } catch (e) {
    console.error("setMockAdminAuth error:", e);
    return false;
  }
}

export function clearMockAuth() {
  try {
    localStorage.removeItem("auth");
    return true;
  } catch (e) {
    console.error("clearMockAuth error:", e);
    return false;
  }
}
