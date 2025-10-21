import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { MealSlot, SelectedMeal } from '../types';

interface PDFExportOptions {
  clientName: string;
  mealSlots: MealSlot[];
  totalNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
}

export const exportEnhancedNutritionPDF = async (options: PDFExportOptions) => {
  try {
    const { clientName, mealSlots, totalNutrition } = options;

    // Create a temporary container for the PDF content
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.width = '800px';
    tempContainer.style.backgroundColor = 'white';
    tempContainer.style.padding = '40px';
    tempContainer.style.fontFamily = 'Arial, sans-serif';
    tempContainer.style.color = '#333';

    // Add professional header
    const header = document.createElement('div');
    header.innerHTML = `
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #dc2626; padding-bottom: 20px;">
        <h1 style="color: #dc2626; font-size: 32px; margin: 0; font-weight: bold;">UnbreakableSteam</h1>
        <p style="color: #666; font-size: 16px; margin: 10px 0 0 0;">Professional Nutrition Coaching</p>
        <div style="margin-top: 10px; display:inline-block; padding:6px 14px; border:1px solid #dc2626; border-radius:999px; color:#dc2626; font-weight:600;">Prepared for ${clientName}</div>
        <p style="color: #666; font-size: 14px; margin: 10px 0 0 0;">Generated on: ${new Date().toLocaleDateString()}</p>
      </div>
    `;
    tempContainer.appendChild(header);

    // Add nutrition summary
    const summary = document.createElement('div');
    summary.innerHTML = `
      <div style="background: #f3f4f6; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
        <h2 style="color: #dc2626; font-size: 20px; margin: 0 0 15px 0;">Daily Nutrition Summary</h2>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
          <div style="text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #dc2626;">${Math.round(totalNutrition.calories)}</div>
            <div style="font-size: 12px; color: #666; text-transform: uppercase;">Calories</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${Math.round(totalNutrition.protein)}g</div>
            <div style="font-size: 12px; color: #666; text-transform: uppercase;">Protein</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #10b981;">${Math.round(totalNutrition.carbs)}g</div>
            <div style="font-size: 12px; color: #666; text-transform: uppercase;">Carbs</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">${Math.round(totalNutrition.fats)}g</div>
            <div style="font-size: 12px; color: #666; text-transform: uppercase;">Fats</div>
          </div>
        </div>
      </div>
    `;
    tempContainer.appendChild(summary);

    // Add each meal slot with ALL meal options
    mealSlots.forEach((slot, slotIndex) => {
      const slotSection = document.createElement('div');
      slotSection.style.marginBottom = '40px';
      slotSection.style.pageBreakInside = 'avoid';

      // Meal slot header
      const slotHeader = document.createElement('div');
      slotHeader.innerHTML = `
        <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 15px 20px; border-radius: 10px; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 22px; font-weight: bold;">${slot.name}</h2>
          ${slot.selectedMeals.length > 1 ? `<p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">${slot.selectedMeals.length} Options Available - Choose One</p>` : ''}
        </div>
      `;
      slotSection.appendChild(slotHeader);

      // Add all meal options
      slot.selectedMeals.forEach((meal, mealIndex) => {
        const mealDiv = document.createElement('div');
        mealDiv.style.marginBottom = '25px';
        mealDiv.style.padding = '20px';
        mealDiv.style.border = '2px solid #e5e7eb';
        mealDiv.style.borderRadius = '10px';
        mealDiv.style.backgroundColor = '#ffffff';

        // Meal option header (if multiple options)
        if (slot.selectedMeals.length > 1) {
          const optionHeader = document.createElement('div');
          optionHeader.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #dc2626;">
              <h3 style="margin: 0; color: #dc2626; font-size: 18px; font-weight: bold;">Option ${mealIndex + 1}: ${meal.name}</h3>
              <div style="background: #fee2e2; color: #dc2626; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                ${Math.round(meal.totalCalories)} cal
              </div>
            </div>
          `;
          mealDiv.appendChild(optionHeader);
        } else {
          const singleHeader = document.createElement('div');
          singleHeader.innerHTML = `
            <div style="display: flex; align-items: center; justify-between; margin-bottom: 15px;">
              <h3 style="margin: 0; color: #dc2626; font-size: 18px; font-weight: bold;">${meal.name}</h3>
              <div style="background: #fee2e2; color: #dc2626; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                ${Math.round(meal.totalCalories)} cal
              </div>
            </div>
          `;
          mealDiv.appendChild(singleHeader);
        }

        // Nutrition info
        const nutritionDiv = document.createElement('div');
        nutritionDiv.innerHTML = `
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 15px; padding: 15px; background: #f9fafb; border-radius: 8px;">
            <div style="text-align: center;">
              <div style="font-size: 16px; font-weight: bold; color: #3b82f6;">${Math.round(meal.totalProtein)}g</div>
              <div style="font-size: 11px; color: #666;">Protein</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 16px; font-weight: bold; color: #10b981;">${Math.round(meal.totalCarbs)}g</div>
              <div style="font-size: 11px; color: #666;">Carbs</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 16px; font-weight: bold; color: #f59e0b;">${Math.round(meal.totalFats)}g</div>
              <div style="font-size: 11px; color: #666;">Fats</div>
            </div>
          </div>
        `;
        mealDiv.appendChild(nutritionDiv);

        // Ingredients section
        const ingredientsDiv = document.createElement('div');
        ingredientsDiv.innerHTML = `
          <div style="margin-bottom: 15px;">
            <h4 style="color: #374151; font-size: 14px; font-weight: 600; margin: 0 0 10px 0; display: flex; align-items: center;">
              <span style="display: inline-block; width: 4px; height: 14px; background: #dc2626; margin-right: 8px; border-radius: 2px;"></span>
              Ingredients
            </h4>
            <ul style="margin: 0; padding-left: 20px; list-style: disc;">
              ${meal.ingredients.map(ing => `
                <li style="margin-bottom: 6px; color: #4b5563; font-size: 13px;">
                  <strong>${ing.food.name}</strong> - ${ing.quantity}g 
                  <span style="color: #9ca3af;">(${Math.round(ing.calories)} cal)</span>
                </li>
              `).join('')}
            </ul>
          </div>
        `;
        mealDiv.appendChild(ingredientsDiv);

        // Cooking instructions
        if (meal.cookingInstructions) {
          const instructionsDiv = document.createElement('div');
          instructionsDiv.innerHTML = `
            <div>
              <h4 style="color: #374151; font-size: 14px; font-weight: 600; margin: 0 0 10px 0; display: flex; align-items: center;">
                <span style="display: inline-block; width: 4px; height: 14px; background: #dc2626; margin-right: 8px; border-radius: 2px;"></span>
                Cooking Instructions
              </h4>
              <p style="margin: 0; color: #4b5563; font-size: 13px; line-height: 1.6; white-space: pre-line;">
                ${meal.cookingInstructions}
              </p>
            </div>
          `;
          mealDiv.appendChild(instructionsDiv);
        }

        slotSection.appendChild(mealDiv);
      });

      tempContainer.appendChild(slotSection);
    });

    // Add footer notes
    const footer = document.createElement('div');
    footer.innerHTML = `
      <div style="margin-top: 40px; padding: 20px; background: #f9fafb; border-radius: 10px; border-left: 4px solid #dc2626;">
        <h3 style="color: #dc2626; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">Important Notes</h3>
        <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 13px; line-height: 1.8;">
          <li>When multiple options are provided for a meal, choose ONE option that fits your preferences</li>
          <li>All ingredients are measured in grams for accuracy</li>
          <li>Meal prep tips: You can prepare multiple meals in advance and store them properly</li>
          <li>Feel free to swap similar ingredients if needed (consult with your coach first)</li>
          <li>Stay hydrated throughout the day - aim for 2-3 liters of water</li>
        </ul>
        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #666; font-size: 12px;">
            📞 For questions or meal modifications, contact your nutrition coach<br/>
            💪 UnbreakableSteam - Professional Nutrition Coaching
          </p>
        </div>
      </div>
    `;
    tempContainer.appendChild(footer);

    document.body.appendChild(tempContainer);

    // Convert to canvas and PDF
    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 800,
      height: tempContainer.scrollHeight
    });

    // Create PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Save the PDF
    pdf.save(`${clientName.replace(/\s+/g, '_')}_NutritionPlan_${new Date().toISOString().split('T')[0]}.pdf`);

    // Clean up
    document.body.removeChild(tempContainer);

    return true;
  } catch (error) {
    console.error('Error exporting PDF:', error);
    alert('Error generating PDF. Please try again.');
    return false;
  }
};

