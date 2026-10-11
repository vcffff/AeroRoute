// Materializes the schema's collections in Firestore by writing one sample
// document per collection (IDs prefixed "sample_"). Firestore is schemaless:
// collections and fields only exist once a document is written, so this script
// is how you "create" them up front. Sample docs use non-existent user IDs so
// real users never see them; delete them from the console whenever.
//
// Usage:  node scripts/seed-firestore.mjs
// Needs FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY (or
// GOOGLE_APPLICATION_CREDENTIALS) and FIREBASE_PROJECT_ID in .env.local.
import { readFileSync, existsSync } from 'node:fs';
import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Plain node does not load .env.local, so parse it minimally.
if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const match = /^([A-Z_]+)=(.*)$/.exec(line.trim());
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}

const projectId = process.env.FIREBASE_PROJECT_ID;
if (!projectId) { console.error('Set FIREBASE_PROJECT_ID in .env.local'); process.exit(1); }
if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  initializeApp({ projectId, credential: cert({ projectId, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') }) });
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  initializeApp({ projectId, credential: applicationDefault() });
} else {
  console.error('No service-account credentials found. Add FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY to .env.local (console → Project settings → Service accounts → Generate new private key).');
  process.exit(1);
}

const db = getFirestore();
const now = new Date().toISOString();
const CUSTOMER = 'sample_customer', OPERATOR = 'sample_operator';

const samples = {
  profiles: { sample_customer: { id: CUSTOMER, username: 'sample-customer', role: 'customer', createdAt: now } },
  addresses: { sample_address: { id: 'sample_address', ownerId: CUSTOMER, label: 'pickup', addressText: 'Алматы, ул. Абая, 10', latitude: 43.238, longitude: 76.889, createdAt: now } },
  orders: {
    sample_order: {
      id: 'sample_order', orderNumber: 'AR-SAMPLE-000001', customerId: CUSTOMER, operatorId: null, droneId: null,
      pickupAddressId: 'sample_address', deliveryAddressId: 'sample_address', origin: 'Алматы, ул. Абая, 10', destination: 'Алматы, ул. Кунаева, 12',
      packageDescription: 'Пример посылки', specialInstructions: null, packageWeightKg: 0.5, packageDimensionsCm: null,
      priorityLevel: 'standard', estimatedDistanceKm: 5, estimatedDurationMinutes: 15,
      status: 'pending', paymentStatus: 'pending', priceAmount: 2900, priceCurrency: 'KZT',
      smartContractAddress: null, escrowTransactionSignature: null, paymentId: null, receiptConfirmedAt: null,
      pickupTimeRequested: null, pickupTimeActual: null, deliveryTimeEstimated: null, deliveryTimeActual: null,
      createdAt: now, updatedAt: now, events: [{ status: 'pending', at: now, actorId: CUSTOMER }],
    },
  },
  drones: {
    sample_drone: {
      id: 'sample_drone', operatorId: OPERATOR, droneModel: 'DJI FlyCart 30', manufacturer: 'DJI',
      serialNumber: 'SN-SAMPLE-000001', registrationNumber: 'REG-SAMPLE-000001',
      maxPayloadKg: 25, maxRangeKm: 20, batteryCapacityMah: 58000, currentBatteryPercent: 100,
      status: 'available', certificationStatus: 'certified',
      insurancePolicyNumber: null, insuranceExpiryDate: null,
      currentLatitude: null, currentLongitude: null, currentAltitudeM: null,
      lastMaintenanceDate: null, nextMaintenanceDue: null,
      totalFlights: 0, totalDistanceKm: 0, createdAt: now, updatedAt: now,
    },
  },
  droneAvailabilityZones: { sample_zone: { id: 'sample_zone', droneId: 'sample_drone', zoneName: 'Астана — центр', centerLatitude: 51.128, centerLongitude: 71.43, radiusKm: 10, isActive: true, createdAt: now } },
  payments: {
    sample_payment: {
      id: 'sample_payment', orderId: 'sample_order', payerId: CUSTOMER, payeeId: OPERATOR,
      amount: 2900, currency: 'KZT', paymentType: 'order_payment', paymentStatus: 'pending',
      smartContractAddress: null, lockTransactionSignature: null, releaseTransactionSignature: null,
      platformFeeAmount: 290, operatorPayoutAmount: 2610, createdAt: now, completedAt: null,
    },
  },
  orderTracking: { sample_tracking: { id: 'sample_tracking', orderId: 'sample_order', latitude: 43.238, longitude: 76.889, altitudeM: 120, speedKmh: 40, batteryPercent: 80, headingDegrees: 90, statusUpdate: 'Пример телеметрии', timestamp: now } },
  reviews: { sample_review: { id: 'sample_review', orderId: 'sample_order', reviewerId: CUSTOMER, revieweeId: OPERATOR, droneId: 'sample_drone', rating: 5, reviewText: 'Пример отзыва', reviewType: 'customer_to_operator', isPublic: true, createdAt: now } },
  incidents: { sample_incident: { id: 'sample_incident', orderId: 'sample_order', droneId: 'sample_drone', reportedByUserId: OPERATOR, incidentType: 'weather_issue', severity: 'low', description: 'Пример инцидента', latitude: 43.238, longitude: 76.889, resolutionStatus: 'open', resolutionNotes: null, createdAt: now, resolvedAt: null } },
};

for (const [collection, docs] of Object.entries(samples)) {
  for (const [id, data] of Object.entries(docs)) {
    await db.collection(collection).doc(id).set(data, { merge: true });
    console.log(`wrote ${collection}/${id}`);
  }
}
console.log(`\nDone. Collections are now visible in the console: https://console.firebase.google.com/project/${projectId}/firestore`);
console.log('Sample docs are prefixed sample_ and invisible to real users — delete them any time.');
