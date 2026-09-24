const hav = (a, b) => {
  if (!a?.lat || !a?.lng || !b?.lat || !b?.lng) return 999;

  const R = 6371;
  const rad = x => x * Math.PI / 180;

  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lng - a.lng);

  const q =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) *
      Math.cos(rad(b.lat)) *
      Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(q));
};

export function urgency(expiry) {
  const mins = (new Date(expiry) - Date.now()) / 60000;

  if (mins <= 0) return 0;
  if (mins <= 60) return 100;
  if (mins <= 180) return 85;
  if (mins <= 360) return 65;

  return 35;
}

function foodMatch(donation, shelter) {
  const category = String(donation.category || '').toLowerCase();
  const foodType = String(donation.foodType || '').toLowerCase();

  const needs = (shelter.foodNeeds || [])
    .filter(n => n.active !== false);

  // First priority: actual shelter food need
  const exactNeed = needs.find(n => {
    const needType = String(n.foodType || '').toLowerCase();

    return (
      needType === category ||
      needType === foodType ||
      category.includes(needType) ||
      needType.includes(category) ||
      foodType.includes(needType) ||
      needType.includes(foodType)
    );
  });

  if (exactNeed) {
    const required = Number(exactNeed.requiredQuantity || 0);
    const quantity = Number(donation.quantity || 0);

    if (required >= quantity) {
      return 100;
    }

    if (quantity > 0) {
      return Math.max(40, Math.round((required / quantity) * 100));
    }

    return 80;
  }

  // Second priority: accepted food types
  const accepted = (shelter.acceptedFoodTypes || [])
    .map(x => String(x).toLowerCase());

  if (
    accepted.includes('all') ||
    accepted.includes(category) ||
    accepted.includes(foodType)
  ) {
    return 75;
  }

  // No explicit need
  return 20;
}

export function matchDonation(donation, shelters, drivers) {
  const quantity = Number(donation.quantity || 0);
  const urgent = urgency(donation.expiryTime);

  const hasAvailableDriver = drivers.some(
    d => d.availability === true
  );

  return shelters
    .map(shelter => {
      const distance = hav(
        donation.location,
        shelter.location
      );

      const availableCapacity =
        Number(shelter.capacity || 0) -
        Number(shelter.currentCapacity || 0);

      // Donation cannot fit
      if (availableCapacity < quantity) {
        return null;
      }

      const distanceScore =
        distance >= 999
          ? 0
          : Math.max(
              0,
              Math.min(100, 100 - (distance / 10) * 100)
            );

      const capacityScore =
        availableCapacity >= quantity
          ? 100
          : Math.max(
              0,
              Math.round(
                (availableCapacity / Math.max(quantity, 1)) * 100
              )
            );

      const foodCompatibility = foodMatch(
        donation,
        shelter
      );

      const driverScore = hasAvailableDriver ? 100 : 0;

      const score = Math.round(
        distanceScore * 0.35 +
        capacityScore * 0.25 +
        foodCompatibility * 0.20 +
        urgent * 0.15 +
        driverScore * 0.05
      );

      return {
        ...(shelter.toObject?.() || shelter),

        distance: Number(distance.toFixed(1)),

        availableCapacity,

        score,

        foodCompatibility,

        urgency: urgent,

        hasFoodNeed: foodCompatibility >= 75,

        driverAvailable: hasAvailableDriver
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);
}
