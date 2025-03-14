// Global variables
let activeGoal = null;
let activeGoalId = null;
let goals = [];
let nextId = 1;
let userId = null;
const APP_VERSION = ''; // Changed version number
// Track completed goals deletion
let completedGoalsDeletionCount = 0;
// Flag to track if support modal has been shown
let supportModalShown = false;

// LocalStorage management functions
function setLocalData(name, value) {
    localStorage.setItem(name, value);
}

function getLocalData(name) {
    return localStorage.getItem(name);
}

function removeLocalData(name) {
    localStorage.removeItem(name);
}

// Generate a unique user ID if not exists
function generateUserId() {
    let id = getLocalData('userId');
    if (!id) {
        id = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        setLocalData('userId', id); // Store in localStorage
    }
    return id;
}

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Generate or retrieve user ID
    userId = generateUserId();
    console.log('User ID:', userId);
    
    // Load completed goals deletion count
    const savedDeletionCount = getLocalData('completed_deletions_count');
    if (savedDeletionCount) {
        completedGoalsDeletionCount = parseInt(savedDeletionCount);
    }
    
    // Load support modal shown flag
    const modalShown = getLocalData('support_modal_shown');
    if (modalShown) {
        supportModalShown = modalShown === 'true';
    }
    
    // Show welcome message for new users
    const isReturningUser = getLocalData('returning_user');
    if (!isReturningUser) {
        showWelcomeMessage();
        setLocalData('returning_user', 'true');
    }
    
    // Show user badge
    showUserBadge();
    
    // Show version badge
    showVersionBadge();
    
    // Load goals from localStorage
    loadGoals();
    
    // Set up event listeners
    setupEventListeners();
    
    // Render goals
    renderGoals();
});

// Show welcome message for new users
function showWelcomeMessage() {
    const welcomeDiv = document.createElement('div');
    welcomeDiv.className = 'welcome-message';
    welcomeDiv.innerHTML = `
        <div class="welcome-content">
            <h2>به ردیاب <b>کارهات</b> خوش اومدی</h2>
            <p>اطلاعاتت به صورت خودکار توی مرورگرت ذخیره میشه.</p>
            <button id="welcome-close">حله</button>
        </div>
    `;
    document.body.appendChild(welcomeDiv);
    
    // Add animation
    setTimeout(() => {
        welcomeDiv.classList.add('visible');
    }, 100);
    
    // Close button event
    document.getElementById('welcome-close').addEventListener('click', function() {
        welcomeDiv.classList.remove('visible');
        setTimeout(() => {
            welcomeDiv.remove();
        }, 500);
    });
}

