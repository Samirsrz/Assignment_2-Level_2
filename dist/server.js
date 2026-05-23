

   import { createRequire } from 'module';

   const require = createRequire(import.meta.url);

  

// src/app.ts
import express from "express";

// src/user/user.route.ts
import { Router } from "express";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  port: process.env.PORT,
  connectionString: process.env.CONNECTION_STRING,
  jwt_access: process.env.JWT_SECRET,
  jwt_refresh_token: process.env.JWT_REFRESH_SECRET
};
var config_default = config;

// src/DB/index.t.ts
import { Pool } from "pg";
var pool = new Pool({
  connectionString: config_default.connectionString
});
var initDB = async () => {
  try {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(20) NOT NULL DEFAULT 'contributor',
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
        );
     `);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS issues (
    id           SERIAL PRIMARY KEY,
    title        VARCHAR(150) NOT NULL,
    description  TEXT NOT NULL,
    type         VARCHAR(20) NOT NULL CHECK (type IN ('bug', 'feature_request')),
    status       VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
    reporter_id  INTEGER NOT NULL,
    created_at   TIMESTAMP DEFAULT NOW(),
    updated_at   TIMESTAMP DEFAULT NOW()
);

`);
    console.log("Database connected");
  } catch (error) {
  }
};

// src/user/userService.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
var createUserIntoDb = async (payLoad) => {
  const { name, email, password, role } = payLoad;
  const hashPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(`
    INSERT INTO users (name,email,password,role)
    VALUES ($1,$2,$3,$4) RETURNING *
    `, [name, email, hashPassword, role ?? "contributor"]);
  delete result.rows[0].password;
  return result.rows[0];
};
var getAllUsersFromDb = async () => {
  const result = await pool.query(`
    SELECT * FROM users
    `);
  return result;
};
var loginUserFromDb = async (payLoad) => {
  const { email, password } = payLoad;
  const userData = await pool.query(`
      SELECT * FROM USERS WHERE email=$1
      `, [email]);
  if (userData.rows.length === 0) {
    throw new Error("User not found");
  }
  const user = userData.rows[0];
  const matchPassword = await bcrypt.compare(password, user.password);
  if (!matchPassword) {
    throw new Error("Invalid password");
  }
  const jwtPayload = {
    id: user.id,
    name: user.name,
    role: user.role,
    email: user.email
  };
  const token = jwt.sign(jwtPayload, config_default.jwt_access, { expiresIn: "1d" });
  return { token, user: {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
    updated_at: user.updated_at
  } };
};
var userService = {
  createUserIntoDb,
  getAllUsersFromDb,
  loginUserFromDb
};

// src/user/user.controller.ts
var createUser = async (req, res) => {
  try {
    const result = await userService.createUserIntoDb(req.body);
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create user"
    });
  }
};
var getAllUsers = async (req, res) => {
  try {
    const result = await userService.getAllUsersFromDb();
    res.status(200).json({
      success: true,
      message: "All users retrieved successfully",
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      error
    });
  }
};
var loginUser = async (req, res) => {
  try {
    const result = await userService.loginUserFromDb(req.body);
    res.status(200).json({
      success: true,
      message: "Login successful,",
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error
    });
  }
};
var userController = {
  createUser,
  getAllUsers,
  loginUser
};

// src/middleware/auth.ts
import jwt2 from "jsonwebtoken";
var auth = (...roles) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return res.status(401).json({
          success: false,
          message: "UNAUTHORIZED ACCESS"
        });
      }
      const decoded = jwt2.verify(token, config_default.jwt_access);
      const userData = await pool.query(`
        SELECT * FROM users WHERE email =$1
        `, [decoded.email]);
      const user = userData.rows[0];
      if (userData.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: "User not found"
        });
      }
      if (roles.length && !roles.includes(user.role)) {
        res.status(403).json({
          success: false,
          message: "Forbidden"
        });
        return;
      }
      req.user = decoded;
      next();
    } catch (error) {
      next(error);
    }
  };
};
var auth_default = auth;

// src/user/user.route.ts
var router = Router();
router.post("/signup", userController.createUser);
router.get("/", userController.getAllUsers);
router.post("/login", userController.loginUser);
var userRoute = router;

// src/issue/issue.route.ts
import { Router as Router2 } from "express";

