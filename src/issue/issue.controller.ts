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


 try {
        const { sort, type, status } = req.query

        const result = await issueService.getAllIssueFromDB(
            sort as string,
            type as string,
            status as string
        )

        res.status(200).json({
            success: true,
            data: result
        })

    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
            error: error
        })
    }

}


const getSingleIssue = async(req:Request,res:Response)=>{
    const {id} = req.params;
    // console.log(id);

    try {
      const issue = await issueService.getIssueByIdFromDB(id as string)
        
        if (!issue) {
            res.status(404).json({
                success: false,
                message: "Issue not found"
            })
            return
        }

        res.status(200).json({
            success: true,
            data: issue
        })

    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
    

}


const updateIssue = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const { title, description, type } = req.body
        const currentUser = req.user

        const issue = await issueService.getIssueByIdFromDB(id as string)


        if (!issue) {
            res.status(404).json({
                success: false,
                message: "Issue not found"
            })
            return
        }

        if (currentUser?.role === 'contributor') {

            if (currentUser.id !== issue.reporter.id) {
                res.status(403).json({
                    success: false,
                    message: "Forbidden — you can only update your own issues"
                })
                return
            }
        }
            const updated = await issueService.updateIssueInDB(id as string, { title, description, type })

        res.status(200).json({
            success: true,
            message: "Issue updated succesfully",
            data: updated
        })

    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}



const deleteIssue = async(req: Request, res: Response) => {
   
  try {
      const {id} = req.params
    const result = await issueService.deletIssueFromDB(id as string)


    if(result.rowCount===0){
           res.status(404).json({
        success:false,
        message: "Issue not found",
        data:{}
         
      })
    }

  res.status(200).json({
    success:true,
    message:"Issue Deleted successfully",
    data: {}
   })
  }catch (error:any) {
    res.status(500).json({
        success:false,
        message: error.message,
        error:error,
         
      })
   }

}






export const issueController = {createIssue,getAllIssue,getSingleIssue, updateIssue,deleteIssue}