// Custom notification system
function showNotification(message, type = 'info', duration = 2000) {
    // Remove any existing notification with the same type
    const existingNotification = document.querySelector(`.notification.${type}`);
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notificationDiv = document.createElement('div');
    notificationDiv.className = `notification ${type}`;
    
    // Set icon based on type
    let icon = '💬';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';
    if (type === 'info') icon = 'ℹ️';
    
    notificationDiv.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${icon}</span>
            <p>${message}</p>
            <button class="notification-close">×</button>
        </div>
    `;
    
    // Make sure notification is added at the end of body to be on top of everything
    document.body.appendChild(notificationDiv);
    
    // Ensure the notification has the highest z-index
    notificationDiv.style.zIndex = '9999';
    
    // Add close button event
    notificationDiv.querySelector('.notification-close').addEventListener('click', function() {
        notificationDiv.classList.remove('visible');
        setTimeout(() => {
            notificationDiv.remove();
        }, 300);
    });
    
    // Show with animation
    setTimeout(() => {
        notificationDiv.classList.add('visible');
    }, 10);
    
    // Auto hide after duration
    if (duration > 0) {
        setTimeout(() => {
            if (notificationDiv.parentNode) {
                notificationDiv.classList.remove('visible');
                setTimeout(() => {
                    if (notificationDiv.parentNode) {
                        notificationDiv.remove();
                    }
                }, 300);
            }
        }, duration);
    }
    
    return notificationDiv;
}

// Show modal dialog (replacement for alert/confirm)
function showModal(options) {
    return new Promise((resolve) => {
        // Create modal element
        const modalDiv = document.createElement('div');
        modalDiv.className = 'modal-overlay';
        
        // Set content based on options
        const title = options.title || '';
        const message = options.message || '';
        const confirmText = options.confirmText || 'تایید';
        const cancelText = options.cancelText || 'لغو';
        const type = options.type || 'info';
        
        // Set icon based on type
        let icon = '💬';
        if (type === 'success') icon = '✅';
        if (type === 'error') icon = '❌';
        if (type === 'warning') icon = '⚠️';
        if (type === 'info') icon = 'ℹ️';
        
        modalDiv.innerHTML = `
            <div class="modal-content ${type}">
                <div class="modal-header">
                    <span class="modal-icon">${icon}</span>
                    <h3>${title}</h3>
                    ${options.showClose !== false ? '<button class="modal-close">×</button>' : ''}
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    ${options.showCancel !== false ? `<button class="modal-button cancel-button">${cancelText}</button>` : ''}
                    <button class="modal-button confirm-button">${confirmText}</button>
                </div>
            </div>
        `;
        
        // Add to body
        document.body.appendChild(modalDiv);
        
        // Add close button event if present
        const closeButton = modalDiv.querySelector('.modal-close');
        if (closeButton) {
            closeButton.addEventListener('click', function() {
                closeModal(modalDiv);
                resolve(false);
            });
        }
        
        // Add cancel button event if present
        const cancelButton = modalDiv.querySelector('.cancel-button');
        if (cancelButton) {
            cancelButton.addEventListener('click', function() {
                closeModal(modalDiv);
                resolve(false);
            });
        }
        
        // Add confirm button event
        const confirmButton = modalDiv.querySelector('.confirm-button');
        confirmButton.addEventListener('click', function() {
            closeModal(modalDiv);
            resolve(true);
        });
        
        // Add click event to close modal when clicking outside
        modalDiv.addEventListener('click', function(event) {
            // Check if the click was on the overlay (outside the modal content)
            if (event.target === modalDiv) {
                closeModal(modalDiv);
                resolve(false);
            }
        });
        
        // Show with animation
        setTimeout(() => {
            modalDiv.classList.add('visible');
        }, 10);
    });
}

// Close modal with animation
function closeModal(modalDiv) {
    modalDiv.classList.remove('visible');
    setTimeout(() => {
        modalDiv.remove();
    }, 300);
}

// Show user badge
function showUserBadge() {
    const badgeDiv = document.createElement('div');
    badgeDiv.className = 'user-badge';
    
    // Get short user ID for display
    const shortId = userId.split('_')[2] || userId.substring(0, 6);
    
    badgeDiv.innerHTML = `
        <span class="user-icon">👤</span>
        <span class="user-id">کاربر: ${shortId}</span>
    `;
    document.body.appendChild(badgeDiv);
    
    // Add click event to show user info
    badgeDiv.addEventListener('click', function() {
        showUserInfo();
    });
}

// Show version badge
function showVersionBadge() {
    const versionContainer = document.createElement('div');
    versionContainer.className = 'version-container';
    
    const versionDiv = document.createElement('div');
    versionDiv.className = 'version-badge';
    versionDiv.textContent = `نسخه ${APP_VERSION} آزمایشی`;
    
    const supportButton = document.createElement('div');
    supportButton.className = 'support-button';
    supportButton.textContent = 'حمایت از توسعه‌دهنده';
    supportButton.addEventListener('click', showSupportModal);
    
    versionContainer.appendChild(versionDiv);
    versionContainer.appendChild(supportButton);
    document.body.appendChild(versionContainer);
}

// Show support modal
function showSupportModal() {
    const modalDiv = document.createElement('div');
    modalDiv.className = 'modal-overlay';
    
    modalDiv.innerHTML = `
        <div class="modal-content support">
            <div class="modal-header">
                <span class="modal-icon">💖</span>
                <h3>حمایت از توسعه‌دهنده</h3>
                <button class="modal-close">×</button>
            </div>
            <div class="modal-body">
                <div class="support-content">
                    <p>اگه این پروژه برات مفید بوده، می‌تونی با یکی از روش‌های زیر<br>از توسعه‌دهنده حمایت کنی:</p>
                        <div class="support-option">
                            <ul>
                                <li><a href="https://github.com/mehrazino/task-tracker/issues/new" target="_blank">اگه پیشنهادی داری بهم بگی</a></li>
                                <li><a href="https://github.com/mehrazino/task-tracker" target="_blank">یه ⭐ به این پروژه در گیت‌هاب بدی</a></li>
                                <li><a href="https://github.com/mehrazino/task-tracker/fork" target="_blank">در توسعه کد مشارکت کنی</a></li>
                            </ul>
                        </div>
                    <br>
                    <p class="support-thanks">ممنون از همراهیت. 😊🙏</p>
                </div>
            </div>
            <div class="modal-footer">
                <button class="modal-button confirm-button">باشه حالا!</button>
            </div>
        </div>
    `;
    
    // Add to body
    document.body.appendChild(modalDiv);
    
    // Add close button event
    const closeButton = modalDiv.querySelector('.modal-close');
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            closeModal(modalDiv);
        });
    }
    
    // Add confirm button event
    const confirmButton = modalDiv.querySelector('.confirm-button');
    confirmButton.addEventListener('click', function() {
        closeModal(modalDiv);
    });
    
    // Add click event to close modal when clicking outside
    modalDiv.addEventListener('click', function(event) {
        // Check if the click was on the overlay (outside the modal content)
        if (event.target === modalDiv) {
            closeModal(modalDiv);
        }
    });
    
    // Show with animation
    setTimeout(() => {
        modalDiv.classList.add('visible');
    }, 10);
}

// Show user info
function showUserInfo() {
    // Count total goals and completed goals
    const totalGoals = goals.length;
    const completedGoals = goals.filter(goal => goal.current >= goal.target && goal.target > 0).length;
    
    // Calculate completion percentage
    const completionPercentage = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
    
    const modalDiv = document.createElement('div');
    modalDiv.className = 'modal-overlay';
    
    modalDiv.innerHTML = `
        <div class="modal-content info">
            <div class="modal-header">
                <span class="modal-icon">ℹ️</span>
                <h3>اطلاعات کاربر</h3>
                <button class="modal-close">×</button>
            </div>  
            <div class="modal-body">
                <div class="user-info-content">
                    <p><strong>تعداد کل کارها:</strong> ${totalGoals}</p>
                    <p><strong>کارهای انجام شده:</strong> ${completedGoals} (${completionPercentage}%)</p>
                    
                    <div class="data-transfer-section">
                        <h4>انتقال داده‌ها</h4>
                        <p>برای انتقال اطلاعاتت به دستگاه‌ها و مرورگرهای دیگه، می‌تونی از گزینه‌های زیر استفاده کنی:</p>
                        <div class="data-transfer-buttons">
                            <button id="export-data-button" class="export-button">دریافت داده‌ها</button>
                            <button id="import-data-button" class="import-button">وارد کردن داده‌ها</button>
                        </div>
                    </div>
                    
                    <div class="user-data-actions">
                        <button id="clear-data-button" class="clear-data-button">پاک کردن داده‌ها</button>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="modal-button confirm-button">بستن</button>
            </div>
        </div>
    `;
    
    // Add to body
    document.body.appendChild(modalDiv);
    
    // Add close button event
    const closeButton = modalDiv.querySelector('.modal-close');
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            closeModal(modalDiv);
        });
    }
    
    // Add confirm button event
    const confirmButton = modalDiv.querySelector('.confirm-button');
    confirmButton.addEventListener('click', function() {
        closeModal(modalDiv);
    });
    
    // Add event listener to clear data button
    const clearDataButton = modalDiv.querySelector('#clear-data-button');
    if (clearDataButton) {
        clearDataButton.addEventListener('click', clearAllData);
    }
    
    // Add event listener to export data button
    const exportDataButton = modalDiv.querySelector('#export-data-button');
    if (exportDataButton) {
        exportDataButton.addEventListener('click', function() {
            showExportDataModal();
        });
    }
    
    // Add event listener to import data button
    const importDataButton = modalDiv.querySelector('#import-data-button');
    if (importDataButton) {
        importDataButton.addEventListener('click', function() {
            showImportDataModal();
        });
    }
    
    // Add click event to close modal when clicking outside
    modalDiv.addEventListener('click', function(event) {
        // Check if the click was on the overlay (outside the modal content)
        if (event.target === modalDiv) {
            closeModal(modalDiv);
        }
    });
    
    // Show with animation
    setTimeout(() => {
        modalDiv.classList.add('visible');
    }, 10);
}

// Load goals from localStorage
function loadGoals() {
    const savedGoals = getLocalData('goals_' + userId);
    if (savedGoals) {
        goals = JSON.parse(savedGoals);
        
        // Find the highest ID to set nextId
        if (goals.length > 0) {
            const maxId = Math.max(...goals.map(goal => goal.id));
            nextId = maxId + 1;
            
            // Update Telegram links for all goals
            goals.forEach((goal, index) => {
                updateTelegramLink(index);
            });
            
            // Save updated goals with updated links
            saveGoals();
        }
    }
}

// Save goals to localStorage
function saveGoals() {
    setLocalData('goals_' + userId, JSON.stringify(goals));
}

// Set up event listeners
function setupEventListeners() {
    // Toggle add form
    const toggleButton = document.getElementById('toggle-add-form');
    if (toggleButton) {
        toggleButton.addEventListener('click', toggleAddForm);
    }
    
    // Add goal submit button
    const addGoalSubmit = document.getElementById('add-goal-submit');
    if (addGoalSubmit) {
        addGoalSubmit.addEventListener('click', addGoal);
    }
    
    // Document click event to close active goal when clicking outside
    document.addEventListener('click', function(event) {
        // If we click outside any goal card
        if (!event.target.closest('.goal') && activeGoal) {
            closeActiveGoal();
        }
        
        // If we click outside the add form and toggle button
        const addForm = document.getElementById('add-goal-form');
        const toggleButton = document.getElementById('toggle-add-form');
        
        if (addForm.classList.contains('visible') && 
            !event.target.closest('#add-goal-form') && 
            event.target !== toggleButton && 
            !toggleButton.contains(event.target)) {
            closeAddForm();
        }
    });
}

// Render goals
function renderGoals() {
    const goalsContainer = document.getElementById('goals');
    goalsContainer.innerHTML = '';
    
    goals.forEach(goal => {
        const goalElement = createGoalElement(goal);
        goalsContainer.appendChild(goalElement);
    });
}

// Create a goal element
function createGoalElement(goal) {
    // Calculate percentage only if target is not null
    const hasTarget = goal.target !== null;
    const percentage = hasTarget && goal.target > 0 ? (goal.current / goal.target * 100).toFixed(1) : 0;
    const isCompleted = hasTarget && goal.current >= goal.target && goal.target > 0;
    
    // Create goal element
    const goalElement = document.createElement('div');
    goalElement.className = 'goal';
    goalElement.setAttribute('data-goal-id', goal.id);
    
    // Add click event to toggle controls
    goalElement.addEventListener('click', function(event) {
        // Prevent clicks on form elements from toggling the goal
        if (event.target.tagName === 'INPUT' || 
            event.target.tagName === 'BUTTON' || 
            event.target.tagName === 'A' ||
            event.target.closest('form') ||
            event.target.closest('.input-group') ||
            event.target.classList.contains('info-icon')) {
            return;
        }
        
        toggleGoalControls(this, goal.id);
    });
    
    // Create goal HTML
    let goalHTML = `
        <h3 class="goal-title">
            <span class="goal-title-text">${goal.name}</span>
            <div class="goal-title-icons">
                <span class="info-icon" title="اطلاعات کارت" onclick="showGoalInfo(${goal.id}); event.stopPropagation();">ℹ️</span>
                ${goal.link ? `<a href="${goal.link}" target="_blank" class="link-icon" onclick="event.stopPropagation();" title="باز کردن لینک">🔗</a>` : ''}
            </div>
        </h3>
        
        <div class="goal-stats">
            ${goal.current} از ${hasTarget ? goal.target : '؟'} 
            ${hasTarget ? `(${percentage}%)` : ''}
        </div>
    `;
    
    // Add progress bar only if target is not null
    if (hasTarget) {
        goalHTML += `
        <div class="progress-bar-container">
            <div class="progress-bar" style="width: ${percentage}%;"></div>
        </div>
        `;
    }
    
    // Add completed badge if goal is completed
    if (isCompleted) {
        goalHTML += `<div class="completed-badge">انجام شد</div>`;
    }
    
    // Add controls
    goalHTML += `<div class="goal-controls">`;
    
    if (isCompleted) {
        goalHTML += `
            <div class="button-group">
                <button class="del-button" onclick="deleteGoal(${goal.id}); event.stopPropagation();">حذف</button>
            </div>
        `;
    } else {
        goalHTML += `
            <div class="button-group">
                <div class="input-group">
                    <input type="number" id="increment-value-${goal.id}" name="increment_value" placeholder="عدد" onclick="event.stopPropagation();">
                    <button type="button" onclick="updateProgress(${goal.id}, document.getElementById('increment-value-${goal.id}').value); event.stopPropagation();">افزایش</button>
                </div>
            </div>
            
            <div class="button-group">
                <button class="edit-button" onclick="toggleEditForm(event, ${goal.id})">ویرایش</button>
                <button class="del-button" onclick="deleteGoal(${goal.id}); event.stopPropagation();">حذف</button>
            </div>
            
            <div id="input-container-${goal.id}" style="display: none;" class="input-group">
                <div class="input-group">
                    <input type="number" id="new-target-${goal.id}" min="0" placeholder="تعداد جدید" required onclick="event.stopPropagation();">
                    <button type="button" onclick="editGoal(${goal.id}); event.stopPropagation();">به‌روزرسانی</button>
                </div>
            </div>
        `;
    }
    
    goalHTML += `</div>`;
    
    // Set the HTML
    goalElement.innerHTML = goalHTML;
    
    return goalElement;
}

// Function to show goal information
function showGoalInfo(goalId) {
    // Find the goal
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    
    // Check if goal is completed
    const isCompleted = goal.current >= goal.target && goal.target > 0;
    
    // Format creation date
    const creationDateObj = goal.createdAt ? new Date(goal.createdAt) : new Date();
    const formattedCreationDate = new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(creationDateObj);
    
    // Format completion date if completed
    let formattedCompletionDate = '';
    if (isCompleted) {
        // If we don't have a completion date recorded, record it now
        if (!goal.completedAt) {
            goal.completedAt = new Date().toISOString();
            saveGoals();
        }
        
        const completionDateObj = new Date(goal.completedAt);
        formattedCompletionDate = new Intl.DateTimeFormat('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(completionDateObj);
    }
    
    let message = `<div class="goal-info-content">
        <div class="info-section">
            <p><strong>تاریخ ایجاد کار:</strong> <span class="date-value">${formattedCreationDate}</span></p>
        </div>`;
    
    if (isCompleted) {
        message += `
        <div class="info-section">
            <p><strong>تاریخ تکمیل:</strong> <span class="date-value">${formattedCompletionDate}</span></p>
        </div>`;
    }
    
    message += `</div>`;
    
    // Show modal with goal info
    showModal({
        title: `اطلاعات کار: ${goal.name}`,
        message: message,
        confirmText: 'بستن',
        type: 'info',
        showCancel: false
    });
}

// Function to update progress
function updateProgress(goalId, incrementValue) {
    // Default to 1 if no value provided
    if (!incrementValue) incrementValue = 1;
    incrementValue = parseInt(incrementValue);
    
    // Find the goal
    const goalIndex = goals.findIndex(goal => goal.id === goalId);
    if (goalIndex !== -1) {
        const wasCompleted = goals[goalIndex].current >= goals[goalIndex].target && goals[goalIndex].target > 0;
        
        // Update current value
        goals[goalIndex].current += incrementValue;
        goals[goalIndex].lastUpdated = new Date().toISOString();
        
        // Update Telegram link if applicable and get update status
        const linkUpdated = updateTelegramLink(goalIndex);
        
        // Check if goal is newly completed
        const isNowCompleted = goals[goalIndex].current >= goals[goalIndex].target && goals[goalIndex].target > 0;
        if (isNowCompleted && !wasCompleted) {
            // Record completion date
            goals[goalIndex].completedAt = new Date().toISOString();
        }
        
        // Save to localStorage
        saveGoals();
        
        // Update the goal element in the DOM
        updateGoalElement(goalId);
        
        // Clear the input field
        const inputField = document.getElementById(`increment-value-${goalId}`);
        if (inputField) {
            inputField.value = '';
        }
        
    }
}

// Function to update Telegram link based on current progress
function updateTelegramLink(goalIndex) {
    const goal = goals[goalIndex];
    
    // Check if the goal has a link and if it's a Telegram link
    if (goal.link && typeof goal.link === 'string' && goal.link.includes('t.me/')) {
        try {
            // Parse the URL
            const url = new URL(goal.link);
            const pathParts = url.pathname.split('/').filter(part => part);
            
            // Make sure we have at least a channel name
            if (pathParts.length >= 1) {
                // The channel name is the first part
                const channelName = pathParts[0];
                
                // Create a new URL with the current progress as the post number
                // Even if target is null (unknown), we still update the link with current progress
                const newUrl = `https://t.me/${channelName}/${goal.current}`;
                
                // Update the link
                if (goal.link !== newUrl) {
                    console.log(`Updating Telegram link for "${goal.name}" from ${goal.link} to ${newUrl}`);
                    goal.link = newUrl;
                    return true; // Return true to indicate the link was updated
                }
            }
        } catch (error) {
            console.error(`Error updating Telegram link for goal ${goal.id}:`, error);
        }
    }
    return false; // Return false to indicate no update was made
}

