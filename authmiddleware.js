const jwt = require('jsonwebtoken');
const JWT_SECRET = 'rowhit3855'

function auth(req,res,next){
    const token = req.headers.authorization;
    if(!token){
        return res.status(401).json({
            message: 'empty token'
        })
    }
    const decoded = jwt.verify(token, JWT_SECRET)
    if(decoded){
        req.userId =decoded.userId,
        next()
    }else{
        res.status(403).json({
            message: 'invalid credentials'
        })
    }
}

module.exports = {
    auth, JWT_SECRET
}