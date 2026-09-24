# FoodRescue AI — Don't Waste Food. Rescue It.

Surplus-to-Shelter is a full-stack hackathon MVP connecting food donors, shelters and volunteer drivers through smart matching and real-time rescue status.

## Stack
- React + Vite + Tailwind CSS + React Router + Framer Motion
- Node.js + Express + MongoDB/Mongoose + JWT
- Leaflet/OpenStreetMap + Recharts

## Quick start
1. `cd project`
2. Copy `backend/.env.example` to `backend/.env`.
3. Set `MONGO_URI` if MongoDB is available. The backend also has an in-memory demo fallback so the UI can be demonstrated without MongoDB.
4. `npm run install:all`
5. `npm run dev`
6. Open the Vite URL shown in the terminal.

## Demo accounts
Use the Demo buttons on `/login`: Donor, Shelter, Driver, Admin. Demo mode is designed for the complete Post → Match → Assign → Pickup → Deliver → Impact story.

## Core matching
Score = distance 35% + capacity 25% + food compatibility 20% + urgency 15% + driver availability 5%, normalized to 0–100.

## Environment
Backend: `PORT`, `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, optional `OPENAI_API_KEY`.

## Project structure
`frontend/` contains the responsive product UI. `backend/` contains REST APIs, models, authentication, matching and seed/demo logic.
