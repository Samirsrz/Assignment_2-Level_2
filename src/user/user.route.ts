import { Router, type Request, type Response } from "express";
import { userController } from "./user.controller";
import auth from "../middleware/auth";


const router = Router()

router.post('/signup',userController.createUser)
router.get('/', userController.getAllUsers)
router.post('/login',userController.loginUser)

export const userRoute=router