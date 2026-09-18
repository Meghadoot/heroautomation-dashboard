async function fetchJson(resourcePath) {
    const separator = resourcePath.includes("?") ? "&" : "?";
    const response = await fetch(
        `${resourcePath}${separator}v=${Date.now()}`,
        { cache: "no-store" }
    );

    if (!response.ok) {
        throw new Error(
            `Unable to load ${resourcePath}: HTTP ${response.status}`
        );
    }

    return response.json();
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatDateTime(value) {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? "-"
        : date.toLocaleString();
}

function formatTime(value) {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? "-"
        : date.toLocaleTimeString();
}

function formatDuration(value) {
    const seconds = Number(value);
    if (!Number.isFinite(seconds)) return "-";

    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;

    return minutes > 0
        ? `${minutes}m ${remainder}s`
        : `${remainder}s`;
}

function statusPresentation(result) {
    switch (result) {
        case "SUCCESS_CONFIRMED":
            return { label: "Success", icon: "✓", cssClass: "success" };
        case "COMPLETED_BY_TIMEOUT_ONLY":
            return { label: "Timeout fallback", icon: "!", cssClass: "warning" };
        case "SKIPPED_ALREADY_COMPLETED_TODAY":
            return { label: "Skipped", icon: "→", cssClass: "muted" };
        case "COMPLETED":
        case "ALREADY_COMPLETED_TODAY":
            return { label: result.replaceAll("_", " "), icon: "✓", cssClass: "success" };
        default:
            return { label: result || "Unknown", icon: "×", cssClass: "failure" };
    }
}

async function loadDashboard() {
    const [latest, history, profile] = await Promise.all([
        fetchJson("latest-run.json"),
        fetchJson("history.json"),
        fetchJson("data/actions-profile.json")
    ]);

    renderMeta(latest, profile);
    renderSummary(latest);
    renderAccounts(latest);
    renderActions(profile);
    renderQuests(profile);
    renderHistory(history);
}

function renderMeta(report, profile) {
    const target = document.getElementById("dashboardMeta");
    if (!target) return;

    target.innerHTML = `
        <div class="meta-card">
            <span><strong>Profile:</strong> ${escapeHtml(profile.profileName || "Default")}</span>
            <span><strong>Last updated:</strong> ${escapeHtml(formatDateTime(report.finishedAt))}</span>
            <span><strong>Runtime:</strong> ${escapeHtml(formatDuration(report.runtimeSeconds))}</span>
            <span><strong>Version:</strong> v1.1.2</span>
        </div>
    `;
}

function renderSummary(report) {
    const target = document.getElementById("summaryCards");
    if (!target) return;

    const overall = statusPresentation(report.overallResult);
    const accountCount = Number(report.totalEnabledAccounts || 0);
    const successRate = accountCount > 0
        ? Math.round((Number(report.confirmed || 0) / accountCount) * 100)
        : 0;

    target.innerHTML = `
        <div class="summary-card"><h3>${accountCount}</h3><span>Accounts</span></div>
        <div class="summary-card"><h3>${Number(report.completed || 0)}</h3><span>Completed</span></div>
        <div class="summary-card"><h3>${Number(report.confirmed || 0)}</h3><span>Success</span></div>
        <div class="summary-card"><h3>${Number(report.failed || 0)}</h3><span>Failed</span></div>
        <div class="summary-card"><h3>${successRate}%</h3><span>Success rate</span></div>
        <div class="summary-card status-card ${overall.cssClass}">
            <h3>${overall.icon} ${escapeHtml(overall.label)}</h3><span>Status</span>
        </div>
    `;
}

function renderAccounts(report) {
    const table = document.getElementById("accountsTable");
    const headRow = table?.querySelector("thead tr");
    const tbody = table?.querySelector("tbody");
    if (!headRow || !tbody) return;

    headRow.innerHTML = `
        <th>Account</th>
        <th>Status</th>
        <th>Completion signal</th>
        <th>Finished</th>
        <th>Runtime</th>
        <th>Logout</th>
    `;

    tbody.innerHTML = "";

    for (const account of report.accounts || []) {
        const status = statusPresentation(account.result);
        const logout = account.logoutVerified === true ? "✓ Verified" : "-";

        tbody.insertAdjacentHTML("beforeend", `
            <tr>
                <td>${escapeHtml(account.name || "-")}</td>
                <td class="${status.cssClass}">${status.icon} ${escapeHtml(status.label)}</td>
                <td>${escapeHtml(account.completionReason || "-")}</td>
                <td>${escapeHtml(formatTime(account.finishedAt))}</td>
                <td>${escapeHtml(formatDuration(account.runtimeSeconds))}</td>
                <td class="${account.logoutVerified === true ? "success" : "muted"}">${logout}</td>
            </tr>
        `);
    }
}

function renderBooleanTable(tableId, entries, firstColumnLabel) {
    const table = document.getElementById(tableId);
    const headRow = table?.querySelector("thead tr");
    const tbody = table?.querySelector("tbody");
    if (!headRow || !tbody) return;

    headRow.innerHTML = `<th>${escapeHtml(firstColumnLabel)}</th><th>Status</th>`;
    tbody.innerHTML = "";

    for (const [name, enabled] of Object.entries(entries || {})) {
        tbody.insertAdjacentHTML("beforeend", `
            <tr>
                <td>${escapeHtml(name)}</td>
                <td class="${enabled ? "enabled" : "disabled"}">${enabled ? "✓ Enabled" : "× Disabled"}</td>
            </tr>
        `);
    }
}

function renderActions(profile) {
    renderBooleanTable("actionsTable", profile.actions, "Goodwin action");
}

function renderQuests(profile) {
    renderBooleanTable("questsTable", profile.quests, "Quest");
}

function renderHistory(history) {
    const table = document.getElementById("historyTable");
    const tbody = table?.querySelector("tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    for (const run of history || []) {
        const status = statusPresentation(run.result);
        tbody.insertAdjacentHTML("beforeend", `
            <tr>
                <td>${escapeHtml(formatDateTime(run.date))}</td>
                <td class="${status.cssClass}">${status.icon} ${escapeHtml(status.label)}</td>
                <td>${Number(run.completed || 0)}</td>
                <td>${Number(run.failed || 0)}</td>
            </tr>
        `);
    }
}

function showDashboardError(error) {
    console.error("Dashboard load failed:", error);
    const target = document.getElementById("dashboardMeta");
    if (target) {
        target.innerHTML = `
            <div class="meta-card failure">
                Dashboard data could not be loaded. ${escapeHtml(error.message)}
            </div>
        `;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadDashboard().catch(showDashboardError);
});
