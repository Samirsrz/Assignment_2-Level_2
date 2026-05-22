
import dotenv from "dotenv"
import path from "path"

dotenv.config({ 
    path:path.join(process.cwd(),".env")
});

const config ={
   port: process.env.PORT,
   connectionString:process.env.CONNECTION_STRING,
   jwt_access:process.env.JWT_SECRET,
   jwt_refresh_token: process.env.JWT_REFRESH_SECRET
}
export default config