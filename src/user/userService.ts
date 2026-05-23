import config from "../config";
import { pool } from "../DB/index.t";
import type { USER } from "../types";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"
const createUserIntoDb=async(payLoad:USER)=>{
   const {name,email,password,role} = payLoad;
   
   const hashPassword = await bcrypt.hash(password,10)
 
    const result = await pool.query(`
    INSERT INTO users (name,email,password,role)
    VALUES ($1,$2,$3,$4) RETURNING *
    `,[name,email,hashPassword,role ?? 'contributor'])

     delete result.rows[0].password
     return result.rows[0]

}



const getAllUsersFromDb=async()=>{
 const result = await pool.query(`
    SELECT * FROM users
    `)

 return result
}
const loginUserFromDb=async(payLoad: 
    {email:string, password:string} )=>{
   
       const {email,password} = payLoad;
       
         const userData = await pool.query(`
      SELECT * FROM USERS WHERE email=$1
      `,[email])  
          
       
      if(userData.rows.length === 0){
         throw new Error("User not found")   
      }

    const user = userData.rows[0]

     const matchPassword = await     bcrypt.compare(password,user.password)

     if(!matchPassword){
        throw new Error("Invalid password")
     }

    
     const jwtPayload={
      id:user.id,
      name:user.name,
      role:user.role,
      email:user.email
     } 

     const token = jwt.sign(jwtPayload,config.jwt_access as string ,{expiresIn:"1d"})

     return {token,user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
    },}

}   
export const userService={
    createUserIntoDb,getAllUsersFromDb,loginUserFromDb
}