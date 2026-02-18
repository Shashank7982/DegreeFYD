const mongoose = require('mongoose');
const College = require('./models/College');
const dotenv = require('dotenv');

dotenv.config();

async function checkSlugs() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const names = [
            'Indian Institute of Technology Bombay',
            'Birla Institute of Technology and Science, Pilani',
            'National Institute of Design',
            'Delhi Technological University',
            'Vellore Institute of Technology'
        ];

        let output = '--- College Slug Check ---\n';
        for (const name of names) {
            const college = await College.findOne({ name: new RegExp(name, 'i') });
            if (college) {
                output += `Found "${name}": ${college.slug}\n`;
            } else {
                output += `Not found: "${name}"\n`;
                const partial = name.split(' ').slice(0, 2).join(' ');
                const colleges = await College.find({ name: new RegExp(partial, 'i') }).limit(3);
                if (colleges.length > 0) {
                    output += `  Similar colleges for "${partial}":\n`;
                    colleges.forEach(c => output += `    - ${c.name}: ${c.slug}\n`);
                }
            }
        }
        require('fs').writeFileSync('slugCheckResult.txt', output);
        console.log('Results written to slugCheckResult.txt');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkSlugs();
