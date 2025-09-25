import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const exportToPDF = async (clientName: string) => {
  try {
    // Get the nutrition app element
    const element = document.getElementById('nutrition-app');
    if (!element) {
      console.error('Nutrition app element not found');
      return;
    }

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
    
    // Clone the content
    const clonedElement = element.cloneNode(true) as HTMLElement;
    
    // Remove client mode toggle and other edit buttons
    const buttonsToRemove = clonedElement.querySelectorAll('button');
    buttonsToRemove.forEach(button => {
      const buttonText = button.textContent?.toLowerCase();
      if (buttonText?.includes('client view') || 
          buttonText?.includes('edit mode') || 
          buttonText?.includes('save template') ||
          buttonText?.includes('export pdf') ||
          buttonText?.includes('share with client') ||
          buttonText?.includes('remove') ||
          buttonText?.includes('edit')) {
        button.remove();
      }
    });

    // Remove tab navigation
    const tabNav = clonedElement.querySelector('[class*="flex space-x-2 mb-8"]');
    if (tabNav) tabNav.remove();

    // Remove template management section
    const templateSection = clonedElement.querySelector('[class*="Meal Plan Templates"]');
    if (templateSection) {
      const templateContainer = templateSection.closest('[class*="p-8 rounded-3xl"]');
      if (templateContainer) templateContainer.remove();
    }

    // Remove meal configuration section
    const mealConfigSection = clonedElement.querySelector('[class*="Meal Configuration"]');
    if (mealConfigSection) {
      const mealConfigContainer = mealConfigSection.closest('[class*="p-8 rounded-3xl"]');
      if (mealConfigContainer) mealConfigContainer.remove();
    }

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
    tempContainer.appendChild(clonedElement);
    document.body.appendChild(tempContainer);

    // Convert to canvas
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

    // Add footer with contact info
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(10);
      pdf.setTextColor(100);
      pdf.text('For questions or modifications, contact your nutrition coach', 20, 285);
      pdf.text('UnbreakableSteam - Professional Nutrition Coaching', 20, 290);
    }

    // Save the PDF
    pdf.save(`${clientName.replace(/\s+/g, '_')}_MealPlan_${new Date().toISOString().split('T')[0]}.pdf`);

    // Clean up
    document.body.removeChild(tempContainer);


  } catch (error) {
    console.error('Error exporting PDF:', error);
    alert('Error generating PDF. Please try again.');
  }
};
