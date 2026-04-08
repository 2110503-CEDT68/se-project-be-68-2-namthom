const mongoose = require('mongoose');

const MassageShopSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true,'Please add a name'],
        unique: true,
        trim: true,
        maxlength:[100,'Name can not be more than 100 characters']
    },
    address:{
        type: String,
        required: [true,'Please add an address']
    },
    location:{
        type: String,
        required: [true,'Please add a location']
    },
    tel:{
        type: String,
        required: [true,'Please add a telephone number']
    },
    map:{
        type: String,
        required: [true,'Please add a map URL']
    },
    openTime:{
        type: String,
        required: [true,'Please add open time']
    },
    closeTime:{
        type: String,
        required: [true,'Please add close time']
    },
    priceRangeMin:{
        type: Number,
        required: [true,'Please add minimum price range']
    },
    priceRangeMax:{
        type: Number,
        required: [true,'Please add maximum price range']
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual populate services
MassageShopSchema.virtual('services', {
    ref: 'MassageService',
    localField: '_id',
    foreignField: 'shop',
    justOne: false
});

// Virtual populate reservations
MassageShopSchema.virtual('reservations', {
    ref: 'Reservation',
    localField: '_id',
    foreignField: 'shop',
    justOne: false
});

module.exports=mongoose.model('MassageShop',MassageShopSchema);