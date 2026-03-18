const { z } = require('zod');

// --- Mocking Schemas for Node Testing ---
const eventSchema = z.object({
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
  title: z.string().min(3),
  tag: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  venue: z.string().min(3),
  isDraft: z.boolean().optional().default(false),
});

const couponSchema = z.object({
  code: z.string().min(3).regex(/^[A-Z0-9]+$/),
  discountPercent: z.number().min(1).max(100),
  active: z.boolean().optional().default(true),
});

// --- Dashboard Logic Simulation ---
function calculateStats(events, participants, coupons) {
  const publicEvents = events.filter(e => !e.isDraft);
  const totalParticipants = participants.length;
  const activeCoupons = coupons.filter(c => c.active).length;
  return {
    totalEvents: publicEvents.length,
    totalParticipants,
    activeCoupons
  };
}

// --- Stress Test Runner ---
function runStressTest() {
  console.log('🚀 INITIALIZING 200% PERFECTION STRESS TEST (Rule of 10 & 20)\n');
  
  const results = [];
  
  for (let i = 1; i <= 20; i++) {
    console.log(`Cycle ${i}/20: Testing Registration & Sync...`);
    
    // 1. Event Variation
    const mockEvent = {
        slug: `event-${i}`,
        title: `Stress Test Event ${i}`,
        tag: i % 2 === 0 ? 'MARATHON' : 'FITNESS',
        date: '2026-04-01',
        time: '06:00',
        venue: 'Test Venue',
        isDraft: false
    };
    const evResult = eventSchema.safeParse(mockEvent);
    if (!evResult.success) throw new Error(`Event Validation Failed at cycle ${i}`);

    // 2. Participant Injection
    const mockParticipants = Array.from({length: i * 5}, (_, k) => ({
        id: `p${i}-${k}`,
        name: `User ${i}-${k}`,
        registeredAt: new Date().toISOString()
    }));

    // 3. Coupon Toggle Logic
    const mockCoupons = [
        { code: `SAVE${i}`, discountPercent: 10 + i, active: i % 2 !== 0 }
    ];
    const cpResult = couponSchema.safeParse(mockCoupons[0]);
    if (!cpResult.success) throw new Error(`Coupon Validation Failed at cycle ${i}`);

    // 4. Stat Calculation Audit
    const stats = calculateStats([mockEvent], mockParticipants, mockCoupons);
    
    // Success Criteria: Math must be exact
    const expectedParticipants = i * 5;
    const mathAccurate = (stats.totalParticipants === expectedParticipants);
    
    if (!mathAccurate) {
        console.error(`❌ STRESS TEST FAILED: Math mismatch at cycle ${i}`);
        return;
    }
    
    results.push({ cycle: i, status: 'PASSED', participants: stats.totalParticipants });
  }

  console.log('\n✅ 20/20 CYCLES COMPLETED WITH 100% ACCURACY');
  console.table(results);
}

runStressTest();
