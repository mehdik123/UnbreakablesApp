import { useState, useEffect } from 'react';
import { UnbreakableSteamClientsManager } from './components/UnbreakableSteamClientsManager';
import { ModernClientPlanView } from './components/ModernClientPlanView';
import { ClientCompleteView } from './components/ClientCompleteView';
import { ModernLoadingScreen } from './components/ModernLoadingScreen';
import MealDatabaseManager from './components/MealDatabaseManager';
import { ExerciseDatabaseManager } from './components/ExerciseDatabaseManager';
import { SimpleWorkoutEditor } from './components/SimpleWorkoutEditor';
import './styles/mobile.css';
import { 
  AppState, 
  Client, 
  NutritionPlan, 
  ClientWorkoutAssignment,
  Meal,
  Exercise
} from './types';
import { loadFoodDatabase } from './utils/csvParser';
import { foods as defaultFoods } from './data/foods';
import { meals as defaultMeals } from './data/meals';
import { exercises as defaultExercises } from './data/exercises';

function App() {
  const [appState, setAppState] = useState<AppState>({
    currentView: 'clients',
    selectedClient: null,
    clients: [],
    isDark: false
  });
  const [foods, setFoods] = useState(defaultFoods);
  const [meals, setMeals] = useState(defaultMeals);
  const [exercises, setExercises] = useState(defaultExercises);
  const [isLoading, setIsLoading] = useState(true);
  const [clientViewData, setClientViewData] = useState<any>(null);

  // Load real food database and handle shared client views
  useEffect(() => {
    const loadDatabase = async () => {
      try {
        const realFoods = await loadFoodDatabase();
        if (realFoods.length > 0) {
          setFoods(realFoods);
        }
      } catch (error) {
        console.log('Using default food database');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDatabase();

    // Load clients from localStorage
    const savedClients = localStorage.getItem('clients');
    if (savedClients) {
      try {
        const clients = JSON.parse(savedClients).map((client: any) => ({
          ...client,
          startDate: new Date(client.startDate),
          weightLog: client.weightLog?.map((entry: any) => ({
            ...entry,
            date: new Date(entry.date)
          })) || []
        }));
        setAppState(prev => ({ ...prev, clients }));
      } catch (error) {
        console.error('Error loading clients:', error);
      }
    }

    // Handle shared client view URLs
    const urlParams = new URLSearchParams(window.location.search);
    const shareId = urlParams.get('share');
    const clientId = urlParams.get('client');
    const viewType = urlParams.get('type'); // 'nutrition', 'workout', 'plan', or 'complete'
    
    if (shareId && clientId && viewType) {
      try {
        const storageKey = `client_${clientId}_${viewType}_${shareId}`;
        const sharedData = localStorage.getItem(storageKey);
        if (sharedData) {
          const parsed = JSON.parse(sharedData);
          setClientViewData(parsed);
          setAppState(prev => ({ ...prev, currentView: 'client-view' }));
          
        }
      } catch (error) {
        console.error('Error loading shared client view:', error);
      }
    }
  }, []);

  // Set up periodic refresh for client view data
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shareId = urlParams.get('share');
    const clientId = urlParams.get('client');
    const viewType = urlParams.get('type');
    
    if (shareId && clientId && viewType) {
      const storageKey = `client_${clientId}_${viewType}_${shareId}`;
      
      const refreshInterval = setInterval(() => {
        const updatedData = localStorage.getItem(storageKey);
        if (updatedData) {
          try {
            const newParsed = JSON.parse(updatedData);
            setClientViewData((prevData: any) => {
              if (JSON.stringify(newParsed) !== JSON.stringify(prevData)) {
                return newParsed;
              }
              return prevData;
            });
          } catch (error) {
            console.error('Error parsing updated client data:', error);
          }
        }
      }, 2000); // Check every 2 seconds
      
      return () => clearInterval(refreshInterval);
    }
  }, []);

  // Client Management Functions
  const handleAddClient = (client: Client) => {
    const newClients = [...appState.clients, client];
    setAppState(prev => ({ ...prev, clients: newClients }));
    localStorage.setItem('clients', JSON.stringify(newClients));
  };

  const handleUpdateClient = (clientId: string, updates: Partial<Client>) => {
    const updatedClients = appState.clients.map(client => 
      client.id === clientId ? { ...client, ...updates } : client
    );
    setAppState(prev => ({ ...prev, clients: updatedClients }));
    localStorage.setItem('clients', JSON.stringify(updatedClients));
  };

  const handleDeleteClient = (clientId: string) => {
    const filteredClients = appState.clients.filter(client => client.id !== clientId);
    setAppState(prev => ({ ...prev, clients: filteredClients }));
    localStorage.setItem('clients', JSON.stringify(filteredClients));
  };

  const handleArchiveClient = (clientId: string) => {
    const updatedClients = appState.clients.map(client => 
      client.id === clientId ? { ...client, isArchived: true } : client
    );
    setAppState(prev => ({ ...prev, clients: updatedClients }));
    localStorage.setItem('clients', JSON.stringify(updatedClients));
  };

  const handleDuplicateClient = (client: Client) => {
    const duplicatedClient: Client = {
      ...client,
      id: Date.now().toString(),
      name: `${client.name} (Copy)`,
      startDate: new Date(),
      // Duplicate nutrition plan if exists
      nutritionPlan: client.nutritionPlan ? {
        ...client.nutritionPlan,
        id: Date.now().toString() + '_nutrition',
        clientId: Date.now().toString(),
        clientName: `${client.name} (Copy)`,
        createdAt: new Date(),
        updatedAt: new Date()
      } : undefined,
      // Duplicate workout assignment if exists
      workoutAssignment: client.workoutAssignment ? {
        ...client.workoutAssignment,
        id: Date.now().toString() + '_workout',
        clientId: Date.now().toString(),
        clientName: `${client.name} (Copy)`,
        startDate: new Date(),
        weeks: client.workoutAssignment.weeks?.map(week => ({
          ...week,
          days: week.days?.map(day => ({
            ...day,
            exercises: day.exercises?.map((exercise: any) => ({
              ...exercise,
              id: `${exercise.id}_copy_${Date.now()}`
            })) || []
          })) || []
        })) || []
      } : undefined,
      // Reset weight log and favorites
      weightLog: [],
      favorites: []
    };
    
    const newClients = [...appState.clients, duplicatedClient];
    setAppState(prev => ({ ...prev, clients: newClients }));
    localStorage.setItem('clients', JSON.stringify(newClients));
  };

  // Navigation Functions
  const handleNavigateToClientPlan = (client: Client) => {
    setAppState(prev => ({ 
      ...prev, 
      selectedClient: client, 
      currentView: 'client-plan' 
    }));
  };


  // Nutrition Plan Functions
  const handleAssignNutritionPlan = (clientId: string, plan: NutritionPlan) => {
    
    // Add timestamp to track when the plan was assigned
    const planWithTimestamp = {
      ...plan,
      assignedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    
    const updatedClients = appState.clients.map(client => 
      client.id === clientId ? { ...client, nutritionPlan: planWithTimestamp } : client
    );
    
    // Update selected client if it's the same client
    const updatedSelectedClient = appState.selectedClient?.id === clientId 
      ? { ...appState.selectedClient, nutritionPlan: planWithTimestamp }
      : appState.selectedClient;
    
    
    setAppState(prev => ({ 
      ...prev, 
      clients: updatedClients,
      selectedClient: updatedSelectedClient
    }));
    localStorage.setItem('clients', JSON.stringify(updatedClients));
    
    // Also save nutrition plan separately for client interface to load
    localStorage.setItem(`nutrition_plan_${clientId}`, JSON.stringify(planWithTimestamp));
    
    // Update shared data if client has an active share link
    updateClientSharedData(clientId, updatedClients);
  };

  // Workout Assignment Functions
  const handleAssignWorkoutPlan = (clientId: string, assignment: ClientWorkoutAssignment) => {
    
    // Add timestamp to track when the assignment was made
    const assignmentWithTimestamp = {
      ...assignment,
      assignedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    
    const updatedClients = appState.clients.map(client => 
      client.id === clientId ? { ...client, workoutAssignment: assignmentWithTimestamp } : client
    );
    
    // Update selected client if it's the same client
    const updatedSelectedClient = appState.selectedClient?.id === clientId 
      ? { ...appState.selectedClient, workoutAssignment: assignmentWithTimestamp }
      : appState.selectedClient;
    
    
    setAppState(prev => ({ 
      ...prev, 
      clients: updatedClients,
      selectedClient: updatedSelectedClient
    }));
    localStorage.setItem('clients', JSON.stringify(updatedClients));
    
    // Update shared data if client has an active share link
    updateClientSharedData(clientId, updatedClients);
  };

  // Update shared data for existing client links
  const updateClientSharedData = (clientId: string, updatedClients: Client[]) => {
    const client = updatedClients.find(c => c.id === clientId);
    if (!client) return;
    
    // Find all existing shared data keys for this client
    const existingKeys = Object.keys(localStorage).filter(key => 
      key.startsWith(`client_${clientId}_complete_`)
    );
    
    
    // Update each existing shared data entry
    existingKeys.forEach(key => {
      try {
        const existingData = JSON.parse(localStorage.getItem(key) || '{}');
        const updatedSharedData = {
          ...existingData,
          clientName: client.name,
          clientId: client.id,
          nutritionPlan: client.nutritionPlan,
          workoutAssignment: client.workoutAssignment,
          weightLog: client.weightLog,
          goal: client.goal,
          numberOfWeeks: client.numberOfWeeks,
          lastUpdated: new Date().toISOString()
        };
        
        localStorage.setItem(key, JSON.stringify(updatedSharedData));
        console.log('Updated shared data for key:', key, 'with weeks:', updatedSharedData.workoutAssignment?.weeks);
      } catch (error) {
        console.error('Error updating shared data for key:', key, error);
      }
    });
  };

  // Sharing Functions
  const handleShareWithClient = (client: Client) => {
    const shareId = Date.now().toString();
    const shareUrl = `${window.location.origin}${window.location.pathname}?share=${shareId}&client=${client.id}&type=complete`;
    
    // Save combined shared data with all features
    const sharedData = {
      clientName: client.name,
      clientId: client.id,
      nutritionPlan: client.nutritionPlan,
      workoutAssignment: client.workoutAssignment,
      weightLog: client.weightLog,
      goal: client.goal,
      numberOfWeeks: client.numberOfWeeks,
      isReadOnly: true,
      canEditRepsWeights: true,
      features: {
        nutrition: !!client.nutritionPlan,
        workout: !!client.workoutAssignment,
        weightJournal: true,
        progressTracking: true
      }
    };
    
    localStorage.setItem(`client_${client.id}_complete_${shareId}`, JSON.stringify(sharedData));
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert(`Complete Client URL copied to clipboard!\n\nShare this link with ${client.name}:\n${shareUrl}\n\nThey will have access to:\n• Nutrition Plan\n• Workout Plan\n• Weight Journal\n• Progress Tracking`);
    }).catch(() => {
      prompt(`Copy this URL to share with ${client.name}:`, shareUrl);
    });
  };

  // Meal Database Handlers
  const handleUpdateMeals = (updatedMeals: Meal[]) => {
    setMeals(updatedMeals);
    // Save to localStorage
    localStorage.setItem('meals', JSON.stringify(updatedMeals));
  };

  const handleNavigateToMealDatabase = () => {
    setAppState(prev => ({ ...prev, currentView: 'meal-database' }));
  };

  const handleBackFromMealDatabase = () => {
    setAppState(prev => ({ ...prev, currentView: 'clients' }));
  };

  // Exercise Database Handlers
  const handleUpdateExercises = (updatedExercises: Exercise[]) => {
    setExercises(updatedExercises);
    // Save to localStorage
    localStorage.setItem('exercises', JSON.stringify(updatedExercises));
  };

  const handleNavigateToExerciseDatabase = () => {
    setAppState(prev => ({ ...prev, currentView: 'exercise-database' }));
  };

  const handleBackFromExerciseDatabase = () => {
    setAppState(prev => ({ ...prev, currentView: 'clients' }));
  };

  if (isLoading) {
    return <ModernLoadingScreen message="Loading UnbreakableSteam..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="relative z-10">
        {appState.currentView === 'clients' && (
          <UnbreakableSteamClientsManager
              isDark={appState.isDark}
              clients={appState.clients}
              onAddClient={handleAddClient}
              onUpdateClient={handleUpdateClient}
              onDeleteClient={handleDeleteClient}
              onArchiveClient={handleArchiveClient}
              onAssignNutritionPlan={handleAssignNutritionPlan}
              onAssignWorkoutPlan={handleAssignWorkoutPlan}
              onShareWithClient={handleShareWithClient}
              onNavigateToClientPlan={handleNavigateToClientPlan}
              onDuplicateClient={handleDuplicateClient}
              onNavigateToMealDatabase={handleNavigateToMealDatabase}
              onNavigateToExerciseDatabase={handleNavigateToExerciseDatabase}
            />
        )}

        {appState.currentView === 'client-plan' && appState.selectedClient && (
          <ModernClientPlanView
            client={appState.selectedClient}
            foods={foods}
            meals={meals}
            onBack={() => setAppState(prev => ({ ...prev, currentView: 'clients', selectedClient: null }))}
            onSaveNutritionPlan={handleAssignNutritionPlan}
            onSaveWorkoutPlan={handleAssignWorkoutPlan}
            onAssignWorkout={handleAssignWorkoutPlan}
            isDark={appState.isDark}
          />
        )}

        {appState.currentView === 'client-view' && clientViewData && (
          <ClientCompleteView
            clientView={clientViewData as any}
            isDark={appState.isDark}
          />
        )}

        {appState.currentView === 'client-view' && !clientViewData && (
          <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                Loading Client Data...
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Please wait while we load your program.
              </p>
            </div>
          </div>
        )}

        {appState.currentView === 'meal-database' && (
          <MealDatabaseManager
            meals={meals}
            onUpdateMeals={handleUpdateMeals}
            onBack={handleBackFromMealDatabase}
          />
        )}

        {appState.currentView === 'exercise-database' && (
          <ExerciseDatabaseManager
            exercises={exercises}
            onUpdateExercises={handleUpdateExercises}
            onBack={handleBackFromExerciseDatabase}
            isDark={appState.isDark}
          />
        )}
      </div>
    </div>
  );
}

export default App;