/**
 * Shared Playwright helpers: signing in as either role, creating participants
 * through the administrator's own screen (so the codes and passwords come from
 * the on-screen Allocation Register, never from a fixture), and signing out.
 *
 * The admin specs import these too, so keep the signatures stable.
 */
export {
  ADMIN_PASSWORD,
  ADMIN_USERNAME,
  createParticipants,
  loginAsAdmin,
  loginAsParticipant,
  logout,
  signIn,
  type ParticipantCredentials,
} from "./auth";

export {
  answerCurrentQuestion,
  answerSignature,
  currentQuestion,
  currentType,
  expectSaved,
  goToQuestion,
  nextQuestion,
  saveCount,
  shot,
  startAssessment,
  type QuestionType,
} from "./attempt";

export { answerCorrectly, currentItem } from "./answer-key";
