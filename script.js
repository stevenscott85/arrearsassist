const arrearsForm = document.getElementById("arrears-form");
const leadForm = document.getElementById("lead-form");
const resultsSection = document.getElementById("results-section");
const freeChecklistCard = document.getElementById("freeChecklistCard");
const checklistSuccessCard = document.getElementById("checklistSuccessCard");
const successTitle = document.getElementById("successTitle");
const showGuidanceBtn = document.getElementById("showGuidanceBtn");
const guidancePanel = document.getElementById("guidance-panel");

const resultPill = document.getElementById("resultPill");
const resultTitle = document.getElementById("resultTitle");
const resultNextStep = document.getElementById("resultNextStep");
const resultWarning = document.getElementById("resultWarning");

const fullPlanSection = document.getElementById("full-plan-section");
const fullPlanHeading = document.getElementById("fullPlanHeading");
const fullPlanStageText = document.getElementById("fullPlanStageText");
const fullPlanPriorityText = document.getElementById("fullPlanPriorityText");
const fullPlanSteps = document.getElementById("fullPlanSteps");
const fullPlanRisks = document.getElementById("fullPlanRisks");
const fullPlanEvidence = document.getElementById("fullPlanEvidence");

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

  const serious = score >= 12;

  const stageTitle = serious
    ? "You are in serious rent arrears territory."
    : "You are in early to mid stage rent arrears.";

  const nextStep = serious
    ? "You should move from informal chasing into structured escalation and evidence preparation."
    : "Formally contact the tenant, start or tighten your arrears log, and record every payment issue from today.";

  const warning = serious
    ? "Serious arrears with poor records, weak communication, or repair disputes can quickly become harder to manage."
    : "If arrears are not documented properly from the start, your position becomes weaker if the case escalates later.";

  const priority = serious
    ? "Get your arrears evidence and communication record in order before the situation worsens."
    : "Create a clean written arrears record and tighten your communication before the case grows arms and legs.";

  const risks = [];
  const evidence = [
    "Tenancy agreement",
    "Rent due dates and payment history",
    "Bank statements or rent record showing missed or short payments",
    "Copies of messages or emails with the tenant about arrears"
  ];

  if (values.writtenRecord === "no") {
    risks.push("You do not have a written arrears record. This is one of the biggest weaknesses in any arrears case.");
  } else if (values.writtenRecord === "partial") {
    risks.push("Your arrears record looks incomplete. Gaps can cause arguments later.");
  }

  if (values.formalContact === "no") {
    risks.push("You have not formally contacted the tenant about arrears yet. Start written communication now.");
  } else if (values.formalContact === "informal") {
    risks.push("You have only used informal messages so far. Important points may not be clearly captured.");
  }

  if (values.disrepairRaised !== "no") {
    risks.push("Disrepair has been raised. You need a separate record of complaints, responses, and access attempts.");
    evidence.push("Repair complaint timeline");
    evidence.push("Photos, contractor notes, and access requests");
  }

  if (values.accessAttempts === "yes-refused") {
    risks.push("Access appears to have been refused or blocked. Keep dated proof of all access requests and responses.");
    evidence.push("Access request messages and replies");
  }

  if (values.currentlyPaying === "none") {
    risks.push("No payments are being made at all. You need your rent schedule completely up to date.");
  }

  if (values.universalCredit === "yes" || values.universalCredit === "notsure") {
    risks.push("Universal Credit may be part of the picture. Keep your arrears figures clean and avoid guessing.");
  }

  const steps = [];

  if (serious) {
    steps.push("Update your arrears schedule so it is accurate and current.");
    steps.push("Make sure all missed payments and partial payments are logged in writing.");
    steps.push("Check that your tenant contact history is complete and organised.");
    steps.push("If repairs have been raised, keep a separate record of issues, access attempts, and outcomes.");
    steps.push("Prepare your core evidence pack so you are not scrambling later.");
    steps.push("Build a single file or folder with payment record, communications, and repair history.");
    steps.push("Keep communication factual, clear, and saved.");
  } else {
    steps.push("Create or update a rent arrears log today.");
    steps.push("Send a clear written arrears message instead of relying on casual chasing.");
    steps.push("Record all payment promises and whether they were kept.");
    steps.push("If repairs are mentioned, separate the rent issue from the repair issue and document both.");
    steps.push("Keep all evidence in one place from the start.");
    steps.push("If the tenant starts falling further behind, move into a more structured escalation process.");
  }

  return {
    serious,
    stageTitle,
    nextStep,
    warning,
    priority,
    steps,
    risks,
    evidence
  };
}

