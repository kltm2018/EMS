import { useState, useEffect, useRef } from "react"
import { SignIn } from "../../components/common/sign-in.jsx"
import { useDispatch, useSelector } from "react-redux"
import { HandlePostEmployees, HandleGetEmployees } from "../../redux/Thunks/EmployeeThunk.js"
import LoadingBar from 'react-top-loading-bar'
import { useNavigate } from 'react-router-dom'
import { CommonStateHandler } from "../../utils/commonhandler.js"

export const EmployeeLogin = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const loadingbar = useRef(null)
    const EmployeeState = useSelector((state) => state.employeereducer)
    const [signinform, set_signinform] = useState({
        email: "",
        password: "",
    })

    const handlesigninform = (event) => {
        CommonStateHandler(signinform, set_signinform, event)
    }

    const handlesigninsubmit = async (e) => {
        e.preventDefault();
        loadingbar.current.continuousStart();
        dispatch(HandlePostEmployees({ apiroute: "LOGIN", data: signinform }))
    }

    useEffect(() => {
        if (!EmployeeState.isAuthenticated) {
            dispatch(HandleGetEmployees({ apiroute: "CHECKELOGIN" }))
        } else {
            if (EmployeeState.is_verified) {
                loadingbar.current.complete()
                navigate("/auth/employee/employee-dashboard")
            } else {
                loadingbar.current.complete()
                navigate("/auth/employee/verify-email")
            }
        }
    }, [EmployeeState.isAuthenticated, EmployeeState.is_verified])

    if (EmployeeState.error.status) {
        loadingbar.current.complete()
    }

    return (
        <div className="employee-login-container">
            <LoadingBar ref={loadingbar} />
            <div className="employee-login-content flex justify-center items-center h-[100vh]">
                <SignIn image={"../../src/assets/Employee-Welcome.jpg"} handlesigninform={handlesigninform} handlesigninsubmit={handlesigninsubmit} targetedstate={EmployeeState} statevalue={signinform} redirectpath={"/auth/employee/forgot-password"} />
            </div>
        </div>
    )
}