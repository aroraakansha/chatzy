import type { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <main className="ambient-shell grid min-h-dvh grid-cols-1 overflow-hidden lg:grid-cols-[1fr_520px]">
      <section className="hidden p-8 lg:flex">
        <div className="chatzy-wallpaper flex flex-1 flex-col justify-between rounded-[36px] border border-white/70 p-10 shadow-[0_30px_90px_rgb(28_45_38/0.14)]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#008069]">
              Chatzy
            </p>
            <h1 className="mt-5 max-w-xl text-5xl font-semibold leading-tight text-[#17211c]">
              Secure conversations for teams, friends, and communities.
            </h1>
          </div>
          <div className="grid max-w-3xl grid-cols-3 gap-4">
            {["Encrypted chats", "Crystal calls", "Live presence"].map((item) => (
              <div
                key={item}
                className="rounded-3xl border border-white/70 bg-white/70 p-4 text-sm font-semibold text-[#27352f] shadow-sm backdrop-blur"
              >
                {item}
                <p className="mt-2 text-xs font-normal leading-5 text-[#66756f]">
                  Production-ready UX patterns with scalable frontend boundaries.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md rounded-[32px] border border-white/70 bg-white/88 p-6 shadow-[0_24px_70px_rgb(28_45_38/0.14)] backdrop-blur-xl sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#008069]">Chatzy</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#17211c]">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-[#66756f]">{subtitle}</p>
          <div className="mt-7">{children}</div>
        </div>
      </section>
    </main>
  );
}
