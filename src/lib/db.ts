import { PrismaClient } from "@prisma/client";

let db: any;

const sampleUsers = [
  { id: "u1", name: "Ayesha Khan", email: "ayesha@example.com", role: "SEO_MANAGER", agencyId: "a1", image: null },
  { id: "u2", name: "Rohit Patel", email: "rohit@example.com", role: "CONTENT_WRITER", agencyId: "a1", image: null },
];

const sampleClients = [
  {
    id: "c1",
    agencyId: "a1",
    businessName: "LumenX Studio",
    website: "https://lumensample.com",
    logoUrl: "https://via.placeholder.com/80",
    industry: "Digital Marketing",
    locations: ["London"],
    services: ["SEO", "PPC"],
    campaignStart: new Date("2026-01-01"),
    monthlyBudget: 6500,
    managerId: "u1",
    notes: "High-growth local SEO and analytics program.",
    status: "ACTIVE",
    createdAt: new Date("2026-01-05"),
  },
  {
    id: "c2",
    agencyId: "a1",
    businessName: "Oceanic Foods",
    website: "https://oceanicfoods.example.com",
    logoUrl: null,
    industry: "Food & Beverage",
    locations: ["Birmingham"],
    services: ["Local SEO", "GBP"],
    campaignStart: new Date("2026-03-15"),
    monthlyBudget: 4200,
    managerId: "u2",
    notes: "Seasonal campaign with focus on Google Business Profile conversions.",
    status: "PAUSED",
    createdAt: new Date("2026-03-20"),
  },
];

const sampleLeads = [
  { id: "l1", clientId: "c1", name: "Amira Sheikh", date: new Date("2026-06-08"), service: "SEO audit", location: "London", source: "manual", landingPage: "/audit", status: "CONTACTED", value: 320 },
  { id: "l2", clientId: "c1", name: "James Moore", date: new Date("2026-06-16"), service: "Content marketing", location: "UK", source: "webhook", landingPage: "/content", status: "QUALIFIED", value: 480 },
  { id: "l3", clientId: "c2", name: "Maya Singh", date: new Date("2026-05-22"), service: "GBP support", location: "Birmingham", source: "manual", landingPage: "/gbp", status: "NEW", value: 0 },
];

const sampleBookings = [
  { id: "b1", clientId: "c1", bookingDate: new Date("2026-06-10"), customer: "Claire James", service: "Monthly SEO", revenue: 2400, staff: "Ayesha", status: "COMPLETED", leadSource: "email" },
  { id: "b2", clientId: "c1", bookingDate: new Date("2026-06-28"), customer: "Jonas Bell", service: "Analytics setup", revenue: 1800, staff: "Rohit", status: "SCHEDULED", leadSource: "call" },
  { id: "b3", clientId: "c2", bookingDate: new Date("2026-06-20"), customer: "Nina Patel", service: "GBP packaging", revenue: 1450, staff: "Ayesha", status: "COMPLETED", leadSource: "referral" },
];

const sampleNotifications = [
  { id: "n1", agencyId: "a1", clientId: "c1", type: "traffic_drop", message: "Traffic dipped 12% week-over-week for LumenX Studio.", read: false, createdAt: new Date("2026-06-29") },
  { id: "n2", agencyId: "a1", clientId: "c2", type: "lead_drop", message: "Oceanic Foods has 3 pending leads needing follow-up.", read: false, createdAt: new Date("2026-06-27") },
];

const sampleMetrics = [
  { id: "m1", clientId: "c1", source: "SEARCH_CONSOLE", date: new Date("2026-06-01"), metrics: { clicks: 120, impressions: 3400, ctr: 3.5, position: 6.8 }, dimensions: null },
  { id: "m2", clientId: "c1", source: "SEARCH_CONSOLE", date: new Date("2026-06-15"), metrics: { clicks: 175, impressions: 4400, ctr: 4.0, position: 6.2 }, dimensions: null },
  { id: "m3", clientId: "c2", source: "SEARCH_CONSOLE", date: new Date("2026-06-12"), metrics: { clicks: 85, impressions: 2100, ctr: 4.1, position: 8.2 }, dimensions: null },
];

