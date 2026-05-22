import type { NextFunction, Request, Response } from "express"
import type { ROLES } from "../types"
import jwt, { type JwtPayload } from "jsonwebtoken"
import config from "../config"
import { pool } from "../DB/index.t"

const auth=(...roles:ROLES[])=>{
     
    return async(req:Request,res:Response,next:NextFunction)=>{     
       try {
           
        const token = req.headers.authorization

        if(!token){
      return  res.status(401).json({
        success:false,
        message:"UNAUTHORIZED ACCESS"
      })
     }
        const decoded = jwt.verify(token as string,config.jwt_access as string) as JwtPayload

      const userData = await pool.query(`
        SELECT * FROM users WHERE email =$1
        `,[decoded.email])



     const user = userData.rows[0]

        if(userData.rows.length===0){
            res.status(404).json({
        success:false,
        message:"User not found"
    })
        } 


        if(roles.length && !roles.includes(user.role)){
        res.status(403).json({
        success:false,
        message:"Forbidden"
    })
     
  }




     req.user =decoded

          next()
        
          

       } catch (error) {
          next(error)
       }

     }
}

export default auth