function renderFreeResult(assessment) {
  resultPill.textContent = "Your free result";
  resultTitle.textContent = assessment.stageTitle;
  resultNextStep.textContent = assessment.nextStep;
  resultWarning.textContent = assessment.warning;

  resultsSection.classList.remove("hidden");
  freeChecklistCard.classList.remove("hidden");
  checklistSuccessCard.classList.add("hidden");
  guidancePanel.classList.add("hidden");

  resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderFullPlan(assessment, firstName = "there") {
  fullPlanHeading.textContent = `${firstName}, here is your full arrears action plan`;
  fullPlanStageText.textContent = assessment.stageTitle.replace(/\.$/, "") + ".";
  fullPlanPriorityText.textContent = assessment.priority;

  fullPlanSteps.innerHTML = "";
  assessment.steps.forEach((step) => {
    const li = document.createElement("li");
    li.textContent = step;
    fullPlanSteps.appendChild(li);
  });

  fullPlanRisks.innerHTML = "";
  assessment.risks.forEach((risk) => {
    const li = document.createElement("li");
    li.textContent = risk;
    fullPlanRisks.appendChild(li);
  });

  fullPlanEvidence.innerHTML = "";
  assessment.evidence.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    fullPlanEvidence.appendChild(li);
  });

  fullPlanSection.classList.remove("hidden");
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

    freeChecklistCard.classList.add("hidden");
    checklistSuccessCard.classList.remove("hidden");

    const leads = JSON.parse(localStorage.getItem("arrearsAssistLeads") || "[]");
    leads.push({
      firstName,
      email,
      assessment: currentAssessment,
      createdAt: new Date().toISOString()
    });
    localStorage.setItem("arrearsAssistLeads", JSON.stringify(leads));

    resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

if (showGuidanceBtn) {
  showGuidanceBtn.addEventListener("click", function () {
    guidancePanel.classList.toggle("hidden");
    if (!guidancePanel.classList.contains("hidden")) {
      guidancePanel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}

/*
  Optional manual unlock for your own testing:
  Add ?paid=1 to the page URL after completing the free result.
  Example:
  https://yourdomain.co.uk/?paid=1
*/
(function checkManualPaidPreview() {
  const url = new URL(window.location.href);
  const paid = url.searchParams.get("paid");

  if (paid === "1") {
    const demoAssessment = {
      serious: true,
      stageTitle: "You are in serious rent arrears territory.",
      nextStep: "You should move from informal chasing into structured escalation and evidence preparation.",
      warning: "Serious arrears with poor records, weak communication, or repair disputes can quickly become harder to manage.",
      priority: "Get your arrears evidence and communication record in order before the situation worsens.",
      steps: [
        "Update your arrears schedule so it is accurate and current.",
        "Make sure all missed payments and partial payments are logged in writing.",
        "Check that your tenant contact history is complete and organised.",
        "If repairs have been raised, keep a separate record of issues, access attempts, and outcomes.",
        "Prepare your core evidence pack so you are not scrambling later.",
        "Build a single file or folder with your payment record, communications, and repair history.",
        "Keep communication factual, clear, and saved."
      ],
      risks: [
        "You do not have a written arrears record. This is one of the biggest weaknesses in any arrears case.",
        "You have not formally contacted the tenant about arrears yet. Start written communication now."
      ],
      evidence: [
        "Tenancy agreement",
        "Rent due dates and payment history",
        "Bank statements or rent record showing missed or short payments",
        "Copies of messages or emails with the tenant about arrears",
        "Repair complaint timeline",
        "Access request messages and replies"
      ]
    };

    currentAssessment = demoAssessment;
    resultsSection.classList.remove("hidden");
    renderFullPlan(demoAssessment, "steven");
  }
})();
