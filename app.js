document.addEventListener("DOMContentLoaded", () => {
    let originalData = [];
    let filteredData = [];
    window.riskChart = null;

    fetch("ATM annotations.json")
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            originalData = formatData(data);
            filteredData = [...originalData];
            populateFilters(data);
            createTable(filteredData);
            createChart(filteredData);
            setupFilters();
            setupColumnToggle();
            setupSearch();
        })
        .catch(error => console.error("Error loading JSON file:", error));

    function formatData(data) {
        const formatted = [];
        for (const [key, details] of Object.entries(data)) {
            const { Title, Cancer, Risk, Medical_Actions_Management, Authors } = details;
            const types = Cancer.Types || [];
            const risks = Risk.Percentages || {};
            const cancerEvidence = Cancer.Evidence || [];

            types.forEach(type => {
                const management = Medical_Actions_Management[type] || {};
                formatted.push({
                    Title,
                    Cancer: type,
                    Risk: risks[type] || "Unknown",
                    Management: management.Recommendations?.join("; ") || "No recommendations",
                    EvidenceCancer: cancerEvidence.join("; ") || "No evidence provided",
                    EvidenceManagement: management.Evidence?.join("; ") || "No evidence provided",
                    Authors: Authors?.join(", ") || "No authors listed"
                });
            });
        }
        return formatted;
    }

    function createTable(data) {
        const tbody = document.querySelector("#riskTable tbody");
        tbody.innerHTML = "";

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No matching results</td></tr>`;
            return;
        }

        data.forEach(item => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${item.Title}</td>
                <td>${item.Cancer}</td>
                <td>${item.Risk}</td>
                <td>${item.Management}</td>
                <td>${item.EvidenceCancer}</td>
                <td>${item.EvidenceManagement}</td>
                <td class="authors">${item.Authors}</td>
            `;
            tbody.appendChild(row);
        });
    }

    function createChart(data) {
        const ctx = document.getElementById("riskChart").getContext("2d");
        const labels = data.map(item => item.Cancer);
        const risks = data.map(item => parseFloat(item.Risk.match(/\d+/)?.[0]) || 0);

        if (window.riskChart) window.riskChart.destroy();

        window.riskChart = new Chart(ctx, {
            type: "bar",
            data: {
                labels,
                datasets: [{
                    label: "Risk Percentage",
                    data: risks,
                    backgroundColor: "rgba(75, 192, 192, 0.2)",
                    borderColor: "rgba(75, 192, 192, 1)",
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: "Risk Percentage" } }
                }
            }
        });
    }

    function populateFilters(data) {
        const paperFilter = document.getElementById("paperFilter");
        Object.keys(data).forEach(key => {
            const option = document.createElement("option");
            option.value = key;
            option.textContent = key;
            paperFilter.appendChild(option);
        });

        const cancerFilter = document.getElementById("cancerFilter");
        const allTypes = [...new Set(originalData.map(item => item.Cancer))];
        allTypes.forEach(type => {
            const option = document.createElement("option");
            option.value = type;
            option.textContent = type;
            cancerFilter.appendChild(option);
        });
    }

    function setupFilters() {
        document.getElementById("filterBtn").addEventListener("click", () => {
            const paper = document.getElementById("paperFilter").value;
            const cancer = document.getElementById("cancerFilter").value;

            filteredData = originalData.filter(item =>
                (paper === "All" || item.Title.includes(paper)) &&
                (cancer === "All" || item.Cancer === cancer)
            );

            createTable(filteredData);
            createChart(filteredData);
        });

        document.getElementById("clearBtn").addEventListener("click", () => {
            filteredData = [...originalData];
            createTable(filteredData);
            createChart(filteredData);
        });
    }

    function setupColumnToggle() {
        document.querySelectorAll(".column-toggle").forEach(toggle => {
            toggle.addEventListener("change", () => {
                const column = toggle.dataset.column;
                document.querySelectorAll(`.${column}`).forEach(cell => {
                    cell.style.display = toggle.checked ? "" : "none";
                });
            });
        });
    }

    function setupSearch() {
        document.getElementById("searchBar").addEventListener("input", e => {
            const term = e.target.value.toLowerCase();
            filteredData = originalData.filter(item =>
                Object.values(item).some(value => value.toLowerCase().includes(term))
            );
            createTable(filteredData);
            createChart(filteredData);
        });
    }
});
