"use client";

import { useState } from "react";
import { ArrowRight, AtSign, Check, Eye, EyeOff, LockKeyhole, MessageCircle, Sparkles, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { api, saveSession } from "@/features/chat/api";

export function AuthPage({ mode = "login" }: { mode?: "login" | "signup" }) {
  const router = useRouter();
  const [signup, setSignup] = useState(mode === "signup");
  const [otpStage, setOtpStage] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      if (otpStage) {
        const session = await api.verifyOtp({ email, phone, code }); saveSession(session); router.replace("/dashboard"); return;
      }
      if (!signup) {
        const session = await api.login(email, password); saveSession(session); router.replace("/dashboard"); return;
      }
      await api.startSignup({ email, phone, password, fullName: name }); setOtpStage(true); setNotice("Your verification code is on its way.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again."); }
    finally { setBusy(false); }
  }

  return <main className="auth-layout">
    <section className="auth-art">
      <a className="brand-lockup" href="/"><span className="brand-symbol"><MessageCircle size={20} fill="currentColor" /></span><span>chatzy<span className="brand-dot">.</span></span></a>
      <div className="auth-art-copy"><span className="eyebrow"><Sparkles size={14} /> A little more human</span><h1>Good things<br />happen <i>here.</i></h1><p>Your people, your little moments, all in one lovely place.</p><div className="art-note"><span className="note-avatars"><i>A</i><i>J</i><i>M</i></span><span><b>Your favorite people</b><small>are just a message away</small></span><span className="note-heart">♥</span></div></div>
      <div className="art-decoration deco-one" /><div className="art-decoration deco-two" /><div className="auth-art-bottom">Made for the conversations that matter <span>✳</span></div>
    </section>
    <section className="auth-form-side"><div className="auth-mobile-brand"><span className="brand-symbol"><MessageCircle size={18} fill="currentColor" /></span>chatzy<span className="brand-dot">.</span></div>
      <form className="auth-card" onSubmit={submit}>
        <span className="eyebrow">{otpStage ? "ONE QUICK CHECK" : signup ? "YOUR PEOPLE ARE HERE" : "WELCOME BACK"}</span>
        <h2>{otpStage ? "Check your inbox." : signup ? "Let's get you in." : "You’re right where you belong."}</h2>
        <p className="auth-intro">{otpStage ? `Enter the code we sent to ${email}.` : signup ? "Create your account and bring your favorite people closer." : "Pick up right where your conversations left off."}</p>
        {error && <div className="alert alert-error" role="alert">{error}</div>}{notice && <div className="alert alert-success"><Check size={15} />{notice}</div>}
        <div className="auth-fields">
          {signup && !otpStage && <label className="field"><span>Your name</span><span className="field-control"><UserRound size={17} /><input required value={name} onChange={(e) => setName(e.target.value)} placeholder="What should we call you?" autoComplete="name" /></span></label>}
          {!otpStage ? <label className="field"><span>Email address</span><span className="field-control"><AtSign size={17} /><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" /></span></label> : <label className="field"><span>Verification code</span><span className="field-control code-control"><input required inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} placeholder="000000" autoComplete="one-time-code" /></span></label>}
          {signup && !otpStage && <label className="field"><span>Phone number <small>optional</small></span><span className="field-control"><span className="phone-prefix">＋</span><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Your number" autoComplete="tel" /></span></label>}
          {!otpStage && <label className="field"><span>Password</span><span className="field-control"><LockKeyhole size={17} /><input required minLength={6} type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" autoComplete={signup ? "new-password" : "current-password"} /><button type="button" className="eye-button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></span></label>}
        </div>
        {!signup && !otpStage && <a className="forgot-link" href="/forgot-password">Forgot password?</a>}
        <button className="button button-primary auth-submit" disabled={busy}>{busy ? <span className="spinner" /> : <>{otpStage ? "Verify & continue" : signup ? "Create my account" : "Sign in"}<ArrowRight size={17} /></>}</button>
        {!otpStage && <><div className="auth-divider"><span />a softer way to stay close<span /></div><a className="google-button" href="/api/auth/google"><span className="google-g">G</span>Continue with Google</a></>}
        <p className="auth-toggle">{otpStage ? <button type="button" onClick={() => { setOtpStage(false); setCode(""); }}>← Back to sign up</button> : signup ? <>Already part of the circle? <button type="button" onClick={() => { setSignup(false); setError(""); }}>Sign in</button></> : <>New around here? <button type="button" onClick={() => { setSignup(true); setError(""); }}>Create an account</button></>}</p>
        <p className="auth-terms">By continuing, you agree to keep it kind and keep it real.</p>
      </form>
    </section>
  </main>;
}
