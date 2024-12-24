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
            setupFilters();
            setupSearch();
        })
        .catch(error => console.error("Error loading JSON file:", error));

    // Format JSON data
    function formatData(data) {
        const formatted = [];
        for (const [paper, details] of Object.entries(data)) {
            const { Title, Cancer, Risk, Medical_Actions_Management } = details;
            const types = Cancer.Types || [];
            const risks = Risk.Percentages || {};
            const evidence = Cancer.Evidence || [];

            types.forEach(type => {
                formatted.push({
                    Title,
                    Cancer: type,
                    Risk: risks[type] || "Unknown",
                    Management: Medical_Actions_Management[type]?.Recommendations?.join("; ") || "No recommendations",
                    Evidence: Medical_Actions_Management[type]?.Evidence?.join("; ") || evidence.join("; ")
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
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No matching results</td></tr>`;
            return;
        }

        data.forEach(item => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td class="title">${item.Title}</td>
                <td class="cancer">${item.Cancer}</td>
                <td class="risk">${item.Risk}</td>
                <td class="management">${item.Management}</td>
                <td class="evidence">${item.Evidence}</td>
            `;
            tbody.appendChild(row);
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
        });

        clearBtn.addEventListener("click", () => {
            document.getElementById("searchBar").value = "";
            paperFilter.value = "All";
            cancerFilter.value = "All";
            filteredData = [...originalData];
            createTable(filteredData);
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
                item.Evidence.toLowerCase().includes(searchTerm) ||
                item.Title.toLowerCase().includes(searchTerm)
            );
            createTable(filteredData);
        });
    }
});
