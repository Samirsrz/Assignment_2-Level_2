import type { Request, Response } from "express";
import { userService } from "./userService";

const createUser =async(req:Request,res:Response)=>{
   try {
      
    const result= await userService.createUserIntoDb(req.body)
    res.status(201).json({
        success:true,
        message:"User registered successfully",
        data:result
    })
   } catch (error) {
     res.status(500).json({
        success:false,
        message:"Failed to create user"
     })
   }
}



const getAllUsers =async(req:Request,res:Response)=>{
try {

  const result = await userService.getAllUsersFromDb()
res.status(200).json({
        success:true,
        message:"All users retrieved successfully",
        data:result.rows
    })
}catch (error:any) {
        res.status(500).json({          
         message: error.message,
        error:error,     
        })                         
    }

}


const loginUser = async(req:Request, res:Response)=>{
  
try {
      const result = await userService.loginUserFromDb(req.body)
       
     res.status(200).json({
        success:true,
        message:"Login successful,",
        data: result
    })


} catch (error:any) {
      res.status(500).json({
        success:false,
         message: error.message,
        error:error,
    })

  }

}

 export const userController={
    createUser,getAllUsers,loginUser
}