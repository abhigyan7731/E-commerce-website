import AdminLayout from "@/components/admin/AdminLayout";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";


export const metadata = {
    title: "AURA. - Store Dashboard",
    description: "AURA. - Store Dashboard",
};

export default function RootAdminLayout({ children }) {
    return (
        <>
            <SignedIn>
                <AdminLayout>
                    {children}
                </AdminLayout>
            </SignedIn>
            <SignedOut>
                <RedirectToSignIn redirectUrl="/admin" />
            </SignedOut>
        </>
    );
}
