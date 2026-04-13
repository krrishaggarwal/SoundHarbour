export const adminMiddleware = (req, res, next) => {
    try {
        if (!req.role) {
            return res.status(401).json({ msg: "Unauthorized: No role found" });
        }

        if (req.role !== "admin") {
            return res.status(403).json({ msg: "Admin access only" });
        }

        next();
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};