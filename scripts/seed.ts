import "dotenv/config";
import { db } from "../lib/db/client";
import {
  auditLogs,
  branches,
  companies,
  corpContracts,
  customers,
  documents,
  drivers,
  extras,
  extrasInventory,
  prices,
  ratePlans,
  reservationItems,
  reservations,
  roles,
  settings,
  userRoles,
  users,
  vehicleClasses,
  vehicles,
} from "../lib/db/schema";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Seeding database...");

  await db.execute(sql`TRUNCATE TABLE notification_queue, document_translations, documents, audit_logs, webhooks, handover_checks, reservation_items, reservations, deliveries, fines, claims, damages, telemetry_events, extras_inventory, extras, prices, vehicles, availability_blocks, rate_plans, vehicle_classes, companies, corp_contracts, customers, drivers, roles, permissions, user_roles, role_permissions, users, branches RESTART IDENTITY CASCADE`);

  const branchData = [
    { code: "SJJ", name: "Sarajevo Airport", city: "Sarajevo" },
    { code: "TZL", name: "Tuzla Downtown", city: "Tuzla" },
    { code: "MOJ", name: "Mostar Old Town", city: "Mostar" },
  ];
  const branchIds = await Promise.all(
    branchData.map(async (branch) => {
      const [row] = await db
        .insert(branches)
        .values({ ...branch, country: "BA" })
        .returning({ id: branches.id });
      return row.id;
    })
  );

  const classData = [
    { code: "ECON", name: "Economy", seats: 5, doors: 5, transmission: "automatic" },
    { code: "SUV", name: "SUV", seats: 5, doors: 5, transmission: "automatic" },
    { code: "VAN", name: "Passenger Van", seats: 9, doors: 5, transmission: "manual" },
    { code: "LUX", name: "Luxury", seats: 5, doors: 4, transmission: "automatic" },
  ];
  const classIds = await Promise.all(
    classData.map(async (cls) => {
      const [row] = await db
        .insert(vehicleClasses)
        .values(cls)
        .returning({ id: vehicleClasses.id });
      return row.id;
    })
  );

  const vehicleData = [
    { vin: "VIN001", plate: "A01-T-001", displayName: "VW Golf" },
    { vin: "VIN002", plate: "A02-T-002", displayName: "Skoda Octavia" },
    { vin: "VIN003", plate: "A03-T-003", displayName: "Dacia Duster" },
    { vin: "VIN004", plate: "A04-T-004", displayName: "Toyota Corolla" },
    { vin: "VIN005", plate: "A05-T-005", displayName: "Renault Clio" },
    { vin: "VIN006", plate: "A06-T-006", displayName: "Hyundai Tucson" },
    { vin: "VIN007", plate: "A07-T-007", displayName: "Mercedes Vito" },
    { vin: "VIN008", plate: "A08-T-008", displayName: "Mercedes E-Class" },
    { vin: "VIN009", plate: "A09-T-009", displayName: "Opel Vivaro" },
    { vin: "VIN010", plate: "A10-T-010", displayName: "Peugeot 308" },
    { vin: "VIN011", plate: "A11-T-011", displayName: "Audi Q5" },
    { vin: "VIN012", plate: "A12-T-012", displayName: "Ford Tourneo" },
  ];

  const vehicleIds = await Promise.all(
    vehicleData.map(async (vehicle, index) => {
      const [row] = await db
        .insert(vehicles)
        .values({
          ...vehicle,
          branchId: branchIds[index % branchIds.length],
          vehicleClassId: classIds[index % classIds.length],
          year: 2021 + (index % 3),
          mileage: 5000 * index,
        })
        .returning({ id: vehicles.id });
      return row.id;
    })
  );

  const ratePlanData = [
    { code: "STD", name: "Standard Retail" },
    { code: "WKND", name: "Weekend Special" },
    { code: "LONG", name: "Long Term" },
    { code: "CORP", name: "Corporate" },
  ];
  const ratePlanIds = await Promise.all(
    ratePlanData.map(async (plan) => {
      const [row] = await db
        .insert(ratePlans)
        .values(plan)
        .returning({ id: ratePlans.id });
      return row.id;
    })
  );

  await db.insert(prices).values(
    classIds.flatMap((vehicleClassId, idx) => {
      return ratePlanIds.map((ratePlanId) => ({
        ratePlanId,
        vehicleClassId,
        baseAmount: (45 + idx * 10).toFixed(2),
        weekdayMask: 127,
      }));
    })
  );

  const extrasData = [
    { code: "GPS", name: "GPS", dailyPrice: "5.00" },
    { code: "CS", name: "Child Seat", dailyPrice: "6.50" },
    { code: "ZK", name: "Zeleni karton", flatPrice: "25.00", requiresInternational: true },
  ];

  const extraIds = await Promise.all(
    extrasData.map(async (extra) => {
      const [row] = await db
        .insert(extras)
        .values(extra)
        .returning({ id: extras.id });
      return row.id;
    })
  );

  await db.insert(extrasInventory).values(
    extraIds.flatMap((extraId) =>
      branchIds.map((branchId) => ({ extraId, branchId, quantity: 5 }))
    )
  );

  const customerData = [
    { fullName: "Lejla Kovač", email: "lejla@example.com", phone: "+38761111222" },
    { fullName: "Adnan Hadžić", email: "adnan@example.com", phone: "+38761222333" },
    { fullName: "Sara Lukić", email: "sara@example.com", phone: "+38761333444" },
    { fullName: "Jonas Berg", email: "jonas@example.se", phone: "+4670123456", country: "SE" },
  ];

  const customerIds = await Promise.all(
    customerData.map(async (customer) => {
      const [row] = await db
        .insert(customers)
        .values(customer)
        .returning({ id: customers.id });
      return row.id;
    })
  );

  const companyData = [
    { name: "EuroTech d.o.o.", contactEmail: "office@eurotech.ba" },
    { name: "Nordic Consulting", contactEmail: "ops@nordic.se" },
  ];

  const companyIds = await Promise.all(
    companyData.map(async (company) => {
      const [row] = await db
        .insert(companies)
        .values(company)
        .returning({ id: companies.id });
      return row.id;
    })
  );

  await db.insert(corpContracts).values(
    companyIds.map((companyId, idx) => ({
      companyId,
      code: idx === 0 ? "ET2024" : "NC2024",
      name: idx === 0 ? "EuroTech Preferred" : "Nordic Sweden",
      ratePlanId: ratePlanIds[3],
    }))
  );

  const userData = [
    { email: "ops@sarajevo.local", name: "Ops Sarajevo", branchId: branchIds[0] },
    { email: "ops@mostar.local", name: "Ops Mostar", branchId: branchIds[2] },
  ];
  const userIds = await Promise.all(
    userData.map(async (user) => {
      const [row] = await db
        .insert(users)
        .values(user)
        .returning({ id: users.id });
      return row.id;
    })
  );

  const [opsRole] = await db
    .insert(roles)
    .values({ name: "operations", description: "Fleet & reservation management" })
    .returning({ id: roles.id });

  for (const userId of userIds) {
    await db.insert(userRoles).values({ userId, roleId: opsRole.id });
  }

  const now = new Date();
  const reservationsToCreate = 10;
  for (let i = 0; i < reservationsToCreate; i++) {
    const pickup = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const dropoff = new Date(pickup.getTime() + 2 * 24 * 60 * 60 * 1000);
    const [reservation] = await db
      .insert(reservations)
      .values({
        code: `RSV-${String(1000 + i)}`,
        status: i % 3 === 0 ? "confirmed" : "inquiry",
        pickupBranchId: branchIds[i % branchIds.length],
        dropoffBranchId: branchIds[(i + 1) % branchIds.length],
        pickupAt: pickup,
        dropoffAt: dropoff,
        customerId: customerIds[i % customerIds.length],
        ratePlanId: ratePlanIds[i % ratePlanIds.length],
        totalAmount: (120 + i * 10).toFixed(2),
      })
      .returning({ id: reservations.id });

    await db.insert(reservationItems).values({
      reservationId: reservation.id,
      vehicleClassId: classIds[i % classIds.length],
      vehicleId: vehicleIds[i % vehicleIds.length],
      startsAt: pickup,
      endsAt: dropoff,
      baseAmount: (100 + i * 5).toFixed(2),
      extrasAmount: i % 2 === 0 ? "25.00" : "0.00",
      totalAmount: (125 + i * 5).toFixed(2),
      priceSnapshot: {
        ratePlan: ratePlanData[i % ratePlanData.length].code,
        base: 100 + i * 5,
        extras: i % 2 === 0 ? 25 : 0,
        currency: "BAM",
      },
    });
  }

  await db.insert(settings).values([
    {
      key: "policy",
      value: {
        minDriverAge: 23,
        fuel: "Return full or refuel charge applies",
        gracePeriodMinutes: 60,
        greenCardRequired: true,
      },
    },
    {
      key: "pricing:yield",
      value: {
        occupancyThreshold: 0.75,
        surgeMultiplier: 1.15,
      },
    },
  ]);

  await db.insert(documents).values({
    type: "rental_summary",
    title: "Demo Rental Summary",
    blobKey: "demo/rental-summary.pdf",
    mimeType: "application/pdf",
    sizeBytes: 1024,
  });

  await db.insert(auditLogs).values({
    action: "seed",
    entity: "system",
    entityId: "seed",
    after: { message: "Seed completed" },
  });

  console.log("Seed completed");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
