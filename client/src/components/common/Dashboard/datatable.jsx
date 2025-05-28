import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useContext } from "react"
import { AuthContext } from "../../../context/AuthContext"

export const DataTable = ({ noticedata }) => {
    const { auth } = useContext(AuthContext);

    const Notices = [];
    if (noticedata) {
        for (let index = 0; index < noticedata.notices.length; index++) {
            Notices.push(
                {
                    noticeID: index + 1,
                    noticeTitle: noticedata.notices[index].title,
                    noticeAudience: noticedata.notices[index].audience,
                    noticeCreatedBy: `${noticedata.notices[index].createdby["firstname"]} ${noticedata.notices[index].createdby["lastname"]}`,
                }
            )
        }
    }
    let filteredNotices = Notices;
    if (auth && auth.role === "Employee") {
        filteredNotices = Notices.filter(n => n.noticeAudience === "All" || n.noticeAudience === auth.user.department);
    }

    return (
        <div className="overflow-auto h-full">
            <div className="notices-heading mx-3 my-2">
                <p className="min-[250px]:text-xl xl:text-3xl font-bold min-[250px]:text-center sm:text-start">Recent Notices</p>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">Notice ID</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Audience</TableHead>
                        <TableHead className="text-right">Created By</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredNotices.map((Notice) => (
                        <TableRow key={Notice.noticeID}>
                            <TableCell className="font-medium">{Notice.noticeID}</TableCell>
                            <TableCell>{Notice.noticeTitle}</TableCell>
                            <TableCell>{Notice.noticeAudience}</TableCell>
                            <TableCell className="text-right">{Notice.noticeCreatedBy}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}