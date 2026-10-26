"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="fatal-screen"><div className="fatal-card"><span className="logo-orbit">c</span><h1>A little hiccup.</h1><p>Chatzy couldn’t open this view just now.</p><button className="button button-primary" onClick={reset}>Try again</button></div></main>;
}
