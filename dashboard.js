let stagesData = []; // Store stages globally for modal use
let advisoryData = {}; // Store all advisory data
let currentProfile = {}; // Store current profile

function openStageModal(stage) {
  document.getElementById('modal-stage-name').textContent = stage.name;
  document.getElementById('modal-day-range').textContent = `Day ${stage.day_start} - ${stage.day_end}`;
  document.getElementById('modal-fertilizer').textContent = stage.fertilizer;
  document.getElementById('modal-irrigation').textContent = stage.irrigation;
  document.getElementById('modal-pest-watch').textContent = stage.pest_watch;
  document.getElementById('modal-disease-risk').textContent = stage.disease_risk;

  // Show/hide critical tag
  const criticalTag = document.getElementById('criticalTag');
  if (stage.critical_stage === 'true' || stage.critical_stage === true) {
    criticalTag.style.display = 'inline-block';
  } else {
    criticalTag.style.display = 'none';
  }

  document.getElementById('stageModal').classList.add('active');
}

function closeStageModal() {
  document.getElementById('stageModal').classList.remove('active');
}

function openEditModal() {
  document.getElementById('editCrop').value = currentProfile.crop.toLowerCase();
  document.getElementById('editSowingDate').value = currentProfile.sowingDate;
  document.getElementById('editModal').classList.add('active');
}

function closeEditModal() {
  document.getElementById('editModal').classList.remove('active');
}

function saveProfile() {
  const newCrop = document.getElementById('editCrop').value;
  const newDate = document.getElementById('editSowingDate').value;

  currentProfile.crop = newCrop.charAt(0).toUpperCase() + newCrop.slice(1);
  currentProfile.sowingDate = newDate;

  localStorage.setItem('farmerProfile', JSON.stringify(currentProfile));
  closeEditModal();
  initDashboard();
}

function renderLinearProgressBar(stages, currentStageObj) {
  const progressBar = document.getElementById('progressBar');
  progressBar.innerHTML = '';

  const totalStages = stages.length;

  stages.forEach((stage, index) => {
    const segment = document.createElement('div');
    segment.className = 'progress-segment';
    segment.setAttribute('data-stage', stage.stage);
    segment.style.flex = `1`;

    const fill = document.createElement('div');
    fill.className = 'segment-fill';

    const label = document.createElement('span');
    label.className = 'segment-label';
    label.textContent = stage.stage;

    // Classify segments
    if (stage.stage < currentStageObj.stage) {
      fill.classList.add('completed');
    } else if (stage.stage === currentStageObj.stage) {
      fill.classList.add('active');
    } else {
      fill.classList.add('future');
    }

    segment.appendChild(fill);
    segment.appendChild(label);

    // Add click listener
    segment.addEventListener('click', () => {
      openStageModal(stage);
    });

    // Add tooltip on hover
    segment.title = `${stage.name}\nDay ${stage.day_start}-${stage.day_end}`;

    progressBar.appendChild(segment);
  });
}

function showCriticalAlert(stage) {
  const alertBanner = document.getElementById('criticalAlert');
  const alertMessage = document.getElementById('alertMessage');

  if (stage.critical_stage === 'true' || stage.critical_stage === true) {
    alertMessage.textContent = `⚠️ ${stage.name} is a critical stage. Requires immediate attention and close monitoring for optimal yield.`;
    alertBanner.style.display = 'flex';
  } else {
    alertBanner.style.display = 'none';
  }
}

function initDashboard() {
  const profile = getFarmerProfile();

  if (!profile) {
    window.location.href = 'index.html';
    return;
  }

  currentProfile = profile;

  fetch('advisory.json')
    .then(res => res.json())
    .then(data => {
      advisoryData = data;
      const daysSinceSowing = getDaysSinceSowing(profile.sowingDate);
      const cropCode = profile.crop.toLowerCase();
      const stages = data[cropCode] || [];
      stagesData = stages;
      const currentStage = getCurrentStage(stages, daysSinceSowing);

      // Update header
      document.getElementById('farmer-name').textContent = `Hello, ${profile.name}`;
      document.getElementById('crop-badge').textContent = profile.crop;
      document.getElementById('days-count').textContent = `${daysSinceSowing} days since sowing`;
      document.getElementById('stage-name').textContent = currentStage.name;

      // Render linear progress bar
      renderLinearProgressBar(stages, currentStage);

      // Show critical alert if applicable
      showCriticalAlert(currentStage);

      // Render advisory preview
      const preview = currentStage.fertilizer.substring(0, 80);
      document.getElementById('advisory-preview').textContent = preview + (preview.length < currentStage.fertilizer.length ? '...' : '');

      // Show NEW badge if today is first day of stage
      if (daysSinceSowing === currentStage.day_start) {
        document.getElementById('new-badge').style.display = 'inline-block';
      } else {
        document.getElementById('new-badge').style.display = 'none';
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

// Modal event listeners
document.getElementById('closeModal')?.addEventListener('click', closeStageModal);
document.getElementById('modalOverlay')?.addEventListener('click', closeStageModal);

// Edit modal listeners
document.getElementById('editProfileBtn')?.addEventListener('click', openEditModal);
document.getElementById('closeEditModal')?.addEventListener('click', closeEditModal);
document.getElementById('editModalOverlay')?.addEventListener('click', closeEditModal);
document.getElementById('saveProfileBtn')?.addEventListener('click', saveProfile);
document.getElementById('cancelEditBtn')?.addEventListener('click', closeEditModal);

// Back button handler
document.querySelector('.back-btn')?.addEventListener('click', () => {
  localStorage.removeItem('farmerProfile');
  window.location.href = 'index.html';
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboard);
} else {
  initDashboard();
}
