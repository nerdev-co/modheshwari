import "dotenv/config";
import {
    PrismaClient,
    Role,
    bloodGroup,
    RelationType,
    EventStatus,
    ApprovalStatus,
    ResourceStatus,
    NotificationChannel,
    NotificationType,
    DeliveryStrategy,
    DeliveryStatus,
    NotificationPriority,
    FanoutStatus,
    InviteStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PASSWORD = "demo123";

async function hashPassword() {
    return bcrypt.hash(PASSWORD, 10);
}

async function main() {
    console.log(" Seeding database...");

    // Clean in correct order (respecting relations)
    await prisma.notificationDelivery.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.fanoutAudit.deleteMany();
    await prisma.outboxEvent.deleteMany();
    await prisma.roleChangeAudit.deleteMany();
    await prisma.message.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.statusUpdateApproval.deleteMany();
    await prisma.statusUpdateRequest.deleteMany();
    await prisma.memberInvite.deleteMany();
    await prisma.userRelation.deleteMany();
    await prisma.familyMember.deleteMany();
    await prisma.family.deleteMany();
    await prisma.resourceRequestApproval.deleteMany();
    await prisma.resourceRequest.deleteMany();
    await prisma.resource.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.eventRegistration.deleteMany();
    await prisma.eventApproval.deleteMany();
    await prisma.event.deleteMany();
    await prisma.medicalRecord.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.user.deleteMany();

    const demoPasswordHash = await hashPassword();

    // ============================================================
    // USERS
    // ============================================================
    console.log(" Creating users...");

    const vikram = await prisma.user.create({
        data: {
            email: "vikram@demo.com",
            password: demoPasswordHash,
            name: "Vikram Mehta",
            role: Role.COMMUNITY_HEAD,
            status: true,
        },
    });

    const sunita = await prisma.user.create({
        data: {
            email: "sunita@demo.com",
            password: demoPasswordHash,
            name: "Sunita Shah",
            role: Role.COMMUNITY_SUBHEAD,
            status: true,
        },
    });

    const ramesh = await prisma.user.create({
        data: {
            email: "ramesh@demo.com",
            password: demoPasswordHash,
            name: "Ramesh Patel",
            role: Role.GOTRA_HEAD,
            status: true,
        },
    });

    const anand = await prisma.user.create({
        data: {
            email: "anand@demo.com",
            password: demoPasswordHash,
            name: "Anand Sharma",
            role: Role.GOTRA_HEAD,
            status: true,
        },
    });

    const rajesh = await prisma.user.create({
        data: {
            email: "rajesh@demo.com",
            password: demoPasswordHash,
            name: "Rajesh Mehta",
            role: Role.FAMILY_HEAD,
            status: true,
        },
    });

    const priya = await prisma.user.create({
        data: {
            email: "priya@demo.com",
            password: demoPasswordHash,
            name: "Priya Shah",
            role: Role.FAMILY_HEAD,
            status: true,
        },
    });

    const amit = await prisma.user.create({
        data: {
            email: "amit@demo.com",
            password: demoPasswordHash,
            name: "Amit Patel",
            role: Role.FAMILY_HEAD,
            status: true,
        },
    });

    const deepak = await prisma.user.create({
        data: {
            email: "deepak@demo.com",
            password: demoPasswordHash,
            name: "Deepak Verma",
            role: Role.FAMILY_HEAD,
            status: true,
        },
    });

    const neha = await prisma.user.create({
        data: {
            email: "neha@demo.com",
            password: demoPasswordHash,
            name: "Neha Mehta",
            role: Role.MEMBER,
            status: true,
        },
    });

    const rohan = await prisma.user.create({
        data: {
            email: "rohan@demo.com",
            password: demoPasswordHash,
            name: "Rohan Mehta",
            role: Role.MEMBER,
            status: true,
        },
    });

    const sanjay = await prisma.user.create({
        data: {
            email: "sanjay@demo.com",
            password: demoPasswordHash,
            name: "Sanjay Shah",
            role: Role.MEMBER,
            status: true,
        },
    });

    const kavita = await prisma.user.create({
        data: {
            email: "kavita@demo.com",
            password: demoPasswordHash,
            name: "Kavita Patel",
            role: Role.MEMBER,
            status: true,
        },
    });

    const arjun = await prisma.user.create({
        data: {
            email: "arjun@demo.com",
            password: demoPasswordHash,
            name: "Arjun Verma",
            role: Role.MEMBER,
            status: true,
        },
    });

    const megha = await prisma.user.create({
        data: {
            email: "megha@demo.com",
            password: demoPasswordHash,
            name: "Megha Sharma",
            role: Role.MEMBER,
            status: true,
        },
    });

    const allUsers = [vikram, sunita, ramesh, anand, rajesh, priya, amit, deepak, neha, rohan, sanjay, kavita, arjun, megha];

    // ============================================================
    // PROFILES
    // ============================================================
    console.log(" Creating profiles...");

    const profileData: Record<string, { phone: string; address: string; profession: string; gotra: string; location: string; bloodGroup: bloodGroup; lat: number; lng: number }> = {
        vikram: { phone: "9876543210", address: "12 MG Road, Indore", profession: "Advocate", gotra: "Kashyap", location: "Indore", bloodGroup: bloodGroup.A_POS, lat: 22.7196, lng: 75.8577 },
        sunita: { phone: "9876543211", address: "45 Rajouri Garden, Bhopal", profession: "Teacher", gotra: "Bharadwaj", location: "Bhopal", bloodGroup: bloodGroup.B_POS, lat: 23.2599, lng: 77.4126 },
        ramesh: { phone: "9876543212", address: "78 Civil Lines, Jaipur", profession: "Doctor", gotra: "Kashyap", location: "Jaipur", bloodGroup: bloodGroup.O_POS, lat: 26.9124, lng: 75.7873 },
        anand: { phone: "9876543213", address: "23 Lakshmi Nagar, Delhi", profession: "Engineer", gotra: "Bharadwaj", location: "Delhi", bloodGroup: bloodGroup.AB_POS, lat: 28.7041, lng: 77.1025 },
        rajesh: { phone: "9876543214", address: "56 Vijay Nagar, Indore", profession: "Business Owner", gotra: "Kashyap", location: "Indore", bloodGroup: bloodGroup.B_NEG, lat: 22.7500, lng: 75.8580 },
        priya: { phone: "9876543215", address: "89 Malviya Nagar, Jaipur", profession: "Architect", gotra: "Bharadwaj", location: "Jaipur", bloodGroup: bloodGroup.O_NEG, lat: 26.8850, lng: 75.8100 },
        amit: { phone: "9876543216", address: "34 Andheri West, Mumbai", profession: "Software Developer", gotra: "Kashyap", location: "Mumbai", bloodGroup: bloodGroup.A_POS, lat: 19.1364, lng: 72.8296 },
        deepak: { phone: "9876543217", address: "67 Koramangala, Bangalore", profession: "Entrepreneur", gotra: "Bharadwaj", location: "Bangalore", bloodGroup: bloodGroup.B_POS, lat: 12.9352, lng: 77.6245 },
        neha: { phone: "9876543218", address: "56 Vijay Nagar, Indore", profession: "Designer", gotra: "Kashyap", location: "Indore", bloodGroup: bloodGroup.AB_NEG, lat: 22.7500, lng: 75.8580 },
        rohan: { phone: "9876543219", address: "56 Vijay Nagar, Indore", profession: "Student", gotra: "Kashyap", location: "Indore", bloodGroup: bloodGroup.O_POS, lat: 22.7500, lng: 75.8580 },
        sanjay: { phone: "9876543220", address: "89 Malviya Nagar, Jaipur", profession: "Doctor", gotra: "Bharadwaj", location: "Jaipur", bloodGroup: bloodGroup.A_POS, lat: 26.8850, lng: 75.8100 },
        kavita: { phone: "9876543221", address: "34 Andheri West, Mumbai", profession: "Accountant", gotra: "Kashyap", location: "Mumbai", bloodGroup: bloodGroup.B_POS, lat: 19.1364, lng: 72.8296 },
        arjun: { phone: "9876543222", address: "67 Koramangala, Bangalore", profession: "Student", gotra: "Bharadwaj", location: "Bangalore", bloodGroup: bloodGroup.O_NEG, lat: 12.9352, lng: 77.6245 },
        megha: { phone: "9876543223", address: "12 Salt Lake, Kolkata", profession: "Journalist", gotra: "Bharadwaj", location: "Kolkata", bloodGroup: bloodGroup.AB_POS, lat: 22.5726, lng: 88.3639 },
    };

    const profiles: Record<string, any> = {};
    for (const user of allUsers) {
        const p = profileData[user.name.split(" ")[0].toLowerCase()];
        profiles[user.id] = await prisma.profile.create({
            data: {
                userId: user.id,
                phone: p.phone,
                address: p.address,
                profession: p.profession,
                gotra: p.gotra,
                location: p.location,
                bloodGroup: p.bloodGroup,
                status: true,
                locationLat: p.lat,
                locationLng: p.lng,
            },
        });
    }

    // ============================================================
    // MEDICAL RECORDS
    // ============================================================
    console.log(" Creating medical records...");

    const medicalData = [
        { userId: vikram.id, bloodType: "A+", conditions: "Hypertension", medications: "Amlodipine 5mg", notes: "Regular checkups every 6 months" },
        { userId: sunita.id, bloodType: "B+", conditions: "None", medications: "None", notes: "Healthy" },
        { userId: ramesh.id, bloodType: "O+", conditions: "Diabetes Type 2", medications: "Metformin 500mg", notes: "Monitor blood sugar regularly" },
        { userId: anand.id, bloodType: "AB+", conditions: "None", medications: "None", notes: "Healthy" },
        { userId: rajesh.id, bloodType: "B-", conditions: "Asthma (mild)", medications: "Inhaler as needed", notes: "Carry inhaler at all times" },
        { userId: priya.id, bloodType: "O-", conditions: "None", medications: "None", notes: "Healthy" },
        { userId: amit.id, bloodType: "A+", conditions: "None", medications: "None", notes: "Healthy" },
        { userId: deepak.id, bloodType: "B+", conditions: "Migraine", medications: "Paracetamin as needed", notes: "Avoid bright lights during episodes" },
        { userId: neha.id, bloodType: "AB-", conditions: "None", medications: "None", notes: "Healthy" },
        { userId: rohan.id, bloodType: "O+", conditions: "None", medications: "None", notes: "Healthy, athletic" },
        { userId: sanjay.id, bloodType: "A+", conditions: "Mild allergy to peanuts", medications: "Cetirizine as needed", notes: "Carry EpiPen" },
        { userId: kavita.id, bloodType: "B+", conditions: "None", medications: "Iron supplements", notes: "Mild iron deficiency" },
        { userId: arjun.id, bloodType: "O-", conditions: "None", medications: "None", notes: "Healthy" },
        { userId: megha.id, bloodType: "AB+", conditions: "None", medications: "None", notes: "Healthy" },
    ];

    for (const med of medicalData) {
        await prisma.medicalRecord.create({ data: med });
    }

    // ============================================================
    // FAMILIES
    // ============================================================
    console.log(" Creating families...");

    const mehtaFamily = await prisma.family.create({
        data: {
            name: "Mehta Family",
            uniqueId: "FAM001",
            headId: rajesh.id,
        },
    });

    const shahFamily = await prisma.family.create({
        data: {
            name: "Shah Family",
            uniqueId: "FAM002",
            headId: priya.id,
        },
    });

    const patelFamily = await prisma.family.create({
        data: {
            name: "Patel Family",
            uniqueId: "FAM003",
            headId: amit.id,
        },
    });

    const vermaFamily = await prisma.family.create({
        data: {
            name: "Verma Family",
            uniqueId: "FAM004",
            headId: deepak.id,
        },
    });

    // ============================================================
    // FAMILY MEMBERS
    // ============================================================
    console.log(" Creating family memberships...");

    await prisma.familyMember.createMany({
        data: [
            // Mehta Family
            { familyId: mehtaFamily.id, userId: rajesh.id, role: Role.FAMILY_HEAD },
            { familyId: mehtaFamily.id, userId: neha.id, role: Role.MEMBER },
            { familyId: mehtaFamily.id, userId: rohan.id, role: Role.MEMBER },
            // Shah Family
            { familyId: shahFamily.id, userId: priya.id, role: Role.FAMILY_HEAD },
            { familyId: shahFamily.id, userId: sanjay.id, role: Role.MEMBER },
            // Patel Family
            { familyId: patelFamily.id, userId: amit.id, role: Role.FAMILY_HEAD },
            { familyId: patelFamily.id, userId: kavita.id, role: Role.MEMBER },
            // Verma Family
            { familyId: vermaFamily.id, userId: deepak.id, role: Role.FAMILY_HEAD },
            { familyId: vermaFamily.id, userId: arjun.id, role: Role.MEMBER },
        ],
    });

    // ============================================================
    // USER RELATIONS (family tree)
    // ============================================================
    console.log(" Creating user relations...");

    await prisma.userRelation.createMany({
        data: [
            // Rajesh <-> Neha (spouse)
            { fromUserId: rajesh.id, toUserId: neha.id, type: RelationType.SPOUSE },
            { fromUserId: neha.id, toUserId: rajesh.id, type: RelationType.SPOUSE },
            // Rajesh -> Rohan (parent), Rohan -> Rajesh (child)
            { fromUserId: rajesh.id, toUserId: rohan.id, type: RelationType.PARENT },
            { fromUserId: rohan.id, toUserId: rajesh.id, type: RelationType.CHILD },
            // Neha -> Rohan (parent), Rohan -> Neha (child)
            { fromUserId: neha.id, toUserId: rohan.id, type: RelationType.PARENT },
            { fromUserId: rohan.id, toUserId: neha.id, type: RelationType.CHILD },
            // Priya <-> Sanjay (spouse)
            { fromUserId: priya.id, toUserId: sanjay.id, type: RelationType.SPOUSE },
            { fromUserId: sanjay.id, toUserId: priya.id, type: RelationType.SPOUSE },
            // Amit <-> Kavita (spouse)
            { fromUserId: amit.id, toUserId: kavita.id, type: RelationType.SPOUSE },
            { fromUserId: kavita.id, toUserId: amit.id, type: RelationType.SPOUSE },
            // Vikram -> Rajesh (sibling)
            { fromUserId: vikram.id, toUserId: rajesh.id, type: RelationType.SIBLING },
            { fromUserId: rajesh.id, toUserId: vikram.id, type: RelationType.SIBLING },
            // Sunita -> Priya (sibling)
            { fromUserId: sunita.id, toUserId: priya.id, type: RelationType.SIBLING },
            { fromUserId: priya.id, toUserId: sunita.id, type: RelationType.SIBLING },
            // Ramesh -> Amit (parent)
            { fromUserId: ramesh.id, toUserId: amit.id, type: RelationType.PARENT },
            { fromUserId: amit.id, toUserId: ramesh.id, type: RelationType.CHILD },
            // Anand -> Deepak (sibling)
            { fromUserId: anand.id, toUserId: deepak.id, type: RelationType.SIBLING },
            { fromUserId: deepak.id, toUserId: anand.id, type: RelationType.SIBLING },
        ],
    });

    // ============================================================
    // EVENTS
    // ============================================================
    console.log(" Creating events...");

    const diwaliEvent = await prisma.event.create({
        data: {
            name: "Diwali Celebration 2025",
            description: "Annual Diwali celebration with cultural programs, dinner, and fireworks. All families welcome.",
            date: new Date("2025-10-20T18:00:00Z"),
            venue: "Community Hall, Indore",
            createdById: rajesh.id,
            status: EventStatus.PENDING,
        },
    });

    const navratriEvent = await prisma.event.create({
        data: {
            name: "Navratri Night 2025",
            description: "Nine nights of Garba and Dandiya. Traditional dress encouraged.",
            date: new Date("2025-10-15T19:00:00Z"),
            venue: "Open Ground, Jaipur",
            createdById: priya.id,
            status: EventStatus.APPROVED,
        },
    });

    const holiEvent = await prisma.event.create({
        data: {
            name: "Holi Festival 2026",
            description: "Colors of joy! Community Holi celebration with organic colors and special drinks.",
            date: new Date("2026-03-10T10:00:00Z"),
            venue: "Ram Leela Ground, Mumbai",
            createdById: amit.id,
            status: EventStatus.REJECTED,
        },
    });

    // ============================================================
    // EVENT APPROVALS
    // ============================================================
    console.log(" Creating event approvals...");

    // Diwali - pending approvals
    await prisma.eventApproval.createMany({
        data: [
            { eventId: diwaliEvent.id, approverId: vikram.id, approverName: vikram.name, role: vikram.role, status: ApprovalStatus.APPROVED, remarks: "Great initiative!" },
            { eventId: diwaliEvent.id, approverId: sunita.id, approverName: sunita.name, role: sunita.role, status: ApprovalStatus.PENDING },
            { eventId: diwaliEvent.id, approverId: ramesh.id, approverName: ramesh.name, role: ramesh.role, status: ApprovalStatus.PENDING },
        ],
    });

    // Navratri - all approved
    await prisma.eventApproval.createMany({
        data: [
            { eventId: navratriEvent.id, approverId: vikram.id, approverName: vikram.name, role: vikram.role, status: ApprovalStatus.APPROVED, reviewedAt: new Date() },
            { eventId: navratriEvent.id, approverId: sunita.id, approverName: sunita.name, role: sunita.role, status: ApprovalStatus.APPROVED, reviewedAt: new Date() },
            { eventId: navratriEvent.id, approverId: ramesh.id, approverName: ramesh.name, role: ramesh.role, status: ApprovalStatus.APPROVED, reviewedAt: new Date() },
        ],
    });

    // Holi - rejected
    await prisma.eventApproval.createMany({
        data: [
            { eventId: holiEvent.id, approverId: vikram.id, approverName: vikram.name, role: vikram.role, status: ApprovalStatus.REJECTED, remarks: "Venue not available", reviewedAt: new Date() },
            { eventId: holiEvent.id, approverId: sunita.id, approverName: sunita.name, role: sunita.role, status: ApprovalStatus.APPROVED, reviewedAt: new Date() },
            { eventId: holiEvent.id, approverId: anand.id, approverName: anand.name, role: anand.role, status: ApprovalStatus.APPROVED, reviewedAt: new Date() },
        ],
    });

    // ============================================================
    // EVENT REGISTRATIONS
    // ============================================================
    console.log(" Creating event registrations...");

    await prisma.eventRegistration.createMany({
        data: [
            // Diwali registrations
            { eventId: diwaliEvent.id, userId: rajesh.id },
            { eventId: diwaliEvent.id, userId: neha.id },
            { eventId: diwaliEvent.id, userId: rohan.id },
            { eventId: diwaliEvent.id, userId: priya.id },
            { eventId: diwaliEvent.id, userId: amit.id },
            // Navratri registrations
            { eventId: navratriEvent.id, userId: priya.id },
            { eventId: navratriEvent.id, userId: sanjay.id },
            { eventId: navratriEvent.id, userId: rajesh.id },
            { eventId: navratriEvent.id, userId: neha.id },
            { eventId: navratriEvent.id, userId: deepak.id },
            { eventId: navratriEvent.id, userId: arjun.id },
        ],
    });

    // ============================================================
    // PAYMENTS
    // ============================================================
    console.log(" Creating payments...");

    await prisma.payment.createMany({
        data: [
            // Diwali payments
            { eventId: diwaliEvent.id, userId: rajesh.id, amount: 500, status: "SUCCESS" },
            { eventId: diwaliEvent.id, userId: neha.id, amount: 500, status: "SUCCESS" },
            { eventId: diwaliEvent.id, userId: rohan.id, amount: 250, status: "SUCCESS" },
            { eventId: diwaliEvent.id, userId: priya.id, amount: 500, status: "PENDING" },
            // Navratri payments
            { eventId: navratriEvent.id, userId: priya.id, amount: 300, status: "SUCCESS" },
            { eventId: navratriEvent.id, userId: sanjay.id, amount: 300, status: "SUCCESS" },
            { eventId: navratriEvent.id, userId: deepak.id, amount: 300, status: "SUCCESS" },
        ],
    });

    // ============================================================
    // RESOURCES
    // ============================================================
    console.log(" Creating resources...");

    const communityHall = await prisma.resource.create({
        data: {
            name: "Community Hall",
            type: "Venue",
            description: "Main community hall with 500 person capacity, stage, and AV equipment",
            capacity: 500,
            status: ResourceStatus.AVAILABLE,
        },
    });

    const projector = await prisma.resource.create({
        data: {
            name: "HD Projector",
            type: "Electronics",
            description: "Epson 4K projector with HDMI and wireless connectivity",
            capacity: 1,
            status: ResourceStatus.BOOKED,
        },
    });

    const soundSystem = await prisma.resource.create({
        data: {
            name: "Sound System",
            type: "Electronics",
            description: "JBL professional sound system with 4 speakers and mixer",
            capacity: 1,
            status: ResourceStatus.AVAILABLE,
        },
    });

    const bus = await prisma.resource.create({
        data: {
            name: "Community Bus",
            type: "Transport",
            description: "40-seater AC bus for community outings",
            capacity: 40,
            status: ResourceStatus.AVAILABLE,
        },
    });

    // ============================================================
    // RESOURCE REQUESTS
    // ============================================================
    console.log(" Creating resource requests...");

    const hallRequest = await prisma.resourceRequest.create({
        data: {
            userId: rajesh.id,
            resourceId: communityHall.id,
            status: ApprovalStatus.APPROVED,
            startDate: new Date("2025-10-20T10:00:00Z"),
            endDate: new Date("2025-10-20T23:00:00Z"),
            approverId: vikram.id,
            approverName: vikram.name,
        },
    });

    const projectorRequest = await prisma.resourceRequest.create({
        data: {
            userId: amit.id,
            resourceId: projector.id,
            status: ApprovalStatus.PENDING,
            startDate: new Date("2025-11-01T09:00:00Z"),
            endDate: new Date("2025-11-01T17:00:00Z"),
        },
    });

    const busRequest = await prisma.resourceRequest.create({
        data: {
            userId: priya.id,
            resourceId: bus.id,
            status: ApprovalStatus.REJECTED,
            startDate: new Date("2025-12-15T06:00:00Z"),
            endDate: new Date("2025-12-15T22:00:00Z"),
            approverId: sunita.id,
            approverName: sunita.name,
        },
    });

    // ============================================================
    // RESOURCE REQUEST APPROVALS
    // ============================================================
    console.log(" Creating resource request approvals...");

    await prisma.resourceRequestApproval.createMany({
        data: [
            // Hall request - approved
            { requestId: hallRequest.id, approverId: vikram.id, approverName: vikram.name, role: vikram.role, status: ApprovalStatus.APPROVED, reviewedAt: new Date() },
            { requestId: hallRequest.id, approverId: sunita.id, approverName: sunita.name, role: sunita.role, status: ApprovalStatus.APPROVED, reviewedAt: new Date() },
            // Projector request - pending
            { requestId: projectorRequest.id, approverId: vikram.id, approverName: vikram.name, role: vikram.role, status: ApprovalStatus.PENDING },
            { requestId: projectorRequest.id, approverId: ramesh.id, approverName: ramesh.name, role: ramesh.role, status: ApprovalStatus.APPROVED, reviewedAt: new Date() },
            // Bus request - rejected
            { requestId: busRequest.id, approverId: vikram.id, approverName: vikram.name, role: vikram.role, status: ApprovalStatus.REJECTED, remarks: "Bus under maintenance", reviewedAt: new Date() },
        ],
    });

    // ============================================================
    // CONVERSATIONS & MESSAGES
    // ============================================================
    console.log(" Creating conversations...");

    const generalChat = await prisma.conversation.create({
        data: {
            participants: [vikram.id, sunita.id, rajesh.id, priya.id, amit.id],
            lastMessage: "See you all at the Diwali celebration!",
            lastMessageAt: new Date(),
        },
    });

    const familyChat = await prisma.conversation.create({
        data: {
            participants: [rajesh.id, neha.id, rohan.id],
            lastMessage: "Don't forget to bring the sweets!",
            lastMessageAt: new Date(),
        },
    });

    await prisma.message.createMany({
        data: [
            // General chat
            { conversationId: generalChat.id, senderId: vikram.id, senderName: vikram.name, content: "Welcome to the community chat!" },
            { conversationId: generalChat.id, senderId: sunita.id, senderName: sunita.name, content: "Thanks Vikram! Excited to be here." },
            { conversationId: generalChat.id, senderId: rajesh.id, senderName: rajesh.name, content: "Let's plan the Diwali event together." },
            { conversationId: generalChat.id, senderId: priya.id, senderName: priya.name, content: "Great idea! I can help with decorations." },
            { conversationId: generalChat.id, senderId: amit.id, senderName: amit.name, content: "I'll handle the food arrangements." },
            { conversationId: generalChat.id, senderId: vikram.id, senderName: vikram.name, content: "See you all at the Diwali celebration!", readBy: [vikram.id, sunita.id, rajesh.id, priya.id, amit.id] },
            // Family chat
            { conversationId: familyChat.id, senderId: rajesh.id, senderName: rajesh.name, content: "Neha, did you buy the decorations?" },
            { conversationId: familyChat.id, senderId: neha.id, senderName: neha.name, content: "Yes! Got diyas and rangoli colors." },
            { conversationId: familyChat.id, senderId: rohan.id, senderName: rohan.name, content: "I'll help set up the lights!" },
            { conversationId: familyChat.id, senderId: rajesh.id, senderName: rajesh.name, content: "Don't forget to bring the sweets!", readBy: [rajesh.id, neha.id] },
        ],
    });

    // ============================================================
    // STATUS UPDATE REQUESTS
    // ============================================================
    console.log(" Creating status update requests...");

    const statusReq = await prisma.statusUpdateRequest.create({
        data: {
            targetUserId: rohan.id,
            requestedById: rajesh.id,
            reason: "Requesting status update for Rohan - currently inactive",
            status: ApprovalStatus.PENDING,
        },
    });

    await prisma.statusUpdateApproval.create({
        data: {
            requestId: statusReq.id,
            approverId: vikram.id,
            approverName: vikram.name,
            role: vikram.role,
            status: ApprovalStatus.APPROVED,
            reviewedAt: new Date(),
        },
    });

    // ============================================================
    // MEMBER INVITES
    // ============================================================
    console.log(" Creating member invites...");

    await prisma.memberInvite.createMany({
        data: [
            {
                familyId: mehtaFamily.id,
                inviteEmail: "newmember1@demo.com",
                status: InviteStatus.PENDING,
                token: "invite-token-001",
            },
            {
                familyId: shahFamily.id,
                invitedUserId: megha.id,
                inviteEmail: "megha@demo.com",
                status: InviteStatus.APPROVED,
                reviewedById: priya.id,
                reviewedAt: new Date(),
                token: "invite-token-002",
            },
            {
                familyId: patelFamily.id,
                inviteEmail: "outsider@demo.com",
                status: InviteStatus.REJECTED,
                reviewedById: amit.id,
                reviewedAt: new Date(),
                remarks: "Does not meet family criteria",
                token: "invite-token-003",
            },
        ],
    });

    // ============================================================
    // NOTIFICATIONS
    // ============================================================
    console.log(" Creating notifications...");

    const notif1 = await prisma.notification.create({
        data: {
            userId: rajesh.id,
            message: "Your event 'Diwali Celebration 2025' has been submitted for approval.",
            type: NotificationType.EVENT_APPROVAL,
            channel: NotificationChannel.IN_APP,
            deliveryStrategy: DeliveryStrategy.BROADCAST,
            priority: NotificationPriority.HIGH,
            eventId: diwaliEvent.id,
        },
    });

    const notif2 = await prisma.notification.create({
        data: {
            userId: vikram.id,
            message: "New event 'Diwali Celebration 2025' requires your approval.",
            type: NotificationType.EVENT_APPROVAL,
            channel: NotificationChannel.IN_APP,
            deliveryStrategy: DeliveryStrategy.BROADCAST,
            priority: NotificationPriority.HIGH,
            eventId: diwaliEvent.id,
        },
    });

    const notif3 = await prisma.notification.create({
        data: {
            userId: priya.id,
            message: "Your event 'Navratri Night 2025' has been approved!",
            type: NotificationType.EVENT_APPROVAL,
            channel: NotificationChannel.IN_APP,
            deliveryStrategy: DeliveryStrategy.BROADCAST,
            priority: NotificationPriority.MEDIUM,
            eventId: navratriEvent.id,
            read: true,
            readAt: new Date(),
        },
    });

    const notif4 = await prisma.notification.create({
        data: {
            userId: amit.id,
            message: "Resource request for 'Community Hall' has been approved.",
            type: NotificationType.RESOURCE_REQUEST,
            channel: NotificationChannel.IN_APP,
            deliveryStrategy: DeliveryStrategy.BROADCAST,
            priority: NotificationPriority.MEDIUM,
            resourceRequestId: hallRequest.id,
            read: true,
            readAt: new Date(),
        },
    });

    const notif5 = await prisma.notification.create({
        data: {
            userId: amit.id,
            message: "Your event 'Holi Festival 2026' has been rejected. Reason: Venue not available.",
            type: NotificationType.EVENT_APPROVAL,
            channel: NotificationChannel.IN_APP,
            deliveryStrategy: DeliveryStrategy.BROADCAST,
            priority: NotificationPriority.HIGH,
            eventId: holiEvent.id,
        },
    });

    const notif6 = await prisma.notification.create({
        data: {
            userId: rohan.id,
            message: "Status update request submitted for your account.",
            type: NotificationType.STATUS_UPDATE_REQUEST,
            channel: NotificationChannel.IN_APP,
            deliveryStrategy: DeliveryStrategy.ESCALATION,
            priority: NotificationPriority.LOW,
            statusUpdateRequestId: statusReq.id,
        },
    });

    const notif7 = await prisma.notification.create({
        data: {
            userId: rajesh.id,
            message: "Payment of ₹500 received for Diwali Celebration.",
            type: NotificationType.PAYMENT_RECEIPT,
            channel: NotificationChannel.IN_APP,
            deliveryStrategy: DeliveryStrategy.BROADCAST,
            priority: NotificationPriority.LOW,
        },
    });

    // ============================================================
    // NOTIFICATION DELIVERIES
    // ============================================================
    console.log(" Creating notification deliveries...");

    await prisma.notificationDelivery.createMany({
        data: [
            { notificationId: notif1.id, channel: NotificationChannel.IN_APP, status: DeliveryStatus.DELIVERED, deliveredAt: new Date() },
            { notificationId: notif1.id, channel: NotificationChannel.EMAIL, status: DeliveryStatus.SENT, deliveredAt: new Date() },
            { notificationId: notif2.id, channel: NotificationChannel.IN_APP, status: DeliveryStatus.DELIVERED, deliveredAt: new Date() },
            { notificationId: notif3.id, channel: NotificationChannel.IN_APP, status: DeliveryStatus.DELIVERED, deliveredAt: new Date() },
            { notificationId: notif3.id, channel: NotificationChannel.PUSH, status: DeliveryStatus.DELIVERED, deliveredAt: new Date() },
            { notificationId: notif4.id, channel: NotificationChannel.IN_APP, status: DeliveryStatus.DELIVERED, deliveredAt: new Date() },
            { notificationId: notif4.id, channel: NotificationChannel.EMAIL, status: DeliveryStatus.DELIVERED, deliveredAt: new Date() },
            { notificationId: notif5.id, channel: NotificationChannel.IN_APP, status: DeliveryStatus.DELIVERED, deliveredAt: new Date() },
            { notificationId: notif6.id, channel: NotificationChannel.IN_APP, status: DeliveryStatus.DELIVERED, deliveredAt: new Date() },
            { notificationId: notif6.id, channel: NotificationChannel.SMS, status: DeliveryStatus.PENDING },
            { notificationId: notif7.id, channel: NotificationChannel.IN_APP, status: DeliveryStatus.DELIVERED, deliveredAt: new Date() },
        ],
    });

    // ============================================================
    // FANOUT AUDIT
    // ============================================================
    console.log(" Creating fanout audit...");

    await prisma.fanoutAudit.create({
        data: {
            fanoutId: "fanout-event-diwali-001",
            initiatedBy: rajesh.id,
            recipientCount: allUsers.length,
            channels: ["IN_APP", "EMAIL"],
            status: FanoutStatus.COMPLETED,
            processedAt: new Date(),
            processedCount: allUsers.length,
        },
    });

    // ============================================================
    // ROLE CHANGE AUDIT (sample records for the new audit log)
    // ============================================================
    console.log(" Creating role change audit records...");

    await prisma.roleChangeAudit.createMany({
        data: [
            {
                actorId: vikram.id,
                actorRole: Role.COMMUNITY_HEAD,
                targetId: rajesh.id,
                targetRole: Role.FAMILY_HEAD,
                previousRole: Role.MEMBER,
                newRole: Role.FAMILY_HEAD,
                action: "ROLE_CHANGE",
                status: "SUCCESS",
                reason: "Promoted to Family Head for Mehta family",
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
            },
            {
                actorId: vikram.id,
                actorRole: Role.COMMUNITY_HEAD,
                targetId: sunita.id,
                targetRole: Role.COMMUNITY_SUBHEAD,
                previousRole: Role.MEMBER,
                newRole: Role.COMMUNITY_SUBHEAD,
                action: "ROLE_CHANGE",
                status: "SUCCESS",
                reason: "Appointed as Community Subhead",
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
            },
            {
                actorId: vikram.id,
                actorRole: Role.COMMUNITY_HEAD,
                targetId: ramesh.id,
                targetRole: Role.GOTRA_HEAD,
                previousRole: Role.MEMBER,
                newRole: Role.GOTRA_HEAD,
                action: "ROLE_CHANGE",
                status: "SUCCESS",
                reason: "Promoted to Gotra Head",
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 7 days ago
            },
        ],
    });

    // ============================================================
    // DONE
    // ============================================================
    console.log("\nSeeding complete!\n");
}

main()
    .catch((e) => {
        console.error(" Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
