const College = require('../models/College');

exports.getDashboardStats = async (req, res) => {
    try {
        const totalColleges = await College.countDocuments();
        const published = await College.countDocuments({ status: 'published' });
        const drafts = await College.countDocuments({ status: 'draft' });

        // Count total unique courses across all colleges
        const collegesWithCourses = await College.find({}, 'courses');
        const totalCourses = collegesWithCourses.reduce((sum, college) => sum + (college.courses?.length || 0), 0);

        res.json({
            totalColleges,
            published,
            drafts,
            totalCourses
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ message: 'Server error fetching dashboard stats' });
    }
};
