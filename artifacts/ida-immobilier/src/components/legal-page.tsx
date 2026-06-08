import { motion } from "framer-motion";
import { LAST_UPDATED } from "@/data/legal";

interface LegalPageProps {
  eyebrow: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}

export function LegalPage({ eyebrow, title, intro, children }: LegalPageProps) {
  return (
    <div>
      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(ellipse_at_70%_30%,#C9A84C_0%,transparent_60%)]" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <p className="text-accent font-semibold uppercase tracking-widest text-sm mb-4">
              {eyebrow}
            </p>
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4 leading-tight">
              {title}
            </h1>
            {intro && (
              <p className="text-primary-foreground/80 text-lg leading-relaxed">
                {intro}
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-10">
            {children}
            <p className="text-sm text-muted-foreground pt-6 border-t border-border">
              Dernière mise à jour : {LAST_UPDATED}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="font-serif text-2xl font-bold text-primary mb-4">{title}</h2>
      <div className="space-y-3 text-muted-foreground leading-relaxed [&_a]:text-primary [&_a]:underline [&_a:hover]:text-accent [&_strong]:text-foreground [&_strong]:font-semibold">
        {children}
      </div>
    </div>
  );
}
