import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, firebaseConfigured } from "../firebase/client";
import LoginPage from "./LoginPage";
import App from "../App";

/** The only application entry: unauthenticated visitors never mount the dashboard. */
export default function AuthGate() {
  const [state, setState] = useState({ loading: true, user: null, error: "" });
  const [signingOut, setSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  // This is a single-page app hosted on GitHub Pages. Do not leave a stale
  // /login subpath in the address bar: deep-link reloads can 404 on Pages.
  useEffect(() => {
    const base = import.meta.env.BASE_URL || "/";
    const normalized = base.endsWith("/") ? base : `${base}/`;
    if (window.location.pathname === `${normalized}login`)
      window.history.replaceState(window.history.state, "", normalized + window.location.search + window.location.hash);
  }, []);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth,
      (user) => setState({ loading: false, user, error: "" }),
      () => setState({ loading: false, user: null, error: "Không xác minh được phiên đăng nhập. Hãy tải lại trang." }),
    );
  }, []);

  async function handleSignOut() {
    if (!auth || signingOut) return;
    setLogoutError("");
    setSigningOut(true);
    try {
      await signOut(auth);
    } catch {
      setLogoutError("Đăng xuất chưa thành công. Vui lòng thử lại.");
    } finally {
      setSigningOut(false);
    }
  }

  if (!firebaseConfigured) return <LoginPage configError="Thiếu cấu hình Firebase. Kiểm tra .env.local, đảm bảo các biến VITE_FIREBASE_* đã được khai báo, rồi khởi động lại Vite." />;
  if (state.loading) return <div role="status" className="grid min-h-dvh place-items-center bg-[#f3f6fb] text-sm font-semibold text-slate-600"><div className="flex items-center gap-3"><span aria-hidden="true" className="size-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600"/>Đang xác thực phiên đăng nhập…</div></div>;
  if (!state.user) return <LoginPage configError={state.error} />;
  return <App key={state.user.uid} user={state.user} onSignOut={handleSignOut} signingOut={signingOut} logoutError={logoutError} />;
}
