import StoreLayout from "@/components/store/StoreLayout";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";

export const metadata = {
    title: "GoCart. - Store Dashboard",
    description: "GoCart. - Store Dashboard",
};

export default function RootStoreLayout({ children }) {
    return (
        <>
            <SignedIn>
                <StoreLayout>
                    {children}
                </StoreLayout>
            </SignedIn>
            <SignedOut>
                <RedirectToSignIn />
            </SignedOut>
        </>
    );
}
