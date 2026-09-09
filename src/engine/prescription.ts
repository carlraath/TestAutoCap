/**
 * Prescription mapping per docs/03: section outcomes to module outcomes, the
 * reporting shorthand and the Training Plan totals.
 */
import { MODULES } from "./structure";
import type {
  AssessmentId,
  ModuleId,
  ModuleOutcome,
  ModulePrescription,
  SectionId,
  SectionMet,
  SectionScore,
  Shorthand,
  TrainingPlan,
  TrainingPlanModule,
} from "./types";

function outcomeFor(module: ModuleId, met: SectionMet): ModuleOutcome {
  switch (module) {
    case "TA-1":
      return met.fundamentals ? "evidence_review" : "prescribed";
    case "SQL-1":
      return met.foundations ? "credited" : "prescribed";
    case "SQL-2":
      return met.foundations && met.applied ? "credited" : "prescribed";
    case "PY-1":
      return met.core ? "credited" : "prescribed";
    case "PY-2a":
    case "PY-2b":
      return met.core && met.testing ? "evidence_review" : "prescribed";
    case "GIT-1":
      return "not_assessed";
  }
}

/** Module outcomes for all seven modules in the recommended sequence TA-1, SQL-1, SQL-2, PY-1, PY-2a, PY-2b, GIT-1. */
export function prescribe(met: SectionMet): ModulePrescription[] {
  return MODULES.map((module) => ({ module: module.id, outcome: outcomeFor(module.id, met) }));
}

function outcomeOf(prescriptions: readonly ModulePrescription[], module: ModuleId): ModuleOutcome | undefined {
  return prescriptions.find((prescription) => prescription.module === module)?.outcome;
}

/** Reporting shorthand, evaluated in the order P1, P2, P3, P4; null when none matches. Never shown to participants. */
export function shorthand(prescriptions: readonly ModulePrescription[]): Shorthand {
  const ta1 = outcomeOf(prescriptions, "TA-1");
  const sql1 = outcomeOf(prescriptions, "SQL-1");
  const py1 = outcomeOf(prescriptions, "PY-1");
  const py2a = outcomeOf(prescriptions, "PY-2a");
  const py2b = outcomeOf(prescriptions, "PY-2b");
  if (py1 === "prescribed" && sql1 === "prescribed") return "P1";
  if (sql1 === "credited" && py1 === "prescribed") return "P2";
  if (py1 === "credited") return "P3";
  if (ta1 === "evidence_review" && py2a === "evidence_review" && py2b === "evidence_review") return "P4";
  return null;
}

/** The Training Plan: every module with its title, hours, course and outcome, plus the total of Prescribed hours. */
export function buildTrainingPlan(prescriptions: readonly ModulePrescription[]): TrainingPlan {
  const modules: TrainingPlanModule[] = MODULES.map((module) => ({
    module: module.id,
    title: module.title,
    hours: module.hours,
    outcome: outcomeOf(prescriptions, module.id) ?? (module.assessed ? "prescribed" : "not_assessed"),
    courseName: module.courseName,
    courseLinks: module.courseLinks.slice(),
  }));
  const prescribedHours = modules.filter((module) => module.outcome === "prescribed").reduce((total, module) => total + module.hours, 0);
  return { modules, prescribedHours };
}

/** Collapses the section scores of the three assessments into the five section flags. A missing section counts as not met. */
export function sectionMetFromScores(scoresByAssessment: Partial<Record<AssessmentId, readonly SectionScore[]>>): SectionMet {
  const met: Record<SectionId, boolean> = { fundamentals: false, foundations: false, applied: false, core: false, testing: false };
  for (const scores of Object.values(scoresByAssessment)) {
    for (const score of scores ?? []) {
      if (score.section in met) met[score.section] = score.met;
    }
  }
  return { ...met };
}
