async function fetchJson(path) {
    const response = await fetch(path);
    return await response.json();
}

async function loadDashboard() {

    const latest =
        await fetchJson("latest-run.json");

    const history =
        await fetchJson("history.json");

    const profile =
        await fetchJson("data/actions-profile.json");

    renderSummary(latest);

    renderMeta(
    	latest,
    	profile
    );

    renderAccounts(latest);

    renderActions(profile);

    renderQuests(profile);

    renderHistory(history);
}

function renderSummary(report) {

    document.getElementById(
        "summaryCards"
    ).innerHTML = `

        <div class="summary-card">
            <h3>${report.totalEnabledAccounts || 0}</h3>
            <span>Accounts</span>
        </div>

        <div class="summary-card">
            <h3>${report.completed || 0}</h3>
            <span>Completed</span>
        </div>

        <div class="summary-card">
            <h3>${report.confirmed || 0}</h3>
            <span>Success</span>
        </div>

        <div class="summary-card">
            <h3>${report.failed || 0}</h3>
            <span>Failed</span>
        </div>

        <div class="summary-card">
            <h3>${report.overallResult}</h3>
            <span>Status</span>
        </div>
    `;
}

function renderAccounts(report) {

    const tbody =
        document.querySelector(
            "#accountsTable tbody"
        );

    tbody.innerHTML = "";

    report.accounts.forEach(account => {

        tbody.innerHTML += `
            <tr>
                <td>${account.name}</td>

                <td class="${
                    account.result ===
                    "SUCCESS_CONFIRMED"
                        ? "success"
                        : "failure"
                }">

                    ${account.result}
                </td>

                <td>
                    ${account.completionReason || "-"}
                </td>
            </tr>
        `;
    });
}

function renderActions(profile) {

    const tbody =
        document.querySelector(
            "#actionsTable tbody"
        );

    tbody.innerHTML = "";

    Object.entries(profile.actions)
        .forEach(([action, enabled]) => {

        tbody.innerHTML += `
            <tr>
                <td>${action}</td>
                <td>${enabled ? "✅" : "❌"}</td>
            </tr>
        `;
    });
}

function renderQuests(profile) {

    const tbody =
        document.querySelector(
            "#questsTable tbody"
        );

    tbody.innerHTML = "";

    Object.entries(profile.quests)
        .forEach(([quest, enabled]) => {

        tbody.innerHTML += `
            <tr>
                <td>${quest}</td>
                <td>${enabled ? "✅" : "❌"}</td>
            </tr>
        `;
    });
}

function renderHistory(history) {

    const tbody =
        document.querySelector(
            "#historyTable tbody"
        );

    tbody.innerHTML = "";

    history.forEach(run => {

        tbody.innerHTML += `
            <tr>
                <td>${run.date}</td>
                <td>${run.result}</td>
                <td>${run.completed || "-"}</td>
                <td>${run.failed || "-"}</td>
            </tr>
        `;
    });
}

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadDashboard()
            .catch(error => {

                console.error(
                    "Dashboard load failed:",
                    error
                );

            });

    }
);

function renderMeta(report, profile) {

    const finishedAt =
        report.finishedAt
            ? new Date(
                report.finishedAt
            ).toLocaleString()
            : "N/A";

    document.getElementById(
        "dashboardMeta"
    ).innerHTML = `
    
        <div class="meta-card">

            <strong>Profile:</strong>
            ${profile.profileName}

            &nbsp;&nbsp;&nbsp;&nbsp;

            <strong>Last Updated:</strong>
            ${finishedAt}

            &nbsp;&nbsp;&nbsp;&nbsp;

            <strong>Version:</strong>
            v1.1.1

        </div>

    `;
}
