const College = require('../models/College');
const mongoose = require('mongoose');

// Get all colleges (public) with filters, search, pagination
exports.getColleges = async (req, res) => {
    try {
        const {
            search,
            city,
            type,
            minFee,
            maxFee,
            sort = 'ranking',
            page = 1,
            limit = 6
        } = req.query;

        // Build filter
        const filter = { status: 'published' };

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { city: { $regex: search, $options: 'i' } },
                { state: { $regex: search, $options: 'i' } }
            ];
        }

        if (city) {
            const cities = city.split(',');
            filter.city = { $in: cities.map(c => new RegExp(c, 'i')) };
        }

        if (type) {
            const types = type.split(',');
            filter.type = { $in: types };
        }

        if (minFee || maxFee) {
            filter['courses.fees'] = {};
            if (minFee) filter['courses.fees'].$gte = Number(minFee);
            if (maxFee) filter['courses.fees'].$lte = Number(maxFee);
        }

        // Build sort
        let sortOption = {};
        switch (sort) {
            case 'ranking':
                sortOption = { ranking: 1 };
                break;
            case 'rating':
                sortOption = { rating: -1 };
                break;
            case 'fees-low':
                sortOption = { 'courses.fees': 1 };
                break;
            case 'fees-high':
                sortOption = { 'courses.fees': -1 };
                break;
            case 'placement':
                sortOption = { 'placement.percentage': -1 };
                break;
            default:
                sortOption = { ranking: 1 };
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const colleges = await College.find(filter)
            .sort(sortOption)
            .skip(skip)
            .limit(limitNum);

        const total = await College.countDocuments(filter);

        res.json({
            data: colleges,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum)
        });
    } catch (error) {
        console.error('Get colleges error:', error);
        res.status(500).json({ message: 'Server error fetching colleges' });
    }
};

// Get college by slug (public)
exports.getCollegeBySlug = async (req, res) => {
    try {
        const college = await College.findOne({ slug: req.params.slug, status: 'published' });
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }
        res.json(college);
    } catch (error) {
        console.error('Get college by slug error:', error);
        res.status(500).json({ message: 'Server error fetching college' });
    }
};

// Get all colleges for admin
exports.getAllCollegesAdmin = async (req, res) => {
    try {
        const colleges = await College.find().sort({ createdAt: -1 });
        res.json(colleges);
    } catch (error) {
        console.error('Get all colleges admin error:', error);
        res.status(500).json({ message: 'Server error fetching colleges' });
    }
};

// Get college by ID (admin)
exports.getCollegeById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            console.warn(`Invalid College ID requested: ${req.params.id}`);
            return res.status(404).json({ message: 'College not found' });
        }
        const college = await College.findById(req.params.id);
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }
        res.json(college);
    } catch (error) {
        console.error('Get college by ID error:', error);
        res.status(500).json({ message: 'Server error fetching college' });
    }
};

// Create college (admin)
exports.createCollege = async (req, res) => {
    try {
        const collegeData = req.body;

        // Generate slug from name if not provided
        if (!collegeData.slug && collegeData.name) {
            collegeData.slug = collegeData.name
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '');
        }

        const college = await College.create(collegeData);
        res.status(201).json(college);
    } catch (error) {
        console.error('Create college error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'College with this slug already exists' });
        }
        res.status(500).json({ message: 'Server error creating college' });
    }
};

// Update college (admin)
exports.updateCollege = async (req, res) => {
    try {
        const college = await College.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        res.json(college);
    } catch (error) {
        console.error('Update college error:', error);
        res.status(500).json({ message: 'Server error updating college' });
    }
};

// Delete college (admin)
exports.deleteCollege = async (req, res) => {
    try {
        const college = await College.findByIdAndDelete(req.params.id);

        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        res.json({ message: 'College deleted successfully' });
    } catch (error) {
        console.error('Delete college error:', error);
        res.status(500).json({ message: 'Server error deleting college' });
    }
};

// Toggle college status (admin)
exports.toggleCollegeStatus = async (req, res) => {
    try {
        const college = await College.findById(req.params.id);

        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        college.status = college.status === 'published' ? 'draft' : 'published';
        await college.save();

        res.json(college);
    } catch (error) {
        console.error('Toggle status error:', error);
        res.status(500).json({ message: 'Server error toggling status' });
    }
};
