import { Router } from "express";
import { issueController } from "./issue.controller";
import auth from "../middleware/auth";


const router = Router()

router.post('/',auth("contributor","maintainer"), issueController.createIssue)


router.get('/',issueController.getAllIssue)


router.get('/:id',issueController.getSingleIssue)







export const issuesRouter = router