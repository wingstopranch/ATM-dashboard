document.addEventListener("DOMContentLoaded", () => {
    let originalData = [];
    let filteredData = [];
    window.riskChart = null;

    // Load JSON data
    fetch("ATM annotations.json")
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
            setupSearch();
        })
        .catch(error => console.error("Error loading JSON file:", error));

    // Format JSON data for easier use
    function formatData(data) {
        const formatted = [];
        for (const [paper, details] of Object.entries(data)) {
            const { Cancer, Risk, Medical_Actions_Management } = details;
            const types = Cancer.Types || [];
            const risks = Risk.Percentages || {};
            const recommendations = Medical_Actions_Management.Recommendations || [];
            types.forEach(type => {
                formatted.push({
                    Paper: paper,
                    Cancer: type,
                    Risk: risks[type] || "Unknown",
                    Management: recommendations.join("; ")
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
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">No matching results</td></tr>`;
            return;
        }

        data.forEach(item => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${item.Cancer}</td>
                <td>${item.Risk}</td>
                <td>${item.Management}</td>
            `;
            tbody.appendChild(row);
        });
    }

    // Create chart
    function createChart(data) {
        const ctx = document.getElementById("riskChart").getContext("2d");
        const labels = data.map(item => item.Cancer);
        const risks = data.map(item => {
            const match = item.Risk.match(/(\d+\.?\d*)/);
            return match ? parseFloat(match[0]) : 0;
        });

        if (window.riskChart) {
            window.riskChart.destroy();
        }

        window.riskChart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    label: "Cancer Risk (%)",
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
                        title: { display: true, text: "Risk Percentage (%)" }
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
                const paperMatch = paperValue === "All" || item.Paper === paperValue;
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

    // Setup search bar
    function setupSearch() {
        const searchBar = document.getElementById("searchBar");
        searchBar.addEventListener("input", () => {
            const searchTerm = searchBar.value.trim().toLowerCase();
            filteredData = originalData.filter(item =>
                item.Cancer.toLowerCase().includes(searchTerm) ||
                item.Management.toLowerCase().includes(searchTerm)
            );
            createTable(filteredData);
            createChart(filteredData);
        });
    }
});
