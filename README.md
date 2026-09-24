# 🍱 FoodRescue AI

## 🚨 Don't Waste Food. Rescue It.

### Surplus-to-Shelter — Real-Time Food Rescue Routing

FoodRescue AI is a full-stack platform that connects food donors with nearby shelters and volunteer drivers to rescue surplus edible food before it expires.

---

# 🎯 Problem Statement

Restaurants and food businesses often have surplus edible food that gets wasted.

At the same time, shelters and NGOs need food but may not know where surplus food is available.

FoodRescue AI solves this problem by connecting:

**Food Donor → Shelter → Driver**

in a real-time rescue workflow.

---

# 💡 Proposed Solution

FoodRescue AI provides one platform where:

- 🍽️ Donors post surplus food
- 🤖 AI extracts food information
- 🎯 Matching Engine finds suitable shelters
- 🏠 Best shelter is selected
- 🚗 Driver is assigned
- 📍 GPS verifies pickup and delivery
- 📦 Food is delivered
- 📊 Impact is automatically calculated

---

# 🏗️ Project Architecture

## Architecture Components

### ⚛️ React + Vite
Frontend interface for all users.

### 🎨 Tailwind CSS
Used for responsive and modern UI.

### 🔀 React Router
Handles application navigation and routes.

### 🟢 Node.js + Express
Backend server that handles APIs and business logic.

### 🍃 MongoDB + Mongoose
Stores users, donations, shelters, drivers and rescue information.

### 🔐 JWT
Provides authentication and role-based access.

### 🤖 AI / LLM
Extracts food type, quantity and category from donor descriptions.

### 🎯 Matching Engine
Finds the most suitable shelter for a donation.

### 📍 GPS Verification
Confirms that the driver is actually near pickup and delivery locations.

### 🗺️ Leaflet + OpenStreetMap
Displays locations on the map.

### 📊 Recharts
Displays impact and analytics charts.

---

# 🔄 System Architecture

```text
                    👥 USERS
       ┌─────────────┼─────────────┐
       ↓             ↓             ↓
    🍽️ Donor      🏠 Shelter     🚗 Driver
       │             │             │
       └─────────────┼─────────────┘
                     ↓
              ⚛️ React Frontend
                     ↓
               🔗 REST API
                     ↓
             🟢 Node + Express
                     │
       ┌─────────────┼─────────────┐
       ↓             ↓             ↓
   🤖 AI/LLM    🎯 Matching      📍 GPS
       │             │             │
       └─────────────┼─────────────┘
                     ↓
                🍃 MongoDB
                     ↓
               📊 Analytics
