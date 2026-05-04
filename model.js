const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
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
    time: {type: Date, default: Date.now}
})

const userModel = mongoose.model('User', userSchema);

const noteModel = mongoose.model('Note', noteSchema);


userSchema.pre("save", (next)=> {
    const user = this;
    if(!user.isModified("password")){
        return next()
    }

    bcrypt.genSalt(10, (err,salt)=> {
        if(err){
            return next(err)
        }
        bcrypt.hash(user.password, salt, (err, hash)=> {
            if(err){
                return next(err)
            }
            user.password = hash
            next();
        })
    })
})

userSchema.methods.comparePassword = function (candidate){
    const storedHash = this.password;
    return new Promise((resolve, reject)=> {
        bcrypt.compare(candidate, storedHash, (err, isMatch)=>{
            if(err){
                return reject(err)
                resolve(isMatch);
            }
        })
    })
}

module.exports = {
    userModel,
    noteModel
}