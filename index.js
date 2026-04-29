const express = require('express');
const app = express();
const { auth, JWT_SECRET } = require('./authmiddleware')
const { userModel, noteModel } = require('./model')
const jwt = require('jsonwebtoken');
const path = require('path')
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

    // const checkExists = userModel.find(u => u.username === username);
    const chekExists = await userModel.findOne({ email: uemail })
    if (chekExists) {
        return res.status(409).json({
            message: ' user already exists'
        })
    }
    const newUser = await userModel.create({
        username: uname,
        email: uemail,
        password: upassword
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
    const { uname, uemail, upassword } = req.body;
    const token = req.headers.authorization;


    const user = await userModel.findOne({ email: uemail })

    if (!user) {
        return res.status(403).json({
            message: 'unauthorized access'
        })
    }

    if (user.password === upassword) {
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

app.delete('/notes/:id', auth, (req, res) => {
    const id = req.query.id;
    console.log(id);
})

app.put('/note/:id', auth, (req, res) => {

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