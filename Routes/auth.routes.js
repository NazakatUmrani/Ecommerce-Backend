import express from 'express';
import { body } from 'express-validator';
import { signup, login, logout, forgetPassword } from '../Controllers/auth.controller.js';

const router = express.Router();

// Create a new user using: POST "/api/auth/signup". Doesn't require Auth
router.post("/signup",
  [
    body("firstName", "First name must be at least 3 characters long").isLength({ min: 3 }),
    body("lastName", "Last name must be at least 3 characters long").isLength({ min: 3 }),
    body("email", "Enter a valid email").isEmail(),
    body("password", "Password must be at least 5 characters").isLength({
      min: 5,
    }),
  ],
  signup
);

// Login using: POST "/api/auth/login". No Auth required
router.post("/login", [body("email", "Enter a valid email").isEmail()], login);

// Logout using: GET "/api/auth/logout". No Auth required
router.get("/logout", logout);

// Logout using: GET "/api/auth/logout". No Auth required
router.get("/password/forget", [body("email", "Enter a valid email").isEmail()], forgetPassword);

export default router;