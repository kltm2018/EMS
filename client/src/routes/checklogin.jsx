import { Navigate } from "react-router-dom"
import { useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { HandleGetEmployees } from "../redux/Thunks/EmployeeThunk"

export const CheckLogin = ({ children }) => {
    const dispatch = useDispatch()
    const { isAuthenticated, is_verified } = useSelector((state) => state.employeereducer)

    useEffect(() => {
        dispatch(HandleGetEmployees({ apiroute: "CHECKELOGIN" }))
    }, [])

    if (isAuthenticated && is_verified) {
        return <Navigate to={"/auth/employee/employee-dashboard"} />
    }

    return children
}