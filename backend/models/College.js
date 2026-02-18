const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
    slug: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    description: String,
    shortDescription: String,
    image: String,
    logo: String,
    location: String,
    city: String,
    state: String,
    established: Number,
    type: {
        type: String,
        enum: ['Public', 'Private', 'Government', 'Deemed'],
        default: 'Private'
    },
    accreditation: String,
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    ranking: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft'
    },
    facilities: [String],
    courses: [{
        name: String,
        duration: String,
        fees: Number,
        eligibility: String,
        seats: Number
    }],
    feeStructure: [{
        year: String,
        tuition: Number,
        hostel: Number,
        other: Number
    }],
    placement: {
        percentage: Number,
        averagePackage: Number,
        highestPackage: Number,
        topRecruiters: [String],
        yearWiseData: [{
            year: String,
            placed: Number,
            averagePackage: Number,
            highestPackage: Number
        }]
    },
    eligibility: [{
        exam: String,
        cutoff: String,
        description: String
    }]
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            ret.id = ret._id;
            return ret;
        }
    },
    toObject: { virtuals: true }
});

// Explicitly define a virtual 'id' that maps to '_id'
collegeSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

module.exports = mongoose.model('College', collegeSchema);
