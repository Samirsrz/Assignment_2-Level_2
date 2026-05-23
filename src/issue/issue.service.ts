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



// const getAllIssueFromDB = async()=>{
//       const result = await pool.query(`
//          SELECT * FROM issues
//          `)
//          return result;
// }

const getAllIssueFromDB = async (sort?: string, type?: string, status?: string) => {

    const result = await pool.query(`SELECT * FROM issues`)
    const issues = result.rows

  
    let filtered = issues
    if (type) {
        filtered = filtered.filter((issue) => issue.type === type)
    }

   
    if (status) {
        filtered = filtered.filter((issue) => issue.status === status)
    }

    if (sort === 'oldest') {
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    } else {
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    const issuesWithReporter = []

    for (const issue of filtered) {
        const reporterResult = await pool.query(`
            SELECT id, name, role FROM users WHERE id = $1
        `, [issue.reporter_id])

        issuesWithReporter.push({
            id: issue.id,
            title: issue.title,
            description: issue.description,
            type: issue.type,
            status: issue.status,
            reporter: reporterResult.rows[0],
            created_at: issue.created_at,
            updated_at: issue.updated_at
        })
    }

    return issuesWithReporter
}



const getIssueByIdFromDB = async (id: string) => {

   
    const result = await pool.query(`
        SELECT * FROM issues WHERE id = $1
    `, [id])

    const issue = result.rows[0]

    if (!issue) {
       return null;
    }

    const reporterResult = await pool.query(`
        SELECT id, name, role FROM users WHERE id = $1
    `, [issue.reporter_id])

    return {
        id: issue.id,
        title: issue.title,
        description: issue.description,
        type: issue.type,
        status: issue.status,
        reporter: reporterResult.rows[0],
        created_at: issue.created_at,
        updated_at: issue.updated_at
    }
}





const updateIssueInDB = async (id:string, payLoad:{
    title?:string,
    description?:string,
    type?:string
})=>{

    const {title,description,type} = payLoad

    const result = await pool.query(`
        UPDATE issues SET
            title       = COALESCE($1, title),
            description = COALESCE($2, description),
            type        = COALESCE($3, type),
            updated_at  = NOW()
        WHERE id = $4
        RETURNING *
    `, [title, description, type, id])
   

    return result.rows[0]

}





export const issueService = {createIssueIntoDB,getAllIssueFromDB,getIssueByIdFromDB, updateIssueInDB}