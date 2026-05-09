import type { Request, Response, NextFunction } from "express";

import 'dotenv/config'

const jwt = require('jsonwebtoken');

export const JWT_SECRET = process.env.JWT_SECRET

interface AuthRequest extends Request {
    userId?: string
}

export function auth(req: AuthRequest, res: Response, next: NextFunction) {
    const token = req.headers.authorization;

    if (typeof token == "string") {
        const decoded: {userId: string} = jwt.verify(token, JWT_SECRET)
        if (decoded) {
            req.userId = decoded.userId,
            next()
        }
    }else{
        return res.status(403).json({
            error: 'invalid credentials'
        })
    }
}

