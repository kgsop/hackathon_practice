// Study Goals Tracker Application
class StudyGoalsTracker {
    constructor() {
        this.goals = this.loadFromStorage('goals') || [];
        this.achievements = this.loadFromStorage('achievements') || [];
        this.currentTab = 'goals';
        
        // Pomodoro Timer Properties
        this.timer = {
            isRunning: false,
            isPaused: false,
            currentTime: 25 * 60, // 25 minutes in seconds
            totalTime: 25 * 60,
            mode: 'work', // 'work', 'break', 'long-break'
            sessionsCompleted: 0,
            sessionsToday: this.loadFromStorage('sessionsToday') || [],
            settings: {
                workDuration: 25,
                breakDuration: 5,
                longBreakDuration: 15,
                sessionsBeforeLongBreak: 4
            }
        };
        this.timerInterval = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderGoals();
        this.renderAchievements();
        this.updateAchievementGoalOptions();
        this.setDefaultDate();
        this.initializePomodoroTimer();
        this.updateTimerDisplay();
        this.updateSessionStats();
        this.renderSessionHistory();
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Goal modal
        document.getElementById('add-goal-btn').addEventListener('click', () => {
            this.openModal('goal-modal');
        });

        document.getElementById('goal-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addGoal();
        });

        document.getElementById('cancel-goal').addEventListener('click', () => {
            this.closeModal('goal-modal');
        });

        // Achievement modal
        document.getElementById('add-achievement-btn').addEventListener('click', () => {
            this.openModal('achievement-modal');
        });