const sampleWorkLogs = [
  { id: "w1", clientId: "c1", userId: "u1", date: new Date("2026-06-08"), category: "content_updates", description: "Published 4 local service pages and optimized meta titles.", timeSpentMins: 120, priority: "HIGH", status: "DONE", attachments: null },
  { id: "w2", clientId: "c1", userId: "u2", date: new Date("2026-06-12"), category: "technical", description: "Fixed mobile layout issues and improved site speed.", timeSpentMins: 90, priority: "MEDIUM", status: "DONE", attachments: null },
  { id: "w3", clientId: "c2", userId: "u1", date: new Date("2026-06-22"), category: "gbp_posts", description: "Added 5 Business Profile posts and updated hours for peak season.", timeSpentMins: 60, priority: "MEDIUM", status: "DONE", attachments: null },
];

const countBookings = (clientId?: string) => sampleBookings.filter((b) => (clientId ? b.clientId === clientId : true)).length;
const countLeads = (clientId?: string) => sampleLeads.filter((l) => (clientId ? l.clientId === clientId : true)).length;

if (!process.env.DATABASE_URL) {
  const defaultModel = {
    findMany: async () => [],
    findUnique: async () => null,
    findFirst: async () => null,
    create: async () => null,
    createMany: async () => null,
    update: async () => null,
    delete: async () => null,
    deleteMany: async () => null,
    count: async () => 0,
    aggregate: async () => ({ _count: 0, _sum: {} }),
    upsert: async () => null,
  } as any;

  const localDb = {
    client: {
      count: async ({ where }: any = {}) => {
        if (where?.status) return sampleClients.filter((client) => client.status === where.status).length;
        return sampleClients.length;
      },
      findMany: async ({ include, orderBy }: any = {}) => {
        const clients = [...sampleClients].sort((a, b) => a.businessName.localeCompare(b.businessName));
        return clients.map((client) => {
          const result: any = { ...client };
          if (include?.manager?.select?.name) {
            result.manager = sampleUsers.find((user) => user.id === client.managerId) ?? null;
          }

          const countInclude = include?._count;
          if (countInclude) {
            const selected = countInclude === true ? { leads: true, bookings: true } : countInclude.select ?? {};
            result._count = {
              leads: selected.leads ? countLeads(client.id) : undefined,
              bookings: selected.bookings ? countBookings(client.id) : undefined,
            };
          }

          return result;
        });
      },
      findUnique: async ({ where, include }: any = {}) => {
        const client = sampleClients.find((item) => item.id === where.id);
        if (!client) return null;
        const result: any = { ...client };
        if (include?.leads) result.leads = sampleLeads.filter((lead) => lead.clientId === client.id);
        if (include?.bookings) result.bookings = sampleBookings.filter((booking) => booking.clientId === client.id);
        if (include?.workLogs) result.workLogs = sampleWorkLogs.filter((entry) => entry.clientId === client.id).map((entry) => ({
          ...entry,
          user: sampleUsers.find((user) => user.id === entry.userId) ?? null,
        }));
        if (include?.metrics) result.metrics = sampleMetrics.filter((metric) => metric.clientId === client.id && metric.source === "SEARCH_CONSOLE");
        return result;
      },
    },
    lead: {
      count: async () => sampleLeads.length,
    },
    booking: {
      aggregate: async ({ _count, _sum }: any = {}) => ({
        _count: typeof _count === "boolean" ? sampleBookings.length : 0,
        _sum: { revenue: sampleBookings.reduce((total, b) => total + (b.revenue ?? 0), 0) },
      }),
    },
    notification: {
      findMany: async ({ where, orderBy, take, include }: any = {}) => {
        let notifications = sampleNotifications.filter((notification) => (where?.read === undefined ? true : notification.read === where.read));
        if (orderBy?.createdAt === "desc") {
          notifications = [...notifications].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
        if (take) notifications = notifications.slice(0, take);
        return notifications.map((notification) => {
          const result: any = { ...notification };
          if (include?.client) result.client = sampleClients.find((client) => client.id === notification.clientId) ?? null;
          return result;
        });
      },
    },
    integrationAccount: {
      findUnique: async () => null,
    },
  } as any;

  db = new Proxy(localDb, { get: (target, prop) => target[prop as string] ?? defaultModel });
} else {
  const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
  db = globalForPrisma.prisma ?? new PrismaClient();
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
}

export { db };
