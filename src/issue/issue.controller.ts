import type { Request, Response } from "express";
import { issueService } from "./issue.service";


const createIssue = async(req:Request,res:Response)=>{
try {
    const { title, description, type } = req.body
        const reporter_id = req.user?.id

    const issue = await issueService.createIssueIntoDB({
        title,description,type,reporter_id
    })
       res.status(201).json({
            success: true,
            message: "Issue created successfully",
            data: issue
        })
     

} catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        })
}
}



const getAllIssue=async(req:Request,res:Response)=>{

    try{
   const result = await issueService.getAllIssueFromDB()
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




export const issueController = {createIssue,getAllIssue}
