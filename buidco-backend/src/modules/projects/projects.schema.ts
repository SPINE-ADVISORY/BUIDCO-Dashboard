import { z } from "zod";

const optNum = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
  z.number().optional()
);

const optStr = z.string().optional().nullable();
const optDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD").optional().nullable();

export const CreateProjectSchema = z.object({
  project_code:   z.string().min(1),
  project_name:   z.string().min(1),
  sector_id:      optNum,
  ulb_id:         optNum,
  contractor_id:  optNum,
  consultant_id:  optNum,
  scheme_id:      optNum,
  procurement_mode: optStr,
  status:         z.string().optional().default("DPR_STAGE"),
  phase:          optStr,
  scheduled_start_date: z.string().default(() => new Date().toISOString().slice(0, 10)),
  actual_start_date:    optDate,
  planned_end_date:     z.string().default(() => {
    const d = new Date(); d.setFullYear(d.getFullYear() + 3);
    return d.toISOString().slice(0, 10);
  }),
  revised_end_date: optDate,
  // Agreement & contract
  agreement_number: optStr,
  agreement_date:   optDate,
  appointed_date:   optDate,
  // GIS
  latitude:  optNum,
  longitude: optNum,
  chainage:  optStr,
  dept_stuck: optStr,
  delay_reason: optStr,
  // project_cost fields (flattened)
  current_sanctioned_cost:                   optNum,
  contract_value_lakhs:                      optNum,
  mobilization_advance_lakhs:                optNum,
  mobilization_advance_recovered_lakhs:      optNum,
  payments_made_lakhs:                       optNum,
  last_payment_date:                         optDate,
  last_ra_bill_no:                           optStr,
  retention_money_lakhs:                     optNum,
});

export const UpdateProjectSchema = CreateProjectSchema.partial();

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
