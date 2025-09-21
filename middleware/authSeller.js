import prisma from "@/lib/prisma"
import { use } from "react"

const authSeller = async (userId) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { store: true },

        }) 
        if(user.store){
            if(user.store.status === "approved"){
                return {storeId: user.store.id}
            } else {
                return false
            }
        }
        return false;
    } catch (error) {
        console.error(error)
        return false
    }
}

export default authSeller