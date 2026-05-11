
import type { Response, NextFunction } from "express"
import type { AuthRequest } from "../types/auth.ts"
const { userModel, noteModel } = require('../model')

export async function checkPro(req: AuthRequest, res: Response, next: NextFunction) {
    const userId = req.userId;
    // console.log(userId)

    if (typeof userId === "string") {
        const user = await userModel.findById(userId)
        if (user.plan !== 'pro') {
            const note = await noteModel.countDocuments({ userId: userId });
            let ucontent = req.body.ncontent;
            //  console.log(ucontent.length)
            if (note > 5 || ucontent.length >= 200) {
                return res.status(429).json({ message: 'limit reached' })
            }

        }
    }else{
        return res.status(403).json({error: 'invalid userId'})
    }


    next();
}
