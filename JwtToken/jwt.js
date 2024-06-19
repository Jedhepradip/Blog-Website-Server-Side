import jwt from "jsonwebtoken"
import dotenv from 'dotenv';
dotenv.config();

const jwtAuthMiddleware = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) return res.status(401).json({ message: "Token Not Found" });

    const token = authorization.split(' ')[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        req.user = decoded;
        next();
    } catch (error) {
        console.error(error);
        return res.status(401).json({ message: "Invalid token" });
    }
};

const generateToken = (userDate) => {
    if (!process.env.SECRET_KEY) {
        console.error("SECRET_KEY is not defined in the environment variables");
        throw new Error("SECRET_KEY is not defined");
    }
    // return jwt.sign(userDate, process.env.SECRET_KEY, { expiresIn: "5d" });
    return jwt.sign(userDate, process.env.SECRET_KEY);
}

export { jwtAuthMiddleware, generateToken };
