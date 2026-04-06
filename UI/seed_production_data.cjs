const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config();

// DNS Override for stability
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Use URI from .env
const MONGODB_URI = "mongodb+srv://gagnersports:Gagner%40123@cluster0.pwjaof4.mongodb.net/gagnersports?appName=Cluster0&retryWrites=true&w=majority";

// Schemas matching the models but loosely defined for the seed script
const eventSchema = new mongoose.Schema({}, { strict: false });
const participantSchema = new mongoose.Schema({}, { strict: false });

const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);
const Participant = mongoose.models.Participant || mongoose.model('Participant', participantSchema);

const eventsData = [
  {
    slug: 'chennai-elite-marathon-2026',
    title: 'Chennai Elite Marathon 2026',
    tag: 'ELITE',
    date: '2026-05-15',
    time: '05:30 AM',
    venue: 'Marina Beach, Chennai',
    bgImg: 'https://res.cloudinary.com/djv5gadoc/image/upload/v1711234567/hero_marathon_8k.png',
    desc: 'The official elite marathon of Chennai, attracting international runners.',
    categories: [{ name: 'Full Marathon (42K)', price: '999', details: ['Hydration', 'Medal'] }],
    registrationOpen: true,
    status: 'Open',
    isDraft: false
  },
  {
    slug: 'corporate-cricket-championship',
    title: 'Corporate Cricket Championship',
    tag: 'CORPORATE',
    date: '2026-06-10',
    time: '09:00 AM',
    venue: 'YMCA Grounds, Chennai',
    bgImg: 'https://res.cloudinary.com/djv5gadoc/image/upload/v1711234567/hero_cricket.png',
    desc: 'Pitching the best corporate teams against each other in a T20 format.',
    categories: [{ name: 'Team Entry', price: '15000', details: ['Jersey', 'Refreshments'] }],
    registrationOpen: true,
    status: 'Open',
    isDraft: false
  },
  {
    slug: 'junior-football-league',
    title: 'Junior Football League',
    tag: 'KIDS',
    date: '2026-07-05',
    time: '08:00 AM',
    venue: 'Nehru Stadium, Chennai',
    bgImg: 'https://res.cloudinary.com/djv5gadoc/image/upload/v1711234567/hero_football.png',
    desc: 'Nurturing the next generation of football stars in Chennai.',
    categories: [{ name: 'Under 14', price: '499', details: ['Kit Bag', 'Participation Cert'] }],
    registrationOpen: true,
    status: 'Open',
    isDraft: false
  },
  {
    slug: 'yoga-wellness-workshop',
    title: 'Yoga Wellness Workshop',
    tag: 'FITNESS',
    date: '2026-04-21',
    time: '06:00 AM',
    venue: 'Semmozhi Poonga, Chennai',
    bgImg: 'https://res.cloudinary.com/djv5gadoc/image/upload/v1711234567/yoga_hero.png',
    desc: 'Align your mind and body with elite Yoga practitioners.',
    categories: [{ name: 'General Session', price: '299', details: ['Yoga Mat provided'] }],
    registrationOpen: true,
    status: 'Open',
    isDraft: false
  },
  {
    slug: 'besant-nagar-beach-run',
    title: 'Besant Nagar Beach Run',
    tag: 'FAMILY',
    date: '2026-08-12',
    time: '05:45 AM',
    venue: 'Elliot’s Beach, Besant Nagar',
    bgImg: 'https://res.cloudinary.com/djv5gadoc/image/upload/v1711234567/health_day_run.png',
    desc: 'A scenic sunrise run across the beautiful shore of Besant Nagar.',
    categories: [{ name: '5K Fun Run', price: '399', details: ['T-shirt', 'Breakfast'] }],
    registrationOpen: true,
    status: 'Open',
    isDraft: false
  },
  {
    slug: 'senior-citizens-walkathon',
    title: 'Senior Citizens Walkathon',
    tag: 'COMMUNITY',
    date: '2026-09-01',
    time: '06:30 AM',
    venue: 'Theosophical Society, Chennai',
    bgImg: 'https://res.cloudinary.com/djv5gadoc/image/upload/v1711234567/fathers_day_marathon.png',
    desc: 'Celebrating health and longevity with our wisdom-rich seniors.',
    categories: [{ name: '2K Walk', price: '199', details: ['Water', 'Medical Support'] }],
    registrationOpen: true,
    status: 'Open',
    isDraft: false
  },
  {
    slug: 'table-tennis-open-2026',
    title: 'Table Tennis Open 2026',
    tag: 'INDOOR',
    date: '2026-10-15',
    time: '10:00 AM',
    venue: 'SDAT Stadium, Egmore',
    bgImg: 'https://images.unsplash.com/photo-1534158914592-062992fbe900?q=80&w=1200&auto=format&fit=crop',
    desc: 'Open tournament for table tennis enthusiasts across South India.',
    categories: [{ name: 'Singles Open', price: '450', details: ['Ball provided'] }],
    registrationOpen: true,
    status: 'Open',
    isDraft: false
  },
  {
    slug: 'badminton-doubles-trophy',
    title: 'Badminton Doubles Trophy',
    tag: 'CHAMPIONSHIP',
    date: '2026-11-20',
    time: '09:00 AM',
    venue: 'Fireball Academy, Chennai',
    bgImg: 'https://images.unsplash.com/photo-1626225967045-944005d6bd51?q=80&w=1200&auto=format&fit=crop',
    desc: 'Intense doubles badminton action with huge prize pool.',
    categories: [{ name: 'Doubles Team', price: '1200', details: ['Birdies provided'] }],
    registrationOpen: true,
    status: 'Open',
    isDraft: false
  },
  {
    slug: 'cyclothon-chennai-2026',
    title: 'Cyclothon Chennai 2026',
    tag: 'CYCLING',
    date: '2026-12-05',
    time: '05:00 AM',
    venue: 'ECR High Road, Chennai',
    bgImg: 'https://images.unsplash.com/photo-1541625602330-2277a1c4b6c3?q=80&w=1200&auto=format&fit=crop',
    desc: 'The biggest cycling event in the city covering 50kms on ECR.',
    categories: [{ name: '50K Pro', price: '750', details: ['Jersey', 'Mechanic support'] }],
    registrationOpen: true,
    status: 'Open',
    isDraft: false
  },
  {
    slug: 'swimming-championship-gala',
    title: 'Swimming Championship Gala',
    tag: 'AQUATIC',
    date: '2026-08-25',
    time: '07:00 AM',
    venue: 'Shenoy Nagar Pools, Chennai',
    bgImg: 'https://images.unsplash.com/photo-1530549387631-fbb129c13d98?q=80&w=1200&auto=format&fit=crop',
    desc: 'State-level selection gala for budding swimmers.',
    categories: [{ name: '100m Freestyle', price: '350', details: ['Cap provided'] }],
    registrationOpen: true,
    status: 'Open',
    isDraft: false
  }
];

