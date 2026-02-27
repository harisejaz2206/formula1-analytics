import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  overline?: string;
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ icon: Icon, title, subtitle, overline, actions }) => {
  return (
    <section className="f1-hero">
      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          {overline && <p className="f1-overline">{overline}</p>}
          <h1 className="f1-page-title">{title}</h1>
          <p className="f1-page-subtitle">{subtitle}</p>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
      <div className="pointer-events-none absolute -right-12 -top-10 h-44 w-44 rounded-full bg-f1-red/15 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-20 right-5 opacity-15">
        <Icon className="h-44 w-44 text-f1-red" />
      </div>
    </section>
  );
};

export default PageHeader;

