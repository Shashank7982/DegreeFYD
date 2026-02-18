const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedUsers = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected');

        // Clear existing users (optional - comment out if you want to keep existing users)
        await User.deleteMany({});
        console.log('Cleared existing users');

        // Hash passwords
        const adminPassword = await bcrypt.hash('admin123', 10);
        const studentPassword = await bcrypt.hash('student123', 10);

        // Create demo users
        const users = [
            {
                name: 'Admin User',
                email: 'admin@degreefyd.com',
                password: adminPassword,
                role: 'admin'
            },
            {
                name: 'Student User',
                email: 'student@degreefyd.com',
                password: studentPassword,
                role: 'student'
            }
        ];

        await User.insertMany(users);
        console.log('Demo users created successfully!');
        console.log('- Admin: admin@degreefyd.com / admin123');
        console.log('- Student: student@degreefyd.com / student123');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding users:', error);
        process.exit(1);
    }
};

seedUsers();
