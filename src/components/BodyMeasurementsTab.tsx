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
  calculateMeasurementChange,
  BodyMeasurement 
} from '../lib/progressTracking';
import { useToast } from '../contexts/ToastContext';

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

export const BodyMeasurementsTab: React.FC<BodyMeasurementsTabProps> = ({
  client,
  currentWeek,
  maxWeeks
}) => {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [allMeasurements, setAllMeasurements] = useState<BodyMeasurement[]>([]);
  const [currentMeasurement, setCurrentMeasurement] = useState<MeasurementInput>({
    bodyFatPercentage: '',
    neck: '',
    waist: '',
    hips: '',
    notes: ''
  });

  // Load measurements
  useEffect(() => {
    loadMeasurements();
  }, [client.id, currentWeek]);

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
        // Reset form if no data for current week
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
      toast.error('Failed to load measurements');
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

      // Only include fields that have values
      if (currentMeasurement.bodyFatPercentage) params.bodyFatPercentage = parseFloat(currentMeasurement.bodyFatPercentage);
      if (currentMeasurement.neck) params.neck = parseFloat(currentMeasurement.neck);
      if (currentMeasurement.waist) params.waist = parseFloat(currentMeasurement.waist);
      if (currentMeasurement.hips) params.hips = parseFloat(currentMeasurement.hips);
      if (currentMeasurement.notes) params.notes = currentMeasurement.notes;

      await saveBodyMeasurement(params);
      toast.success('Measurements saved successfully!');
      await loadMeasurements();
    } catch (error) {
      console.error('Failed to save measurements:', error);
      toast.error('Failed to save measurements');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof MeasurementInput, value: string) => {
    setCurrentMeasurement(prev => ({ ...prev, [field]: value }));
  };

  const [compareWeek1, setCompareWeek1] = useState(1);
  const [compareWeek2, setCompareWeek2] = useState(currentWeek);

  // Update compareWeek2 when currentWeek changes
  useEffect(() => {
    setCompareWeek2(currentWeek);
  }, [currentWeek]);

  const getInsightComment = (change: number, percentageChange: number, field: string) => {
    const absChange = Math.abs(change);
    const absPercent = Math.abs(percentageChange);
    
    if (field === 'bodyFatPercentage') {
      if (change < -2) return '🔥 Excellent fat loss progress!';
      if (change < -0.5) return '✅ Great progress, keep it up!';
      if (change > 2) return '⚠️ Consider reviewing diet';
      if (Math.abs(change) < 0.5) return '➡️ Maintaining steadily';
      return '📊 Slight increase noted';
    }
    
    if (field === 'waist') {
      if (change < -2) return '🎉 Amazing waist reduction!';
      if (change < -0.5) return '💪 Good progress on core!';
      if (change > 2) return '📈 Waist increasing';
      return '➡️ Stable measurement';
    }
    
    if (field === 'neck' || field === 'hips') {
      if (absPercent < 1) return '➡️ Consistent measurement';
      if (absPercent < 3) return '📊 Minor changes detected';
      return change > 0 ? '📈 Measurement increased' : '📉 Measurement decreased';
    }
    
    return '📊 Progress tracking';
  };

  const renderMeasurementComparison = () => {
    const week1Data = allMeasurements.find(m => m.weekNumber === compareWeek1);
    const week2Data = allMeasurements.find(m => m.weekNumber === compareWeek2);

    const measurementFields = [
      { label: 'Body Fat %', key: 'bodyFatPercentage', unit: '%', icon: User },
      { label: 'Neck', key: 'neck', unit: 'cm' },
      { label: 'Waist', key: 'waist', unit: 'cm' },
      { label: 'Hips', key: 'hips', unit: 'cm' }
    ];

    // Get available weeks for dropdowns
    const availableWeeks = Array.from(
      new Set([...allMeasurements.map(m => m.weekNumber), currentWeek])
    ).sort((a, b) => a - b);

    if (availableWeeks.length === 0) {
      return (
        <div className="text-center py-12">
          <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No measurement data yet</p>
          <p className="text-gray-500 text-sm">Save measurements to start comparing weeks</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Week Selectors */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {/* Week 1 Selector */}
          <div className="flex items-center gap-2">
            <label className="text-white/60 text-sm font-medium">Week</label>
            <select
              value={compareWeek1}
              onChange={(e) => setCompareWeek1(Number(e.target.value))}
              className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white text-sm font-medium focus:outline-none focus:border-[#dc1e3a] transition-colors cursor-pointer"
            >
              {Array.from({ length: maxWeeks }, (_, i) => i + 1).map(week => (
                <option key={week} value={week}>Week {week}</option>
              ))}
            </select>
          </div>

          <div className="text-[#dc1e3a] font-bold text-lg">VS</div>

          {/* Week 2 Selector */}
          <div className="flex items-center gap-2">
            <label className="text-white/60 text-sm font-medium">Week</label>
            <select
              value={compareWeek2}
              onChange={(e) => setCompareWeek2(Number(e.target.value))}
              className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white text-sm font-medium focus:outline-none focus:border-[#dc1e3a] transition-colors cursor-pointer"
            >
              {Array.from({ length: maxWeeks }, (_, i) => i + 1).map(week => (
                <option key={week} value={week}>Week {week}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                className="bg-gradient-to-br from-gray-800 to-gray-800/50 border border-gray-700 rounded-2xl p-5 hover:border-[#dc1e3a]/30 transition-all duration-300"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {field.icon && <field.icon className="w-5 h-5 text-[#dc1e3a]" />}
                    <h4 className="text-white font-semibold">{field.label}</h4>
                  </div>
                  {hasData && (
                    <div className={`flex items-center gap-1 text-sm font-bold ${
                      isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {isPositive && <TrendingUp className="w-4 h-4" />}
                      {isNegative && <TrendingDown className="w-4 h-4" />}
                      {!isPositive && !isNegative && <Minus className="w-4 h-4" />}
                      <span>{isPositive ? '+' : ''}{percentageChange.toFixed(1)}%</span>
                    </div>
                  )}
                </div>

                {/* Comparison Values */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {/* Week 1 */}
                  <div className="text-center">
                    <div className="text-white/60 text-xs mb-1">Week {compareWeek1}</div>
                    <div className="text-white text-lg font-bold">
                      {value1 !== undefined ? `${value1.toFixed(1)}${field.unit}` : '--'}
                    </div>
                  </div>

                  {/* Difference */}
                  <div className="text-center">
                    <div className="text-white/60 text-xs mb-1">Change</div>
                    <div className={`text-lg font-bold ${
                      isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {hasData ? `${isPositive ? '+' : ''}${change.toFixed(1)}${field.unit}` : '--'}
                    </div>
                  </div>

                  {/* Week 2 */}
                  <div className="text-center">
                    <div className="text-white/60 text-xs mb-1">Week {compareWeek2}</div>
                    <div className="text-white text-lg font-bold">
                      {value2 !== undefined ? `${value2.toFixed(1)}${field.unit}` : '--'}
                    </div>
                  </div>
                </div>

                {/* Insight Comment */}
                {hasData && (
                  <div className="bg-gradient-to-r from-[#dc1e3a]/10 to-transparent border-l-2 border-[#dc1e3a] px-3 py-2 rounded">
                    <p className="text-white/90 text-sm">{comment}</p>
                  </div>
                )}

                {/* No Data Message */}
                {!hasData && (
                  <div className="text-center py-2">
                    <p className="text-gray-500 text-sm">No data for one or both weeks</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Input Form - Compact */}
      <div className="bg-gray-900 backdrop-blur-xl border border-gray-700 rounded-2xl p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg md:text-xl font-bold text-white">Week {currentWeek} Measurements</h3>
            <p className="text-white/60 text-xs md:text-sm">Enter measurements in cm</p>
          </div>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-[#dc1e3a] hover:bg-[#dc1e3a]/90 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-300 text-sm"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span className="hidden md:inline">Save</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Body Fat % */}
          <div>
            <label className="block text-white/80 text-xs font-medium mb-1.5">Body Fat %</label>
            <input
              type="number"
              step="0.1"
              value={currentMeasurement.bodyFatPercentage || ''}
              onChange={(e) => handleInputChange('bodyFatPercentage', e.target.value)}
              placeholder="18.5"
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#dc1e3a] transition-colors"
            />
          </div>

          {/* Neck */}
          <div>
            <label className="block text-white/80 text-xs font-medium mb-1.5">Neck (cm)</label>
            <input
              type="number"
              step="0.1"
              value={currentMeasurement.neck || ''}
              onChange={(e) => handleInputChange('neck', e.target.value)}
              placeholder="38.5"
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#dc1e3a] transition-colors"
            />
          </div>

          {/* Waist */}
          <div>
            <label className="block text-white/80 text-xs font-medium mb-1.5">Waist (cm)</label>
            <input
              type="number"
              step="0.1"
              value={currentMeasurement.waist || ''}
              onChange={(e) => handleInputChange('waist', e.target.value)}
              placeholder="82.0"
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#dc1e3a] transition-colors"
            />
          </div>

          {/* Hips */}
          <div>
            <label className="block text-white/80 text-xs font-medium mb-1.5">Hips (cm)</label>
            <input
              type="number"
              step="0.1"
              value={currentMeasurement.hips || ''}
              onChange={(e) => handleInputChange('hips', e.target.value)}
              placeholder="95.0"
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#dc1e3a] transition-colors"
            />
          </div>
        </div>

        {/* Notes - Compact */}
        <div className="mt-4">
          <label className="block text-white/80 text-xs font-medium mb-1.5">Notes (optional)</label>
          <textarea
            value={currentMeasurement.notes || ''}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Add any notes about your measurements..."
            rows={2}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#dc1e3a] transition-colors resize-none"
          />
        </div>
      </div>

      {/* Week-to-Week Comparison Tool */}
      <div className="bg-gray-900 backdrop-blur-xl border border-gray-700 rounded-2xl p-4 md:p-6">
        <div className="mb-6">
          <h3 className="text-lg md:text-xl font-bold text-white">📊 Week Comparison Tool</h3>
          <p className="text-white/60 text-xs md:text-sm">Compare any two weeks to track your progress</p>
        </div>
        {renderMeasurementComparison()}
      </div>
    </div>
  );
};

