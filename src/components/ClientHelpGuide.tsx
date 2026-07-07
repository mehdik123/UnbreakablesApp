import React, { useState } from 'react';
import {
  X,
  PlayCircle,
  ChevronDown,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { CLIENT_GUIDE_SECTIONS } from '../data/clientGuideFaq';
import { CLIENT_GUIDE_VIDEO_URL, toYoutubeEmbedUrl } from '../config/clientGuide';

interface ClientHelpGuideProps {
  isRtl: boolean;
  t: (key: string, vars?: Record<string, string | number>) => string;
  onClose: () => void;
  onReplayTour?: () => void;
}

export const ClientHelpGuide: React.FC<ClientHelpGuideProps> = ({
  isRtl,
  t,
  onClose,
  onReplayTour,
}) => {
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const embedUrl = toYoutubeEmbedUrl(CLIENT_GUIDE_VIDEO_URL);

  const toggleFaq = (id: string) => {
    setOpenFaq((prev) => (prev === id ? null : id));
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex flex-col"
      style={{ background: 'var(--bg)' }}
      dir={isRtl ? 'rtl' : 'ltr'}
      role="dialog"
      aria-modal="true"
      aria-labelledby="client-help-guide-title"
    >
      <header
        className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-b"
        style={{ borderColor: 'var(--hair)', background: 'var(--surface-1)' }}
      >
        <div className="min-w-0 flex items-center gap-2">
          <BookOpen className="w-5 h-5 shrink-0" style={{ color: 'var(--red)' }} />
          <div className="min-w-0">
            <h2 id="client-help-guide-title" className="font-display font-semibold text-[16px] truncate" style={{ color: 'var(--txt-hi)' }}>
              {t('guide.title')}
            </h2>
            <p className="text-[11px] truncate" style={{ color: 'var(--txt-lo)' }}>
              {t('guide.subtitle')}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 active:scale-90 transition-transform"
          style={{ background: 'var(--glass)', border: '1px solid var(--hair)', color: 'var(--txt-mid)' }}
          aria-label={t('guide.close')}
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-8 space-y-5 max-w-2xl mx-auto w-full">
        {/* Video */}
        <section
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--surface-1)', border: '1px solid var(--hair)' }}
        >
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--hair)' }}>
            <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--txt-hi)' }}>
              <PlayCircle className="w-4 h-4" style={{ color: 'var(--red)' }} />
              {t('guide.videoTitle')}
            </h3>
          </div>
          {embedUrl ? (
            <div className="relative w-full aspect-video bg-black">
              <iframe
                title={t('guide.videoTitle')}
                src={`${embedUrl}?rel=0`}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="px-4 py-6 text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ background: 'rgba(255,45,85,.12)' }}
              >
                <PlayCircle className="w-7 h-7" style={{ color: 'var(--red)' }} />
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--txt-mid)' }}>
                {t('guide.videoMissing')}
              </p>
            </div>
          )}
        </section>

        {onReplayTour && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onReplayTour();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold active:scale-[0.98] transition-transform"
            style={{ background: 'var(--grad-red)', color: '#fff' }}
          >
            <Sparkles className="w-4 h-4" />
            {t('guide.replayTour')}
          </button>
        )}

        {/* FAQ by section */}
        {CLIENT_GUIDE_SECTIONS.map((section) => (
          <section key={section.id}>
            <h3
              className="text-[11px] font-bold uppercase tracking-[0.14em] mb-2 px-1"
              style={{ color: 'var(--txt-lo)' }}
            >
              {t(`guide.section.${section.id}`)}
            </h3>
            <div className="space-y-2">
              {section.faqIds.map((faqId) => {
                const isOpen = openFaq === faqId;
                return (
                  <div
                    key={faqId}
                    className="rounded-xl overflow-hidden"
                    style={{ background: 'var(--surface-1)', border: '1px solid var(--hair)' }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(faqId)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-start"
                      aria-expanded={isOpen}
                    >
                      <span className="text-[13.5px] font-semibold leading-snug" style={{ color: 'var(--txt-hi)' }}>
                        {t(`guide.faq.${faqId}.q`)}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        style={{ color: 'var(--txt-lo)' }}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-0">
                        <p className="text-[13px] leading-relaxed" style={{ color: 'var(--txt-mid)' }}>
                          {t(`guide.faq.${faqId}.a`)}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        <p className="text-center text-[12px] px-2 pt-2" style={{ color: 'var(--txt-lo)' }}>
          {t('guide.footer')}
        </p>
      </div>
    </div>
  );
};

export default ClientHelpGuide;
