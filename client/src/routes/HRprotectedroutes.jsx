import { HandleGetHumanResources } from "../redux/Thunks/HRThunk.js"
import { useDispatch, useSelector } from "react-redux"
import { useEffect } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { Loading } from "../components/common/loading.jsx"

export const HRProtectedRoutes = ({ children }) => {
    const dispatch = useDispatch()
    const HRState = useSelector((state) => state.HRReducer)
    const location = useLocation()

    useEffect(() => {
        if (!HRState.isAuthenticated || !HRState.isVerified || !HRState.isAuthourized) {
            dispatch(HandleGetHumanResources({ apiroute: "CHECKLOGIN" }))
            dispatch(HandleGetHumanResources({ apiroute: "CHECK_VERIFY_EMAIL" }))
        }
    }, [
        HRState.isAuthenticated,
        HRState.isVerified,
        HRState.isAuthourized,
        HRState.error.content,
    ])

    if (HRState.isLoading) {
        return <Loading />
    }

    if (!HRState.isAuthenticated) {
        return <Navigate to="/auth/HR/login" state={{ from: location }} replace />
    }

    if (!HRState.isVerified) {
        return <Navigate to="/auth/HR/verify-email" state={{ from: location }} replace />
    }

    if (!HRState.isAuthourized) {
        return <Navigate to="/auth/HR/signup" state={{ from: location }} replace />
    }

    return children
}