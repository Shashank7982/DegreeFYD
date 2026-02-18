const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected\n');

        const users = await User.find({}, 'name email role');
        console.log(`Found ${users.length} users in database:\n`);
        users.forEach(user => {
            console.log(`- ${user.name} (${user.email}) - Role: ${user.role}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkUsers();