const participantsData = [
  { name: 'Arjun Reddy', email: 'arjun.r@gmail.com', phone: '9840123450' },
  { name: 'Priya Mani', email: 'priya.m@yahoo.com', phone: '9710254321' },
  { name: 'Karthik Raja', email: 'karthik.r@outlook.com', phone: '9600156789' },
  { name: 'Divya Bharathi', email: 'divya.b@hotmail.com', phone: '9500012345' },
  { name: 'Sanjay Dutt', email: 'sanjay.d@gmail.com', phone: '9444109876' },
  { name: 'Meera Jasmine', email: 'meera.j@gmail.com', phone: '9380123456' },
  { name: 'Vijay Kumar', email: 'vijay.k@gmail.com', phone: '9280154321' },
  { name: 'Sneha Reddy', email: 'sneha.r@gmail.com', phone: '9170256789' },
  { name: 'Rohan Sharma', email: 'rohan.s@gmail.com', phone: '9080012345' },
  { name: 'Aditi Rao', email: 'aditi.r@gmail.com', phone: '9940109876' },
  { name: 'Manoj Bajpayee', email: 'manoj.b@gmail.com', phone: '9840156780' },
  { name: 'Samantha Ruth', email: 'samantha.r@gmail.com', phone: '9710200000' },
  { name: 'Nawaz Siddiq', email: 'nawaz.s@gmail.com', phone: '9600100000' },
  { name: 'Tamannaah B', email: 'tamanna.b@gmail.com', phone: '9500000000' },
  { name: 'Pankaj Tr', email: 'pankaj.t@gmail.com', phone: '9444111111' },
  { name: 'Rashmika M', email: 'rashmika.m@gmail.com', phone: '9380222222' },
  { name: 'Yash Kumar', email: 'yash.k@gmail.com', phone: '9280333333' },
  { name: 'Kiara Advani', email: 'kiara.a@gmail.com', phone: '9170444444' },
  { name: 'Ayush Khurana', email: 'ayush.k@gmail.com', phone: '9080555555' },
  { name: 'Radhika Apte', email: 'radhika.a@gmail.com', phone: '9940666666' }
];

async function seedData() {
  try {
    console.log('📡 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
    console.log('✅ Connected to:', mongoose.connection.name);

    // 1. CLEAR OLD DATA (To ensure exact counts)
    console.log('🧹 Purging existing Events and Participants...');
    await Event.deleteMany({});
    await Participant.deleteMany({});

    // 2. INSERT EVENTS
    console.log(`📦 Inserting ${eventsData.length} Events...`);
    await Event.insertMany(eventsData);

    // 3. INSERT PARTICIPANTS (Link to diverse events)
    console.log(`📦 Inserting ${participantsData.length} Participants...`);
    const participantsWithLinks = participantsData.map((p, idx) => {
      const event = eventsData[idx % eventsData.length]; // Cycle through events
      return {
        ...p,
        eventSlug: event.slug,
        eventName: event.title,
        category: event.categories[0].name,
        paymentStatus: 'Paid',
        isPaid: true,
        orderId: `ORD-${Date.now()}-${idx}`,
        transactionId: `TXN-${Math.random().toString(36).substring(7).toUpperCase()}`,
        registeredAt: new Date().toISOString()
      };
    });
    await Participant.insertMany(participantsWithLinks);

    // 4. VERIFICATION
    const eventCount = await Event.countDocuments();
    const participantCount = await Participant.countDocuments();

    console.log('\n────────────────────────────────────────────────');
    console.log('🚀 POPULATION COMPLETE: Final Report');
    console.log('────────────────────────────────────────────────');
    console.log(`Events Created      : ${eventCount}`);
    console.log(`Participants Created: ${participantCount}`);
    console.log('────────────────────────────────────────────────');

    if (eventCount === 10 && participantCount === 20) {
      console.log('✅ DATABASE SYNC VERIFIED: Success!');
    } else {
      console.warn('⚠️ Count Mismatch detected. Please check logs.');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ SEED FAILURE:', err.message);
    process.exit(1);
  }
}

seedData();
