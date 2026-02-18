const mongoose = require('mongoose');
const fs = require('fs');
const dotenv = require('dotenv');
const College = require('./models/College');

dotenv.config();

// Helper functions to generate authentic data
const generateSlug = (name) => {
    return name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/--+/g, '-')
        .substring(0, 100);
};

const getCollegeType = (name) => {
    if (name.toLowerCase().includes('government') || name.toLowerCase().includes('govt')) return 'Government';
    if (name.toLowerCase().includes('iit') || name.toLowerCase().includes('nit') || name.toLowerCase().includes('aiims')) return 'Government';
    if (name.toLowerCase().includes('deemed')) return 'Deemed';
    return Math.random() > 0.7 ? 'Public' : 'Private';
};

const generateDescription = (name, city, state) => {
    const templates = [
        `${name} is a premier educational institution located in ${city}, ${state}. Established with a vision to provide quality education, the college offers a wide range of undergraduate and postgraduate programs. The institution is known for its excellent faculty, modern infrastructure, and strong industry connections.`,
        `Located in the heart of ${city}, ${state}, ${name} has been a beacon of academic excellence. The college offers comprehensive programs across various disciplines, focusing on both theoretical knowledge and practical skills. With state-of-the-art facilities and experienced faculty, students receive a well-rounded education.`,
        `${name}, situated in ${city}, ${state}, is committed to nurturing future leaders and professionals. The institution provides a conducive learning environment with modern amenities, research facilities, and strong placement opportunities. The college emphasizes holistic development through academics, sports, and extracurricular activities.`
    ];
    return templates[Math.floor(Math.random() * templates.length)];
};

const generateShortDescription = (name) => {
    return `${name} offers quality education with excellent placement opportunities and modern infrastructure.`;
};

const generateFacilities = () => {
    const allFacilities = [
        'Library', 'Computer Labs', 'Sports Complex', 'Cafeteria', 'Hostel',
        'Wi-Fi Campus', 'Auditorium', 'Medical Facilities', 'Gymnasium',
        'Laboratories', 'Transportation', 'Innovation Lab', 'Conference Hall',
        'Seminar Rooms', 'Placement Cell', 'Student Lounge', 'Research Center'
    ];
    const count = Math.floor(Math.random() * 5) + 8; // 8-12 facilities
    return allFacilities.sort(() => 0.5 - Math.random()).slice(0, count);
};

const generateCourses = (name) => {
    const courses = [];
    const isEngineering = name.toLowerCase().includes('engineering') || name.toLowerCase().includes('technology') || name.toLowerCase().includes('institute of tech');
    const isMedical = name.toLowerCase().includes('medical') || name.toLowerCase().includes('dental') || name.toLowerCase().includes('aiims');
    const isBusiness = name.toLowerCase().includes('management') || name.toLowerCase().includes('business');

    if (isEngineering) {
        courses.push(
            { name: 'B.Tech Computer Science', duration: '4 years', fees: Math.floor(Math.random() * 200000) + 100000, eligibility: 'JEE Main / State CET', seats: Math.floor(Math.random() * 120) + 60 },
            { name: 'B.Tech Electronics', duration: '4 years', fees: Math.floor(Math.random() * 180000) + 90000, eligibility: 'JEE Main / State CET', seats: Math.floor(Math.random() * 100) + 60 },
            { name: 'B.Tech Mechanical', duration: '4 years', fees: Math.floor(Math.random() * 150000) + 80000, eligibility: 'JEE Main / State CET', seats: Math.floor(Math.random() * 120) + 60 },
            { name: 'M.Tech', duration: '2 years', fees: Math.floor(Math.random() * 150000) + 75000, eligibility: 'GATE', seats: Math.floor(Math.random() * 40) + 20 }
        );
    } else if (isMedical) {
        courses.push(
            { name: 'MBBS', duration: '5.5 years', fees: Math.floor(Math.random() * 500000) + 500000, eligibility: 'NEET', seats: Math.floor(Math.random() * 150) + 100 },
            { name: 'MD', duration: '3 years', fees: Math.floor(Math.random() * 400000) + 300000, eligibility: 'NEET PG', seats: Math.floor(Math.random() * 50) + 30 }
        );
    } else if (isBusiness) {
        courses.push(
            { name: 'MBA', duration: '2 years', fees: Math.floor(Math.random() * 300000) + 150000, eligibility: 'CAT / MAT / State CET', seats: Math.floor(Math.random() * 120) + 60 },
            { name: 'PGDM', duration: '2 years', fees: Math.floor(Math.random() * 250000) + 120000, eligibility: 'CAT / XAT', seats: Math.floor(Math.random() * 80) + 40 }
        );
    } else {
        courses.push(
            { name: 'B.A.', duration: '3 years', fees: Math.floor(Math.random() * 50000) + 20000, eligibility: '12th Pass', seats: Math.floor(Math.random() * 100) + 50 },
            { name: 'B.Sc.', duration: '3 years', fees: Math.floor(Math.random() * 60000) + 25000, eligibility: '12th Pass (Science)', seats: Math.floor(Math.random() * 100) + 50 },
            { name: 'B.Com', duration: '3 years', fees: Math.floor(Math.random() * 50000) + 20000, eligibility: '12th Pass', seats: Math.floor(Math.random() * 100) + 50 }
        );
    }

    return courses;
};

