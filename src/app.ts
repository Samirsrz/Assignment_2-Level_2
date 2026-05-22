
import express, { type Application, type Request, type Response } from "express"
import  { userRoute } from "./user/user.route"
import { issuesRouter } from "./issue/issue.route"
const app:Application = express()

app.use(express.json())



app.use("/api/auth",userRoute)
app.use("/api/issues",issuesRouter)

app.get('/', (req:Request, res:Response) => {
  res.send('Hello World!')
})

export default app;