        document.getElementById('achievement-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addAchievement();
        });

        document.getElementById('cancel-achievement').addEventListener('click', () => {
            this.closeModal('achievement-modal');
        });

        // Feedback generation
        document.getElementById('generate-feedback-btn').addEventListener('click', () => {
            this.generateFeedback();
        });

        // Pomodoro Timer Events
        document.getElementById('start-timer-btn').addEventListener('click', () => {
            this.startTimer();
        });

        document.getElementById('pause-timer-btn').addEventListener('click', () => {
            this.pauseTimer();
        });

        document.getElementById('reset-timer-btn').addEventListener('click', () => {
            this.resetTimer();
        });

        // Timer Settings Events
        document.getElementById('work-duration').addEventListener('change', (e) => {
            this.timer.settings.workDuration = parseInt(e.target.value);
            this.updateTimerSettings();
        });

        document.getElementById('break-duration').addEventListener('change', (e) => {
            this.timer.settings.breakDuration = parseInt(e.target.value);
        });

        document.getElementById('long-break-duration').addEventListener('change', (e) => {
            this.timer.settings.longBreakDuration = parseInt(e.target.value);
        });

        document.getElementById('sessions-before-long-break').addEventListener('change', (e) => {
            this.timer.settings.sessionsBeforeLongBreak = parseInt(e.target.value);
        });

        // Modal close events
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                this.closeModal(modal.id);
            });
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });
    }

    switchTab(tabName) {
        // Update active tab
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update active content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        this.currentTab = tabName;
    }

    openModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
        document.body.style.overflow = 'auto';
        this.clearForm(modalId.replace('-modal', '-form'));
    }

    clearForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
        }
    }

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('goal-deadline').value = today;
        document.getElementById('achievement-date').value = today;
    }

    addGoal() {
        const formData = new FormData(document.getElementById('goal-form'));
        const goal = {
            id: Date.now().toString(),
            title: formData.get('goal-title') || document.getElementById('goal-title').value,
            description: formData.get('goal-description') || document.getElementById('goal-description').value,
            category: formData.get('goal-category') || document.getElementById('goal-category').value,
            deadline: formData.get('goal-deadline') || document.getElementById('goal-deadline').value,
            priority: formData.get('goal-priority') || document.getElementById('goal-priority').value,
            createdAt: new Date().toISOString(),
            completed: false
        };

        this.goals.push(goal);
        this.saveToStorage('goals', this.goals);
        this.renderGoals();
        this.closeModal('goal-modal');
        this.updateAchievementGoalOptions();
        this.showNotification('Goal added successfully!', 'success');
    }

    addAchievement() {
        const formData = new FormData(document.getElementById('achievement-form'));
        const achievement = {
            id: Date.now().toString(),
            title: formData.get('achievement-title') || document.getElementById('achievement-title').value,
            description: formData.get('achievement-description') || document.getElementById('achievement-description').value,
            relatedGoal: formData.get('achievement-goal') || document.getElementById('achievement-goal').value,
            date: formData.get('achievement-date') || document.getElementById('achievement-date').value,
            effort: formData.get('achievement-effort') || document.getElementById('achievement-effort').value,
            createdAt: new Date().toISOString()
        };

        this.achievements.push(achievement);
        this.saveToStorage('achievements', this.achievements);
        this.renderAchievements();
        this.closeModal('achievement-modal');
        this.showNotification('Achievement logged successfully!', 'success');
    }

    renderGoals() {
        const goalsList = document.getElementById('goals-list');
        
        if (this.goals.length === 0) {
            goalsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-target"></i>
                    <h3>No Goals Yet</h3>
                    <p>Start your journey by setting your first study goal!</p>
                </div>
            `;
            return;
        }

        goalsList.innerHTML = this.goals.map(goal => `
            <div class="goal-card fade-in">
                <div class="goal-header">
                    <div>
                        <h3 class="goal-title">${this.escapeHtml(goal.title)}</h3>
                        <span class="goal-category">${goal.category}</span>
                    </div>
                    <span class="goal-priority priority-${goal.priority}">${goal.priority}</span>
                </div>
                <p class="goal-description">${this.escapeHtml(goal.description)}</p>
                <div class="goal-meta">
                    <span><i class="fas fa-calendar"></i> Due: ${this.formatDate(goal.deadline)}</span>
                    <span><i class="fas fa-clock"></i> ${this.getDaysUntilDeadline(goal.deadline)}</span>
                </div>
                <div class="goal-actions">
                    <button class="btn btn-success btn-small" onclick="studyTracker.completeGoal('${goal.id}')">
                        <i class="fas fa-check"></i> Complete
                    </button>
                    <button class="btn btn-danger btn-small" onclick="studyTracker.deleteGoal('${goal.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderAchievements() {
        const achievementsList = document.getElementById('achievements-list');
        
        if (this.achievements.length === 0) {
            achievementsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-trophy"></i>
                    <h3>No Achievements Yet</h3>
                    <p>Start logging your accomplishments to track your progress!</p>
                </div>
            `;
            return;
        }

        achievementsList.innerHTML = this.achievements
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(achievement => `
                <div class="achievement-card slide-in-left">
                    <div class="achievement-header">
                        <h3 class="achievement-title">${this.escapeHtml(achievement.title)}</h3>
                        <span class="achievement-date">${this.formatDate(achievement.date)}</span>
                    </div>
                    <p class="achievement-description">${this.escapeHtml(achievement.description)}</p>
                    <div class="achievement-meta">
                        ${achievement.relatedGoal ? `<span><i class="fas fa-link"></i> Related to: ${this.getGoalTitle(achievement.relatedGoal)}</span>` : ''}
                        <span class="achievement-effort effort-${achievement.effort}">${achievement.effort}</span>
                    </div>
                </div>
            `).join('');
    }

    updateAchievementGoalOptions() {
        const goalSelect = document.getElementById('achievement-goal');
        const currentValue = goalSelect.value;
        
        goalSelect.innerHTML = '<option value="">Select Goal (Optional)</option>' +
            this.goals.map(goal => 
                `<option value="${goal.id}">${this.escapeHtml(goal.title)}</option>`
            ).join('');
        
        goalSelect.value = currentValue;
    }

    completeGoal(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (goal) {
            goal.completed = true;
            goal.completedAt = new Date().toISOString();
            this.saveToStorage('goals', this.goals);
            this.renderGoals();
            this.showNotification('Goal completed! Great job!', 'success');
        }
    }

    deleteGoal(goalId) {
        if (confirm('Are you sure you want to delete this goal?')) {
            this.goals = this.goals.filter(g => g.id !== goalId);
            this.saveToStorage('goals', this.goals);
            this.renderGoals();
            this.updateAchievementGoalOptions();
            this.showNotification('Goal deleted', 'info');
        }
    }

    generateFeedback() {
        const motivationContent = document.getElementById('motivation-content');
        const reflectionContent = document.getElementById('reflection-content');
        const progressContent = document.getElementById('progress-content');

        // Generate motivation
        const motivation = this.getMotivationalMessage();
        motivationContent.innerHTML = `<p>${motivation}</p>`;

        // Generate reflection prompts
        const reflectionPrompts = this.getReflectionPrompts();
        reflectionContent.innerHTML = `
            <p>Here are some questions to help you reflect on your learning journey:</p>
            <ul>
                ${reflectionPrompts.map(prompt => `<li>${prompt}</li>`).join('')}
            </ul>
        `;

        // Generate progress insights
        const progressInsights = this.getProgressInsights();
        progressContent.innerHTML = `
            <div class="progress-stats">
                ${progressInsights.map(stat => `
                    <div class="stat-card">
                        <div class="stat-number">${stat.value}</div>
                        <div class="stat-label">${stat.label}</div>
                    </div>
                `).join('')}
            </div>
            <p>${progressInsights.insight}</p>
        `;

        this.showNotification('Feedback generated! Check out your personalized insights.', 'success');
    }

    getMotivationalMessage() {
        const messages = [
            "Every expert was once a beginner. Every pro was once an amateur. Keep going!",
            "The only way to do great work is to love what you do. Your dedication shows!",
            "Success is not final, failure is not fatal: it is the courage to continue that counts.",
            "You are capable of amazing things. Trust the process and keep moving forward.",
            "Learning is a treasure that will follow its owner everywhere. You're building something valuable!",
            "The future belongs to those who believe in the beauty of their dreams. Keep dreaming big!",
            "Your hard work today is preparing you for tomorrow's opportunities.",
            "Every small step you take brings you closer to your goals. You're doing great!",
            "Challenges are what make life interesting. Overcoming them is what makes life meaningful.",
            "You have within you right now, everything you need to deal with whatever the world can throw at you."
        ];

        const completedGoals = this.goals.filter(g => g.completed).length;
        const totalGoals = this.goals.length;
        
        if (completedGoals > 0 && totalGoals > 0) {
            const completionRate = (completedGoals / totalGoals) * 100;
            if (completionRate >= 80) {
                return "Outstanding! You've completed most of your goals. You're a true achiever! " + messages[Math.floor(Math.random() * messages.length)];
            } else if (completionRate >= 50) {
                return "Great progress! You're more than halfway there. " + messages[Math.floor(Math.random() * messages.length)];
            } else {
                return "Keep pushing forward! Every step counts. " + messages[Math.floor(Math.random() * messages.length)];
            }
        }

        return messages[Math.floor(Math.random() * messages.length)];
    }

    getReflectionPrompts() {
        const prompts = [
            "What was the most challenging concept you learned recently?",
            "How did you overcome a difficult problem in your studies?",
            "What study technique worked best for you this week?",
            "What would you do differently if you could redo a recent study session?",
            "How has your understanding of your subject evolved?",
            "What connections have you made between different topics?",
            "What questions do you still have about your current studies?",
            "How do you plan to apply what you've learned?",
            "What motivates you to keep studying when it gets tough?",
            "What advice would you give to someone starting to learn what you're studying?"
        ];

        return prompts.sort(() => 0.5 - Math.random()).slice(0, 5);
    }

    getProgressInsights() {
        const totalGoals = this.goals.length;
        const completedGoals = this.goals.filter(g => g.completed).length;
        const totalAchievements = this.achievements.length;
        const recentAchievements = this.achievements.filter(a => {
            const achievementDate = new Date(a.date);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return achievementDate >= weekAgo;
        }).length;

        const stats = [
            { value: totalGoals, label: "Total Goals" },
            { value: completedGoals, label: "Completed Goals" },
            { value: totalAchievements, label: "Achievements Logged" },
            { value: recentAchievements, label: "This Week's Achievements" }
        ];

        let insight = "";
        if (totalGoals === 0) {
            insight = "Start by setting your first goal to begin tracking your progress!";
        } else if (completedGoals === totalGoals && totalGoals > 0) {
            insight = "Congratulations! You've completed all your goals. Time to set new ones!";
        } else if (completedGoals > 0) {
            const completionRate = Math.round((completedGoals / totalGoals) * 100);
            insight = `You've completed ${completionRate}% of your goals. ${completionRate >= 70 ? 'Excellent progress!' : 'Keep up the great work!'}`;
        } else {
            insight = "You have goals set up - now focus on taking action to achieve them!";
        }

        return { stats, insight };
    }

    getGoalTitle(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        return goal ? goal.title : 'Unknown Goal';
    }

    getDaysUntilDeadline(deadline) {
        const today = new Date();
        const deadlineDate = new Date(deadline);
        const diffTime = deadlineDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            return `${Math.abs(diffDays)} days overdue`;
        } else if (diffDays === 0) {
            return 'Due today';
        } else if (diffDays === 1) {
            return 'Due tomorrow';
        } else {
            return `${diffDays} days remaining`;
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideInRight 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    loadFromStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            return null;
        }
    }

    // Pomodoro Timer Methods
    initializePomodoroTimer() {
        this.loadTimerSettings();
        this.updateTimerSettings();
    }

    loadTimerSettings() {
        const savedSettings = this.loadFromStorage('timerSettings');
        if (savedSettings) {
            this.timer.settings = { ...this.timer.settings, ...savedSettings };
        }
    }

    updateTimerSettings() {
        document.getElementById('work-duration').value = this.timer.settings.workDuration;
        document.getElementById('break-duration').value = this.timer.settings.breakDuration;
        document.getElementById('long-break-duration').value = this.timer.settings.longBreakDuration;
        document.getElementById('sessions-before-long-break').value = this.timer.settings.sessionsBeforeLongBreak;
        
        this.saveToStorage('timerSettings', this.timer.settings);
    }

    startTimer() {
        if (!this.timer.isRunning) {
            this.timer.isRunning = true;
            this.timer.isPaused = false;
            
            this.timerInterval = setInterval(() => {
                this.timer.currentTime--;
                this.updateTimerDisplay();
                
                if (this.timer.currentTime <= 0) {
                    this.completeSession();
                }
            }, 1000);
            
            this.updateTimerControls();
            this.showNotification('Timer started! Focus time begins now.', 'success');
        }
    }

    pauseTimer() {
        if (this.timer.isRunning) {
            this.timer.isRunning = false;
            this.timer.isPaused = true;
            clearInterval(this.timerInterval);
            this.updateTimerControls();
            this.showNotification('Timer paused', 'info');
        }
    }

    resetTimer() {
        this.timer.isRunning = false;
        this.timer.isPaused = false;
        clearInterval(this.timerInterval);
        
        // Reset to current mode's duration
        if (this.timer.mode === 'work') {
            this.timer.currentTime = this.timer.settings.workDuration * 60;
            this.timer.totalTime = this.timer.settings.workDuration * 60;
        } else if (this.timer.mode === 'break') {
            this.timer.currentTime = this.timer.settings.breakDuration * 60;
            this.timer.totalTime = this.timer.settings.breakDuration * 60;
        } else if (this.timer.mode === 'long-break') {
            this.timer.currentTime = this.timer.settings.longBreakDuration * 60;
            this.timer.totalTime = this.timer.settings.longBreakDuration * 60;
        }
        
        this.updateTimerDisplay();
        this.updateTimerControls();
        this.showNotification('Timer reset', 'info');
    }

    completeSession() {
        clearInterval(this.timerInterval);
        this.timer.isRunning = false;
        this.timer.isPaused = false;
        
        // Log the completed session
        const session = {
            id: Date.now().toString(),
            mode: this.timer.mode,
            duration: this.timer.totalTime,
            completedAt: new Date().toISOString(),
            date: new Date().toISOString().split('T')[0]
        };
        
        this.timer.sessionsToday.push(session);
        this.saveToStorage('sessionsToday', this.timer.sessionsToday);
        
        // Show completion notification
        if (this.timer.mode === 'work') {
            this.timer.sessionsCompleted++;
            this.showNotification('Great work! Time for a break!', 'success');
            this.switchToBreak();
        } else {
            this.showNotification('Break time over! Ready to focus again?', 'info');
            this.switchToWork();
        }
        
        this.updateTimerControls();
        this.updateSessionStats();
        this.renderSessionHistory();
    }

    switchToBreak() {
        // Determine if it's a long break
        const completedWorkSessions = this.timer.sessionsToday.filter(s => s.mode === 'work').length;
        const shouldTakeLongBreak = completedWorkSessions % this.timer.settings.sessionsBeforeLongBreak === 0;
        
        if (shouldTakeLongBreak) {
            this.timer.mode = 'long-break';
            this.timer.currentTime = this.timer.settings.longBreakDuration * 60;
            this.timer.totalTime = this.timer.settings.longBreakDuration * 60;
        } else {
            this.timer.mode = 'break';
            this.timer.currentTime = this.timer.settings.breakDuration * 60;
            this.timer.totalTime = this.timer.settings.breakDuration * 60;
        }
        
        this.updateTimerDisplay();
    }

    switchToWork() {
        this.timer.mode = 'work';
        this.timer.currentTime = this.timer.settings.workDuration * 60;
        this.timer.totalTime = this.timer.settings.workDuration * 60;
        this.updateTimerDisplay();
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timer.currentTime / 60);
        const seconds = this.timer.currentTime % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('timer-display').textContent = timeString;
        
        // Update mode display
        let modeText = '';
        if (this.timer.mode === 'work') {
            modeText = 'Focus Time';
        } else if (this.timer.mode === 'break') {
            modeText = 'Short Break';
        } else if (this.timer.mode === 'long-break') {
            modeText = 'Long Break';
        }
        
        document.getElementById('timer-mode').textContent = modeText;
        
        // Update timer circle classes
        const timerCircle = document.querySelector('.timer-circle');
        timerCircle.className = `timer-circle ${this.timer.mode}`;
        
        const timerMode = document.getElementById('timer-mode');
        timerMode.className = `timer-mode ${this.timer.mode}`;
    }

    updateTimerControls() {
        const startBtn = document.getElementById('start-timer-btn');
        const pauseBtn = document.getElementById('pause-timer-btn');
        
        if (this.timer.isRunning) {
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            startBtn.innerHTML = '<i class="fas fa-play"></i> Running...';
        } else if (this.timer.isPaused) {
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            startBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
        } else {
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            startBtn.innerHTML = '<i class="fas fa-play"></i> Start';
        }
    }

    updateSessionStats() {
        const today = new Date().toISOString().split('T')[0];
        const todaySessions = this.timer.sessionsToday.filter(s => s.date === today);
        const completedWorkSessions = todaySessions.filter(s => s.mode === 'work').length;
        const totalFocusTime = todaySessions.filter(s => s.mode === 'work').reduce((total, s) => total + s.duration, 0);
        
        document.getElementById('completed-sessions').textContent = completedWorkSessions;
        document.getElementById('total-focus-time').textContent = Math.floor(totalFocusTime / 60);
        
        // Calculate current streak (consecutive days with completed sessions)
        const sortedSessions = this.timer.sessionsToday.sort((a, b) => new Date(b.date) - new Date(a.date));
        let streak = 0;
        let currentDate = new Date();
        
        for (let i = 0; i < 30; i++) { // Check last 30 days
            const checkDate = new Date(currentDate);
            checkDate.setDate(checkDate.getDate() - i);
            const dateString = checkDate.toISOString().split('T')[0];
            
            const daySessions = sortedSessions.filter(s => s.date === dateString && s.mode === 'work');
            if (daySessions.length > 0) {
                streak++;
            } else if (i > 0) { // Don't break streak on current day if no sessions yet
                break;
            }
        }
        
        document.getElementById('current-streak').textContent = streak;
    }

    renderSessionHistory() {
        const historyList = document.getElementById('session-history');
        const recentSessions = this.timer.sessionsToday
            .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
            .slice(0, 10);
        
        if (recentSessions.length === 0) {
            historyList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <h3>No Sessions Yet</h3>
                    <p>Start your first Pomodoro session to see your history!</p>
                </div>
            `;
            return;
        }
        
        historyList.innerHTML = recentSessions.map(session => `
            <div class="session-item fade-in">
                <div class="session-info">
                    <div class="session-type">${this.getSessionTypeText(session.mode)}</div>
                    <div class="session-duration">${Math.floor(session.duration / 60)} minutes</div>
                </div>
                <div class="session-time">${this.formatTime(session.completedAt)}</div>
            </div>
        `).join('');
    }

    getSessionTypeText(mode) {
        switch (mode) {
            case 'work': return 'Focus Session';
            case 'break': return 'Short Break';
            case 'long-break': return 'Long Break';
            default: return 'Session';
        }
    }

    formatTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }
}

// Add CSS for notifications
const notificationStyles = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// Initialize the application
let studyTracker;
document.addEventListener('DOMContentLoaded', () => {
    studyTracker = new StudyGoalsTracker();
});
