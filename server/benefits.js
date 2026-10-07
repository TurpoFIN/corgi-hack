import {z} from 'zod';
import {dealValueSchema} from './deal-values.js';
export const benefitSchema=z.object({
 icon:z.enum(['shower','ticket','food','fitness','classes','pool','trainer','music','culture','duration','delivery','savings','location']),
 label:z.string().trim().min(2).max(64),
 evidence:z.string().trim().min(5).max(400)
});
export const benefitFields={
 valueUsd:dealValueSchema.optional(),
 benefitSummary:z.string().trim().max(260).default(''),
 benefits:z.array(benefitSchema).max(4).default([]),
 // Detail text is not a compact-card field. Preserve all material conditions.
 benefitCaveat:z.string().trim().default('')
};
export const benefitContextSchema=z.object(benefitFields);