const generatePlacement = () => {
    return {
        percentage: Math.floor(Math.random() * 30) + 65, // 65-95%
        averagePackage: Math.floor(Math.random() * 500000) + 300000, // 3-8 LPA
        highestPackage: Math.floor(Math.random() * 2000000) + 1000000, // 10-30 LPA
        topRecruiters: ['TCS', 'Wipro', 'Infosys', 'Accenture', 'Capgemini', 'Cognizant'].sort(() => 0.5 - Math.random()).slice(0, 5),
        yearWiseData: [
            { year: '2023', placed: Math.floor(Math.random() * 200) + 100, averagePackage: Math.floor(Math.random() * 400000) + 280000, highestPackage: Math.floor(Math.random() * 1500000) + 900000 },
            { year: '2022', placed: Math.floor(Math.random() * 180) + 90, averagePackage: Math.floor(Math.random() * 380000) + 260000, highestPackage: Math.floor(Math.random() * 1400000) + 850000 }
        ]
    };
};

const generateEligibility = (name) => {
    const isEngineering = name.toLowerCase().includes('engineering') || name.toLowerCase().includes('technology');
    const isMedical = name.toLowerCase().includes('medical') || name.toLowerCase().includes('dental');

    if (isEngineering) {
        return [
            { exam: 'JEE Main', cutoff: `${Math.floor(Math.random() * 50000) + 10000}`, description: 'Required for B.Tech admissions' },
            { exam: 'State CET', cutoff: `${Math.floor(Math.random() * 20000) + 5000}`, description: 'State level engineering entrance' }
        ];
    } else if (isMedical) {
        return [
            { exam: 'NEET', cutoff: `${Math.floor(Math.random() * 100) + 550}`, description: 'Required for MBBS admissions' }
        ];
    } else {
        return [
            { exam: '12th Boards', cutoff: `${Math.floor(Math.random() * 25) + 60}%`, description: 'Minimum marks required' }
        ];
    }
};

const seedColleges = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected successfully!\n');

        // Read data.json
        console.log('Reading data.json...');
        const rawData = fs.readFileSync('../data.json', 'utf8');
        const collegesData = JSON.parse(rawData);
        console.log(`Found ${collegesData.length} colleges in data.json\n`);

        // Clear existing colleges
        console.log('Clearing existing colleges...');
        await College.deleteMany({});
        console.log('Cleared existing colleges\n');

        // Transform and insert colleges in batches
        console.log('Transforming and importing colleges...');
        const batchSize = 100;
        let imported = 0;

        for (let i = 0; i < collegesData.length; i += batchSize) {
            const batch = collegesData.slice(i, i + batchSize);

            const transformedColleges = batch.map((college, index) => {
                // Clean up state and city data
                let state = college.state;
                let city = college.city;

                // If state looks like it might be in nirfRank field, swap them
                if (college.nirfRank && isNaN(college.nirfRank) && college.nirfRank.length > 4) {
                    state = college.nirfRank;
                }

                // Ensure we have valid city and state
                if (!city || city === 'nan') city = state || 'Unknown';
                if (!state || state === 'nan') state = 'India';

                const slug = generateSlug(college.name);
                const ranking = college.nirfRank !== 'nan' && !isNaN(college.nirfRank) ? parseInt(college.nirfRank) : Math.floor(Math.random() * 500) + 1;
                const established = Math.floor(Math.random() * 40) + 1980; // 1980-2020

                return {
                    slug: `${slug}-${i + index}`, // Add index to ensure uniqueness
                    name: college.name,
                    description: generateDescription(college.name, city, state),
                    shortDescription: generateShortDescription(college.name),
                    image: `https://picsum.photos/seed/${slug}/800/400`,
                    logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(college.name)}&size=200`,
                    location: `${city}, ${state}`,
                    city: city,
                    state: state,
                    established: established,
                    type: getCollegeType(college.name),
                    accreditation: Math.random() > 0.3 ? 'NAAC A+' : 'NAAC A',
                    rating: parseFloat((Math.random() * 2 + 3).toFixed(1)), // 3.0-5.0 as Number
                    ranking: ranking,
                    status: 'published',
                    facilities: generateFacilities(),
                    courses: generateCourses(college.name),
                    feeStructure: [
                        { year: '1st Year', tuition: Math.floor(Math.random() * 150000) + 50000, hostel: 80000, other: 20000 },
                        { year: '2nd Year', tuition: Math.floor(Math.random() * 150000) + 50000, hostel: 85000, other: 15000 }
                    ],
                    placement: generatePlacement(),
                    eligibility: generateEligibility(college.name)
                };
            });

            try {
                await College.insertMany(transformedColleges);
                imported += transformedColleges.length;
                console.log(`Imported ${imported} / ${collegesData.length} colleges...`);
            } catch (err) {
                console.error(`Error in batch ${i}-${i + batchSize}:`, err.message);
                // Continue with next batch
            }
        }

        console.log(`\n✅ Successfully imported ${imported} colleges to MongoDB!`);
        console.log('\nDatabase Statistics:');
        const stats = {
            total: await College.countDocuments(),
            published: await College.countDocuments({ status: 'published' }),
            government: await College.countDocuments({ type: 'Government' }),
            private: await College.countDocuments({ type: 'Private' })
        };
        console.log(`- Total: ${stats.total}`);
        console.log(`- Published: ${stats.published}`);
        console.log(`- Government: ${stats.government}`);
        console.log(`- Private: ${stats.private}`);

        process.exit(0);
    } catch (error) {
        console.error('Error seeding colleges:', error);
        process.exit(1);
    }
};

seedColleges();
