document.addEventListener('DOMContentLoaded', () => {
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-input');
    const uploadContent = document.querySelector('.upload-content');
    const loadingState = document.getElementById('loading-state');
    const resultsSection = document.getElementById('results-section');
    const summaryText = document.getElementById('summary-text');
    const errorsContainer = document.getElementById('errors-container');
    const btnReset = document.getElementById('btn-reset');

    // Drag and Drop Events
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    btnReset.addEventListener('click', () => {
        resultsSection.classList.add('hidden');
        uploadZone.classList.remove('hidden');
        fileInput.value = '';
    });

    async function handleFile(file) {
        if (!file.name.endsWith('.log') && !file.name.endsWith('.txt')) {
            alert('Please upload a .log or .txt file.');
            return;
        }

        // Show loading state
        uploadContent.classList.add('hidden');
        loadingState.classList.remove('hidden');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/analyze', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Analysis failed');
            }

            const data = await response.json();
            displayResults(data);

        } catch (error) {
            console.error('Error:', error);
            alert(`Error: ${error.message}`);
            // Reset UI on error
            uploadContent.classList.remove('hidden');
            loadingState.classList.add('hidden');
        }
    }

    function displayResults(data) {
        // Hide upload, show results
        uploadZone.classList.add('hidden');
        uploadContent.classList.remove('hidden');
        loadingState.classList.add('hidden');
        resultsSection.classList.remove('hidden');

        // Render overview
        summaryText.textContent = data.incident_overview || data.summary || "No incident overview provided.";

        // Render metrics
        const metricsDash = document.getElementById('metrics-dashboard');
        if (data.metrics) {
            document.getElementById('metric-errors').textContent = data.metrics.total_errors || 0;
            document.getElementById('metric-warnings').textContent = data.metrics.total_warnings || 0;
            document.getElementById('metric-services').textContent = data.metrics.failed_services || 0;
            metricsDash.classList.remove('hidden');
        } else {
            metricsDash.classList.add('hidden');
        }

        // Render recommendations
        const recContainer = document.getElementById('recommendations-container');
        const recList = document.getElementById('recommendations-list');
        recList.innerHTML = '';
        if (data.recommendations && data.recommendations.length > 0) {
            data.recommendations.forEach(rec => {
                const li = document.createElement('li');
                li.innerHTML = `<i class="ph ph-check-circle"></i> ${escapeHtml(rec)}`;
                recList.appendChild(li);
            });
            recContainer.classList.remove('hidden');
        } else {
            recContainer.classList.add('hidden');
        }

        // Render errors
        errorsContainer.innerHTML = '';
        
        if (!data.errors || data.errors.length === 0) {
            errorsContainer.innerHTML = `
                <div class="glass-card" style="text-align: center; color: var(--primary);">
                    <i class="ph ph-check-circle" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                    <h3>All Good!</h3>
                    <p>No critical errors were found in this log.</p>
                </div>
            `;
            return;
        }

        data.errors.forEach(err => {
            const errorCard = document.createElement('div');
            errorCard.className = 'error-card';
            
            let badgesHtml = '';
            if (err.affected_service || err.confidence_score || err.severity) {
                badgesHtml = `<div class="rca-badges">`;
                if (err.severity) {
                    const sevLower = err.severity.toLowerCase();
                    badgesHtml += `<span class="badge badge-${sevLower}"><i class="ph ph-warning"></i> ${escapeHtml(err.severity)}</span>`;
                }
                if (err.affected_service) {
                    badgesHtml += `<span class="badge badge-service"><i class="ph ph-hard-drive"></i> ${escapeHtml(err.affected_service)}</span>`;
                }
                if (err.confidence_score) {
                    badgesHtml += `<span class="badge badge-confidence"><i class="ph ph-chart-line-up"></i> Confidence: ${escapeHtml(err.confidence_score)}</span>`;
                }
                badgesHtml += `</div>`;
            }

            let rcaHtml = '';
            if (err.root_cause) {
                rcaHtml = `
                <div class="explanation-section" style="margin-bottom: 1rem;">
                    <h4><i class="ph ph-magnifying-glass"></i> Root Cause</h4>
                    <p>${escapeHtml(err.root_cause)}</p>
                </div>`;
            }

            let debuggingAreasHtml = '';
            if (err.recommended_debugging_areas && err.recommended_debugging_areas.length > 0) {
                const areas = err.recommended_debugging_areas.map(area => 
                    `<li><i class="ph ph-target"></i> ${escapeHtml(area)}</li>`
                ).join('');
                debuggingAreasHtml = `
                <div class="fix-section" style="margin-top: 1rem; background: transparent; border: none; padding: 0;">
                    <h4><i class="ph ph-crosshair"></i> Recommended Debugging Areas</h4>
                    <ul class="debugging-areas-list">
                        ${areas}
                    </ul>
                </div>`;
            }
            
            errorCard.innerHTML = `
                <div class="error-header">
                    <i class="ph ph-warning-circle"></i> Issue Detected
                </div>
                ${badgesHtml}
                <div class="code-block">${escapeHtml(err.message)}</div>
                
                ${rcaHtml}
                <div class="explanation-section">
                    <h4><i class="ph ph-book-open"></i> Simple Explanation</h4>
                    <p>${escapeHtml(err.explanation)}</p>
                </div>

                <div class="fix-section">
                    <h4><i class="ph ph-wrench"></i> Suggested Fix</h4>
                    <p>${escapeHtml(err.fix)}</p>
                </div>
                
                ${debuggingAreasHtml}
            `;
            
            errorsContainer.appendChild(errorCard);
        });
    }

    // Utility to prevent XSS
    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return String(unsafe)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});
