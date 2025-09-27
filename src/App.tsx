import { useState, useEffect, Suspense, lazy } from 'react';
import { ModernLoadingScreen } from './components/ModernLoadingScreen';

// Lazy load heavy components
const UnbreakableSteamClientsManager = lazy(() => import('./components/UnbreakableSteamClientsManager').then(module => ({ default: module.UnbreakableSteamClientsManager })));
const ModernClientPlanView = lazy(() => import('./components/ModernClientPlanView').then(module => ({ default: module.ModernClientPlanView })));
const ClientCompleteView = lazy(() => import('./components/ClientCompleteView').then(module => ({ default: module.ClientCompleteView })));
// const ClientInterface = lazy(() => import('./components/ClientInterface').then(module => ({ default: module.ClientInterface })));
const ModernClientInterface = lazy(() => import('./components/ModernClientInterface').then(module => ({ default: module.ModernClientInterface })));
const MealDatabaseManager = lazy(() => import('./components/MealDatabaseManager'));
const IngredientsManager = lazy(() => import('./components/IngredientsManager'));
const ExerciseDatabaseManager = lazy(() => import('./components/ExerciseDatabaseManager').then(module => ({ default: module.ExerciseDatabaseManager })));
// const SimpleWorkoutEditor = lazy(() => import('./components/SimpleWorkoutEditor').then(module => ({ default: module.SimpleWorkoutEditor })));
const TemplatesBuilder = lazy(() => import('./components/TemplatesBuilder'));
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
import { supabase, isSupabaseReady } from './lib/supabaseClient';
import { dbListClients, dbListClientsWithWorkoutAssignments, dbAddClient, dbUpdateClient, dbDeleteClient, dbListExercises, dbAddExercise, dbUpdateExercise, dbDeleteExercise, dbCreateWorkoutAssignment, dbUpdateWorkoutAssignment, dbGetClientWorkoutAssignment } from './lib/db';

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

  // Load real food database and exercises from database
  useEffect(() => {
    const loadDatabase = async () => {
      try {
        const realFoods = await loadFoodDatabase();
        if (realFoods.length > 0) {
          setFoods(realFoods);
        }
      } catch (error) {

      }

      // Load exercises from database
      if (isSupabaseReady) {
        try {
          const { data: dbExercises, error } = await dbListExercises();
          if (error) {
            console.error('Error loading exercises from database:', error);
          } else if (dbExercises && dbExercises.length > 0) {

            const mappedExercises = dbExercises.map((r: any) => ({ 
              id: r.id, 
              name: r.name, 
              muscleGroup: r.muscle_group || '', 
              equipment: '', 
              instructions: '', 
              videoUrl: r.video_url, 
              imageUrl: '', 
              difficulty: 'beginner' as const, 
              category: 'strength' as const, 
              primaryMuscles: [], 
              secondaryMuscles: [], 
              createdAt: new Date(), 
              updatedAt: new Date() 
            }));
            setExercises(mappedExercises);

          } else {

            // Populate database with static exercises
            try {
              for (const exercise of defaultExercises) {
                await dbAddExercise({
                  name: exercise.name,
                  video_url: exercise.videoUrl || '',
                  muscle_group: exercise.muscleGroup || ''
                });
              }

              
              // Reload exercises from database
              const { data: reloadedExercises } = await dbListExercises();
              if (reloadedExercises && reloadedExercises.length > 0) {
                const mappedExercises = reloadedExercises.map((r: any) => ({ 
                  id: r.id, 
                  name: r.name, 
                  muscleGroup: r.muscle_group || '', 
                  equipment: '', 
                  instructions: '', 
                  videoUrl: r.video_url, 
                  imageUrl: '', 
                  difficulty: 'beginner' as const, 
                  category: 'strength' as const, 
                  primaryMuscles: [], 
                  secondaryMuscles: [], 
                  createdAt: new Date(), 
                  updatedAt: new Date() 
                }));
                setExercises(mappedExercises);

              }
            } catch (populateError) {
              console.error('Error populating exercises database:', populateError);
            }
          }
        } catch (error) {
          console.error('Error loading exercises from database:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    
    loadDatabase();

    // Handle client share URLs first
    const urlParams = new URLSearchParams(window.location.search);
    const clientShareId = urlParams.get('client');
    
    // Load clients and handle share URLs
    (async () => {
      let clients: Client[] = [];
      
      // Load clients from Supabase if available; fallback to localStorage
      if (isSupabaseReady) {
        const { data, error } = await dbListClientsWithWorkoutAssignments();
        
        if (data && data.length > 0) {
          clients = await Promise.all(data.map(async (row: any) => {
            
            // Map workout assignment data
            let workoutAssignment: ClientWorkoutAssignment | undefined = undefined;
            if (row.workout_assignments && row.workout_assignments.length > 0) {
              const assignment = row.workout_assignments[0]; // Get the first active assignment
              
              // Enrich the program with muscle groups from the database
              let enrichedProgram = assignment.program_json;
              
              if (enrichedProgram && enrichedProgram.days && supabase) {
                try {
                  const { data: dbExercises } = await supabase
                    .from('exercises')
                    .select('name, video_url, muscle_group');
                  
                  if (dbExercises) {
                    const exerciseMap = new Map();
                    dbExercises.forEach((ex: any) => {
                      exerciseMap.set(ex.name, ex);
                    });
                    
                    enrichedProgram = {
                      ...enrichedProgram,
                      days: enrichedProgram.days.map((day: any) => ({
                        ...day,
                        exercises: day.exercises?.map((workoutEx: any) => {
                          const dbExercise = exerciseMap.get(workoutEx.exercise?.name);
                          if (dbExercise) {
                            return {
                              ...workoutEx,
                              exercise: {
                                ...workoutEx.exercise,
                                videoUrl: dbExercise.video_url,
                                muscleGroup: dbExercise.muscle_group
                              }
                            };
                          }
                          return workoutEx;
                        }) || []
                      })) || []
                    };
                    
                  }
                } catch (error) {
                  console.error('❌ Failed to enrich program with muscle groups:', error);
                }
              }
              
              workoutAssignment = {
                id: assignment.id,
                clientId: row.id,
                clientName: row.full_name,
                startDate: new Date(assignment.start_date),
                duration: assignment.duration_weeks,
                currentWeek: assignment.current_week || 1,
                currentDay: assignment.current_day || 1,
                program: enrichedProgram,
                weeks: enrichedProgram?.weeks || [],
                progressionRules: enrichedProgram?.progressionRules || [],
                isActive: assignment.is_active,
                lastModifiedBy: assignment.last_modified_by
              };
              
              console.log('🔍 APP DEBUG - Mapped workout assignment:', {
                id: workoutAssignment.id,
                hasProgram: !!workoutAssignment.program,
                programName: workoutAssignment.program?.name,
                weeksCount: workoutAssignment.weeks?.length || 0
              });
            }
            
            return {
              id: row.id,
              name: row.full_name,
              email: row.email || '',
              phone: row.phone || '',
              goal: row.goal || 'maintenance',
              numberOfWeeks: row.number_of_weeks || 12,
              startDate: new Date(row.start_date || new Date()),
              isActive: row.is_active !== false,
              favorites: row.favorites || [],
              weightLog: row.weight_log || [],
              workoutAssignment
            };
          }));
          
          console.log('🔍 APP DEBUG - Final clients array:', clients.map(c => ({
            id: c.id,
            name: c.name,
            hasWorkoutAssignment: !!c.workoutAssignment,
            programName: c.workoutAssignment?.program?.name
          })));
          
          setAppState(prev => ({ ...prev, clients }));
        } else {

          // Fallback to loading basic clients without workout assignments
          const { data: basicClients } = await dbListClients();
          if (basicClients) {
            clients = basicClients.map((row: any) => ({
              id: row.id,
              name: row.full_name,
              email: row.email || '',
              phone: row.phone || '',
              goal: row.goal || 'maintenance',
              numberOfWeeks: row.number_of_weeks || 12,
              startDate: new Date(row.start_date || new Date()),
              isActive: row.is_active !== false,
              favorites: row.favorites || [],
              weightLog: row.weight_log || []
            }));
            setAppState(prev => ({ ...prev, clients }));
          }
        }
      } else {
        const savedClients = localStorage.getItem('clients');
        if (savedClients) {
          try {
            clients = JSON.parse(savedClients).map((client: any) => ({
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
      }
      
      // Handle client share URL after clients are loaded
      if (clientShareId) {
        // Extract client ID from share ID (format: "name-uuid" where uuid has dashes)
        // For UUID format: el-mehdi-kamal-c621ad4e-4643-496b-a9da-95a0d3d6b7ef
        // We need to extract: c621ad4e-4643-496b-a9da-95a0d3d6b7ef
        const uuidPattern = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
        const uuidMatch = clientShareId.match(uuidPattern);
        const extractedClientId = uuidMatch ? uuidMatch[1] : clientShareId;
        

        
        // Find client in loaded data
        const foundClient = clients.find((c: any) => c.id === extractedClientId);
        
        if (foundClient) {

          setAppState(prev => ({ 
            ...prev, 
            currentView: 'client-interface',
            selectedClient: foundClient
          }));
        } else {
          console.error('❌ Client not found for share ID:', clientShareId);

          // Fallback to clients view if client not found
          setAppState(prev => ({ ...prev, currentView: 'clients' }));
        }
      }
    })();
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
  const handleAddClient = async (client: Client) => {
    if (isSupabaseReady) {
      const { data } = await dbAddClient({ 
        full_name: client.name,
        number_of_weeks: client.numberOfWeeks,
        goal: client.goal,
        email: client.email,
        phone: client.phone,
        start_date: client.startDate.toISOString().split('T')[0],
        is_active: client.isActive,
        favorites: client.favorites,
        weight_log: client.weightLog
      });
      if (data) {
        const mapped: Client = { ...client, id: data.id };
        setAppState(prev => ({ ...prev, clients: [...prev.clients, mapped] }));
      }
    } else {
      const newClients = [...appState.clients, client];
      setAppState(prev => ({ ...prev, clients: newClients }));
      localStorage.setItem('clients', JSON.stringify(newClients));
    }
  };

  const handleUpdateClient = async (clientId: string, updates: Partial<Client>) => {
    if (isSupabaseReady) {
      if (updates.name) await dbUpdateClient(clientId, { full_name: updates.name });
    }
    const updatedClients = appState.clients.map(client => client.id === clientId ? { ...client, ...updates } : client);
    setAppState(prev => ({ ...prev, clients: updatedClients }));
    if (!isSupabaseReady) localStorage.setItem('clients', JSON.stringify(updatedClients));
  };

  const handleDeleteClient = async (clientId: string) => {
    if (isSupabaseReady) await dbDeleteClient(clientId);
    const filteredClients = appState.clients.filter(client => client.id !== clientId);
    setAppState(prev => ({ ...prev, clients: filteredClients }));
    if (!isSupabaseReady) localStorage.setItem('clients', JSON.stringify(filteredClients));
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
  const handleAssignWorkoutPlan = async (clientId: string, assignment: ClientWorkoutAssignment) => {
    try {

      
      // Initialize weeks array if it doesn't exist
      let weeksArray = assignment.weeks || [];



      if (weeksArray.length === 0) {

        weeksArray = Array.from({ length: assignment.duration }, (_, index) => ({
          weekNumber: index + 1,
          isUnlocked: index === 0, // Only week 1 is unlocked by default
          isCompleted: false,
          exercises: [],
          days: []
        }));
      }
      
      let assignmentResult;
      let error;
      
      // Check if assignment already exists in database
      const existingAssignment = await dbGetClientWorkoutAssignment(clientId);
      




      
      if (existingAssignment?.data && existingAssignment.data.id) {

        console.log('🔄 Assignment data being sent:', {
          assignmentId: existingAssignment.data.id,
          currentWeek: assignment.currentWeek,
          weeksArray: weeksArray,
          programData: assignment.program,
          hasWeeks: !!assignment.weeks,
          weeksLength: assignment.weeks?.length
        });
        
        const programJsonToSave = {
          ...assignment.program,
          weeks: weeksArray
        };
        


        
        // Update existing assignment
        const updateResult = await dbUpdateWorkoutAssignment(existingAssignment.data.id, {
          program_json: programJsonToSave,
          current_week: assignment.currentWeek,
          current_day: assignment.currentDay,
          last_modified_by: 'coach'
        });
        assignmentResult = updateResult.data;
        error = updateResult.error;
      } else {

        console.log('🆕 Assignment data being sent:', {
          clientId: clientId,
          currentWeek: assignment.currentWeek,
          weeksArray: weeksArray,
          programData: assignment.program,
          hasWeeks: !!assignment.weeks,
          weeksLength: assignment.weeks?.length
        });
        
        const programJsonToSave = {
          ...assignment.program,
          weeks: weeksArray
        };
        



        
        // Create new assignment
        const createResult = await dbCreateWorkoutAssignment({
          client_id: clientId,
          program_id: assignment.program?.id,
          program_json: programJsonToSave,
          duration_weeks: assignment.duration,
          current_week: assignment.currentWeek,
          current_day: assignment.currentDay,
          is_active: true,
          last_modified_by: 'coach'
        });
        assignmentResult = createResult.data;
        error = createResult.error;
      }
      
      if (error) {
        console.error('❌ Failed to save workout assignment to Supabase:', error);
        alert(`Error assigning workout: ${error.message}`);
        return;
      }
      



      
      // Add timestamp to track when the assignment was made
      const assignmentWithTimestamp = {
        ...assignment,
        weeks: weeksArray, // Include the initialized weeks array
        id: assignmentResult?.id || assignment.id,
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
      
    } catch (err) {
      console.error('❌ Failed to assign workout plan:', err as Error);
      alert(`Failed to assign workout plan: ${(err as Error).message || err}`);
    }
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
  const handleUpdateExercises = async (updatedExercises: Exercise[]) => {
    if (isSupabaseReady) {
      // diff with current exercises state
      const prevById = new Map(exercises.map(e => [e.id, e]));
      const nextById = new Map(updatedExercises.map(e => [e.id, e]));
      // deletes
      for (const [id] of prevById) {
        if (!nextById.has(id)) await dbDeleteExercise(id);
      }
      // upserts
      for (const ex of updatedExercises) {
        if (!prevById.has(ex.id) || ex.id.length < 10) {
          await dbAddExercise({ name: ex.name, video_url: (ex as any).videoUrl || (ex as any).video_url, muscle_group: (ex as any).muscleGroup || (ex as any).muscle_group });
        } else {
          await dbUpdateExercise(ex.id, { name: ex.name, video_url: (ex as any).videoUrl || (ex as any).video_url, muscle_group: (ex as any).muscleGroup || (ex as any).muscle_group });
        }
      }
      const { data } = await dbListExercises();
      if (data) setExercises(data.map((r: any) => ({ id: r.id, name: r.name, muscleGroup: r.muscle_group || '', equipment: '', instructions: '', videoUrl: r.video_url, imageUrl: '', difficulty: 'beginner', category: 'strength', primaryMuscles: [], secondaryMuscles: [], createdAt: new Date(), updatedAt: new Date() })));
    } else {
      setExercises(updatedExercises);
      localStorage.setItem('exercises', JSON.stringify(updatedExercises));
    }
  };

  const handleNavigateToExerciseDatabase = () => {
    setAppState(prev => ({ ...prev, currentView: 'exercise-database' }));
  };

  const handleBackFromExerciseDatabase = () => {
    setAppState(prev => ({ ...prev, currentView: 'clients' }));
  };

  const handleNavigateToIngredients = () => {
    setAppState(prev => ({ ...prev, currentView: 'ingredients' }));
  };

  if (isLoading) {
    return <ModernLoadingScreen message="Loading UnbreakableSteam..." />;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="relative z-10">
        <Suspense fallback={<ModernLoadingScreen message="Loading component..." />}>
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
              onNavigateToIngredients={handleNavigateToIngredients}
              onNavigateToTemplates={() => setAppState(prev => ({ ...prev, currentView: 'templates' }))}
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

        {appState.currentView === 'client-interface' && appState.selectedClient && (
          <ModernClientInterface
            client={appState.selectedClient}
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
            onUpdateMeals={handleUpdateMeals}
            onBack={handleBackFromMealDatabase}
          />
        )}

        {appState.currentView === 'ingredients' && (
          <IngredientsManager onBack={() => setAppState(prev => ({ ...prev, currentView: 'clients' }))} />
        )}

        {appState.currentView === 'exercise-database' && (
          <ExerciseDatabaseManager
            onBack={handleBackFromExerciseDatabase}
          />
        )}

        {appState.currentView === 'templates' && (
          <TemplatesBuilder
            onBack={() => setAppState(prev => ({ ...prev, currentView: 'clients' }))}
          />
        )}
        </Suspense>
      </div>
    </div>
  );
}

export default App;
