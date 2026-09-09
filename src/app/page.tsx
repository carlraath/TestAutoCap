import { AppFooter } from "@/components/brand/AppFooter";
import { AppHeader } from "@/components/brand/AppHeader";
import { AvecLogo } from "@/components/brand/AvecLogo";

/** Phase 0 hello page. Replaced by the role-based redirect in Phase 1. */
export default function Home() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-10 sm:px-6">
        <section className="brand-gradient rounded-card p-10 text-white shadow-card sm:p-16">
          <AvecLogo className="h-9 w-auto" />
          <h1 className="mt-8 max-w-2xl text-3xl sm:text-5xl">Capability Placement</h1>
          <p className="mt-4 max-w-xl text-base font-normal text-white/90 sm:text-lg">
            A short, structured placement assessment that produces a bespoke training plan for every participant.
          </p>
        </section>
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {["Test Automation Fundamentals", "SQL", "Python"].map((t) => (
            <div key={t} className="rounded-card border border-brand-500/20 bg-white p-6 shadow-card">
              <h2 className="text-lg">{t}</h2>
              <p className="mt-2 text-sm text-ink-600">10 questions, 10 minutes.</p>
            </div>
          ))}
        </section>
      </main>
      <AppFooter />
    </>
  );
}
