import type { ReactNode } from "react";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description: string;
};

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="grid min-h-[220px] place-items-center rounded-3xl border border-dashed border-[#cbd5d0] bg-white/55 p-8 text-center">
      <div>
        {icon ? (
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-[#e7f7f1] text-[#008069]">
            {icon}
          </div>
        ) : null}
        <h2 className="text-lg font-semibold text-[#17211c]">{title}</h2>
        <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-[#66756f]">{description}</p>
      </div>
    </div>
  );
}
