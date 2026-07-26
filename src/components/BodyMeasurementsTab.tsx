import React, { useState, useEffect } from 'react';
import {
  Save,
  TrendingUp,
  TrendingDown,
  Minus,
  User,
  Activity
} from 'lucide-react';
import { Client } from '../types';
import {
  saveBodyMeasurement,
  getClientBodyMeasurements,
  getBodyMeasurementByWeek,
  BodyMeasurement
} from '../lib/progressTracking';
import { useToast } from '../contexts/ToastContext';
import { useClientLocale } from '../contexts/ClientLocaleContext';

interface BodyMeasurementsTabProps {
  client: Client;
  currentWeek: number;
  maxWeeks: number;
}

interface MeasurementInput {
  bodyFatPercentage: string;
  neck: string;
  waist: string;
  hips: string;
  notes: string;
}

const fieldStyle: React.CSSProperties = {
  background: 'var(--surface-2)',
  border: '1px solid var(--hair)',
  color: 'var(--txt-hi)',
  fontSize: 16,
};

export const BodyMeasurementsTab: React.FC<BodyMeasurementsTabProps> = ({
  client,
  currentWeek,
  maxWeeks
}) => {
  const toast = useToast();
  const { t } = useClientLocale();
  const [isLoading, setIsLoading] = useState(false);
  const [allMeasurements, setAllMeasurements] = useState<BodyMeasurement[]>([]);
  const [currentMeasurement, setCurrentMeasurement] = useState<MeasurementInput>({
    bodyFatPercentage: '',
    neck: '',
    waist: '',
    hips: '',
    notes: ''
  });
  const [compareWeek1, setCompareWeek1] = useState(1);
  const [compareWeek2, setCompareWeek2] = useState(currentWeek);

  useEffect(() => {
    loadMeasurements();
  }, [client.id, currentWeek]);

  useEffect(() => {
    setCompareWeek2(currentWeek);
  }, [currentWeek]);

  const loadMeasurements = async () => {
    try {
      setIsLoading(true);
      const [allData, weekData] = await Promise.all([
        getClientBodyMeasurements(client.id),
        getBodyMeasurementByWeek(client.id, currentWeek)
      ]);

      setAllMeasurements(allData);

      if (weekData) {
        setCurrentMeasurement({
          bodyFatPercentage: weekData.bodyFatPercentage?.toString() || '',
          neck: weekData.neck?.toString() || '',
          waist: weekData.waist?.toString() || '',
          hips: weekData.hips?.toString() || '',
          notes: weekData.notes || ''
        });
      } else {
        setCurrentMeasurement({
          bodyFatPercentage: '',
          neck: '',
          waist: '',
          hips: '',
          notes: ''
        });
      }
    } catch (error) {
      console.error('Failed to load measurements:', error);
      toast.error(t('meas.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const params: any = {
        clientId: client.id,
        weekNumber: currentWeek
      };
      if (currentMeasurement.bodyFatPercentage) params.bodyFatPercentage = parseFloat(currentMeasurement.bodyFatPercentage);
      if (currentMeasurement.neck) params.neck = parseFloat(currentMeasurement.neck);
      if (currentMeasurement.waist) params.waist = parseFloat(currentMeasurement.waist);
      if (currentMeasurement.hips) params.hips = parseFloat(currentMeasurement.hips);
      if (currentMeasurement.notes) params.notes = currentMeasurement.notes;

      await saveBodyMeasurement(params);
      toast.success(t('meas.saveSuccess'));
      await loadMeasurements();
    } catch (error) {
      console.error('Failed to save measurements:', error);
      toast.error(t('meas.saveFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof MeasurementInput, value: string) => {
    setCurrentMeasurement(prev => ({ ...prev, [field]: value }));
  };

  const getInsightComment = (change: number, percentageChange: number, field: string) => {
    const absPercent = Math.abs(percentageChange);

    if (field === 'bodyFatPercentage') {
      if (change < -2) return t('meas.insightFatExcellent');
      if (change < -0.5) return t('meas.insightFatGreat');
      if (change > 2) return t('meas.insightFatReview');
      if (Math.abs(change) < 0.5) return t('meas.insightFatMaintain');
      return t('meas.insightFatSlight');
    }

    if (field === 'waist') {
      if (change < -2) return t('meas.insightWaistAmazing');
      if (change < -0.5) return t('meas.insightWaistGood');
      if (change > 2) return t('meas.insightWaistIncreasing');
      return t('meas.insightStable');
    }

    if (field === 'neck' || field === 'hips') {
      if (absPercent < 1) return t('meas.insightConsistent');
      if (absPercent < 3) return t('meas.insightMinor');
      return change > 0 ? t('meas.insightIncreased') : t('meas.insightDecreased');
    }

    return t('meas.insightTracking');
  };

  const renderMeasurementComparison = () => {
    const week1Data = allMeasurements.find(m => m.weekNumber === compareWeek1);
    const week2Data = allMeasurements.find(m => m.weekNumber === compareWeek2);

    const measurementFields = [
      { label: t('meas.bodyFat'), key: 'bodyFatPercentage', unit: '%', icon: User },
      { label: t('meas.neckShort'), key: 'neck', unit: 'cm' },
      { label: t('meas.waistShort'), key: 'waist', unit: 'cm' },
      { label: t('meas.hipsShort'), key: 'hips', unit: 'cm' }
    ];

    const availableWeeks = Array.from(
      new Set([...allMeasurements.map(m => m.weekNumber), currentWeek])
    ).sort((a, b) => a - b);

    if (availableWeeks.length === 0) {
      return (
        <div className="text-center py-6">
          <Activity className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--txt-lo)' }} />
          <p className="text-sm" style={{ color: 'var(--txt-mid)' }}>{t('meas.noDataYet')}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--txt-lo)' }}>{t('meas.saveToCompare')}</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <label className="flex items-center gap-1.5">
            <span className="text-[11px]" style={{ color: 'var(--txt-lo)' }}>{t('meas.week')}</span>
            <select
              value={compareWeek1}
              onChange={(e) => setCompareWeek1(Number(e.target.value))}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium outline-none"
              style={fieldStyle}
            >
              {Array.from({ length: maxWeeks }, (_, i) => i + 1).map(week => (
                <option key={week} value={week}>{t('photo.week', { n: week })}</option>
              ))}
            </select>
          </label>
          <span className="text-xs font-bold" style={{ color: 'var(--red)' }}>{t('photo.vs')}</span>
          <label className="flex items-center gap-1.5">
            <span className="text-[11px]" style={{ color: 'var(--txt-lo)' }}>{t('meas.week')}</span>
            <select
              value={compareWeek2}
              onChange={(e) => setCompareWeek2(Number(e.target.value))}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium outline-none"
              style={fieldStyle}
            >
              {Array.from({ length: maxWeeks }, (_, i) => i + 1).map(week => (
                <option key={week} value={week}>{t('photo.week', { n: week })}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {measurementFields.map(field => {
            const value1 = week1Data?.[field.key as keyof BodyMeasurement] as number | undefined;
            const value2 = week2Data?.[field.key as keyof BodyMeasurement] as number | undefined;
            const hasData = value1 !== undefined && value2 !== undefined;
            const change = hasData ? value2 - value1 : 0;
            const percentageChange = hasData && value1 > 0 ? ((change / value1) * 100) : 0;
            const isPositive = change > 0;
            const isNegative = change < 0;
            const comment = hasData ? getInsightComment(change, percentageChange, field.key) : '';

            return (
              <div
                key={field.key}
                className="rounded-xl p-3"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)' }}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {field.icon && <field.icon className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--red)' }} />}
                    <h4 className="text-xs font-semibold truncate" style={{ color: 'var(--txt-hi)' }}>{field.label}</h4>
                  </div>
                  {hasData && (
                    <div
                      className="flex items-center gap-0.5 text-[11px] font-bold tnum shrink-0"
                      style={{ color: isPositive ? 'var(--green)' : isNegative ? 'var(--red)' : 'var(--txt-lo)' }}
                    >
                      {isPositive && <TrendingUp className="w-3 h-3" />}
                      {isNegative && <TrendingDown className="w-3 h-3" />}
                      {!isPositive && !isNegative && <Minus className="w-3 h-3" />}
                      <span>{isPositive ? '+' : ''}{percentageChange.toFixed(1)}%</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  <div className="text-center">
                    <div className="text-[9px] uppercase tracking-wide mb-0.5" style={{ color: 'var(--txt-lo)' }}>
                      {t('photo.week', { n: compareWeek1 })}
                    </div>
                    <div className="text-sm font-bold tnum" style={{ color: 'var(--txt-hi)' }}>
                      {value1 !== undefined ? `${value1.toFixed(1)}${field.unit}` : '--'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[9px] uppercase tracking-wide mb-0.5" style={{ color: 'var(--txt-lo)' }}>
                      {t('meas.change')}
                    </div>
                    <div
                      className="text-sm font-bold tnum"
                      style={{ color: isPositive ? 'var(--green)' : isNegative ? 'var(--red)' : 'var(--txt-lo)' }}
                    >
                      {hasData ? `${isPositive ? '+' : ''}${change.toFixed(1)}${field.unit}` : '--'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[9px] uppercase tracking-wide mb-0.5" style={{ color: 'var(--txt-lo)' }}>
                      {t('photo.week', { n: compareWeek2 })}
                    </div>
                    <div className="text-sm font-bold tnum" style={{ color: 'var(--txt-hi)' }}>
                      {value2 !== undefined ? `${value2.toFixed(1)}${field.unit}` : '--'}
                    </div>
                  </div>
                </div>

                {hasData ? (
                  <p
                    className="text-[11px] leading-snug pl-2"
                    style={{ color: 'var(--txt-mid)', borderLeft: '2px solid var(--red)' }}
                  >
                    {comment}
                  </p>
                ) : (
                  <p className="text-[11px] text-center" style={{ color: 'var(--txt-lo)' }}>{t('meas.noDataBoth')}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div
        className="rounded-2xl p-3 sm:p-4"
        style={{ background: 'var(--surface-1)', border: '1px solid var(--hair)' }}
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold truncate" style={{ color: 'var(--txt-hi)' }}>
              {t('meas.weekMeasurements', { week: currentWeek })}
            </h3>
            <p className="text-[11px]" style={{ color: 'var(--txt-lo)' }}>{t('meas.enterCm')}</p>
          </div>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-semibold disabled:opacity-50 shrink-0"
            style={{ background: 'var(--grad-red)', minHeight: 40 }}
          >
            {isLoading ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{t('meas.save')}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {([
            { key: 'bodyFatPercentage' as const, label: t('meas.bodyFat'), placeholder: '18.5' },
            { key: 'neck' as const, label: t('meas.neck'), placeholder: '38.5' },
            { key: 'waist' as const, label: t('meas.waist'), placeholder: '82.0' },
            { key: 'hips' as const, label: t('meas.hips'), placeholder: '95.0' },
          ]).map((f) => (
            <label key={f.key} className="block">
              <span className="block text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--txt-lo)' }}>
                {f.label}
              </span>
              <input
                type="number"
                step="0.1"
                inputMode="decimal"
                value={currentMeasurement[f.key] || ''}
                onChange={(e) => handleInputChange(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="w-full rounded-lg px-2.5 py-2 outline-none tnum"
                style={fieldStyle}
              />
            </label>
          ))}
        </div>

        <div className="mt-2.5">
          <label className="block text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--txt-lo)' }}>
            {t('meas.notesOptional')}
          </label>
          <textarea
            value={currentMeasurement.notes || ''}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder={t('meas.notesPlaceholder')}
            rows={2}
            className="w-full rounded-lg px-2.5 py-2 outline-none resize-none"
            style={fieldStyle}
          />
        </div>
      </div>

      <div
        className="rounded-2xl p-3 sm:p-4"
        style={{ background: 'var(--surface-1)', border: '1px solid var(--hair)' }}
      >
        <div className="mb-3">
          <h3 className="text-sm sm:text-base font-bold" style={{ color: 'var(--txt-hi)' }}>
            {t('meas.comparisonTool')}
          </h3>
          <p className="text-[11px]" style={{ color: 'var(--txt-lo)' }}>{t('meas.compareDesc')}</p>
        </div>
        {renderMeasurementComparison()}
      </div>
    </div>
  );
};
