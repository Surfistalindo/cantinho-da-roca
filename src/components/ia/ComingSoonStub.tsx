import { ReactNode } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWandMagicSparkles, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface ComingSoonStubProps {
  icon: IconDefinition;
  badge: string;
  headline: string;
  description: string;
  bullets: string[];
  ctaTo?: string;
  ctaLabel?: string;
  children?: ReactNode;
}

export default function ComingSoonStub({
  icon, badge, headline, description, bullets, ctaTo, ctaLabel, children,
}: ComingSoonStubProps) {
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/[0.06] via-card to-card p-6 sm:p-8 md:p-10">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative grid gap-8 md:grid-cols-[1.4fr_1fr] items-center">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10.5px] font-semibold uppercase tracking-[0.1em]">
              <FontAwesomeIcon icon={faWandMagicSparkles} className="h-2.5 w-2.5" />
              {badge}
            </span>
            <div className="space-y-3">
              <h2 className="text-[24px] sm:text-[28px] font-semibold tracking-tight text-foreground leading-[1.15]">
                {headline}
              </h2>
              <p className="text-[13.5px] text-muted-foreground leading-relaxed max-w-xl">
                {description}
              </p>
            </div>
            <ul className="space-y-2">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-[13px] text-foreground/85">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span className="leading-relaxed">{b}</span>
                </li>
              ))}
            </ul>
            {ctaTo && (
              <div className="pt-2">
                <Button asChild variant="outline" className="rounded-xl">
                  <Link to={ctaTo}>
                    {ctaLabel ?? 'Saiba mais'}
                    <FontAwesomeIcon icon={faArrowRight} className="h-3.5 w-3.5 ml-2" />
                  </Link>
                </Button>
              </div>
            )}
          </div>

          <div className="relative">
            <div className="rounded-2xl border bg-card/80 backdrop-blur-sm p-6 shadow-card flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary flex items-center justify-center ring-1 ring-primary/20 mb-3">
                <FontAwesomeIcon icon={icon} className="h-7 w-7" />
              </div>
              <p className="text-[13px] font-semibold text-foreground">Em construção</p>
              <p className="text-[11.5px] text-muted-foreground mt-1 leading-relaxed max-w-[220px]">
                Esta capacidade será ativada em breve como parte da Suíte IA.
              </p>
            </div>
          </div>
        </div>
      </section>

      {children}
    </div>
  );
}
