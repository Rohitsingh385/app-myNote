
const {userModel, noteModel} = require('./model')

async function checkPro(req,res,next){
    const userId = req.userId;
   // console.log(userId)
    
    const user = await userModel.findById(userId)

    if(user.plan !== 'pro'){
        const note = await noteModel.countDocuments({userId: userId});
        let ucontent = req.body.ncontent;
      //  console.log(ucontent.length)
        if(note > 5 || ucontent.length >= 200){
            return res.status(429).json({message: 'limit reached'})
        }
        
    }
    next();
}

module.exports = {checkPro}