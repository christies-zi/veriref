export enum ClaimTypes {
    notAnalysing = 0,
    correct = 1,
    incorrect = 2,
    cannotSay = 3,
    noSource = 4,
    processing = 5,
    almostCorrect = 6,
    mightBeCorrect = 7,
    textNotRelated = 8
  }

export const claimOptions = [
    { value: ClaimTypes.incorrect, label: '❌ Wrong' },
    { value: ClaimTypes.cannotSay, label: '🤷 Inconclusive' },
    { value: ClaimTypes.noSource, label: '⛔ Could Not Access Source' },
    { value: ClaimTypes.correct, label: '✅ Correct' },
    { value: ClaimTypes.almostCorrect, label: '☑️ Almost Correct' },
    { value: ClaimTypes.mightBeCorrect, label: '🥊 Controversial' },
    { value: ClaimTypes.textNotRelated, label: '⚠️ Error scraping the source.' },
];