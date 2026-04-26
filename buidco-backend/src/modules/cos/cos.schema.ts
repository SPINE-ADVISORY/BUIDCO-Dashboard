import { z } from "zod";

const optNum = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
  z.number().optional()
);
const optStr = z.string().optional().nullable();
const optDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable();

export const CreateCosSchema = z.object({
  project_id:         z.number(),
  project_code:       optStr,
  cos_number:         z.string(),
  cos_date:           z.string(),
  cos_category:       z.string(),
  cos_description:    z.string().optional().default(""),
  cost_before_cos:    optNum,
  cos_amount:         z.preprocess(Number, z.number()).optional().default(0),
  approval_authority: z.string().optional().default("MD"),
  approval_order_no:  z.string().optional().default("N/A"),
  is_time_linked:     z.boolean().optional().default(false),
  remarks:            optStr,
  // EoT fields (used when is_time_linked = true)
  eot_number:         optStr,
  eot_days_granted:   optNum,
  original_end_date:  optDate,
  new_end_date:       optDate,
  eot_category:       z.string().optional().default("SCOPE_CHANGE"),
  eot_reason:         z.string().optional().default(""),
  eot_days_sought:    optNum,
  date_from:          optDate,
  eot_approval_date:  optDate,
  approval_authority_eot: optStr,
  approval_order_no_eot:  optStr,
});

export const UpdateCosSchema = CreateCosSchema.partial();

export type CreateCosInput = z.infer<typeof CreateCosSchema>;
