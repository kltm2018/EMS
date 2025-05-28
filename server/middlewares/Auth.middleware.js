import jwt from 'jsonwebtoken'

// Nhân viên thường
export const VerifyEmployeeToken = (req, res, next) => {
    const token = req.cookies.EMtoken
    if (!token) {
        return res.status(401).json({ success: false, message: "Unauthorized access", gologin : true })
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (!decoded || decoded.EMrole !== "Employee") {
            res.clearCookie("EMtoken")
            return res.status(403).json({ success: false, message: "unauthenticated employee", gologin : true })
        }
        req.EMid = decoded.EMid
        req.EMrole = decoded.EMrole
        req.ORGID = decoded.ORGID
        next()
    } catch (error) {
        return res.status(500).json({ success: false, message: "internal server error", error: error })
    }
}

// HR
export const VerifyHRToken = (req, res, next) => {
    const token = req.cookies.HRtoken
    if (!token) {
        return res.status(401).json({ success: false, message: "Unauthorized access", gologin : true })
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (!decoded || !(decoded.HRrole === "HR-Admin" || decoded.HRrole === "HR-Staff")) {
            res.clearCookie("HRtoken")
            return res.status(403).json({ success: false, message: "unauthenticated HR", gologin : true })
        }
        req.HRid = decoded.HRid
        req.ORGID = decoded.ORGID
        req.Role = decoded.HRrole
        next()
    } catch (error) {
        return res.status(500).json({ success: false, message: "internal server error", error: error })
    }
}

// Trưởng phòng
export const VerifyManagerToken = (req, res, next) => {
    const token = req.cookies.ManagerToken
    if (!token) {
        return res.status(401).json({ success: false, message: "Unauthorized access", gologin : true })
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (!decoded || decoded.EMrole !== "Manager") {
            res.clearCookie("ManagerToken")
            return res.status(403).json({ success: false, message: "unauthenticated manager", gologin : true })
        }
        req.EMid = decoded.EMid
        req.EMrole = decoded.EMrole
        req.ORGID = decoded.ORGID
        req.DepartmentID = decoded.DepartmentID
        next()
    } catch (error) {
        return res.status(500).json({ success: false, message: "internal server error", error: error })
    }
}

// Kế toán
export const VerifyAccountantToken = (req, res, next) => {
    const token = req.cookies.AccountantToken
    if (!token) {
        return res.status(401).json({ success: false, message: "Unauthorized access", gologin : true })
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (!decoded || decoded.EMrole !== "Accountant") {
            res.clearCookie("AccountantToken")
            return res.status(403).json({ success: false, message: "unauthenticated accountant", gologin : true })
        }
        req.EMid = decoded.EMid
        req.EMrole = decoded.EMrole
        req.ORGID = decoded.ORGID
        next()
    } catch (error) {
        return res.status(500).json({ success: false, message: "internal server error", error: error })
    }
}