const arrearsForm = document.getElementById("arrears-form");
const leadForm = document.getElementById("lead-form");
const resultsSection = document.getElementById("results-section");
const trackerSection = document.getElementById("tracker-section");
const checklistSuccessCard = document.getElementById("checklistSuccessCard");
const successTitle = document.getElementById("successTitle");

const resultPill = document.getElementById("resultPill");
const resultTitle = document.getElementById("resultTitle");
const resultStageTag = document.getElementById("resultStageTag");
const resultRiskTag = document.getElementById("resultRiskTag");
const resultNextStep = document.getElementById("resultNextStep");
const resultWarning = document.getElementById("resultWarning");

const caseSetupForm = document.getElementById("case-setup-form");
const paymentForm = document.getElementById("payment-form");
const noteForm = document.getElementById("note-form");
const printTrackerBtn = document.getElementById("printTrackerBtn");
const clearTrackerBtn = document.getElementById("clearTrackerBtn");

const summaryMonthlyRent = document.getElementById("summaryMonthlyRent");
const summaryMonthsElapsed = document.getElementById("summaryMonthsElapsed");
const summaryTotalDue = document.getElementById("summaryTotalDue");
const summaryTotalPaid = document.getElementById("summaryTotalPaid");
const summaryArrears = document.getElementById("summaryArrears");
const summaryTrackerStage = document.getElementById("summaryTrackerStage");

const paymentsTableBody = document.getElementById("paymentsTableBody");
const timelineList = document.getElementById("timelineList");

let currentAssessment = null;

const STORAGE_KEY = "arrearsAssistTrackerData";

let trackerData = {
  caseSetup: {
    monthlyRent: 0,
    tenancyStartDate: ""
  },
  payments: [],
  notes: []
};

function formatCurrency(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP"
  }).format(Number(value || 0));
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

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
  trackerSection.classList.remove("hidden");
  checklistSuccessCard.classList.add("hidden");

  resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function saveTrackerData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trackerData));
}

function loadTrackerData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      trackerData = {
        caseSetup: parsed.caseSetup || { monthlyRent: 0, tenancyStartDate: "" },
        payments: Array.isArray(parsed.payments) ? parsed.payments : [],
        notes: Array.isArray(parsed.notes) ? parsed.notes : []
      };
    }
  } catch (error) {
    console.error("Could not load tracker data", error);
  }
}

function monthsBetweenInclusive(startDateString) {
  if (!startDateString) return 0;

  const start = new Date(startDateString);
  if (Number.isNaN(start.getTime())) return 0;

  const now = new Date();
  let months =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth()) +
    1;

  if (months < 0) months = 0;
  return months;
}

function getTrackerStage(arrears, monthlyRent) {
  if (!monthlyRent || monthlyRent <= 0) return "Not set";

  if (arrears < monthlyRent) return "Early";
  if (arrears < monthlyRent * 2) return "Mid stage";
  return "Serious";
}

function calculateTrackerSummary() {
  const monthlyRent = Number(trackerData.caseSetup.monthlyRent || 0);
  const monthsElapsed = monthsBetweenInclusive(trackerData.caseSetup.tenancyStartDate);
  const totalDue = monthlyRent * monthsElapsed;

  const totalPaid = trackerData.payments.reduce((sum, payment) => {
    return sum + Number(payment.amount || 0);
  }, 0);

  const arrears = Math.max(totalDue - totalPaid, 0);
  const stage = getTrackerStage(arrears, monthlyRent);

  return {
    monthlyRent,
    monthsElapsed,
    totalDue,
    totalPaid,
    arrears,
    stage
  };
}

function renderPaymentsTable() {
  if (!trackerData.payments.length) {
    paymentsTableBody.innerHTML = `
      <tr>
        <td colspan="3" class="empty-state-cell">No payments added yet.</td>
      </tr>
    `;
    return;
  }

  const sortedPayments = [...trackerData.payments].sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });

  paymentsTableBody.innerHTML = sortedPayments
    .map((payment) => {
      return `
        <tr>
          <td>${escapeHtml(payment.date)}</td>
          <td>${formatCurrency(payment.amount)}</td>
          <td>
            <button type="button" class="table-delete-btn" data-payment-id="${escapeHtml(payment.id)}">
              Delete
            </button>
          </td>
        </tr>
      `;
    })
    .join("");

  const deleteButtons = document.querySelectorAll("[data-payment-id]");
  deleteButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const id = button.getAttribute("data-payment-id");
      trackerData.payments = trackerData.payments.filter((payment) => payment.id !== id);
      saveTrackerData();
      renderTracker();
    });
  });
}

