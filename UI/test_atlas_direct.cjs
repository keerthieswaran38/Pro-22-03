const mongoose = require('mongoose');

async function test() {
    const uri = "mongodb+srv://gagner_sports:gagner2026sports@gagnersports.nxw3p4l.mongodb.net/gagnersports?retryWrites=true&w=majority";
    console.log('Testing connection to Atlas...');
    try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
        console.log('✅ Connected!');
        const counts = await mongoose.connection.db.collection('events').countDocuments();
        console.log('Event count:', counts);
        await mongoose.disconnect();
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}
test();
