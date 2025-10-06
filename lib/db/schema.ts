import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const reservationStatusEnum = pgEnum("reservation_status", [
  "inquiry",
  "confirmed",
  "waitlist",
  "no_show",
  "cancelled",
  "closed",
]);

export const handoverTypeEnum = pgEnum("handover_type", ["checkout", "checkin"]);

export const telemetryEventTypeEnum = pgEnum("telemetry_event_type", [
  "ignition_on",
  "ignition_off",
  "speeding",
  "geofence_entry",
  "geofence_exit",
  "battery_low",
  "movement",
]);

export const documentKindEnum = pgEnum("document_kind", [
  "rental_summary",
  "handover_report",
  "damage_report",
  "contract",
  "other",
]);

export const branches = pgTable(
  "branches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 12 }).notNull().unique(),
    name: varchar("name", { length: 120 }).notNull(),
    address: text("address"),
    city: varchar("city", { length: 64 }),
    country: varchar("country", { length: 64 }).default("BA").notNull(),
    phone: varchar("phone", { length: 32 }),
    email: varchar("email", { length: 120 }),
    timezone: varchar("timezone", { length: 64 }).default("Europe/Sarajevo"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => ({
    codeIdx: index("branches_code_idx").on(table.code),
  })
);

export const vehicleClasses = pgTable(
  "vehicle_classes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 16 }).notNull().unique(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    seats: integer("seats"),
    doors: integer("doors"),
    transmission: varchar("transmission", { length: 32 }),
    fuelType: varchar("fuel_type", { length: 32 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    codeIdx: index("vehicle_classes_code_idx").on(table.code),
  })
);

export const vehicles = pgTable(
  "vehicles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    vin: varchar("vin", { length: 32 }).notNull().unique(),
    plate: varchar("plate", { length: 16 }).notNull().unique(),
    displayName: varchar("display_name", { length: 120 }).notNull(),
    branchId: uuid("branch_id").references(() => branches.id),
    vehicleClassId: uuid("vehicle_class_id")
      .notNull()
      .references(() => vehicleClasses.id),
    year: integer("year"),
    color: varchar("color", { length: 32 }),
    mileage: integer("mileage").default(0),
    status: varchar("status", { length: 24 }).default("available"),
    telematicsUnitId: varchar("telematics_unit_id", { length: 64 }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    branchIdx: index("vehicles_branch_idx").on(table.branchId),
    classIdx: index("vehicles_class_idx").on(table.vehicleClassId),
  })
);

export const availabilityBlocks = pgTable(
  "availability_blocks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    reason: varchar("reason", { length: 120 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    vehicleIdx: index("availability_vehicle_idx").on(table.vehicleId, table.startsAt),
  })
);

export const ratePlans = pgTable(
  "rate_plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 24 }).notNull().unique(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    currency: varchar("currency", { length: 3 }).default("BAM").notNull(),
    channel: varchar("channel", { length: 32 }).default("direct"),
    active: boolean("active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    codeIdx: index("rate_plans_code_idx").on(table.code),
  })
);

export const prices = pgTable(
  "prices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ratePlanId: uuid("rate_plan_id")
      .notNull()
      .references(() => ratePlans.id, { onDelete: "cascade" }),
    vehicleClassId: uuid("vehicle_class_id")
      .notNull()
      .references(() => vehicleClasses.id, { onDelete: "cascade" }),
    startDate: date("start_date"),
    endDate: date("end_date"),
    losMin: integer("los_min").default(1),
    losMax: integer("los_max"),
    weekdayMask: integer("weekday_mask").default(127),
    baseAmount: numeric("base_amount", { precision: 10, scale: 2 }).notNull(),
    weekendMultiplier: numeric("weekend_multiplier", { precision: 6, scale: 3 }).default("1"),
    currency: varchar("currency", { length: 3 }).default("BAM"),
    eventName: varchar("event_name", { length: 120 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    rateClassIdx: index("prices_rate_class_idx").on(table.ratePlanId, table.vehicleClassId),
  })
);