function buildTimelineItems() {
  const paymentItems = trackerData.payments.map((payment) => ({
    date: payment.date,
    title: "Payment received",
    text: `${formatCurrency(payment.amount)} received`
  }));

  const noteItems = trackerData.notes.map((note) => ({
    date: note.date,
    title: note.type,
    text: note.text
  }));

  return [...paymentItems, ...noteItems].sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });
}

function renderTimeline() {
  const items = buildTimelineItems();

  if (!items.length) {
    timelineList.innerHTML = `<div class="empty-state-block">No timeline entries yet.</div>`;
    return;
  }

  timelineList.innerHTML = items
    .map((item) => {
      return `
        <div class="timeline-item">
          <span class="timeline-date">${escapeHtml(item.date)}</span>
          <span class="timeline-title">${escapeHtml(item.title)}</span>
          <p class="timeline-text">${escapeHtml(item.text)}</p>
        </div>
      `;
    })
    .join("");
}

function renderTrackerSummary() {
  const summary = calculateTrackerSummary();

  summaryMonthlyRent.textContent = formatCurrency(summary.monthlyRent);
  summaryMonthsElapsed.textContent = String(summary.monthsElapsed);
  summaryTotalDue.textContent = formatCurrency(summary.totalDue);
  summaryTotalPaid.textContent = formatCurrency(summary.totalPaid);
  summaryArrears.textContent = formatCurrency(summary.arrears);
  summaryTrackerStage.textContent = summary.stage;
}

function populateSetupForm() {
  document.getElementById("monthlyRent").value =
    trackerData.caseSetup.monthlyRent || "";
  document.getElementById("tenancyStartDate").value =
    trackerData.caseSetup.tenancyStartDate || "";
}

function renderTracker() {
  populateSetupForm();
  renderTrackerSummary();
  renderPaymentsTable();
  renderTimeline();
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

    const leads = JSON.parse(localStorage.getItem("arrearsAssistLeads") || "[]");
    leads.push({
      firstName,
      email,
      assessment: currentAssessment,
      createdAt: new Date().toISOString()
    });
    localStorage.setItem("arrearsAssistLeads", JSON.stringify(leads));

    checklistSuccessCard.classList.remove("hidden");
    checklistSuccessCard.scrollIntoView({ behavior: "smooth", block: "start" });

    leadForm.reset();
  });
}

if (caseSetupForm) {
  caseSetupForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const monthlyRentValue = Number(document.getElementById("monthlyRent").value);
    const tenancyStartDateValue = document.getElementById("tenancyStartDate").value;

    if (!monthlyRentValue || monthlyRentValue <= 0) {
      alert("Enter a valid monthly rent figure.");
      return;
    }

    trackerData.caseSetup.monthlyRent = monthlyRentValue;
    trackerData.caseSetup.tenancyStartDate = tenancyStartDateValue;

    saveTrackerData();
    renderTracker();
    alert("Case setup saved.");
  });
}

if (paymentForm) {
  paymentForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const paymentDate = document.getElementById("paymentDate").value;
    const paymentAmount = Number(document.getElementById("paymentAmount").value);

    if (!paymentDate || !paymentAmount || paymentAmount <= 0) {
      alert("Enter a valid payment date and amount.");
      return;
    }

    trackerData.payments.push({
      id: crypto.randomUUID(),
      date: paymentDate,
      amount: paymentAmount
    });

    saveTrackerData();
    renderTracker();
    paymentForm.reset();
  });
}

if (noteForm) {
  noteForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const noteDate = document.getElementById("noteDate").value;
    const noteType = document.getElementById("noteType").value;
    const noteText = document.getElementById("noteText").value.trim();

    if (!noteDate || !noteType || !noteText) {
      alert("Complete all note fields.");
      return;
    }

    trackerData.notes.push({
      id: crypto.randomUUID(),
      date: noteDate,
      type: noteType,
      text: noteText
    });

    saveTrackerData();
    renderTracker();
    noteForm.reset();
  });
}

if (printTrackerBtn) {
  printTrackerBtn.addEventListener("click", function () {
    window.print();
  });
}

if (clearTrackerBtn) {
  clearTrackerBtn.addEventListener("click", function () {
    const confirmed = window.confirm(
      "Are you sure you want to clear all tracker data on this device?"
    );

    if (!confirmed) return;

    trackerData = {
      caseSetup: {
        monthlyRent: 0,
        tenancyStartDate: ""
      },
      payments: [],
      notes: []
    };

    saveTrackerData();
    renderTracker();
    alert("Tracker data cleared.");
  });
}

loadTrackerData();
renderTracker();
