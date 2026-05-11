import mongoose, { Document } from 'mongoose'
mongoose.connect('mongodb://localhost:27017/mytodo')
interface user extends Document {
    username: string,
    email: string,
    password: string,
    plan: string,
    stripeCustomerId: string,
    planExpiresAt: Date
}

interface notes {
    userId: string,
    content: string,
    pinned: boolean,
    time: Date,
}
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

export const userModel = mongoose.model<user>('User', userSchema);

export const noteModel = mongoose.model<notes>('Note', noteSchema);


