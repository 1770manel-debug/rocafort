document.addEventListener('DOMContentLoaded', () => {
    const anySearchInput = document.getElementById('anySearchInput');
    const trimestreSearchInput = document.getElementById('trimestreSearchInput');
    const pisSearchInput = document.getElementById('pisSearchInput');
    const obresSearchInput = document.getElementById('obresSearchInput');
    const empresaSearchInput = document.getElementById('empresaSearchInput');
    const preuSearchInput = document.getElementById('preuSearchInput');
    const pressupostSearchInput = document.getElementById('pressupostSearchInput');
    const searchButton = document.getElementById('searchButton');

    const resultsTableBody = document.querySelector('#resultsTable tbody');
    let allData = [];

    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRkAoBcQ9DibnUJJaL4MqYG_yd-DxJ0cVlEp5QyADwGR8rcqoKuMbJem9QyErYLEQqydELXPolzCxXS/pub?output=csv';

    Papa.parse(csvUrl, {
        download: true,
        header: true,
        complete: (results) => {
            allData = results.data;
            populateSelects();
            displayResults(allData);
        }
    });

    const searchInputs = [
        { input: anySearchInput, column: 'any', type: 'select' },
        { input: trimestreSearchInput, column: 'trimestre', type: 'select' },
        { input: pisSearchInput, column: 'pis', type: 'select' },
        { input: obresSearchInput, column: 'obres', type: 'text' },
        { input: empresaSearchInput, column: 'empresa', type: 'select' },
        { input: preuSearchInput, column: 'preu', type: 'text' },
        { input: pressupostSearchInput, column: 'pressupost', type: 'text' }
    ];

    function populateSelects() {
        searchInputs.forEach(({ input, column, type }) => {
            if (type === 'select') {
                const uniqueValues = [...new Set(allData.map(row => row[column]).filter(value => value && String(value).trim() !== ''))].sort();
                // Clear existing options except the first one (placeholder)
                while (input.options.length > 1) {
                    input.remove(1);
                }
                uniqueValues.forEach(value => {
                    const option = document.createElement('option');
                    option.value = value;
                    option.textContent = value;
                    input.appendChild(option);
                });
            }
        });
    }

    searchButton.addEventListener('click', performSearch);

    const focusColumns = ['any', 'trimestre', 'pis', 'empresa'];
    searchInputs.forEach(({ input, column, type }) => {
        if (focusColumns.includes(column)) {
            input.addEventListener('focus', () => {
                const filteredOnFocus = allData.filter(row => {
                    const value = row[column];
                    return value && String(value).trim() !== '';
                });
                displayResults(filteredOnFocus);
            });
            input.addEventListener('blur', () => {
                performSearch();
            });
        }
    });

    function performSearch() {
        const activeSearchTerms = searchInputs.map(({ input, column, type }) => {
            let term = '';
            if (type === 'text') {
                term = input.value.toLowerCase();
            } else if (type === 'select') {
                term = input.value; 
            }
            return { term, column, type };
        }).filter(item => item.term); 

        if (activeSearchTerms.length === 0) {
            displayResults(allData);
            return;
        }

        const filteredData = allData.filter(row => {
            // A row matches if it satisfies ALL of the active search terms (AND logic)
            return activeSearchTerms.every(activeSearch => { // Changed from 'some' to 'every'
                const value = row[activeSearch.column];
                if (!value) return false; 

                if (activeSearch.type === 'text') {
                    return String(value).toLowerCase().includes(activeSearch.term);
                } else if (activeSearch.type === 'select') {
                    return String(value) === activeSearch.term; 
                }
                return false;
            });
        });
        displayResults(filteredData);
    }

    function displayResults(data) {
        resultsTableBody.innerHTML = '';
        if (data.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="7" style="text-align: center;">No se encontraron resultados.</td>`;
            resultsTableBody.appendChild(tr);
            return;
        }
        data.forEach(row => {
            const tr = document.createElement('tr');
            const obresValue = row.obres;
            let obresCellContent = obresValue;

            // Simple URL check
            if (obresValue && (obresValue.startsWith('http://') || obresValue.startsWith('https://'))) {
                obresCellContent = `<a href="${obresValue}" target="_blank">${obresValue}</a>`;
            }

            tr.innerHTML = `
                <td>${row.any}</td>
                <td>${row.trimestre}</td>
                <td>${row.pis}</td>
                <td>${obresCellContent}</td> 
                <td>${row.empresa}</td>
                <td>${row.preu}</td>
                <td>${row.pressupost}</td>
            `;
            resultsTableBody.appendChild(tr);
        });
    }
});