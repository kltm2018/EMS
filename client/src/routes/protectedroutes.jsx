import { Navigate, useLocation } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import { useEffect } from "react"
import { HandleGetEmployees } from "../redux/Thunks/EmployeeThunk"

export const ProtectedRoutes = ({ children }) => {
    const { isAuthenticated, is_verified } = useSelector((state) => state.employeereducer)
    const dispatch = useDispatch()
    const location = useLocation()

    useEffect(() => {
        dispatch(HandleGetEmployees({ apiroute: "CHECKELOGIN" }))
    }, [isAuthenticated])

    if (!isAuthenticated) {
        return <Navigate to="/auth/employee/login" state={{ from: location }} replace />
    }

    if (!is_verified) {
        return <Navigate to="/auth/employee/verify-email" state={{ from: location }} replace />
    }

    return children
}