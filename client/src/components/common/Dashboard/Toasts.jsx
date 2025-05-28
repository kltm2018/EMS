import { useToast } from "../../../hooks/use-toast.js"
import { Button } from "@/components/ui/button"
import { ToastAction } from "@/components/ui/toast"
import { useSelector, useDispatch } from "react-redux"
import { useEffect, useRef, useContext } from "react"
import { HandlePostHREmployees } from "../../../redux/Thunks/HREmployeesThunk.js"
import { AuthContext } from "../../../context/AuthContext"

export const FormSubmitToast = ({ formdata }) => {
    const { toast } = useToast()
    const dispatch = useDispatch()
    const HREmployeesState = useSelector((state) => state.HREmployeesPageReducer)
    const { auth } = useContext(AuthContext);

    const SubmitFormData = async () => {
        if (auth && (auth.role === "HR-Admin" || auth.role === "HR-Staff")) {
            dispatch(HandlePostHREmployees({ apiroute: "ADDEMPLOYEE", data: formdata }))
        } else {
            toast({
                variant: "destructive",
                title: "Không đủ quyền.",
                description: "Chỉ phòng nhân sự mới được thêm nhân viên.",
            })
        }
    }

    console.log(HREmployeesState, "This is the HR plus Employees State")
    return (
        <>
            <Button
                variant="outline"
                onClick={() => {
                    SubmitFormData()
                }}
                className="bg-blue-800 border-2 border-blue-800 px-4 py-2 text-white font-bold rounded-lg hover:bg-white hover:text-blue-800"
            >
                Add Employee
            </Button>
        </>
    )
}