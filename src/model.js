const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
mongoose.connect('mongodb://localhost:27017/mytodo')
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    plan: {
        type: String,
        enum: ["free", "pro"],
        default: "free"
    },
    stripeCustomerId: {
        type: String,
        default: null
    },
    planExpiresAt: {
        type: Date,
        default: null,
    }
})
const noteSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true

    },
    content: String,
    color: String,
    pinned: Boolean,
    time: { type: Date, default: Date.now }
})

const userModel = mongoose.model('User', userSchema);

const noteModel = mongoose.model('Note', noteSchema);



module.exports = {
    userModel,
    noteModel
}