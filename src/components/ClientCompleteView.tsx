import React, { useState } from 'react';
import { 
  Utensils, 
  Dumbbell, 
  User,
  Calendar,
  Target,
  Download,
  Share2,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  CheckCircle,
  Plus,
  Minus,
  Zap,
  BarChart3,
  Scale,
  TrendingUp,
  Activity
} from 'lucide-react';
import ClientInterface from './ClientInterface';
import { Client } from '../types';

interface ClientCompleteViewProps {
  clientView: {
    clientName: string;
    clientId: string;
    nutritionPlan?: any;
    workoutAssignment?: any;
    weightLog: any[];
    goal: string;
    numberOfWeeks: number;
    isReadOnly: boolean;
    canEditRepsWeights: boolean;
    features: {
      nutrition: boolean;
      workout: boolean;
      weightJournal: boolean;
      progressTracking: boolean;
    };
  };
  isDark: boolean;
}

export const ClientCompleteView: React.FC<ClientCompleteViewProps> = ({
  clientView,
  isDark
}) => {
  console.log('ClientCompleteView - clientView data:', clientView);
  // Convert clientView data to Client object format
  const client: Client = {
    id: clientView.clientId,
    name: clientView.clientName,
    email: `${clientView.clientName.toLowerCase().replace(' ', '.')}@example.com`,
    phone: '+1234567890',
    age: 30,
    gender: 'other',
    height: 175,
    weight: 75,
    goal: clientView.goal,
    numberOfWeeks: clientView.numberOfWeeks,
    startDate: new Date(),
    notes: 'Client program shared via link',
    weightLog: clientView.weightLog || [],
    favorites: [],
    nutritionPlan: clientView.nutritionPlan || null,
    workoutAssignment: clientView.workoutAssignment || null
  };

  return (
    <ClientInterface
      client={client}
          isDark={isDark}
      onBack={() => window.history.back()}
    />
  );
};




