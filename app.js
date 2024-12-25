document.addEventListener("DOMContentLoaded", () => {
    let originalData = [];
    let filteredData = [];
    let riskChart = null;

    fetch("ATM annotations.json")
        .then(response => response.json())
        .then(data => {
            originalData = formatData(data);
            filteredData = [...originalData];
            populateFilters(originalData);
            createTable(filteredData);
            createChart(filteredData);
            setupFilters();
        })
        .catch(error => console.error("Error loading JSON file:", error));

    function formatData(data) {
        const formatted = [];
        for (const [paper, details] of Object.entries(data)) {
            const { Title, Cancer, Risk, Medical_Actions_Management, Authors } = details;
            const types = Cancer.Types || [];
            const risks = Risk.Percentages || {};
            const evidenceForCancer = Cancer.Evidence || [];

            types.forEach(type => {
                const management = Medical_Actions_Management[type.replace(/\s/g, "_")] || {};
                formatted.push({
                    Title,
                    Cancer: type,
                    Risk: risks[type] || "Unknown",
                    Management: management.Recommendations?.join("; ") || "No recommendations",
                    EvidenceCancer: evidenceForCancer.join("; ") || "No evidence provided",
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
                <td>${item.Authors}</td>
            `;
            tbody.appendChild(row);
        });
    }

    function createChart(data) {
        const ctx = document.getElementById("riskChart").getContext("2d");
        const labels = data.map(item => item.Cancer);
        const risks = data.map(item => parseFloat(item.Risk.match(/\d+/)?.[0]) || 0);

        if (riskChart) riskChart.destroy();

        riskChart = new Chart(ctx, {
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
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: "Risk Percentage" }
                    }
                }
            }
        });
    }

    function populateFilters(data) {
        const paperFilter = document.getElementById("paperFilter");
        const cancerFilter = document.getElementById("cancerFilter");

        const papers = [...new Set(data.map(item => item.Title))];
        const cancers = [...new Set(data.map(item => item.Cancer))];

        papers.forEach(paper => {
            const option = document.createElement("option");
            option.value = paper;
            option.textContent = paper;
            paperFilter.appendChild(option);
        });

        cancers.forEach(cancer => {
            const option = document.createElement("option");
            option.value = cancer;
            option.textContent = cancer;
            cancerFilter.appendChild(option);
        });
    }

    function setupFilters() {
        document.getElementById("filterBtn").addEventListener("click", () => {
            const paperValue = document.getElementById("paperFilter").value;
            const cancerValue = document.getElementById("cancerFilter").value;

            filteredData = originalData.filter(item => {
                return (paperValue === "All" || item.Title === paperValue) &&
                    (cancerValue === "All" || item.Cancer === cancerValue);
            });

            createTable(filteredData);
            createChart(filteredData);
        });

        document.getElementById("clearBtn").addEventListener("click", () => {
            filteredData = [...originalData];
            createTable(filteredData);
            createChart(filteredData);
        });
    }
});
