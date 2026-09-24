# FoodRescue AI — Don't Waste Food. Rescue It.

FoodRescue AI is a full-stack food rescue platform that connects food donors with nearby shelters and volunteer drivers to rescue surplus edible food before it expires.

The platform demonstrates an end-to-end rescue lifecycle:

**Food Donor → Food Donation → Smart Matching → Shelter Selection → Driver Assignment → Pickup → Delivery → Impact Tracking**

---

## Problem Statement

Restaurants, food businesses and other donors often have surplus edible food that may go to waste because suitable shelters and transportation are not identified quickly enough.

FoodRescue AI addresses this coordination problem by providing a real-time platform for:

- Posting surplus food
- Finding suitable shelters
- Assigning available drivers
- Tracking rescue status
- Verifying driver arrival using GPS
- Measuring food rescue impact

---

## Proposed Solution

FoodRescue AI automatically connects the three main participants:

### Food Donor
Posts surplus food with:

- Food type
- Category
- Quantity
- Location
- Expiry time
- Description

### Shelter / NGO
Provides:

- Available capacity
- Food requirements
- Accepted food types
- Location

### Volunteer Driver
Receives rescue assignments and progresses through the pickup and delivery workflow.

---

## End-to-End Workflow

```text
Donor
  ↓
Post Surplus Food
  ↓
AI Food Information Extraction
  ↓
Smart Matching Engine
  ↓
Best Suitable Shelter
  ↓
Driver Assignment
  ↓
Driver Accepts Rescue
  ↓
GPS Pickup Verification
  ↓
Food Picked Up
  ↓
GPS Shelter Arrival Verification
  ↓
Food Delivered
  ↓
Impact Dashboard Updated