// Update a specific goal element
function updateGoalElement(goalId) {
    const goalIndex = goals.findIndex(goal => goal.id === goalId);
    if (goalIndex === -1) return;
    
    const goal = goals[goalIndex];
    const existingElement = document.querySelector(`.goal[data-goal-id="${goalId}"]`);
    
    if (existingElement) {
        // Check if target was null before and now has a value
        const hasTarget = goal.target !== null;
        const percentage = hasTarget && goal.target > 0 ? (goal.current / goal.target * 100).toFixed(1) : 0;
        
        // Update stats text
        const statsElement = existingElement.querySelector('.goal-stats');
        statsElement.textContent = `${goal.current} از ${hasTarget ? goal.target : '؟'} ${hasTarget ? `(${percentage}%)` : ''}`;
        
        // Update link if it exists
        if (goal.link) {
            const linkElement = existingElement.querySelector('.link-icon');
            if (linkElement) {
                linkElement.href = goal.link;
            } else {
                // If link element doesn't exist but goal has a link, recreate the title section
                const titleElement = existingElement.querySelector('.goal-title');
                if (titleElement) {
                    titleElement.innerHTML = `
                        <span class="goal-title-text">${goal.name}</span>
                        <div class="goal-title-icons">
                            <span class="info-icon" title="اطلاعات کارت" onclick="showGoalInfo(${goal.id}); event.stopPropagation();">ℹ️</span>
                            <a href="${goal.link}" target="_blank" class="link-icon" onclick="event.stopPropagation();" title="باز کردن لینک">🔗</a>
                        </div>
                    `;
                }
            }
        }
        
        // Check if we need to add or update progress bar
        let progressBarContainer = existingElement.querySelector('.progress-bar-container');
        
        if (hasTarget) {
            if (!progressBarContainer) {
                // Target was added, create progress bar container and bar
                progressBarContainer = document.createElement('div');
                progressBarContainer.className = 'progress-bar-container';
                
                const progressBar = document.createElement('div');
                progressBar.className = 'progress-bar';
                progressBar.style.width = '0%'; // Start at 0 for animation
                
                progressBarContainer.appendChild(progressBar);
                
                // Insert after stats
                const statsElement = existingElement.querySelector('.goal-stats');
                statsElement.insertAdjacentElement('afterend', progressBarContainer);
                
                // Force reflow to ensure animation works
                void progressBarContainer.offsetWidth;
                
                // Set transition for smooth animation
                progressBar.style.transition = 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)';
                
                // Add the updating class for wave animation
                progressBar.classList.add('updating');
                
                // Update width with delay to ensure animation is visible
                setTimeout(() => {
                    progressBar.style.width = `${percentage}%`;
                }, 50);
                
                // Remove the updating class after animation completes
                setTimeout(() => {
                    progressBar.classList.remove('updating');
                }, 1050);
            } else {
                // Progress bar exists, just update it
                const progressBar = progressBarContainer.querySelector('.progress-bar');
                
                // Make sure the transition is applied
                progressBar.style.transition = 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)';
                
                // Add the updating class for wave animation
                progressBar.classList.add('updating');
                
                // Update width with delay to ensure animation is visible
                setTimeout(() => {
                    progressBar.style.width = `${percentage}%`;
                }, 50);
                
                // Remove the updating class after animation completes
                setTimeout(() => {
                    progressBar.classList.remove('updating');
                }, 1050);
            }
        } else if (progressBarContainer) {
            // Target was removed, remove progress bar with animation
            progressBarContainer.style.transition = 'opacity 0.5s ease';
            progressBarContainer.style.opacity = '0';
            
            setTimeout(() => {
                if (progressBarContainer.parentNode) {
                    progressBarContainer.parentNode.removeChild(progressBarContainer);
                }
            }, 500);
        }
        
        // Check if completion status changed
        const isCompleted = hasTarget && goal.current >= goal.target && goal.target > 0;
        const hasCompletedBadge = existingElement.querySelector('.completed-badge');
        
        if (isCompleted && !hasCompletedBadge) {
            // Record completion date if not already set
            if (!goal.completedAt) {
                goal.completedAt = new Date().toISOString();
                saveGoals();
            }
            
            // Add completed badge without animation
            const completedBadge = document.createElement('div');
            completedBadge.className = 'completed-badge';
            completedBadge.textContent = 'انجام شد';
            
            // Insert before controls
            const controls = existingElement.querySelector('.goal-controls');
            existingElement.insertBefore(completedBadge, controls);
            
            // Update controls to show only delete button
            const controlsHTML = `
                <div class="button-group">
                    <button class="del-button" onclick="deleteGoal(${goal.id}); event.stopPropagation();">حذف</button>
                </div>
            `;
            controls.innerHTML = controlsHTML;
        } else if (!isCompleted && hasCompletedBadge) {
            // Remove completed badge without animation
            if (hasCompletedBadge.parentNode) {
                hasCompletedBadge.parentNode.removeChild(hasCompletedBadge);
            }
            
            // Remove completion date
            if (goal.completedAt) {
                delete goal.completedAt;
                saveGoals();
            }
            
            // Recreate the full controls
            const newElement = createGoalElement(goal);
            existingElement.parentNode.replaceChild(newElement, existingElement);
            
            // If this was the active goal, update the activeGoal reference
            if (activeGoalId === goalId) {
                activeGoal = newElement;
                newElement.classList.add('active');
            }
        }
    }
}

