import express from "express";
import { body } from "express-validator";
import {
  signup,
  login,
  logout,
  forgetPassword,
  resetPassword,
  updatePassword,
  getUserDetails,
  updateUser,
  verifySignup,
} from "../Controllers/auth.controller.js";
import authenticate from "../Middleware/authenticate.js";

const router = express.Router();

// Create a new user using: POST "/api/auth/signup". Doesn't require Auth
router.post(
  "/signup",
  [
    body("firstName", "firstName must be at least 3 characters long").isLength({
      min: 3,
    }),
    body("lastName", "lastName must be at least 3 characters long").isLength({
      min: 3,
    }),
    body("email", "Enter a valid email").isEmail(),
    body("password", "Password must be at least 5 characters").isLength({
      min: 5,
    }),
    body("role")
      .optional()
      .isIn(["user", "seller"])
      .withMessage("Role must be either 'user' or 'seller'"),
  ],
  signup
);

// Verify signup using: POST "/api/auth/signup/verify". No Auth required
router.post(
  "/signup/verify",
  [
    body("email", "Enter a valid email").isEmail(),
    body("otp", "OTP must be 6 digits long").isLength({ min: 6, max: 6 }),
  ],
  verifySignup
);

// Login using: POST "/api/auth/login". No Auth required
router.post(
  "/login",
  [
    body("email", "Enter a valid email").isEmail(),
    body("password", "Password must be at least 5 characters").isLength({
      min: 5,
    }),
  ],
  login
);

// Logout using: GET "/api/auth/logout". No Auth required
router.get("/logout", logout);

// Forget Password using: POST "/api/auth/password/forget". No Auth required
router.post(
  "/password/forget",
  [body("email", "Enter a valid email").isEmail()],
  forgetPassword
);

// Reset Password using: POST "/api/auth/password/reset". No Auth required
router.post(
  "/password/reset",
  [
    body("email", "Enter a valid email").isEmail(),
    body("otp", "OTP must be 6 digits long").isLength({ min: 6, max: 6 }),
    body("password", "Password must be at least 5 characters").isLength({
      min: 5,
    }),
  ],
  resetPassword
);

// Update password using: POST "/api/auth/password/update". Requires Auth
router.post(
  "/password/update",
  authenticate,
  [
    body("oldPassword", "oldPassword must be at least 5 characters").isLength({
      min: 5,
    }),
    body("newPassword", "newPassword must be at least 5 characters").isLength({
      min: 5,
    }),
  ],
  updatePassword
);

// Get user details using: GET "/api/auth/user". Requires Auth
router.get("/user", authenticate, getUserDetails);

// Update user using: POST "/api/auth/user/update". Requires Auth
router.post(
  "/user/update",
  authenticate,
  [
    body("firstName", "firstName must be at least 3 characters long").isLength({ min: 3 }).optional(),
    body("lastName", "lastName must be at least 3 characters long").isLength({ min: 3 }).optional(),
    body("email", "Enter a valid email").isEmail().optional(),
    body("role").optional().isIn(["user", "seller"]).withMessage("Role must be either 'user' or 'seller'"),
    body("profilePic", "Enter a valid URL").isURL().optional(),
  ],
  updateUser
);

export default router;
