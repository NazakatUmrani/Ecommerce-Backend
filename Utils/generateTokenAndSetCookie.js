import jwt from "jsonwebtoken"

export const generateTokenAndSetCookie = (data, res) => {
    const token = jwt.sign(data, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });
    res.cookie("jwtToken", token, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true, //Prevent XSS attacks cross-site scripting attacks
        sameSite: "strict",
        secure: process.env.NODE_ENV !== "development",
    });
    return token;
}