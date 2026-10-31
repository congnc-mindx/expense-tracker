import { useRef, useState } from "react";
import useAuth from "./hooks/useAuth";
import LoginPage from "./pages/LoginPage";
import App from "./App";

export default function AuthGate() {
  const { user, loading, error, logout } = useAuth();
  const lock = useRef(false);
  const [signingOut, setSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  async function handleLogout() {
    if (lock.current) return;
    lock.current = true;
    setSigningOut(true);
    setLogoutError("");
    try {
      await logout();
    } catch {
      setLogoutError("Chưa đăng xuất được. Vui lòng thử lại.");
    } finally {
      lock.current = false;
      setSigningOut(false);
    }
  }
  if (loading || error)
    return (
      <main className="grid min-h-dvh place-items-center bg-slate-50 p-6">
        <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6">
          <p
            role={error ? "alert" : "status"}
            className={error ? "text-rose-700" : "text-slate-600"}
          >
            {error || "Đang kiểm tra phiên đăng nhập…"}
          </p>
        </section>
      </main>
    );
  if (!user) return <LoginPage />;
  return (
    <App
      key={user.uid}
      user={user}
      onSignOut={handleLogout}
      signingOut={signingOut}
      logoutError={logoutError}
    />
  );
}
