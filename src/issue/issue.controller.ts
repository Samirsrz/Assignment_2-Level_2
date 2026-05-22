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


export const issueController = {createIssue}