// Function to toggle the add form visibility
function toggleAddForm() {
    const form = document.getElementById('add-goal-form');
    const toggleButton = document.getElementById('toggle-add-form');
    
    if (form.classList.contains('visible')) {
        // Hide the form
        form.classList.remove('visible');
        toggleButton.classList.remove('active');
        toggleButton.textContent = 'افزودن کار جدید';
        
        // Animate closing
        form.style.opacity = '0';
        form.style.maxHeight = '0';
        form.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            form.style.display = 'none';
        }, 500);
    } else {
        // Show the form
        form.style.display = 'flex';
        form.style.opacity = '0';
        form.style.maxHeight = '0';
        form.style.transform = 'translateY(-20px)';
        
        // Force reflow
        void form.offsetWidth;
        
        // Animate opening
        form.classList.add('visible');
        toggleButton.classList.add('active');
        toggleButton.textContent = 'بستن';
        
        form.style.opacity = '1';
        form.style.maxHeight = '200px'; // Adjust based on your form's height
        form.style.transform = 'translateY(0)';
    }
}

// Function to close the add form
function closeAddForm() {
    const form = document.getElementById('add-goal-form');
    const toggleButton = document.getElementById('toggle-add-form');
    
    if (form.classList.contains('visible')) {
        // Hide the form
        form.classList.remove('visible');
        toggleButton.classList.remove('active');
        toggleButton.textContent = 'افزودن کار جدید';
        
        // Animate closing
        form.style.opacity = '0';
        form.style.maxHeight = '0';
        form.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            form.style.display = 'none';
        }, 500);
    }
}