export const extras = pgTable(
  "extras",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 24 }).notNull().unique(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    dailyPrice: numeric("daily_price", { precision: 10, scale: 2 }),
    flatPrice: numeric("flat_price", { precision: 10, scale: 2 }),
    currency: varchar("currency", { length: 3 }).default("BAM"),
    requiresInternational: boolean("requires_international").default(false),
    active: boolean("active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  }
);

export const extrasInventory = pgTable(
  "extras_inventory",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    extraId: uuid("extra_id")
      .notNull()
      .references(() => extras.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "cascade" }),
    quantity: integer("quantity").default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    uniqueInventory: index("extras_inventory_unique").on(table.extraId, table.branchId),
  })
);

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fullName: varchar("full_name", { length: 160 }).notNull(),
    email: varchar("email", { length: 160 }),
    phone: varchar("phone", { length: 32 }),
    address: text("address"),
    city: varchar("city", { length: 64 }),
    country: varchar("country", { length: 64 }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  }
);

export const companies = pgTable(
  "companies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    vatNumber: varchar("vat_number", { length: 64 }),
    billingAddress: text("billing_address"),
    contactEmail: varchar("contact_email", { length: 160 }),
    contactPhone: varchar("contact_phone", { length: 32 }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  }
);

export const drivers = pgTable(
  "drivers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    licenseNumber: varchar("license_number", { length: 64 }),
    licenseCountry: varchar("license_country", { length: 64 }),
    birthDate: date("birth_date"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  }
);

export const coupons = pgTable(
  "coupons",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 24 }).notNull().unique(),
    description: text("description"),
    discountType: varchar("discount_type", { length: 24 }).default("percent"),
    discountValue: numeric("discount_value", { precision: 6, scale: 2 }).default("0"),
    validFrom: timestamp("valid_from", { withTimezone: true }),
    validTo: timestamp("valid_to", { withTimezone: true }),
    usageLimit: integer("usage_limit"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    notes: text("notes"),
  }
);

export const corpContracts = pgTable(
  "corp_contracts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 24 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    description: text("description"),
    ratePlanId: uuid("rate_plan_id").references(() => ratePlans.id),
    notes: text("notes"),
    validFrom: timestamp("valid_from", { withTimezone: true }),
    validTo: timestamp("valid_to", { withTimezone: true }),
  },
  (table) => ({
    uniqueCorpContract: index("corp_contracts_unique").on(table.companyId, table.code),
  })
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 160 }).notNull().unique(),
    name: varchar("name", { length: 160 }),
    branchId: uuid("branch_id").references(() => branches.id),
    phone: varchar("phone", { length: 32 }),
    locale: varchar("locale", { length: 8 }).default("bs"),
    image: text("image"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    passwordHash: text("password_hash"),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  }
);

export const roles = pgTable(
  "roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 80 }).notNull().unique(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  }
);

export const permissions = pgTable(
  "permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 120 }).notNull().unique(),
    description: text("description"),
  }
);

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ name: "role_permissions_pk", columns: [table.roleId, table.permissionId] }),
  })
);

export const userRoles = pgTable(
  "user_roles",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ name: "user_roles_pk", columns: [table.userId, table.roleId] }),
  })
);

