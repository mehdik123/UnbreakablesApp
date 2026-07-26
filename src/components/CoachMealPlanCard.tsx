import React from 'react';
import {
  Save,
  Edit3,
  Trash2,
  Camera,
  Plus,
  ChevronDown,
  CheckCircle,
  X,
  Flame,
  Target,
  TrendingUp,
  Shield,
  List,
  BookOpen,
} from 'lucide-react';
import { SelectedMeal } from '../types';
import { formatPortionAnnotation } from '../utils/portionAnnotations';

export type CoachMealPlanCardProps = {
  selectedMeal: SelectedMeal;
  slotId: string;
  mealName: string;
  category: string;
  imageUrl: string;
  nutrition: { calories: number; protein: number; carbs: number; fat: number };
  isIngredientsExpanded: boolean;
  isInstructionsExpanded: boolean;
  editingMealName: boolean;
  tempMealName: string;
  setTempMealName: (v: string) => void;
  onMealNameEdit: () => void;
  onMealNameSave: () => void;
  onMealNameCancel: () => void;
  onSaveToLibrary: () => void;
  onEditPortions: () => void;
  onRemoveMeal: () => void;
  onToggleIngredients: () => void;
  onToggleInstructions: () => void;
  onAddIngredient: () => void;
  onIngredientNameClick: (idx: number) => void;
  onIngredientQuantityChange: (idx: number, qty: number) => void;
  onRemoveIngredient: (idx: number) => void;
  onInstructionsChange: (value: string) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPhotoClick: () => void;
  fileInputRef: (el: HTMLInputElement | null) => void;
  inputKey: string;
};

/**
 * Presentation-only coach meal card.
 * All persistence / plan mutations stay in UltraModernNutritionEditor handlers.
 */