// Function to show/hide goal controls
function toggleGoalControls(goalElement, goalId) {
    // If there's a previously active goal that's different from the current one, deactivate it
    if (activeGoal && activeGoal !== goalElement) {
        activeGoal.classList.remove('active');
    }
    
    // Toggle the state of the current goal
    goalElement.classList.toggle('active');
    
    // Update the active goal
    if (goalElement.classList.contains('active')) {
        activeGoal = goalElement;
        activeGoalId = goalId;
    } else {
        activeGoal = null;
        activeGoalId = null;
    }
}

// Function to close active goal
function closeActiveGoal() {
    if (activeGoal) {
        activeGoal.classList.remove('active');
        activeGoal = null;
        activeGoalId = null;
        
        // Also close any open edit forms
        closeAllEditForms();
    }
}

// Function to close all edit forms
function closeAllEditForms() {
    const editForms = document.querySelectorAll('[id^="input-container-"]');
    editForms.forEach(form => {
        if (form.style.display !== 'none') {
            // Set transitions for smooth animation
            form.style.transition = 'opacity 0.4s ease, max-height 0.4s ease';
            
            // Animate to hidden state
            form.style.opacity = '0';
            form.style.maxHeight = '0';
            
            // Wait for animation to complete before hiding
            setTimeout(() => {
                form.style.display = 'none';
            }, 400); // Match the transition duration
        }
    });
}

