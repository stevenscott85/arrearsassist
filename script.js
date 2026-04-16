const arrearsForm = document.getElementById("arrears-form");
const leadForm = document.getElementById("lead-form");

const formError = document.getElementById("form-error");
const leadError = document.getElementById("lead-error");

const freeResultSection = document.getElementById("free-result-section");
const premiumSection = document.getElementById("premium-section");
const evictionGuidanceSection = document.getElementById("eviction-guidance-section");
const paidSection = document.getElementById("paid-section");

const freeStageTitle = document.getElementById("free-stage-title");
const freeNextStep = document.getElementById("free-next-step");
const freeWarning = document.getElementById("free-warning");

const premiumGreeting = document.getElementById("premium-greeting");
const premiumStage = document.getElementById("premium-stage");
const premiumPriority = document.getElementById("premium-priority");
const premiumActions = document.getElementById("premium-actions");
const premiumRisks = document.getElementById("premium-risks");
const premiumEvidence = document.getElementById("premium-evidence");

const showEvictionGuidanceBtn = document.getElementById("show-eviction-guidance");

let lastAssessment = null;

if (arrearsForm) {
  arrearsForm.addEventListener("submit", function (event) {
    event.preventDefault();
    formError.textContent = "";

    const formData = {
      arrearsMonths: document.getElementById("arrearsMonths").value,
      paymentStatus: document.getElementById("paymentStatus").value,
      disrepair: document.getElementById("disrepair").value,
      accessAttempts: document.getElementById("accessAttempts").value,
      uc: document.getElementById("uc").value,
      paymentRecord: document.getElementById("paymentRecord").value,
      formalContact: document.getElementById("formalContact").value,
    };

    const emptyField = Object.values(formData).some((value) => !value);

    if (emptyField) {
      formError.textContent = "Please answer all 7 questions first.";
      return;
    }

    lastAssessment = buildAssessment(formData);
    renderFreeResult(lastAssessment);

    freeResultSection.classList.remove("hidden");
    premiumSection.classList.add("hidden");
    evictionGuidanceSection.classList.add("hidden");
    paidSection.classList.add("hidden");

    freeResultSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

if (leadForm) {
  leadForm.addEventListener("submit", function (event) {
    event.preventDefault();
    leadError.textContent = "";

    if (!lastAssessment) {
      leadError.textContent = "Please complete the arrears check first.";
      return;
    }

    const firstName = document.getElementById("firstName").value.trim();
    const email = document.getElementById("email").value.trim();

    if (!firstName || !email) {
      leadError.textContent = "Please enter your first name and email address.";
      return;
    }

    if (!isValidEmail(email)) {
      leadError.textContent = "Please enter a valid email address.";
      return;
    }

    const savedLead = {
      firstName,
      email,
      assessment: lastAssessment,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem("arrearsAssistLead", JSON.stringify(savedLead));

    renderFreeChecklistConfirmation(firstName);
  });
}

if (showEvictionGuidanceBtn) {
  showEvictionGuidanceBtn.addEventListener("click", function () {
    evictionGuidanceSection.classList.remove("hidden");
    evictionGuidanceSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function buildAssessment(data) {
  const risks = [];
  const evidence = [
    "Tenancy agreement",
    "Rent due dates and payment history",
    "Bank statements or rent record showing missed or short payments",
    "Copies of messages or emails with the tenant about arrears",
  ];

  let stage = "";
  let nextStep = "";
  let warning = "";
  let priority = "";
  let actions = [];

  const isEarly =
    data.arrearsMonths === "less-than-1" ||
    (data.arrearsMonths === "one-to-two" && data.paymentStatus === "partial");

  const isSerious =
    data.arrearsMonths === "two-plus" ||
    (data.arrearsMonths === "one-to-two" && data.paymentStatus === "none");

  const highRisk =
    data.disrepair === "yes" ||
    data.accessAttempts === "refused" ||
    data.accessAttempts === "no-attempt" ||
    data.paymentRecord === "no";

  if (isEarly) {
    stage = "You are in early to mid stage rent arrears.";
    nextStep =
      "Formally contact the tenant, start or tighten your arrears log, and record every payment issue from today.";
    warning =
      "If arrears are not documented properly from the start, your position becomes weaker if the case escalates later.";
    priority =
      "Take control of the paper trail now before the arrears become more serious.";
    actions = [
      "Create a simple arrears record showing rent due, rent paid, shortfall, and date.",
      "Send a clear written arrears message to the tenant and keep a copy.",
      "Log every payment from today onward, including partial payments.",
      "Keep copies of texts, emails, and letters in one place.",
      "If the tenant mentions repairs, start a repairs and access log immediately.",
    ];
  }

  if (isSerious) {
    stage = "You are in serious rent arrears territory.";
    nextStep =
      "You should move from informal chasing into structured escalation and evidence preparation.";
    warning =
      "Serious arrears with poor records, weak communication, or repair disputes can quickly become harder to manage.";
    priority =
      "Get your arrears evidence and communication record in order before the situation worsens.";
    actions = [
      "Update your arrears schedule so it is accurate and current.",
      "Make sure all missed payments and partial payments are logged in writing.",
      "Check that your tenant contact history is complete and organised.",
      "If repairs have been raised, keep a separate record of issues, access attempts, and outcomes.",
      "Prepare your core evidence pack so you are not scrambling later.",
    ];
  }

  if (!isEarly && !isSerious) {
    stage = "You are in a mixed arrears situation.";
    nextStep =
      "Clean up your records and take a structured approach before making any major move.";
    warning =
      "Mixed arrears cases become messy when there is no clean payment timeline.";
    priority = "Clarify the facts before you escalate.";
    actions = [
      "Build a full payment timeline.",
      "Confirm exactly what is unpaid and since when.",
      "Make sure all tenant contact is saved in writing.",
      "Separate arrears issues from repair issues.",
      "Get your evidence in one place.",
    ];
  }

  if (data.disrepair === "yes") {
    risks.push(
      "Disrepair has been raised. This increases the risk of delay or dispute if your records are weak."
    );
    evidence.push("Repairs log showing what was reported and when");
  }

  if (data.accessAttempts === "refused") {
    risks.push(
      "You say access was refused. Keep proof of appointments, messages, and refused access."
    );
    evidence.push("Proof of access attempts and any refusals");
  }

  if (data.accessAttempts === "no-attempt" && data.disrepair === "yes") {
    risks.push(
      "Disrepair has been raised but you have not attempted access. That is a risk area."
    );
    evidence.push("Plan for arranging inspection or repair access");
  }

  if (data.paymentRecord === "no") {
    risks.push(
      "You do not have a written arrears record. This is one of the biggest weaknesses in any arrears case."
    );
  } else {
    evidence.push("Written arrears schedule or spreadsheet");
  }

  if (data.formalContact === "no") {
    risks.push(
      "You have not formally contacted the tenant about arrears yet. Start written communication now."
    );
  }

  if (data.uc === "yes") {
    risks.push(
      "Universal Credit is involved. Payment issues can become more complicated if you do not log dates and communications."
    );
    evidence.push("Universal Credit related notes, letters, or payment information");
    actions.push(
      "If Universal Credit is involved, log what has been paid, what stopped, and what has been said by the tenant."
    );
  }

  if (highRisk) {
    actions.push(
      "Do not rely on memory. Build a single file or folder with your payment record, communications, and repair history."
    );
  }

  actions.push(
    "Avoid emotional back and forth. Keep communication factual, clear, and saved."
  );

  if (risks.length === 0) {
    risks.push(
      "No major extra risk flag was triggered from your answers, but record keeping still matters."
    );
  }

  return {
    stage,
    nextStep,
    warning,
    priority,
    actions,
    risks,
    evidence,
  };
}

function renderFreeResult(assessment) {
  freeStageTitle.textContent = assessment.stage;
  freeNextStep.textContent = assessment.nextStep;
  freeWarning.textContent = assessment.warning;
}

function renderPremiumResult(firstName, assessment) {
  premiumGreeting.textContent = `${firstName}, here is your full arrears action plan`;
  premiumStage.textContent = assessment.stage;
  premiumPriority.textContent = assessment.priority;

  premiumActions.innerHTML = "";
  assessment.actions.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    premiumActions.appendChild(li);
  });

  premiumRisks.innerHTML = "";
  assessment.risks.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    premiumRisks.appendChild(li);
  });

  premiumEvidence.innerHTML = "";
  assessment.evidence.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    premiumEvidence.appendChild(li);
  });
}

function renderFreeChecklistConfirmation(firstName) {
  const leadCaptureCard = document.getElementById("lead-capture-card");

  if (!leadCaptureCard) {
    return;
  }

  leadCaptureCard.innerHTML = `
    <div class="section-tag">Checklist requested</div>
    <h2>Nice one, ${escapeHtml(firstName)}</h2>
    <p>
      Your free arrears checklist request has been captured.
    </p>
    <div class="result-group warning-box">
      <h3>What happens next</h3>
      <p>
        You should check your inbox once email delivery is connected. For now, your free route is captured and your paid route stays separate.
      </p>
    </div>
    <div class="result-cta-box">
      <h3>Want the full system now?</h3>
      <p class="result-cta-text">
        The full arrears system includes the full action plan, templates, tracking tools, and structured escalation guidance.
      </p>
      <div class="result-cta-actions">
        <a
          href="https://buy.stripe.com/test_9B6fZh3uNgunbcxaEYasg00"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-primary"
        >
          Unlock full arrears plan
        </a>
      </div>
      <p class="result-cta-note">
        This opens the Stripe checkout. The free checklist and paid upgrade are now separate routes.
      </p>
    </div>
  `;
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
