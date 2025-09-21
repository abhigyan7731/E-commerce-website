import { serve } from "inngest/next";
import { inngest } from "@/components/inngest/client";
import { deleteCouponExpiry,syncUserCreation, syncUserDeletion, synUserUpdation, couponCreated } from "@/components/inngest/functions";
// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
   syncUserCreation,
   synUserUpdation,
   syncUserDeletion,
   deleteCouponExpiry,
   couponCreated
  ],
});