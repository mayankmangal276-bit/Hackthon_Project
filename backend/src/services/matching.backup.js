const EARTH_RADIUS_KM = 6371;

function toRadians(value) {
  return (Number(value) * Math.PI) / 180;
}

export function haversineDistance(a, b) {
  if (
    !a ||
    !b ||
    a.lat == null ||
    a.lng == null ||
    b.lat == null ||
    b.lng == null
  ) {
    return Infinity;
  }

  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const dLat = toRadians(Number(b.lat) - Number(a.lat));
  const dLng = toRadians(Number(b.lng) - Number(a.lng));

  const q =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLng / 2) ** 2;

  return (
    2 *
    EARTH_RADIUS_KM *
    Math.asin(Math.sqrt(Math.min(1, q)))
  );
}

export function urgency(expiry) {
  const minutes =
    (new Date(expiry).getTime() - Date.now()) / 60000;

  if (minutes <= 0) return 0;
  if (minutes <= 60) return 100;
  if (minutes <= 180) return 85;
  if (minutes <= 360) return 65;

  return 35;
}

function distanceScore(distance) {
  if (!Number.isFinite(distance)) return 0;

  /*
   * 0 km  -> 100
   * 5 km  -> 50
   * 10 km -> 0
   *
   * This is a simple MVP distance score.
   * Later we can replace this with actual route/ETA.
   */
  return Math.max(
    0,
    Math.min(100, 100 - distance * 10)
  );
}

function foodCompatibility(donation, shelter) {
  const accepted = shelter.acceptedFoodTypes || [];

  if (!accepted.length) {
    return 0;
  }

  if (
    accepted.includes('ALL') ||
    accepted.includes(donation.category)
  ) {
    return 100;
  }

  /*
   * Basic category compatibility for common cases.
   */
  const category = String(
    donation.category || ''
  ).toLowerCase();

  const normalizedAccepted = accepted.map((item) =>
    String(item).toLowerCase()
  );

  if (normalizedAccepted.includes(category)) {
    return 100;
  }

  return 0;
}

function getAvailableCapacity(shelter) {
  const capacity = Number(shelter.capacity || 0);
  const currentCapacity = Number(
    shelter.currentCapacity || 0
  );

  return Math.max(0, capacity - currentCapacity);
}

function getShelterObject(shelter) {
  if (typeof shelter.toObject === 'function') {
    return shelter.toObject();
  }

  return { ...shelter };
}

export function matchDonation(
  donation,
  shelters,
  drivers
) {
  const quantity = Number(donation.quantity || 0);
  const donationUrgency = urgency(
    donation.expiryTime
  );

  // Do not match expired food.
  if (donationUrgency === 0) {
    return [];
  }

  const availableDrivers = drivers.filter(
    (driver) => driver.availability === true
  );

  const driverScore =
    availableDrivers.length > 0 ? 100 : 0;

  return shelters
    .map((shelter) => {
      const shelterObject = getShelterObject(shelter);

      const distance = haversineDistance(
        donation.location,
        shelter.location
      );

      const availableCapacity =
        getAvailableCapacity(shelter);

      /*
       * Capacity score:
       *
       * enough capacity -> 100
       * insufficient capacity -> 0
       */
      const capacityScore =
        availableCapacity >= quantity ? 100 : 0;

      const foodScore = foodCompatibility(
        donation,
        shelter
      );

      const distanceScore =
        distanceScore(distance);

      /*
       * Required matching weights:
       *
       * Distance       35%
       * Capacity       25%
       * Food            20%
       * Urgency        15%
       * Driver           5%
       */
      const score = Math.round(
        distanceScore * 0.35 +
        capacityScore * 0.25 +
        foodScore * 0.20 +
        donationUrgency * 0.15 +
        driverScore * 0.05
      );

      return {
        ...shelterObject,

        distance: Number.isFinite(distance)
          ? Number(distance.toFixed(1))
          : null,

        distanceScore,

        availableCapacity,

        capacityScore,

        foodCompatibility: foodScore,

        urgency: donationUrgency,

        driverAvailability:
          availableDrivers.length,

        driverScore,

        score,
      };
    })

    /*
     * A shelter is eligible only if:
     *
     * 1. Enough capacity
     * 2. Food is compatible
     * 3. Valid location exists
     */
    .filter(
      (shelter) =>
        shelter.availableCapacity >= quantity &&
        shelter.foodCompatibility > 0 &&
        shelter.distance !== null
    )

    .sort((a, b) => {
      // Higher score first.
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      // If score is same, closer shelter first.
      return a.distance - b.distance;
    });
}
