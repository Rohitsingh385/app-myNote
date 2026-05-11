require('dotenv').config()
import express from 'express';
const app = express();
import { auth, JWT_SECRET } from './middleware/authmiddleware.js'
import { checkPro } from './middleware/checkProStatus.js'
import { userModel, noteModel } from './models/model.js'
import type { Response } from "express"
import jwt from 'jsonwebtoken'
import path from 'path'
import bcrypt from 'bcrypt'
import Stripe from "stripe"
import * as z from "zod"
import type { AuthRequest } from './types/auth.js';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)
app.use(express.json())

const noteData = z.object({
    ncontent: z.string(),
    ncolor: z.string(),
    npinned: z.boolean(),
    ntime: z.date(),
})

interface noteBody {
    ncontent: string,
    ncolor: string,
    npinned: boolean,
    ntime: Date,
}
const signUpData = z.object({
    uname: z.string(),
    uemail: z.string(),
    upassword: z.string()
})
interface signUpBody {
    uname: string,
    uemail: string,
    upassword: string
}

const loginData = z.object({
    uemail: z.string(),
    upassword: z.string()
})
interface loginBody {
    uemail: string,
    upassword: string
}

const IdParamsParam = z.object({
    id: z.string()
})
interface IdParams{
    id: string
}
app.post('/note', auth, checkPro, async (req: AuthRequest, res: Response) => {
    const { ncontent, ncolor, npinned, ntime }: noteBody = noteData.parse(req.body);

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

    return res.status(200).json({ newNote })
})

// signup 
app.post('/signup', async (req: AuthRequest, res: Response) => {

    const { uname, uemail, upassword } : signUpBody = signUpData.parse(req.body);

    if (uname === '' || uemail === '' || upassword === '') {
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

// signin
app.post('/login', async (req: AuthRequest, res: Response) => {
    
    const { uemail, upassword }: loginBody = loginData.parse(req.body);

    if (!uemail || !upassword) {
        return res.status(400).json({ message: 'username email password required' })
    }

    if (upassword.length < 8) {
        return res.status(400).json({ message: 'password must be 8 characters' })
    }

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

app.post('/subscribe', auth, async (req: AuthRequest, res: Response) => {

    const user = await userModel.findById(req.userId);
    if (!user) {
        return res.status(404).json({ message: 'user not found' });
    }

    let customer;
    if (user.stripeCustomerId) {
        customer = await stripe.customers.retrieve(user.stripeCustomerId);
    } else {
        customer = await stripe.customers.create({
            email: user.email,
            name: user.username,
        });
        user.stripeCustomerId = customer.id;
        await user.save();
    }

    const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        mode: 'subscription',
        line_items: [
            {
                price: 'price_1TThna9lXtYLLw8IhlOexiPY',
                quantity: 1
            }
        ],
        success_url: 'http://localhost:8080/success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'http://localhost:8080/cancel'
    });

    res.json({ url: session.url });
})

app.get('/success', async (req: AuthRequest, res: Response) => {
    const sessionId = req.query.session_id;
    if (!sessionId) {
        return res.status(400).send('Invalid session');
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === 'paid') {
        const customerId = session.customer;
        const user = await userModel.findOne({ stripeCustomerId: customerId });
        if (user) {
            user.plan = 'pro';
            await user.save();
        }
    }

    res.redirect('http://localhost/');
})

app.get('/user', auth, async (req: AuthRequest, res: Response) => {

    const userId = req.userId;

    const user = await userModel.find({ _id: userId }).select('-password');
    //console.log(user)
    res.status(201).json({ user })
})

app.get('/cancel', (req, res) => {
    res.redirect('/')
})

app.get('/billing-portal', auth, async (req: AuthRequest, res: Response) => {
    const user = await userModel.findById(req.userId);

    if (!user || !user.stripeCustomerId) {
        return res.status(400).json({ message: 'no subscription' });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: 'http://localhost:8080/'
    });

    res.json({ url: portalSession.url });
})

app.delete('/notes/:id', auth, async (req: AuthRequest, res: Response) => {
    const validatedParams : IdParams = IdParamsParam.parse(req.params);
    // console.log(id)
  

    const response = await noteModel.findByIdAndDelete(validatedParams.id)
    if (response) {
        return res.status(201).json({ message: 'note delted' })
    }
    else {
        return res.status(500).json({ message: 'something went wrong' })
    }

})

app.put('/pin/:id', auth, async (req: AuthRequest, res: Response) => {
    const validatedParams: IdParams = IdParamsParam.parse(req.params);

    const note = await noteModel.findById(validatedParams.id);
   

    if(note.pinned === false){
        note.pinned = true;
    }else{
        note.pinned = false;
    }
    await note.save();


})

// GET ROUTES
// get notes auth
app.get('/notes', auth, async (req: AuthRequest, res: Response) => {
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

//if user is pro user top show manage subscriotion
// if user not pro max chracter 100, max notes 5
// if user is pro no resrtiction 