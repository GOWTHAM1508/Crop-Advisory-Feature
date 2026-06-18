// FUNCTION 1 — Read farmer profile from localStorage
function getFarmerProfile() {
  const data = localStorage.getItem('farmerProfile');
  return data ? JSON.parse(data) : null;
}

// FUNCTION 2 — Calculate days since sowing
function getDaysSinceSowing(sowingDateStr) {
  const sowing = new Date(sowingDateStr);
  const today = new Date();
  return Math.floor((today - sowing) / (1000 * 60 * 60 * 24));
}

// FUNCTION 3 — Find current stage from days count
function getCurrentStage(cropStages, dayCount) {
  return cropStages.find(s => dayCount >= s.day_start && dayCount <= s.day_end)
    || cropStages[cropStages.length - 1]; // fallback to last if past harvest
}

// FUNCTION 4 — Save feedback to localStorage
function saveFeedback(stageNum, rating, comment) {
  const existing = JSON.parse(localStorage.getItem('feedbackHistory') || '[]');
  existing.push({ stageNum, rating, comment, date: new Date().toISOString() });
  localStorage.setItem('feedbackHistory', JSON.stringify(existing));
}

// FUNCTION 5 — Get engagement summary (for Power BI analytics slide)
function getEngagementSummary() {
  const history = JSON.parse(localStorage.getItem('feedbackHistory') || '[]');
  const actions = JSON.parse(localStorage.getItem('actionsMarked') || '[]');
  const ratings = history.map(f => f.rating).filter(Boolean);
  return {
    totalFeedback: history.length,
    avgRating: ratings.length
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
      : 'No ratings yet',
    actionsMarked: actions.length
  };
}

// Registration form handling (only on index.html)
function initRegistrationForm() {
  const form = document.getElementById('registrationForm');
  if (!form) return; // Exit if not on registration page

  const successMessage = document.getElementById('successMessage');
  const sowingDateInput = document.getElementById('sowingDate');

  function setMaxSowingDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const maxDate = `${year}-${month}-${day}`;
    sowingDateInput.max = maxDate;
  }

  function validateForm() {
    const formGroups = form.querySelectorAll('.form-group');
    let isValid = true;

    formGroups.forEach(group => {
      const input = group.querySelector('input, select');

      if (!input.checkValidity()) {
        group.classList.add('invalid');
        isValid = false;
      } else {
        group.classList.remove('invalid');
      }
    });

    return isValid;
  }

  function saveFarmerProfile() {
    const profile = {
      name: document.getElementById('farmerName').value,
      mobileNumber: document.getElementById('mobileNumber').value,
      crop: document.getElementById('crop').value,
      sowingDate: document.getElementById('sowingDate').value,
      district: document.getElementById('district').value,
      landArea: document.getElementById('landArea').value,
      language: document.getElementById('language').value
    };
    localStorage.setItem('farmerProfile', JSON.stringify(profile));
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    successMessage.classList.remove('show');

    if (validateForm()) {
      saveFarmerProfile();
      successMessage.classList.add('show');
      form.reset();

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 2000);
    }
  });

  form.addEventListener('change', function () {
    const formGroups = form.querySelectorAll('.form-group');
    formGroups.forEach(group => {
      const input = group.querySelector('input, select');
      if (input.checkValidity()) {
        group.classList.remove('invalid');
      }
    });
  });

  setMaxSowingDate();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initRegistrationForm);

//dashboard.html js
function initDashboard() {
  const profile = getFarmerProfile();

  if (!profile) {
    window.location.href = 'index.html';
    return;
  }

  // Fetch advisory data from JSON
  fetch('advisory.json')
    .then(res => res.json())
    .then(advisoryData => {
      const daysSinceSowing = getDaysSinceSowing(profile.sowingDate);
      const cropCode = profile.crop.toLowerCase();
      const stages = advisoryData[cropCode] || [];
      const currentStage = getCurrentStage(stages, daysSinceSowing);

      // Render farmer info
      document.getElementById('farmer-name').textContent = `Hello, ${profile.name}`;
      document.getElementById('crop-badge').textContent = profile.crop;
      document.getElementById('days-count').textContent = `${daysSinceSowing} days since sowing`;
      document.getElementById('stage-name').textContent = currentStage.name;

      // Dynamically create progress bar dots
      const progressBar = document.getElementById('progress-bar');
      progressBar.innerHTML = ''; // Clear existing dots
      stages.forEach((stage, i) => {
        const dot = document.createElement('div');
        dot.className = 'stage-dot';
        dot.id = `stage-dot-${i + 1}`;

        if (stage.stage < currentStage.stage) {
          dot.classList.add('completed');
          dot.innerHTML = '✓';
        } else if (stage.stage === currentStage.stage) {
          dot.classList.add('active');
        }

        progressBar.appendChild(dot);
      });

      // Render advisory preview (first 80 chars from fertilizer advice)
      const preview = currentStage.fertilizer.substring(0, 80);
      document.getElementById('advisory-preview').textContent = preview + (preview.length < currentStage.fertilizer.length ? '...' : '');

      // Show NEW badge if today is first day of stage
      if (daysSinceSowing === currentStage.day_start) {
        document.getElementById('new-badge').style.display = 'inline-block';
      }

      // Link to full advisory
      const advisoryLink = document.getElementById('advisory-link');
      advisoryLink.href = `advisory.html?crop=${cropCode}&stage=${currentStage.stage}`;
    })
    .catch(err => {
      console.error('Failed to load advisory data:', err);
      document.getElementById('advisory-preview').textContent = 'Unable to load advisory data.';
    });
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', initDashboard);