// Function to show/hide the edit form
function toggleEditForm(event, goalId) {
    event.stopPropagation(); // Prevent the click event from propagating to the card
    
    var inputContainer = document.getElementById('input-container-' + goalId);
    if (inputContainer.style.display === 'none' || inputContainer.style.display === '') {
        // First set display to block but with height 0 and opacity 0
        inputContainer.style.display = 'block';
        inputContainer.style.maxHeight = '0';
        inputContainer.style.opacity = '0';
        inputContainer.style.overflow = 'hidden';
        
        // Ensure the container has proper spacing
        inputContainer.style.marginTop = '15px';
        inputContainer.style.paddingTop = '15px';
        inputContainer.style.borderTop = '1px dashed var(--card-border)';
        
        // Set transitions for smooth animation
        inputContainer.style.transition = 'opacity 0.6s ease, max-height 0.6s ease';
        
        // Force reflow
        void inputContainer.offsetWidth;
        
        // Animate to visible state
        inputContainer.style.opacity = '1';
        inputContainer.style.maxHeight = '100px'; // Adjust based on your form's height
    } else {
        // Animate to hidden state
        inputContainer.style.opacity = '0';
        inputContainer.style.maxHeight = '0';
        
        // Wait for animation to complete before hiding
        setTimeout(() => {
            inputContainer.style.display = 'none';
        }, 400); // Match the transition duration
    }
}

// Function to add a new goal
function addGoal() {
    const nameInput = document.getElementById('goal_name');
    const targetInput = document.getElementById('goal_target');
    const linkInput = document.getElementById('goal_link');
    
    const name = nameInput.value.trim();
    const targetValue = targetInput.value.trim();
    const link = linkInput.value.trim();
    
    // The number of tasks can be empty or a positive number
    const target = targetValue === '' ? null : parseInt(targetValue);
    
    if (name && (target === null || (!isNaN(target) && target > 0))) {
        // Create new goal
        const newGoal = {
            id: nextId++,
            name: name,
            target: target,
            current: 0,
            link: link || null,
            createdAt: new Date().toISOString()
        };
        
        // Add to goals array
        goals.push(newGoal);
        
        // Save to localStorage
        saveGoals();
        
        // Add the new goal to the DOM
        const goalsContainer = document.getElementById('goals');
        const goalElement = createGoalElement(newGoal);
        goalsContainer.appendChild(goalElement);
        
        // Clear form
        nameInput.value = '';
        targetInput.value = '';
        linkInput.value = '';
        
        // Close form
        closeAddForm();
        
        // Show success notification
        showNotification(`کار "${name}" با موفقیت اضافه شد!`, 'success');
    } else {
        showNotification('لطفاً نام کار را به درستی وارد کنید!', 'error');
    }
}

