import React from 'react';
import { Dumbbell, UtensilsCrossed, LineChart } from 'lucide-react';

interface ModernLoadingScreenProps {
  message?: string;
}

const SPLASH_PILLS = [
  { icon: Dumbbell, label: 'Training', accent: 'app-splash-pill--red' },
  { icon: UtensilsCrossed, label: 'Nutrition', accent: 'app-splash-pill--green' },
  { icon: LineChart, label: 'Progress', accent: 'app-splash-pill--blue' },
] as const;

export const ModernLoadingScreen: React.FC<ModernLoadingScreenProps> = ({
  message = 'Loading…',
}) => {
  return (
    <div className="app-splash workout-shell" role="status" aria-live="polite" aria-busy="true">
      <div className="coach-hub-glow" aria-hidden />
      <div className="app-splash-inner">
        <div className="app-splash-mark">
          <img src="/brand-logo-light.png" alt="" className="app-splash-logo" />
          <p className="app-splash-wordmark font-saira">UNBREAKABLES</p>
        </div>

        <p className="app-splash-message">{message}</p>

        <div className="coach-hub-loading-bar app-splash-bar" aria-hidden>
          <span />
        </div>

        <ul className="app-splash-pills">
          {SPLASH_PILLS.map(({ icon: Icon, label, accent }) => (
            <li key={label} className={`app-splash-pill ${accent}`}>
              <Icon className="app-splash-pill-icon" aria-hidden />
              <span>{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