export const CoachMealPlanCard: React.FC<CoachMealPlanCardProps> = ({
  selectedMeal,
  mealName,
  category,
  imageUrl,
  nutrition,
  isIngredientsExpanded,
  isInstructionsExpanded,
  editingMealName,
  tempMealName,
  setTempMealName,
  onMealNameEdit,
  onMealNameSave,
  onMealNameCancel,
  onSaveToLibrary,
  onEditPortions,
  onRemoveMeal,
  onToggleIngredients,
  onToggleInstructions,
  onAddIngredient,
  onIngredientNameClick,
  onIngredientQuantityChange,
  onRemoveIngredient,
  onInstructionsChange,
  onImageUpload,
  onPhotoClick,
  fileInputRef,
}) => {
  const qty = selectedMeal.quantity || 1;
  const ingredients = selectedMeal.meal.ingredients || [];

  return (
    <article className="coach-meal-card">
      <div className="coach-meal-card-top">
        <div className="coach-meal-card-media">
          <img src={imageUrl} alt={mealName} />
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={onImageUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={onPhotoClick}
            className="coach-meal-photo-btn"
            title="Change photo"
          >
            <Camera className="w-4 h-4" />
            <span className="coach-meal-btn-label">Photo</span>
          </button>
        </div>

        <div className="coach-meal-card-main">
          <div className="coach-meal-headline">
            <div className="min-w-0 flex-1">
              {editingMealName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempMealName}
                    onChange={(e) => setTempMealName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onMealNameSave();
                      if (e.key === 'Escape') onMealNameCancel();
                    }}
                    className="coach-meal-name-input"
                    autoFocus
                  />
                  <button type="button" onClick={onMealNameSave} className="coach-icon-ok" title="Save name">
                    <CheckCircle className="w-5 h-5" />
                  </button>
                  <button type="button" onClick={onMealNameCancel} className="coach-icon-cancel" title="Cancel">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <h4
                  onClick={onMealNameEdit}
                  className="coach-meal-title"
                  title="Click to rename"
                >
                  {mealName}
                </h4>
              )}
              <span className="coach-meal-slot-tag capitalize">{category || 'meal'}</span>
            </div>

            <div className="coach-meal-macros">
              <div className="coach-macro">
                <Flame className="w-3.5 h-3.5" style={{ color: 'var(--orange)' }} />
                <span className="tnum font-display font-bold">{Math.round(nutrition.calories * qty)}</span>
                <span className="lbl">kcal</span>
              </div>
              <div className="coach-macro">
                <Target className="w-3.5 h-3.5" style={{ color: 'var(--blue)' }} />
                <span className="tnum font-display font-bold">{Math.round(nutrition.protein * qty)}g</span>
                <span className="lbl">protein</span>
              </div>
              <div className="coach-macro coach-macro--muted">
                <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--green)' }} />
                <span className="tnum font-display font-bold">{Math.round(nutrition.carbs * qty)}g</span>
                <span className="lbl">carbs</span>
              </div>
              <div className="coach-macro coach-macro--muted">
                <Shield className="w-3.5 h-3.5" style={{ color: 'var(--violet)' }} />
                <span className="tnum font-display font-bold">{Math.round(nutrition.fat * qty)}g</span>
                <span className="lbl">fat</span>
              </div>
            </div>
          </div>

          <div className="coach-meal-actions">
            <button
              type="button"
              onClick={onSaveToLibrary}
              className="coach-act coach-act--green"
              title="Save this edited version as a NEW meal in the library. The original meal is never changed."
            >
              <Save className="w-4 h-4" />
              <span className="coach-meal-btn-label">Save as new meal</span>
            </button>
            <button type="button" onClick={onEditPortions} className="coach-act coach-act--blue" title="Focus ingredient portion editing">
              <Edit3 className="w-4 h-4" />
              <span className="coach-meal-btn-label">Edit portions</span>
            </button>
            <button type="button" onClick={onRemoveMeal} className="coach-act coach-act--red" title="Remove this meal from the plan">
              <Trash2 className="w-4 h-4" />
              <span className="coach-meal-btn-label">Remove</span>
            </button>
          </div>
        </div>
      </div>

      <div className="coach-meal-section">
        <div className="coach-meal-section-head">
          <button type="button" onClick={onToggleIngredients} className="coach-section-toggle">
            <List className="w-4 h-4" style={{ color: 'var(--green)' }} />
            <span>Ingredients</span>
            <span className="coach-count">{ingredients.length}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isIngredientsExpanded ? 'rotate-180' : ''}`} />
          </button>
          <button type="button" onClick={onAddIngredient} className="coach-act coach-act--green coach-act--sm" title="Add ingredient">
            <Plus className="w-4 h-4" />
            <span className="coach-meal-btn-label">Add</span>
          </button>
        </div>

        {isIngredientsExpanded && (
          <div className="coach-ing-table">
            <div className="coach-ing-head">
              <span>Food</span>
              <span>Per 100g</span>
              <span>Portion</span>
              <span>kcal</span>
              <span />
            </div>
            {ingredients.map((ingredient, idx) => {
              const grams = ingredient.quantity;
              const lineKcal = Math.round((ingredient.food.kcal * grams) / 100 * qty);
              const portionNote = formatPortionAnnotation(ingredient.food.name, grams);
              return (
                <div key={`${selectedMeal.id}-ing-${idx}`} className="coach-ing-row">
                  <button
                    type="button"
                    className="coach-ing-name"
                    onClick={() => onIngredientNameClick(idx)}
                    title="Tap to replace this food"
                  >
                    <span className="coach-ing-name-text">{ingredient.food.name}</span>
                    {portionNote && (
                      <span className="coach-ing-portion-note">{portionNote}</span>
                    )}
                  </button>
                  <span className="coach-ing-meta tnum">{ingredient.food.kcal} kcal</span>
                  <div className="coach-ing-portion" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step={0.1}
                      value={grams}
                      onChange={(e) => onIngredientQuantityChange(idx, parseFloat(e.target.value) || 0)}
                      className="coach-ing-input"
                    />
                    <span>g</span>
                  </div>
                  <span className="coach-ing-kcal tnum">{lineKcal}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveIngredient(idx)}
                    className="coach-ing-del"
                    title="Remove ingredient"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
            {ingredients.length === 0 && (
              <p className="coach-ing-empty">No ingredients yet. Tap Add.</p>
            )}
          </div>
        )}
      </div>

      <div className="coach-meal-section">
        <button type="button" onClick={onToggleInstructions} className="coach-section-toggle w-full">
          <BookOpen className="w-4 h-4" style={{ color: 'var(--violet)' }} />
          <span>How to cook</span>
          <ChevronDown className={`w-4 h-4 ms-auto transition-transform ${isInstructionsExpanded ? 'rotate-180' : ''}`} />
        </button>
        {isInstructionsExpanded && (
          <textarea
            value={selectedMeal.meal.cookingInstructions || ''}
            onChange={(e) => onInstructionsChange(e.target.value)}
            className="coach-cook-area"
            rows={3}
            placeholder="Cooking notes for this meal…"
          />
        )}
      </div>
    </article>
  );
};

export default CoachMealPlanCard;
