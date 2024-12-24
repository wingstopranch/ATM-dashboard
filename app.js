document.addEventListener("DOMContentLoaded", () => {
    let originalData = [];
    let filteredData = [];
    window.riskChart = null;

    // Load JSON data
    fetch("ATM_annotations.json")
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            originalData = formatData(data);
            filteredData = [...originalData];
            createTable(filteredData);
            createChart(filteredData);
            setupFilters();
            setupColumnToggle();
            setupSearch();
        })
        .catch(error => console.error("Error loading JSON file:", error));

    // Format JSON data
    function formatData(data) {
        const formatted = [];
        for (const [paper, details] of Object.entries(data)) {
            const { Title, Cancer, Risk, Medical_Actions_Management, Authors } = details;
            const types = Cancer.Types || [];
            const risks = Risk.Percentages || {};
            const cancerEvidence = Cancer.Evidence || [];

            types.forEach(type => {
                const management = Medical_Actions_Management[type] || {};
                const recommendations = management.Recommendations?.length
                    ? management.Recommendations.join("; ")
                    : "No recommendations";
                formatted.push({
                    Title,
                    Cancer: type,
                    Risk: risks[type] || "Unknown",
                    Management: recommendations,
                    EvidenceCancer: cancerEvidence.join("; ") || "No evidence provided",
                    EvidenceManagement: management.Evidence?.join("; ") || "No evidence provided",
                    Authors: Authors?.join(", ") || "No authors listed"
                });
            });
        }
        return formatted;
    }

    // Create table
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
                <td class="title">${item.Title}</td>
                <td class="cancer">${item.Cancer}</td>
                <td class="risk">${item.Risk}</td>
                <td class="management">${item.Management}</td>
                <td class="evidence-cancer">${item.EvidenceCancer}</td>
                <td class="evidence-management">${item.EvidenceManagement}</td>
                <td class="authors">${item.Authors}</td>
            `;
            tbody.appendChild(row);
        });
    }

    // Create chart
    function createChart(data) {
        const ctx = document.getElementById("riskChart").getContext("2d");
        const labels = data.map(item => item.Cancer);
        const risks = data.map(item => parseFloat(item.Risk.match(/\d+/)?.[0]) || 0);

        if (window.riskChart) {
            window.riskChart.destroy();
        }

        window.riskChart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: labels,
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
                        title: {
                            display: true,
                            text: "Risk Percentage"
                        }
                    }
                }
            }
        });
    }

    // Setup filters
    function setupFilters() {
        const paperFilter = document.getElementById("paperFilter");
        const cancerFilter = document.getElementById("cancerFilter");
        const filterBtn = document.getElementById("filterBtn");
        const clearBtn = document.getElementById("clearBtn");

        filterBtn.addEventListener("click", () => {
            const paperValue = paperFilter.value.trim();
            const cancerValue = cancerFilter.value.trim();
            filteredData = originalData.filter(item => {
                const paperMatch = paperValue === "All" || item.Title.includes(paperValue);
                const cancerMatch = cancerValue === "All" || item.Cancer === cancerValue;
                return paperMatch && cancerMatch;
            });
            createTable(filteredData);
            createChart(filteredData);
        });

        clearBtn.addEventListener("click", () => {
            document.getElementById("searchBar").value = "";
            paperFilter.value = "All";
            cancerFilter.value = "All";
            filteredData = [...originalData];
            createTable(filteredData);
            createChart(filteredData);
        });
    }

    // Setup column toggle
    function setupColumnToggle() {
        const toggles = document.querySelectorAll(".column-toggle");
        toggles.forEach(toggle => {
            toggle.addEventListener("change", () => {
                const columnClass = toggle.dataset.column;
                const isVisible = toggle.checked;
                document.querySelectorAll(`.${columnClass}`).forEach(cell => {
                    cell.style.display = isVisible ? "" : "none";
                });
            });
        });
    }

    // Setup search
    function setupSearch() {
        const searchBar = document.getElementById("searchBar");
        searchBar.addEventListener("input", () => {
            const searchTerm = searchBar.value.trim().toLowerCase();
            filteredData = originalData.filter(item =>
                item.Cancer.toLowerCase().includes(searchTerm) ||
                item.Management.toLowerCase().includes(searchTerm) ||
                item.EvidenceCancer.toLowerCase().includes(searchTerm) ||
                item.EvidenceManagement.toLowerCase().includes(searchTerm) ||
                item.Title.toLowerCase().includes(searchTerm)
            );
            createTable(filteredData);
            createChart(filteredData);
        });
    }
});