export const reservations = pgTable(
  "reservations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 24 }).notNull().unique(),
    status: reservationStatusEnum("status").default("inquiry").notNull(),
    pickupBranchId: uuid("pickup_branch_id")
      .notNull()
      .references(() => branches.id),
    dropoffBranchId: uuid("dropoff_branch_id")
      .notNull()
      .references(() => branches.id),
    pickupAt: timestamp("pickup_at", { withTimezone: true }).notNull(),
    dropoffAt: timestamp("dropoff_at", { withTimezone: true }).notNull(),
    customerId: uuid("customer_id").references(() => customers.id),
    companyId: uuid("company_id").references(() => companies.id),
    ratePlanId: uuid("rate_plan_id").references(() => ratePlans.id),
    corpContractId: uuid("corp_contract_id").references(() => corpContracts.id),
    couponId: uuid("coupon_id").references(() => coupons.id),
    channel: varchar("channel", { length: 32 }).default("ops"),
    currency: varchar("currency", { length: 3 }).default("BAM").notNull(),
    quoteExpiresAt: timestamp("quote_expires_at", { withTimezone: true }),
    totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).default("0"),
    internalNotes: text("internal_notes"),
    customerNotes: text("customer_notes"),
    auditTrail: jsonb("audit_trail").default(sql`'[]'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    statusIdx: index("reservations_status_idx").on(table.status),
    periodIdx: index("reservations_period_idx").on(table.pickupAt, table.dropoffAt),
  })
);

export const reservationItems = pgTable(
  "reservation_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reservationId: uuid("reservation_id")
      .notNull()
      .references(() => reservations.id, { onDelete: "cascade" }),
    vehicleId: uuid("vehicle_id").references(() => vehicles.id),
    vehicleClassId: uuid("vehicle_class_id")
      .notNull()
      .references(() => vehicleClasses.id),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    currency: varchar("currency", { length: 3 }).default("BAM"),
    baseAmount: numeric("base_amount", { precision: 10, scale: 2 }).default("0"),
    taxesAmount: numeric("taxes_amount", { precision: 10, scale: 2 }).default("0"),
    feesAmount: numeric("fees_amount", { precision: 10, scale: 2 }).default("0"),
    extrasAmount: numeric("extras_amount", { precision: 10, scale: 2 }).default("0"),
    totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).default("0"),
    priceSnapshot: jsonb("price_snapshot").default(sql`'{}'::jsonb`),
    notes: text("notes"),
  },
  (table) => ({
    reservationIdx: index("reservation_items_reservation_idx").on(table.reservationId),
  })
);

export const handoverChecks = pgTable(
  "handover_checks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reservationId: uuid("reservation_id")
      .notNull()
      .references(() => reservations.id, { onDelete: "cascade" }),
    type: handoverTypeEnum("type").notNull(),
    performedBy: uuid("performed_by").references(() => users.id),
    odometer: integer("odometer"),
    fuelLevel: integer("fuel_level"),
    cleanliness: varchar("cleanliness", { length: 32 }),
    photos: jsonb("photos").default(sql`'[]'::jsonb`),
    damages: jsonb("damages").default(sql`'[]'::jsonb`),
    signatureBlob: varchar("signature_blob", { length: 256 }),
    internalChargesNote: text("internal_charges_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  }
);

export const damages = pgTable(
  "damages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reservationId: uuid("reservation_id").references(() => reservations.id),
    vehicleId: uuid("vehicle_id").references(() => vehicles.id),
    reportedAt: timestamp("reported_at", { withTimezone: true }).defaultNow(),
    severity: varchar("severity", { length: 32 }),
    description: text("description"),
    photoKeys: jsonb("photo_keys").default(sql`'[]'::jsonb`),
    estimateAmount: numeric("estimate_amount", { precision: 10, scale: 2 }),
    currency: varchar("currency", { length: 3 }).default("BAM"),
    status: varchar("status", { length: 32 }).default("open"),
  }
);

export const claims = pgTable(
  "claims",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reservationId: uuid("reservation_id").references(() => reservations.id),
    filedAt: timestamp("filed_at", { withTimezone: true }).defaultNow(),
    claimType: varchar("claim_type", { length: 32 }),
    status: varchar("status", { length: 32 }).default("open"),
    amount: numeric("amount", { precision: 10, scale: 2 }),
    currency: varchar("currency", { length: 3 }).default("BAM"),
    notes: text("notes"),
  }
);

export const fines = pgTable(
  "fines",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reservationId: uuid("reservation_id").references(() => reservations.id),
    issuedAt: timestamp("issued_at", { withTimezone: true }).defaultNow(),
    authority: varchar("authority", { length: 120 }),
    reference: varchar("reference", { length: 120 }),
    amount: numeric("amount", { precision: 10, scale: 2 }),
    currency: varchar("currency", { length: 3 }).default("BAM"),
    status: varchar("status", { length: 32 }).default("open"),
    notes: text("notes"),
  }
);

export const deliveries = pgTable(
  "deliveries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reservationId: uuid("reservation_id").references(() => reservations.id),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    type: varchar("type", { length: 32 }).default("delivery"),
    address: text("address"),
    contactName: varchar("contact_name", { length: 120 }),
    contactPhone: varchar("contact_phone", { length: 32 }),
    notes: text("notes"),
  }
);

export const telemetryEvents = pgTable(
  "telemetry_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull(),
    type: telemetryEventTypeEnum("type").notNull(),
    source: varchar("source", { length: 64 }).default("traccar"),
    payload: jsonb("payload").default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    vehicleIdx: index("telemetry_vehicle_idx").on(table.vehicleId, table.recordedAt),
  })
);

export const settings = pgTable(
  "settings",
  {
    key: varchar("key", { length: 80 }).primaryKey(),
    value: jsonb("value").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  }
);

export const webhooks = pgTable(
  "webhooks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    url: text("url").notNull(),
    secret: varchar("secret", { length: 120 }).notNull(),
    active: boolean("active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    lastTriggeredAt: timestamp("last_triggered_at", { withTimezone: true }),
  }
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorId: uuid("actor_id").references(() => users.id),
    action: varchar("action", { length: 120 }).notNull(),
    entity: varchar("entity", { length: 120 }).notNull(),
    entityId: varchar("entity_id", { length: 120 }).notNull(),
    before: jsonb("before"),
    after: jsonb("after"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    entityIdx: index("audit_logs_entity_idx").on(table.entity, table.entityId),
  })
);

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reservationId: uuid("reservation_id").references(() => reservations.id, { onDelete: "set null" }),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    type: documentKindEnum("type").default("other").notNull(),
    title: varchar("title", { length: 160 }),
    blobKey: varchar("blob_key", { length: 256 }).notNull(),
    mimeType: varchar("mime_type", { length: 128 }).default("application/pdf"),
    sizeBytes: integer("size_bytes").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    createdBy: uuid("created_by").references(() => users.id),
  },
  (table) => ({
    reservationIdx: index("documents_reservation_idx").on(table.reservationId),
  })
);

export const documentTranslations = pgTable(
  "document_translations",
  {
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    locale: varchar("locale", { length: 8 }).notNull(),
    metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  },
  (table) => ({
    pk: primaryKey({ name: "document_translations_pk", columns: [table.documentId, table.locale] }),
  })
);

export const notificationQueue = pgTable(
  "notification_queue",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reservationId: uuid("reservation_id").references(() => reservations.id),
    channel: varchar("channel", { length: 24 }).default("email"),
    payload: jsonb("payload").default(sql`'{}'::jsonb`),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).defaultNow(),
    attempts: integer("attempts").default(0),
    lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
    status: varchar("status", { length: 24 }).default("pending"),
  }
);

export const reservationsRelations = relations(reservations, ({ many, one }) => ({
  items: many(reservationItems),
  customer: one(customers, {
    fields: [reservations.customerId],
    references: [customers.id],
  }),
  pickupBranch: one(branches, {
    fields: [reservations.pickupBranchId],
    references: [branches.id],
  }),
  dropoffBranch: one(branches, {
    fields: [reservations.dropoffBranchId],
    references: [branches.id],
  }),
}));

export const vehiclesRelations = relations(vehicles, ({ many, one }) => ({
  branch: one(branches, { fields: [vehicles.branchId], references: [branches.id] }),
  vehicleClass: one(vehicleClasses, {
    fields: [vehicles.vehicleClassId],
    references: [vehicleClasses.id],
  }),
  availability: many(availabilityBlocks),
  reservationItems: many(reservationItems),
}));
