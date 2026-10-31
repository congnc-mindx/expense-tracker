import { useState } from "react";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../firebase/client";

const authErrors = {
  "auth/invalid-credential": "Email hoặc mật khẩu chưa chính xác.",
  "auth/wrong-password": "Email hoặc mật khẩu chưa chính xác.",
  "auth/user-not-found": "Không tìm thấy tài khoản này.",
  "auth/invalid-email": "Email không đúng định dạng.",
  "auth/too-many-requests": "Có quá nhiều lần thử. Vui lòng thử lại sau.",
  "auth/network-request-failed": "Không có kết nối mạng. Hãy kiểm tra Internet rồi thử lại.",
  "auth/user-disabled": "Tài khoản đã bị vô hiệu hóa.",
  "auth/operation-not-allowed": "Chưa bật Email/Password trong Firebase Authentication.",
  "auth/unauthorized-domain": "Tên miền hiện tại chưa được cấp phép trong Firebase Authentication.",
  "auth/invalid-api-key": "Cấu hình Firebase chưa đúng. Kiểm tra .env.local.",
  "auth/missing-email": "Vui lòng nhập email để tiếp tục.",
};
const friendlyError = (error) => authErrors[error?.code] || "Có lỗi khi kết nối tài khoản. Hãy kiểm tra Firebase và thử lại.";

function BrandMark({ inverse = false }) {
  return <div aria-hidden="true" className={`grid size-12 shrink-0 place-items-center rounded-2xl text-2xl font-black ${inverse ? "bg-white text-blue-700" : "bg-blue-600 text-white shadow-lg shadow-blue-600/20"}`}>◈</div>;
}

export default function LoginPage({ configError = "" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (!auth || busy || resetBusy || configError) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      // Firebase manages the auth session itself; never save a password or token manually.
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setPassword("");
    } catch (reason) {
      setError(friendlyError(reason));
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword() {
    if (!auth || busy || resetBusy || configError) return;
    if (!email.trim()) {
      setError("Hãy nhập email của bạn trước khi chọn Quên mật khẩu.");
      return;
    }
    setResetBusy(true);
    setError("");
    setNotice("");
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setNotice("Nếu email có tài khoản hợp lệ, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.");
    } catch (reason) {
      setError(friendlyError(reason));
    } finally {
      setResetBusy(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[#f3f6fb] text-slate-900 lg:h-dvh lg:overflow-hidden">
      <div className="mx-auto flex min-h-dvh max-w-[1440px] flex-col p-4 sm:p-5 lg:h-full lg:min-h-0 lg:flex-row lg:gap-4 lg:p-5">
        <section className="login-brand relative hidden w-[50%] min-w-0 flex-col justify-between overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#102654] via-[#163b77] to-[#2765b8] p-8 text-white lg:flex xl:p-10">
          <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-24 size-[540px] rounded-full border border-white/15" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-12 top-4 size-[370px] rounded-full border border-white/15" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-36 -left-28 size-[430px] rounded-full bg-white/5" />
          <div className="relative flex items-center gap-4"><BrandMark inverse /><div><p className="text-2xl font-extrabold tracking-tight">zWhisFlow</p><p className="text-sm text-blue-100">Quản lý tài chính cá nhân</p></div></div>
          <div className="relative max-w-lg py-5">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-blue-100">✦ DỮ LIỆU CỦA BẠN · QUYỀN KIỂM SOÁT CỦA BẠN</p>
            <h1 className="text-4xl font-extrabold leading-[1.15] tracking-tight xl:text-5xl">Mọi khoản tiền.<br/><span className="text-[#a9d6ff]">Một nơi quản lý.</span></h1>
            <p className="mt-4 max-w-md text-base leading-7 text-blue-100">Theo dõi thu chi, lập ngân sách, đối chiếu mục tiêu và lưu giữ sổ mừng – thăm hỏi qua nhiều năm.</p>
            <div className="login-benefits mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm"><p className="text-2xl">▤</p><p className="mt-2 font-bold">Thu chi & ngân sách</p><p className="mt-1 text-xs leading-5 text-blue-100">Rõ ràng theo từng tháng</p></div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm"><p className="text-2xl">♡</p><p className="mt-2 font-bold">Sổ quan hệ lâu dài</p><p className="mt-1 text-xs leading-5 text-blue-100">Lưu từng lần gửi và nhận</p></div>
            </div>
          </div>
          <p className="login-footnote relative text-xs text-blue-200">Đăng nhập bảo mật bằng Firebase Authentication · Dữ liệu riêng theo tài khoản</p>
        </section>

        <main className="flex min-w-0 flex-1 items-center justify-center px-1 py-6 sm:px-6 lg:overflow-y-auto lg:px-8 lg:py-3">
          <div className="w-full max-w-[440px]">
            <div className="mb-6 flex items-center gap-3 lg:hidden"><BrandMark /><div><p className="text-xl font-extrabold">zWhisFlow</p><p className="text-sm text-slate-500">Tài chính cá nhân</p></div></div>
            <div className="mb-6"><p className="mb-2 text-xs font-bold tracking-wide text-blue-600">CHÀO MỪNG TRỞ LẠI</p><h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Đăng nhập</h2><p className="mt-2 text-sm leading-6 text-slate-500">Đăng nhập để truy cập dữ liệu tài chính và sổ mừng, thăm hỏi của bạn.</p></div>
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <label className="grid gap-2 text-sm font-bold text-slate-700">Địa chỉ email
                <input type="email" autoComplete="username" autoCapitalize="none" spellCheck={false} required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email@example.com" className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-normal outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
              </label>
              <label className="grid gap-2 text-sm font-bold text-slate-700">Mật khẩu
                <span className="relative block"><input type={showPassword ? "text" : "password"} autoComplete="current-password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Nhập mật khẩu" className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-16 text-base font-normal outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
                  <button type="button" aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} onClick={() => setShowPassword((value) => !value)} className="absolute inset-y-0 right-4 text-sm font-semibold text-blue-600 hover:text-blue-800">{showPassword ? "Ẩn" : "Hiện"}</button>
                </span>
              </label>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm text-slate-600"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="size-4 accent-blue-600" />Ghi nhớ đăng nhập</label>
                <button type="button" disabled={busy || resetBusy || Boolean(configError)} onClick={resetPassword} className="text-sm font-bold text-blue-600 hover:underline disabled:opacity-50">{resetBusy ? "Đang gửi…" : "Quên mật khẩu?"}</button>
              </div>
              <p className="-mt-2 text-xs leading-5 text-slate-500">{remember ? "Bạn sẽ duy trì đăng nhập sau khi đóng trình duyệt trên thiết bị này, cho đến khi đăng xuất hoặc phiên bị thu hồi." : "Phiên đăng nhập chỉ được duy trì trong phiên trình duyệt hiện tại."}</p>
              {(configError || error) && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700">{configError || error}</p>}
              {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-700">{notice}</p>}
              <button type="submit" disabled={busy || resetBusy || Boolean(configError)} className="mt-1 h-12 w-full rounded-xl bg-blue-600 px-5 py-3 font-extrabold text-white shadow-lg shadow-blue-600/15 transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60">{busy ? "Đang xác thực…" : "Đăng nhập vào zWhisFlow  →"}</button>
            </form>
            <div className="mt-6 border-t border-slate-200 pt-4"><p className="text-xs leading-6 text-slate-500">Chỉ những tài khoản được tạo trong Firebase Authentication mới có quyền đăng nhập. Không có đăng ký tài khoản công khai.</p></div>
          </div>
        </main>
      </div>
    </div>
  );
}
