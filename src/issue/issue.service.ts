import { pool } from "../DB/index.t"


const createIssueIntoDB =async(payLoad:{title:string,description:string,type:string,reporter_id: number})=>{
    const {title,description,type,reporter_id} = payLoad
        const result =  await pool.query(`
            INSERT INTO issues (title, description, type, reporter_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *
    `, [title, description, type, reporter_id]

     )
            
    return result.rows[0]           
 
}

export const issueService = {createIssueIntoDB}