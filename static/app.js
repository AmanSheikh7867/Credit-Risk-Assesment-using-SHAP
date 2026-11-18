// ============================================================
// Credit Risk Analyzer – Client‑Side Logic
// ============================================================

// ── Configuration ────────────────────────────────────────────
// Replace the placeholder below with your deployed FastAPI URL.
const API_URL = ""; // Same origin — served by FastAPI

// ── DOM references ───────────────────────────────────────────
const form = document.getElementById("loanForm");
const submitBtn = document.getElementById("submitBtn");
const btnText = submitBtn.querySelector(".btn-text");
const spinner = submitBtn.querySelector(".spinner");

const resultsPanel = document.getElementById("resultsPanel");
const resultBadge = document.getElementById("resultBadge");

const metricProbability = document.getElementById("metricProbability");
const metricThreshold = document.getElementById("metricThreshold");
const metricPrediction = document.getElementById("metricPrediction");

const probBarFill = document.getElementById("probBarFill");
const thresholdMarker = document.getElementById("thresholdMarker");

const errorToast = document.getElementById("errorToast");
const errorMessage = document.getElementById("errorMessage");

// ── Helpers ──────────────────────────────────────────────────

/**
 * Collect form values and coerce them to the types the API expects.
 * Returns a plain object matching the LoanApplication schema.
 */
function collectFormData() {
  return {
    person_age: parseInt(form.person_age.value, 10),
    person_income: parseFloat(form.person_income.value),
    person_home_ownership: form.person_home_ownership.value,
    person_emp_length: parseFloat(form.person_emp_length.value),
    loan_intent: form.loan_intent.value,
    loan_grade: form.loan_grade.value,
    loan_amnt: parseFloat(form.loan_amnt.value),
    loan_int_rate: parseFloat(form.loan_int_rate.value),
    loan_percent_income: parseFloat(form.loan_percent_income.value),
    cb_person_default_on_file: form.cb_person_default_on_file.value,
    cb_person_cred_hist_length: parseInt(form.cb_person_cred_hist_length.value, 10),
  };
}

/** Toggle the loading state of the submit button. */
function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  btnText.textContent = isLoading ? "Analyzing…" : "Analyze Risk";
  spinner.classList.toggle("hidden", !isLoading);
}

/** Show a temporary error toast at the bottom of the screen. */
function showError(msg) {
  errorMessage.textContent = msg;
  errorToast.classList.remove("hidden");
  // Force reflow so the transition triggers correctly.
  void errorToast.offsetWidth;
  errorToast.classList.add("visible");

  setTimeout(() => {
    errorToast.classList.remove("visible");
    setTimeout(() => errorToast.classList.add("hidden"), 350);
  }, 4500);
}

/** Render the prediction results in the results panel. */
function renderResults(data) {
  // data = { default_probability, default_prediction, threshold, Result }

  const probability = data.default_probability;
  const threshold = data.threshold;
  const isHighRisk = data.default_prediction === 1;

  // Badge
  resultBadge.textContent = isHighRisk ? "⚠ High Risk" : "✓ Low Risk";
  resultBadge.className = "result-badge " + (isHighRisk ? "high-risk" : "low-risk");

  // Metrics
  metricProbability.textContent = (probability * 100).toFixed(2) + "%";
  metricThreshold.textContent = (threshold * 100).toFixed(2) + "%";
  metricPrediction.textContent = data.Result;

  // Probability bar
  probBarFill.className = "prob-bar-fill " + (isHighRisk ? "high" : "low");
  // Animate the bar width after a micro‑delay so the CSS transition fires.
  requestAnimationFrame(() => {
    probBarFill.style.width = (probability * 100).toFixed(2) + "%";
  });

  // Threshold marker
  thresholdMarker.style.left = (threshold * 100).toFixed(2) + "%";

  // Show the panel
  resultsPanel.classList.remove("hidden");

  // Smooth scroll to results
  resultsPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ── Form submission ──────────────────────────────────────────
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Hide previous results while loading
  resultsPanel.classList.add("hidden");
  // Reset bar width so re‑animation works
  probBarFill.style.width = "0%";

  const payload = collectFormData();
  setLoading(true);

  try {
    const response = await fetch(`${API_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // If your API requires an API key, uncomment and set the line below:
        // "X-API-Key": "[API_KEY]",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => null);
      const detail = errBody?.detail || `Server responded with ${response.status}`;
      throw new Error(detail);
    }

    const result = await response.json();
    renderResults(result);
  } catch (err) {
    console.error("Prediction request failed:", err);
    showError(err.message || "Unable to reach the prediction API.");
  } finally {
    setLoading(false);
  }
});
