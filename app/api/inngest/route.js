import { serve } from "inngest/next";
import { syncUserCreation, syncUserDeletion, synUserUpdation } from "@/components/inngest/functions";
import { inngest } from "@/components/inngest/client";

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    syncUserCreation,
    synUserUpdation,
    syncUserDeletion
  ],
});