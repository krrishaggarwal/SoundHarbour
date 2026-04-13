import jwt from "jsonwebtoken";

export const userJwtMiddleware = (req, res, next) => {
    try {
        const token = req.header("x-auth-token");

        if (!token) {
            return res.status(401).json({ msg: "No token, authorization denied" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded || !decoded.id) {
            return res.status(401).json({ msg: "Invalid token payload" });
        }

        req.userId = decoded.id;
        req.role = decoded.role;

        next();

    } catch (err) {
        console.error(err.message);
        return res.status(401).json({ msg: "Token is not valid" });
    }
};