const mongoose = require('mongoose');
const College = require('./models/College');
const dotenv = require('dotenv');

dotenv.config();

async function updateCollegeImages() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const colleges = await College.find({});
        console.log(`Found ${colleges.length} colleges`);

        let count = 0;
        const collegeImages = [
            'https://images.unsplash.com/photo-1562774053-701939374585',
            'https://images.unsplash.com/photo-1541339907198-e08756ebafe3',
            'https://images.unsplash.com/photo-1523050338691-037006ec90b3',
            'https://images.unsplash.com/photo-1592280771190-3e2e4d571952',
            'https://images.unsplash.com/photo-1519389950473-47ba0277781c',
            'https://images.unsplash.com/photo-1523050854058-8df90110c9f1',
            'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a',
            'https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0',
            'https://images.unsplash.com/photo-1574169208507-84376144848b',
            'https://images.unsplash.com/photo-1564981797816-1043664bf78d'
        ];

        for (const college of colleges) {
            // Pick an image based on the college name to be consistent
            const nameSum = college.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const imageIndex = Math.abs(nameSum) % collegeImages.length;
            const imageUrl = `${collegeImages[imageIndex]}?w=800&h=400&fit=crop`;

            await College.updateOne({ _id: college._id }, { $set: { image: imageUrl } });
            count++;
            if (count % 100 === 0) console.log(`Updated ${count} colleges...`);
        }

        console.log(`Successfully updated images for ${count} colleges`);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

updateCollegeImages();