// Function to edit a goal
function editGoal(goalId) {
    const newTargetInput = document.getElementById(`new-target-${goalId}`);
    const newTargetValue = newTargetInput.value.trim();
    
    // The number of tasks can be empty or a positive number
    const newTarget = newTargetValue === '' ? null : parseInt(newTargetValue);
    
    if (newTargetValue === '' || (!isNaN(newTarget) && newTarget >= 0)) {
        // Find the goal
        const goalIndex = goals.findIndex(goal => goal.id === goalId);
        if (goalIndex !== -1) {
            // Update target value
            goals[goalIndex].target = newTarget;
            goals[goalIndex].lastUpdated = new Date().toISOString();
            
            // Update Telegram link if applicable
            const linkUpdated = updateTelegramLink(goalIndex);
            
            // Save to localStorage
            saveGoals();
            
            // Update the goal element in the DOM
            updateGoalElement(goalId);
            
            // Close the edit form
            closeAllEditForms();
            
            // Show success notification
            showNotification(`کار "${goals[goalIndex].name}" با موفقیت به‌روز شد!`, 'success');
            
        }
    } else {
        showNotification('لطفاً تعداد کار را به درستی وارد کنید!', 'error');
    }
}

// Function to delete a goal
function deleteGoal(goalId, confirmed = false) {
    // Find the goal element
    const goalElement = document.querySelector(`.goal[data-goal-id="${goalId}"]`);
    
    if (!goalElement) return;
    
    if (!confirmed) {
        // Show confirmation UI inside the card
        const controls = goalElement.querySelector('.goal-controls');
        
        // Store the original content to restore if canceled
        if (!controls.hasAttribute('data-original-content')) {
            controls.setAttribute('data-original-content', controls.innerHTML);
        }
        
        // Create confirmation UI
        const confirmationHTML = `
            <div class="delete-confirmation">
                <p class="confirmation-message">آیا مطمئنی که می‌خوای این کار رو حذف کنی؟</p>
                <div class="confirmation-buttons">
                    <button class="confirm-delete-button" onclick="deleteGoal(${goalId}, true); event.stopPropagation();">حذف</button>
                    <button class="cancel-delete-button" onclick="cancelDelete(${goalId}); event.stopPropagation();">لغو</button>
                </div>
            </div>
        `;
        
        // Apply fade-out animation to current content
        controls.style.transition = 'opacity 0.3s ease';
        controls.style.opacity = '0';
        
        // Replace content after fade-out
        setTimeout(() => {
            controls.innerHTML = confirmationHTML;
            controls.style.opacity = '1';
        }, 300);
        
        return;
    }
    
    // Find the goal to check if it's completed
    const goalIndex = goals.findIndex(goal => goal.id === goalId);
    const isCompletedGoal = goalIndex !== -1 && 
                           goals[goalIndex].current >= goals[goalIndex].target && 
                           goals[goalIndex].target > 0;
    
    // If confirmed, proceed with deletion
    // Add a fade-out animation
    goalElement.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    goalElement.style.opacity = '0';
    goalElement.style.transform = 'scale(0.8)';
    
    setTimeout(() => {
        // Remove the element after animation
        if (goalElement.parentNode) {
            goalElement.parentNode.removeChild(goalElement);
        }
        
        // Remove the goal from the array
        goals = goals.filter(goal => goal.id !== goalId);
        
        // Save to localStorage
        saveGoals();
        
        // Reset active goal if it was deleted
        if (activeGoalId === goalId) {
            activeGoal = null;
            activeGoalId = null;
        }
        
        // If a completed goal was deleted, increment the counter
        if (isCompletedGoal) {
            completedGoalsDeletionCount++;
            setLocalData('completed_deletions_count', completedGoalsDeletionCount);
            
            // Check if we should show the support modal
            if (completedGoalsDeletionCount >= 3 && !supportModalShown) {
                setTimeout(() => {
                    showSupportModal();
                    supportModalShown = true;
                    setLocalData('support_modal_shown', 'true');
                }, 500);
            }
        }
    }, 500);
}

// Function to cancel delete operation
function cancelDelete(goalId) {
    const goalElement = document.querySelector(`.goal[data-goal-id="${goalId}"]`);
    if (!goalElement) return;
    
    const controls = goalElement.querySelector('.goal-controls');
    const originalContent = controls.getAttribute('data-original-content');
    
    if (originalContent) {
        // Apply fade-out animation
        controls.style.opacity = '0';
        
        // Restore original content after fade-out
        setTimeout(() => {
            controls.innerHTML = originalContent;
            controls.removeAttribute('data-original-content');
            controls.style.opacity = '1';
        }, 300);
    }
}

// Clear all data
function clearAllData() {
    showModal({
        title: 'پاک کردن داده‌ها',
        message: 'مطمئنی می‌خوای همه داده‌هات رو پاک کنی؟<br>بعد از حذف دیگه برگشت نداره!',
        confirmText: 'آره، پاک کن',
        cancelText: 'نه، بی‌خیال',
        type: 'warning'
    }).then(confirmed => {
        if (confirmed) {
            // Clear all localStorage data
            removeLocalData('userId');
            removeLocalData('returning_user');
            removeLocalData('goals_' + userId);
            
            // Show notification
            showNotification('همه داده‌هات پاک شد. صفحه دوباره بارگذاری میشه...', 'success');
            
            // Reload page after a short delay
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        }
    });
}

