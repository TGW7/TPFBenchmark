/**
 * /config — public surface.
 *
 * The engine-facing standards catalogue, generated from the Excel master. See
 * README.md (also generated) for the codegen boundary.
 */

export {
  HRS_BENCHMARKS,
  HRS_BENCHMARKS_BY_ID,
  CORE_BENCHMARKS,
} from './benchmarks';
export {
  HRS_PATHWAY_CONFIGS,
  HRS_PATHWAY_LIST,
  PATHWAY_IDS,
} from './pathways';
export { HRS_WODS, HRS_WOD_LIST, WOD_PUBLIC_NAMES, wodPublicName } from './wods';
export type { WodPublicName } from './wods';