// src/issue/issue.service.ts
var createIssueIntoDB = async (payLoad) => {
  const { title, description, type, reporter_id } = payLoad;
  const result = await pool.query(
    `
            INSERT INTO issues (title, description, type, reporter_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *
    `,
    [title, description, type, reporter_id]
  );
  return result.rows[0];
};
var getAllIssueFromDB = async (sort, type, status) => {
  const result = await pool.query(`SELECT * FROM issues`);
  const issues = result.rows;
  let filtered = issues;
  if (type) {
    filtered = filtered.filter((issue) => issue.type === type);
  }
  if (status) {
    filtered = filtered.filter((issue) => issue.status === status);
  }
  if (sort === "oldest") {
    filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  } else {
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  const issuesWithReporter = [];
  for (const issue of filtered) {
    const reporterResult = await pool.query(`
            SELECT id, name, role FROM users WHERE id = $1
        `, [issue.reporter_id]);
    issuesWithReporter.push({
      id: issue.id,
      title: issue.title,
      description: issue.description,
      type: issue.type,
      status: issue.status,
      reporter: reporterResult.rows[0],
      created_at: issue.created_at,
      updated_at: issue.updated_at
    });
  }
  return issuesWithReporter;
};
var getIssueByIdFromDB = async (id) => {
  const result = await pool.query(`
        SELECT * FROM issues WHERE id = $1
    `, [id]);
  const issue = result.rows[0];
  if (!issue) {
    return null;
  }
  const reporterResult = await pool.query(`
        SELECT id, name, role FROM users WHERE id = $1
    `, [issue.reporter_id]);
  return {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: reporterResult.rows[0],
    created_at: issue.created_at,
    updated_at: issue.updated_at
  };
};
var updateIssueInDB = async (id, payLoad) => {
  const { title, description, type } = payLoad;
  const result = await pool.query(`
        UPDATE issues SET
            title       = COALESCE($1, title),
            description = COALESCE($2, description),
            type        = COALESCE($3, type),
            updated_at  = NOW()
        WHERE id = $4
        RETURNING *
    `, [title, description, type, id]);
  return result.rows[0];
};
var deletIssueFromDB = async (id) => {
  const result = await pool.query(`
        
         Delete from issues where id=$1
         `, [id]);
  return result;
};
var issueService = { createIssueIntoDB, getAllIssueFromDB, getIssueByIdFromDB, updateIssueInDB, deletIssueFromDB };

// src/issue/issue.controller.ts
var createIssue = async (req, res) => {
  try {
    const { title, description, type } = req.body;
    const reporter_id = req.user?.id;
    const issue = await issueService.createIssueIntoDB({
      title,
      description,
      type,
      reporter_id
    });
    res.status(201).json({
      success: true,
      message: "Issue created successfully",
      data: issue
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
var getAllIssue = async (req, res) => {
  try {
    const { sort, type, status } = req.query;
    const result = await issueService.getAllIssueFromDB(
      sort,
      type,
      status
    );
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error
    });
  }
};
var getSingleIssue = async (req, res) => {
  const { id } = req.params;
  try {
    const issue = await issueService.getIssueByIdFromDB(id);
    if (!issue) {
      res.status(404).json({
        success: false,
        message: "Issue not found"
      });
      return;
    }
    res.status(200).json({
      success: true,
      data: issue
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
var updateIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, type } = req.body;
    const currentUser = req.user;
    const issue = await issueService.getIssueByIdFromDB(id);
    if (!issue) {
      res.status(404).json({
        success: false,
        message: "Issue not found"
      });
      return;
    }
    if (currentUser?.role === "contributor") {
      if (currentUser.id !== issue.reporter.id) {
        res.status(403).json({
          success: false,
          message: "Forbidden \u2014 you can only update your own issues"
        });
        return;
      }
    }
    const updated = await issueService.updateIssueInDB(id, { title, description, type });
    res.status(200).json({
      success: true,
      message: "Issue updated succesfully",
      data: updated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
var deleteIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await issueService.deletIssueFromDB(id);
    if (result.rowCount === 0) {
      res.status(404).json({
        success: false,
        message: "Issue not found",
        data: {}
      });
    }
    res.status(200).json({
      success: true,
      message: "Issue Deleted successfully",
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error
    });
  }
};
var issueController = { createIssue, getAllIssue, getSingleIssue, updateIssue, deleteIssue };

// src/issue/issue.route.ts
var router2 = Router2();
router2.post("/", auth_default("contributor", "maintainer"), issueController.createIssue);
router2.get("/", issueController.getAllIssue);
router2.get("/:id", issueController.getSingleIssue);
router2.patch("/:id", auth_default("contributor", "maintainer"), issueController.updateIssue);
router2.delete("/:id", auth_default("maintainer"), issueController.deleteIssue);
var issuesRouter = router2;

// src/middleware/globalErrorHandler.ts
var globalErrorHandler = (err, req, res, next) => {
  res.status(500).json({
    success: false,
    message: err.message || "Internal server error"
  });
};

// src/app.ts
var app = express();
app.use(express.json());
app.use("/api/auth", userRoute);
app.use("/api/issues", issuesRouter);
app.get("/", (req, res) => {
  res.send("Hello World!");
});
app.use(globalErrorHandler);
var app_default = app;

// src/server.ts
var main = () => {
  initDB();
  app_default.listen(config_default.port, () => {
    console.log(`Example app listening on port ${config_default.port}`);
  });
};
main();
//# sourceMappingURL=server.js.map