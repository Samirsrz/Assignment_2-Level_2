
import express, { type Application, type Request, type Response } from "express"
import  { userRoute } from "./user/user.route"
import { issuesRouter } from "./issue/issue.route"
import { globalErrorHandler } from "./middleware/globalErrorHandler"
const app:Application = express()

app.use(express.json())



app.use("/api/auth",userRoute)
app.use("/api/issues",issuesRouter)

app.get('/', (req:Request, res:Response) => {
  res.send('Hello World!')
})


app.use(globalErrorHandler)


export default app;