require('dotenv').config()
const express = require('express');
const app = express();
const { auth, JWT_SECRET } = require('./authmiddleware')
const { userModel, noteModel } = require('./model')
const jwt = require('jsonwebtoken');
const path = require('path')
const bcrypt = require('bcrypt')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
app.use(express.json())


// POST ROUTE
// add note
app.post('/note', auth, async (req, res) => {
    const { ncontent, ncolor, npinned, ntime } = req.body;

    if (ncontent === '') {
        return res.status(422).json({ message: 'missing field' })
    }
    const newNote = await noteModel.create({
        content: ncontent,
        color: ncolor,
        pinned: npinned,
        time: ntime,
        userId: req.userId
    })

    return res.status(200).json({ message: 'note created' })
})

// singup 
app.post('/signup', async (req, res) => {
    const { uname, uemail, upassword } = req.body;

    if (!uname || !uemail || !upassword) {
        return res.status(400).json({ message: 'username email password required' })
    }

    if (upassword.length < 8) {
        return res.status(400).json({ message: 'password must be 8 characters' })
    }
    // const checkExists = userModel.find(u => u.username === username);
    const chekExists = await userModel.findOne({ email: uemail })
    if (chekExists) {
        return res.status(409).json({
            message: ' user already exists'
        })
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(upassword, salt);
    const newUser = await userModel.create({
        username: uname,
        email: uemail,
        password: hashedPassword
    })
    const token = jwt.sign({
        userId: newUser._id
    }, JWT_SECRET)

    return res.status(200).json({
        message: 'Signed up successfully',
        token: token
    })

})

// singin
app.post('/login', async (req, res) => {
    const { uemail, upassword } = req.body;

    if (!uemail || !upassword) {
        return res.status(400).json({ message: 'username email password required' })
    }

    if (upassword.length < 8) {
        return res.status(400).json({ message: 'password must be 8 characters' })
    }
    const token = req.headers.authorization;


    const user = await userModel.findOne({ email: uemail })

    if (!user) {
        return res.status(403).json({
            message: 'unauthorized access'
        })
    }
   
    const isPassword = await bcrypt.compare(upassword, user.password);
    if (isPassword) {
        const token = jwt.sign({
            userId: user._id
        }, JWT_SECRET)

        return res.json({
            token: token
        })
    } else {
        return res.status(403).json({
            message: 'incorrect credentials'
        })
    }

})


app.get('/subscribe', async(req,res)=> {

    const plan = req.query.plan;
  
    
    if(!plan){
        return res.json({message: 'plan not found'})
    }
    let priceId;

    switch(plan.toLowerCase()){
        case 'pro':
            priceId = 'price_1TThna9lXtYLLw8IhlOexiPY'
            break
        default:
            return res.json({message: 'plan not found'})
    }
    const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [
            {
            price: priceId,
            quantity: 1

            }
        ],
        success_url: 'http://localhost:8080/success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'http://localhost:8080/cancel'
    })
    res.redirect(session.url)
})

app.get('/success', async(req,res)=> {
    const session = await stripe.checkout.sessions.retrieve(req.query.session_id);

    res.send('subscribed')
})

app.get('/cancel', (req,res)=> {
    res.redirect('/')
})
app.delete('/notes/:id', auth, async (req, res) => {
    const id = req.params.id;
    console.log(id)
    if (!id) {
        return res.status(204).json({ message: 'content not found' })
    }

    const response = await noteModel.findByIdAndDelete(id)
    if (response) {
        return res.status(201).json({ message: 'note delted' })
    }
    else {
        return res.status(500).json({ message: 'something went wrong' })
    }

})

app.put('/pin/:id', auth, async (req, res) => {
    const id = req.query.id;

    if (!id) {
        return res.json({ message: 'empmty id' })
    }
    const note = await noteModel.findById(id);
    if (!note) {
        return res.json({ message: 'empmty id' })
    }
    const updatedTodo = await noteModel.findByIdAndUpdate(id,)
})


// GET ROUTES
// get notes auth
app.get('/notes', auth, async (req, res) => {
    const userNotes = await noteModel.find({ userId: req.userId });
    return res.status(200).json({ notes: userNotes })
})

// signup page
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'signup.html'))
})

//signin page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'login.html'))
})

//dashboard page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'))
})






app.listen(8080, () => {
    console.log(`app is listening on http://loaclhost:${8080}`);

})