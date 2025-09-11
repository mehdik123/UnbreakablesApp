# NutriPlan Pro - Professional Nutrition Designer

A modern, interactive web application for creating personalized nutrition plans with real-time calculations and professional PDF exports.

## 🎯 **What This App Does**

Transform your spreadsheet-based meal planning into a modern, interactive experience:

- **Real Database Integration**: Uses your actual food and meal databases
- **Interactive Meal Selection**: Dropdown menus with your complete meal library
- **Editable Ingredients**: Modify portions and remove ingredients on-the-fly
- **Auto Calculations**: Real-time nutrition updates as you make changes
- **Client Management**: Add client names and customize plans
- **Professional PDF Export**: Generate modern, interactive PDFs for clients
- **Meal Database Management**: Add, edit, and manage your meal library
- **Meal Plan Templates**: Import and export multi-day meal plans

## 🚀 **How to Run**

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser** and go to `http://localhost:5173`

## 📋 **Your Workflow - From Spreadsheets to Modern App**

### **Before (Spreadsheets)**:
- Manual ingredient calculations
- Static meal plans
- Basic PDF exports
- Limited customization

### **Now (NutriPlan Pro)**:
- **Real-time calculations** using your food database
- **Interactive meal selection** from your meal library
- **Editable ingredients** with instant nutrition updates
- **Professional PDF exports** with modern design
- **Complete meal management** system

## 🛠️ **Key Features**

### **1. Real Database Integration**
- **Food Database**: Automatically loads your CSV food database
- **Meal Database**: Complete meal library with images, ingredients, and instructions
- **Real-time Calculations**: All nutrition values calculated from your actual data

### **2. Interactive Meal Planning**
- **Smart Meal Selection**: Filter by category (breakfast, lunch, dinner, snack)
- **Search Functionality**: Find meals quickly with search and filters
- **Visual Meal Cards**: See meal images and nutrition at a glance

### **3. Editable Ingredients**
- **Portion Control**: Adjust ingredient quantities with real-time updates
- **Ingredient Swapping**: Replace ingredients from your food database
- **Nutrition Tracking**: See calories and macros update instantly
- **Remove Ingredients**: Exclude ingredients clients don't consume

### **4. Professional PDF Export**
- **Modern Design**: Clean, professional layout
- **Complete Information**: Meals, ingredients, nutrition, and instructions
- **Client Ready**: Perfect for sharing with clients

### **5. Meal Database Management**
- **Add New Meals**: Create meals with images, ingredients, and instructions
- **Edit Existing Meals**: Modify meal details and ingredients
- **Import Meal Plans**: Load multi-day meal plan templates
- **Organize by Category**: Breakfast, lunch, dinner, and snack categories

## 📊 **How to Use**

### **Step 1: Meal Planning**
1. **Set Client Name**: Enter the client's name at the top
2. **Choose Meals Per Day**: Select 3-6 meals per day
3. **Add Meals**: Click "Add Meal" for each time slot
4. **Select from Database**: Choose from your meal library
5. **Customize Ingredients**: Edit portions or remove ingredients as needed

### **Step 2: Real-time Customization**
1. **View Nutrition**: See total calories and macros update instantly
2. **Edit Ingredients**: Click "Ingredients" to modify portions
3. **Remove Items**: Delete ingredients clients don't consume
4. **Add Alternatives**: Replace ingredients from your food database

### **Step 3: Export to PDF**
1. **Review Plan**: Check all meals and nutrition totals
2. **Export**: Click "Export to PDF" button
3. **Share**: Send professional PDF to your client

### **Step 4: Manage Your Database**
1. **Switch to Database Tab**: Click "Meal Database" tab
2. **Add New Meals**: Create meals with full details
3. **Import Plans**: Load meal plan templates
4. **Organize**: Keep your meal library updated

## 🗄️ **Database Structure**

### **Food Database (CSV)**
```csv
Food (100g),KCal,Protein,Fat,Carbs
Blueberries,64,1,0,14
Chicken Breast, Raw,110,23,2,0
...
```

### **Meal Database (JSON)**
```json
{
  "id": "1",
  "name": "Protein Oatmeal Bowl",
  "category": "breakfast",
  "image": "image_url",
  "cookingInstructions": "Step-by-step instructions...",
  "ingredients": [
    {
      "food": { "name": "Oats", "kcal": 378, ... },
      "quantity": 50
    }
  ]
}
```

## 🎨 **Modern Interface Features**

- **Dark/Light Theme**: Toggle between themes
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Smooth Animations**: Professional transitions and interactions
- **Intuitive Navigation**: Easy-to-use tabs and menus
- **Visual Feedback**: Clear indicators for all actions

## 📱 **Client Benefits**

### **For You (Nutritionist)**:
- **Faster Planning**: No more manual spreadsheet calculations
- **Professional Output**: Modern PDFs that impress clients
- **Easy Customization**: Quick ingredient adjustments
- **Database Management**: Keep your meal library organized

### **For Your Clients**:
- **Professional Plans**: Beautiful, easy-to-read PDFs
- **Complete Information**: All ingredients, portions, and instructions
- **Visual Appeal**: Meal images and clear layout
- **Customized Plans**: Tailored to their preferences

## 🔧 **Technical Features**

- **React + TypeScript**: Modern, type-safe development
- **Vite**: Fast development and building
- **Tailwind CSS**: Beautiful, responsive styling
- **Real-time Calculations**: Instant nutrition updates
- **PDF Generation**: Professional document creation
- **CSV Integration**: Direct database import

## 🚀 **Getting Started**

1. **Run the app**: `npm run dev`
2. **Load your data**: The app automatically loads your CSV food database
3. **Start planning**: Create your first meal plan
4. **Customize**: Edit ingredients and portions
5. **Export**: Generate your first professional PDF

## 📈 **Future Enhancements**

- **Client Database**: Store client information and preferences
- **Meal Plan Templates**: Pre-built multi-day plans
- **Nutrition Goals**: Set and track client targets
- **Progress Tracking**: Monitor client adherence
- **Mobile App**: Native mobile application
- **Cloud Sync**: Access plans from anywhere

---

**Transform your nutrition planning from spreadsheets to a modern, professional tool that impresses clients and saves you time!** 