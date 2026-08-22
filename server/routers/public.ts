import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { contactRequests } from "../../drizzle/schema";
import { getDb } from "../db";
import { publicProcedure, router } from "../_core/trpc";

export const publicRouter = router({
  contact: publicProcedure
    .input(z.object({
      name: z.string().min(2).max(180),
      email: z.string().email(),
      service: z.string().max(120).optional(),
      message: z.string().min(10).max(5000),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No se pudo registrar el contacto. Inténtalo de nuevo." });
      const inserted = await db.insert(contactRequests).values(input);
      return { success: true as const, requestId: Number(inserted[0].insertId) };
    }),
});