// Show export data modal
function showExportDataModal() {
    // Generate export data
    const exportData = exportUserData();
    
    const modalDiv = document.createElement('div');
    modalDiv.className = 'modal-overlay';
    
    modalDiv.innerHTML = `
        <div class="modal-content info">
            <div class="modal-header">
                <span class="modal-icon">📤</span>
                <h3>دریافت داده‌ها</h3>
                <button class="modal-close">×</button>
            </div>
            <div class="modal-body">
                <div class="export-data-content">
                    <p>این کد رو کپی کن و توی دستگاه یا مرورگر دیگه‌ت از طریق گزینه «وارد کردن داده‌ها» وارد کن:</p>
                    <div class="export-data-container">
                        <textarea id="export-data-text" readonly class="export-data-textarea">${exportData}</textarea>
                    </div>
                    <div class="export-data-actions">
                        <button id="copy-export-data" class="copy-export-button">کپی کردن کد</button>
                    </div>
                    <div class="export-data-instructions">
                        <p>راهنما:</p>
                        <ol>
                            <li>دکمه «کپی کردن کد» رو بزن.</li>
                            <li>توی دستگاه دیگه، به بخش اطلاعات کاربر برو.</li>
                            <li>گزینه «وارد کردن داده‌ها» رو انتخاب کن.</li>
                            <li>کد کپی شده رو توی کادر مربوطه جای‌گذاری کن.</li>
                        </ol>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="modal-button confirm-button">بستن</button>
            </div>
        </div>
    `;
    
    // Add to body
    document.body.appendChild(modalDiv);
    
    // Add close button event
    const closeButton = modalDiv.querySelector('.modal-close');
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            closeModal(modalDiv);
        });
    }
    
    // Add confirm button event
    const confirmButton = modalDiv.querySelector('.confirm-button');
    confirmButton.addEventListener('click', function() {
        closeModal(modalDiv);
    });
    
    // Add copy button event
    const copyButton = modalDiv.querySelector('#copy-export-data');
    const exportDataText = modalDiv.querySelector('#export-data-text');
    
    if (copyButton && exportDataText) {
        copyButton.addEventListener('click', function() {
            exportDataText.select();
            document.execCommand('copy');
            
            // Show feedback
            copyButton.textContent = 'کپی شد!';
            copyButton.classList.add('copied');
            
            // Show notification
            showNotification('کد با موفقیت کپی شد!', 'success');
            
            // Reset button text after 2 seconds
            setTimeout(() => {
                copyButton.textContent = 'کپی کردن کد';
                copyButton.classList.remove('copied');
            }, 2000);
        });
    }
    
    // Show with animation
    setTimeout(() => {
        modalDiv.classList.add('visible');
    }, 10);
}

// Show import data modal
function showImportDataModal() {
    const modalDiv = document.createElement('div');
    modalDiv.className = 'modal-overlay';
    
    modalDiv.innerHTML = `
        <div class="modal-content info">
            <div class="modal-header">
                <span class="modal-icon">📥</span>
                <h3>وارد کردن داده‌ها</h3>
                <button class="modal-close">×</button>
            </div>
            <div class="modal-body">
                <div class="import-data-content">
                    <p>کد کپی شده رو در این کادر وارد کن:</p>
                    <div class="import-data-container">
                        <textarea id="import-data-text" class="import-data-textarea" placeholder="اینجا"></textarea>
                    </div>
                    <div class="import-data-warning">
                        <p>⚠️ توجه: این کار همه داده‌های فعلیت رو با داده‌های جدید جایگزین می‌کنه!</p>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="modal-button cancel-button">بی‌خیال</button>
                <button class="modal-button confirm-button" id="import-data-confirm">ثبت </button>
            </div>
        </div>
    `;
    
    // Add to body
    document.body.appendChild(modalDiv);
    
    // Add close button event
    const closeButton = modalDiv.querySelector('.modal-close');
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            closeModal(modalDiv);
        });
    }
    
    // Add cancel button event
    const cancelButton = modalDiv.querySelector('.cancel-button');
    if (cancelButton) {
        cancelButton.addEventListener('click', function() {
            closeModal(modalDiv);
        });
    }
    
    // Add confirm button event
    const confirmButton = modalDiv.querySelector('#import-data-confirm');
    const importDataText = modalDiv.querySelector('#import-data-text');
    
    if (confirmButton && importDataText) {
        confirmButton.addEventListener('click', function() {
            const importData = importDataText.value.trim();
            
            if (!importData) {
                showNotification('اول کد رو وارد کن', 'error');
                return;
            }
            
            // Show confirmation dialog
            showModal({
                title: 'تأیید وارد کردن داده‌ها',
                message: 'مطمئنی می‌خوای داده‌های فعلیت رو با داده‌های جدید جایگزین کنی؟<br>این کار برگشت نداره!',
                confirmText: 'آره، وارد کن',
                cancelText: 'نه، بیخیال',
                type: 'warning'
            }).then(confirmed => {
                if (confirmed) {
                    // Try to import data
                    const success = importUserData(importData);
                    
                    if (success) {
                        // Close the import modal
                        closeModal(modalDiv);
                        
                        // Show success notification
                        showNotification('داده‌هات با موفقیت وارد شدن! صفحه داره دوباره بارگذاری میشه...', 'success');
                        
                        // Reload page after a short delay
                        setTimeout(() => {
                            window.location.reload();
                        }, 2000);
                    } else {
                        showNotification('کد وارد شده معتبر نیست.<br> دوباره کد رو کپی و جای‌گذاری!', 'error');
                    }
                }
            });
        });
    }
    
    // Show with animation
    setTimeout(() => {
        modalDiv.classList.add('visible');
    }, 10);
}

// Export user data as JSON string
function exportUserData() {
    const userData = {
        userId: userId,
        goals: goals,
        createdAt: new Date().toISOString()
    };
    
    return JSON.stringify(userData);
}

// Import user data from JSON string
function importUserData(jsonData) {
    try {
        const userData = JSON.parse(jsonData);
        
        if (!userData.userId || !userData.goals || !Array.isArray(userData.goals)) {
            throw new Error('Invalid data format');
        }
        
        // Save the imported user ID
        setLocalData('userId', userData.userId);
        
        // Save the imported goals
        setLocalData('goals_' + userData.userId, JSON.stringify(userData.goals));
        
        return true;
    } catch (error) {
        console.error('Error importing user data:', error);
        return false;
    }
}