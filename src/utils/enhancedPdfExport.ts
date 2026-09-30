import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { MealSlot, SelectedMeal, Ingredient } from '../types';
import { calculateMealNutrition } from './nutritionCalculator';
import { getEffectiveSelectedMeal } from './mealSlotOverrides';
import { formatIngredientQuantityLabel } from './portionAnnotations';

interface PDFExportOptions {
  clientName: string;
  mealSlots: MealSlot[];
  totalNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getMealIngredients(sm: SelectedMeal): Ingredient[] {
  if (Array.isArray(sm.customIngredients) && sm.customIngredients.length > 0) {
    return sm.customIngredients;
  }
  return sm.meal?.ingredients || [];
}

function ingredientLineCalories(ing: Ingredient): number {
  const qty = Number(ing.quantity) || 0;
  const kcal = Number(ing.food?.kcal) || 0;
  return Math.round((kcal * qty) / 100);
}

export const exportEnhancedNutritionPDF = async (options: PDFExportOptions) => {
  const { clientName, mealSlots, totalNutrition } = options;
  let tempContainer: HTMLDivElement | null = null;

  try {
    tempContainer = document.createElement('div');
    tempContainer.setAttribute('data-nutrition-pdf', '1');
    // Keep on-screen but invisible — off-canvas (-9999px) often yields blank captures
    Object.assign(tempContainer.style, {
      position: 'fixed',
      left: '0',
      top: '0',
      width: '800px',
      padding: '40px',
      backgroundColor: '#ffffff',
      color: '#333333',
      fontFamily: 'Inter, Arial, sans-serif',
      zIndex: '0',
      pointerEvents: 'none',
      boxSizing: 'border-box',
      // Keep painted for html2canvas but off-screen
      transform: 'translateY(-12000px)',
    });

    const safeName = escapeHtml(clientName || 'Client');
    const generatedOn = new Date().toLocaleDateString();

    const header = document.createElement('div');
    header.innerHTML = `
      <div style="text-align:center;margin-bottom:30px;border-bottom:3px solid #dc2626;padding-bottom:20px;">
        <h1 style="color:#dc2626;font-size:32px;margin:0;font-weight:bold;">Unbreakables</h1>
        <p style="color:#666;font-size:16px;margin:10px 0 0 0;">Professional Nutrition Coaching</p>
        <div style="margin-top:12px;display:inline-block;padding:6px 14px;border:1px solid #dc2626;border-radius:999px;color:#dc2626;font-weight:600;">
          Prepared for ${safeName}
        </div>
        <p style="color:#666;font-size:14px;margin:10px 0 0 0;">Generated on: ${generatedOn}</p>
      </div>
    `;
    tempContainer.appendChild(header);

    const summary = document.createElement('div');
    summary.innerHTML = `
      <div style="background:#f3f4f6;border-radius:12px;padding:20px;margin-bottom:30px;">
        <h2 style="color:#dc2626;font-size:20px;margin:0 0 15px 0;">Daily Nutrition Summary</h2>
        <p style="margin:0 0 12px 0;color:#6b7280;font-size:12px;">
          Totals use the first meal option in each slot (what the client sees first).
        </p>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:15px;">
          <div style="text-align:center;">
            <div style="font-size:24px;font-weight:bold;color:#dc2626;">${Math.round(totalNutrition.calories || 0)}</div>
            <div style="font-size:12px;color:#666;text-transform:uppercase;">Calories</div>
          </div>
          <div style="text-align:center;">
            <div style="font-size:24px;font-weight:bold;color:#3b82f6;">${Math.round(totalNutrition.protein || 0)}g</div>
            <div style="font-size:12px;color:#666;text-transform:uppercase;">Protein</div>
          </div>
          <div style="text-align:center;">
            <div style="font-size:24px;font-weight:bold;color:#10b981;">${Math.round(totalNutrition.carbs || 0)}g</div>
            <div style="font-size:12px;color:#666;text-transform:uppercase;">Carbs</div>
          </div>
          <div style="text-align:center;">
            <div style="font-size:24px;font-weight:bold;color:#f59e0b;">${Math.round(totalNutrition.fat || 0)}g</div>
            <div style="font-size:12px;color:#666;text-transform:uppercase;">Fat</div>
          </div>
        </div>
      </div>
    `;
    tempContainer.appendChild(summary);

    const slots = Array.isArray(mealSlots) ? mealSlots : [];
    if (slots.length === 0 || slots.every((s) => !(s.selectedMeals || []).length)) {
      const empty = document.createElement('div');
      empty.innerHTML = `
        <div style="padding:24px;border:1px dashed #d1d5db;border-radius:12px;text-align:center;color:#6b7280;">
          No meals in this plan yet.
        </div>
      `;
      tempContainer.appendChild(empty);
    }

    slots.forEach((slot) => {
      const selectedMeals = Array.isArray(slot.selectedMeals) ? slot.selectedMeals : [];
      if (selectedMeals.length === 0) return;

      const slotSection = document.createElement('div');
      slotSection.style.marginBottom = '36px';

      const slotHeader = document.createElement('div');
      slotHeader.innerHTML = `
        <div style="background:linear-gradient(135deg,#dc2626 0%,#b91c1c 100%);color:#fff;padding:14px 18px;border-radius:10px;margin-bottom:16px;">
          <h2 style="margin:0;font-size:20px;font-weight:bold;">${escapeHtml(slot.name || 'Meal')}</h2>
          ${
            selectedMeals.length > 1
              ? `<p style="margin:6px 0 0 0;font-size:13px;opacity:0.9;">${selectedMeals.length} options — choose one</p>`
              : ''
          }
        </div>
      `;
      slotSection.appendChild(slotHeader);

      selectedMeals.forEach((rawMeal, mealIndex) => {
        const effective = getEffectiveSelectedMeal(rawMeal);
        const nutrition = calculateMealNutrition(effective);
        const mealName = effective.meal?.name || 'Meal';
        const ingredients = getMealIngredients(effective);
        const instructions =
          effective.meal?.cookingInstructions ||
          rawMeal.meal?.cookingInstructions ||
          '';

        const mealDiv = document.createElement('div');
        mealDiv.style.cssText =
          'margin-bottom:20px;padding:18px;border:2px solid #e5e7eb;border-radius:10px;background:#fff;';

        const title =
          selectedMeals.length > 1
            ? `Option ${mealIndex + 1}: ${mealName}`
            : mealName;

        mealDiv.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;padding-bottom:10px;border-bottom:2px solid #fee2e2;">
            <h3 style="margin:0;color:#dc2626;font-size:17px;font-weight:bold;">${escapeHtml(title)}</h3>
            <div style="background:#fee2e2;color:#dc2626;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;white-space:nowrap;">
              ${Math.round(nutrition.kcal || 0)} kcal
            </div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px;padding:12px;background:#f9fafb;border-radius:8px;">
            <div style="text-align:center;">
              <div style="font-size:16px;font-weight:bold;color:#3b82f6;">${Math.round(nutrition.protein || 0)}g</div>
              <div style="font-size:11px;color:#666;">Protein</div>
            </div>
            <div style="text-align:center;">
              <div style="font-size:16px;font-weight:bold;color:#10b981;">${Math.round(nutrition.carbs || 0)}g</div>
              <div style="font-size:11px;color:#666;">Carbs</div>
            </div>
            <div style="text-align:center;">
              <div style="font-size:16px;font-weight:bold;color:#f59e0b;">${Math.round(nutrition.fat || 0)}g</div>
              <div style="font-size:11px;color:#666;">Fat</div>
            </div>
          </div>
          <div style="margin-bottom:${instructions ? '14px' : '0'};">
            <h4 style="color:#374151;font-size:14px;font-weight:600;margin:0 0 8px 0;">Ingredients</h4>
            <ul style="margin:0;padding-left:18px;">
              ${
                ingredients.length
                  ? ingredients
                      .map((ing) => {
                        const foodName = ing.food?.name || 'Ingredient';
                        const qtyLabel = formatIngredientQuantityLabel(foodName, Number(ing.quantity) || 0);
                        return `<li style="margin-bottom:6px;color:#4b5563;font-size:13px;">
                          <strong>${escapeHtml(foodName)}</strong> — ${escapeHtml(qtyLabel)}
                          <span style="color:#9ca3af;">(${ingredientLineCalories(ing)} kcal)</span>
                        </li>`;
                      })
                      .join('')
                  : `<li style="color:#9ca3af;font-size:13px;">No ingredients listed</li>`
              }
            </ul>
          </div>
          ${
            instructions
              ? `<div>
                  <h4 style="color:#374151;font-size:14px;font-weight:600;margin:0 0 8px 0;">Cooking Instructions</h4>
                  <p style="margin:0;color:#4b5563;font-size:13px;line-height:1.6;white-space:pre-line;">${escapeHtml(instructions)}</p>
                </div>`
              : ''
          }
        `;

        slotSection.appendChild(mealDiv);
      });

      tempContainer.appendChild(slotSection);
    });

    const footer = document.createElement('div');
    footer.innerHTML = `
      <div style="margin-top:28px;padding:18px;background:#f9fafb;border-radius:10px;border-left:4px solid #dc2626;">
        <h3 style="color:#dc2626;font-size:15px;font-weight:bold;margin:0 0 8px 0;">Notes</h3>
        <ul style="margin:0;padding-left:18px;color:#4b5563;font-size:13px;line-height:1.7;">
          <li>If a slot has multiple options, pick one that fits your day.</li>
          <li>Portions are in grams (with scoop/piece hints where available).</li>
          <li>Message your coach for swaps or adjustments.</li>
        </ul>
      </div>
    `;
    tempContainer.appendChild(footer);

    document.body.appendChild(tempContainer);

    // Let layout settle before capture
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 800,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 8;
    const usableWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * usableWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;

    pdf.addImage(imgData, 'PNG', margin, position, usableWidth, imgHeight);
    heightLeft -= pageHeight - margin;

    while (heightLeft > 0) {
      position = margin - (imgHeight - heightLeft);
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin, position, usableWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(9);
      pdf.setTextColor(120);
      pdf.text('Unbreakables — Nutrition Plan', margin, pageHeight - 6);
      pdf.text(`Page ${i} / ${pageCount}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
    }

    const fileSafe = String(clientName || 'Client')
      .replace(/[^\w\-]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    pdf.save(`${fileSafe || 'Client'}_NutritionPlan_${new Date().toISOString().slice(0, 10)}.pdf`);

    return true;
  } catch (error) {
    console.error('Error exporting PDF:', error);
    throw error;
  } finally {
    if (tempContainer?.parentNode) {
      tempContainer.parentNode.removeChild(tempContainer);
    }
  }
};
