const arrearsForm = document.getElementById("arrears-form");
const leadForm = document.getElementById("lead-form");
const resultsSection = document.getElementById("results-section");
const checklistSuccessCard = document.getElementById("checklistSuccessCard");
const successTitle = document.getElementById("successTitle");

const resultPill = document.getElementById("resultPill");
const resultTitle = document.getElementById("resultTitle");
const resultStageTag = document.getElementById("resultStageTag");
const resultRiskTag = document.getElementById("resultRiskTag");
const resultNextStep = document.getElementById("resultNextStep");
const resultWarning = document.getElementById("resultWarning");

let currentAssessment = null;

function getFormValues() {
  return {
    monthsArrears: document.getElementById("monthsArrears").value,
    currentlyPaying: document.getElementById("currentlyPaying").value,
    disrepairRaised: document.getElementById("disrepairRaised").value,
    accessAttempts: document.getElementById("accessAttempts").value,
    universalCredit: document.getElementById("universalCredit").value,
    writtenRecord: document.getElementById("writtenRecord").value,
    formalContact: document.getElementById("formalContact").value
  };
}

function validateChecker(values) {
  return Object.values(values).every(Boolean);
}

function buildAssessment(values) {
  let score = 0;

  if (values.monthsArrears === "under1") score += 1;
  if (values.monthsArrears === "1to2") score += 3;
  if (values.monthsArrears === "2plus") score += 5;

  if (values.currentlyPaying === "full") score += 0;
  if (values.currentlyPaying === "partial") score += 2;
  if (values.currentlyPaying === "none") score += 4;

  if (values.disrepairRaised === "minor") score += 1;
  if (values.disrepairRaised === "serious") score += 3;

  if (values.accessAttempts === "yes-refused") score += 2;
  if (values.accessAttempts === "no") score += 1;

  if (values.universalCredit === "yes") score += 1;
  if (values.universalCredit === "notsure") score += 1;

  if (values.writtenRecord === "partial") score += 2;
  if (values.writtenRecord === "no") score += 4;

  if (values.formalContact === "informal") score += 1;
  if (values.formalContact === "no") score += 3;

  let stage = "Early";
  let risk = "Moderate";

  if (score >= 12) {
    stage = "Serious";
    risk = "High";
  } else if (score >= 7) {
    stage = "Mid stage";
    risk = "Elevated";
  }

  const stageTitle =
    score >= 12
      ? "You are in serious rent arrears territory."
      : score >= 7
      ? "You are in mid stage rent arrears."
      : "You are in early stage rent arrears.";

  const nextStep =
    score >= 12
      ? "Move out of casual chasing and into a structured arrears process with a clean log, organised communication, and evidence in one place."
      : score >= 7
      ? "Tighten your arrears record, move communication into clear written form, and stop relying on memory or scattered messages."
      : "Formally contact the tenant in writing, start or tighten your arrears log, and record every missed or short payment from today.";

  const warning =
    values.writtenRecord === "no"
      ? "Your biggest weakness is poor record keeping. If arrears grow and your log is weak, your position gets harder fast."
      : values.disrepairRaised !== "no"
      ? "Disrepair has been raised. If that is not tracked properly alongside access attempts and responses, the case can get messy."
      : values.formalContact === "no"
      ? "You have not formally contacted the tenant yet. Delay now usually creates avoidable gaps later."
      : "If you let arrears build without a clean written trail, you make a bad situation harder to manage later.";

  return {
    score,
    stage,
    risk,
    stageTitle,
    nextStep,
    warning
  };
}

function renderFreeResult(assessment) {
  resultPill.textContent = "Your free result";
  resultTitle.textContent = assessment.stageTitle;
  resultStageTag.textContent = assessment.stage;
  resultRiskTag.textContent = assessment.risk;
  resultNextStep.textContent = assessment.nextStep;
  resultWarning.textContent = assessment.warning;

  resultsSection.classList.remove("hidden");
  checklistSuccessCard.classList.add("hidden");

  resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

if (arrearsForm) {
  arrearsForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const values = getFormValues();

    if (!validateChecker(values)) {
      alert("Fill in all 7 questions first.");
      return;
    }

    currentAssessment = buildAssessment(values);
    renderFreeResult(currentAssessment);
  });
}

if (leadForm) {
  leadForm.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!currentAssessment) {
      alert("Complete the checker first.");
      return;
    }

    const firstName = document.getElementById("firstName").value.trim();
    const email = document.getElementById("emailAddress").value.trim();

    if (!firstName || !email) {
      alert("Enter your first name and email address.");
      return;
    }

    successTitle.textContent = `Nice one, ${firstName}`;

    const leads = JSON.parse(localStorage.getItem("arrearsActionSystemLeads") || "[]");
    leads.push({
      firstName,
      email,
      assessment: currentAssessment,
      createdAt: new Date().toISOString()
    });
    localStorage.setItem("arrearsActionSystemLeads", JSON.stringify(leads));

    checklistSuccessCard.classList.remove("hidden");
    checklistSuccessCard.scrollIntoView({ behavior: "smooth", block: "start" });

    leadForm.reset();
  });
}
