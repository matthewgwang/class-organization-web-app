// Paste your unique Firebase configuration object here
const firebaseConfig = {
    // ... PASTE YOUR CONFIG OBJECT FROM THE FIREBASE CONSOLE ...
    // Make sure this is filled in with your actual keys from your project
    apiKey: "AIzaSyBu3s8js5CmRvX-4Mptoc1pDOSXDm1q8tI",
  authDomain: "class-app-1621a.firebaseapp.com",
  projectId: "class-app-1621a",
  storageBucket: "class-app-1621a.firebasestorage.app",
  messagingSenderId: "305371365710",
  appId: "1:305371365710:web:81f33edb7aaec336ab1e1f",
  measurementId: "G-839WB2QCXR"

};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const provider = new firebase.auth.GoogleAuthProvider();

document.addEventListener('DOMContentLoaded', () => {

    // --- TAB SWITCHING LOGIC ---
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });

    // --- State Variables ---
    let currentUser = null;
    let events = [];
    let unsubscribe = null;
    let currentDate = new Date();

    // --- DOM Elements ---
    const authBtn = document.getElementById('auth-btn');
    const userEmailDisplay = document.getElementById('user-email');
    const assignmentModal = document.getElementById('assignment-modal');
    const eventModal = document.getElementById('event-modal');
    const classModal = document.getElementById('class-modal');
    const detailsModal = document.getElementById('details-modal');
    const weekDisplay = document.getElementById('week-display');

    // =================================================================
    // --- AUTHENTICATION ---
    // =================================================================

    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            userEmailDisplay.textContent = user.email;
            authBtn.textContent = 'Sign Out';
            listenForDataChanges();
        } else {
            currentUser = null;
            userEmailDisplay.textContent = 'Not signed in';
            authBtn.textContent = 'Sign In with Google';
            if (unsubscribe) unsubscribe();
            clearAllData();
        }
    });

    authBtn.addEventListener('click', () => {
        if (currentUser) {
            auth.signOut();
        } else {
            auth.signInWithPopup(provider);
        }
    });

    // =================================================================
    // --- DATABASE (FIRESTORE) FUNCTIONS ---
    // =================================================================

    function listenForDataChanges() {
        if (!currentUser) return;
        const query = db.collection('users').doc(currentUser.uid).collection('events');
        unsubscribe = query.onSnapshot(snapshot => {
            events = [];
            snapshot.forEach(doc => {
                events.push({ id: doc.id, ...doc.data() });
            });
            renderAll();
        });
    }

    async function saveData(data) {
        if (!currentUser) return alert("You must be signed in to save data.");
        await db.collection('users').doc(currentUser.uid).collection('events').add(data);
    }

    async function updateData(id, updatedData) {
        if (!currentUser) return;
        await db.collection('users').doc(currentUser.uid).collection('events').doc(id).update(updatedData);
    }

    async function deleteData(id) {
        if (!currentUser) return;
        await db.collection('users').doc(currentUser.uid).collection('events').doc(id).delete();
    }

    function clearAllData() {
        events = [];
        renderAll();
    }

    // =================================================================
    // --- RENDER FUNCTIONS ---
    // =================================================================

    function renderAll() {
        renderDashboard();
        renderCalendar();
        renderAssignments();
    }

    function renderDashboard() {
        const deadlinesList = document.getElementById('upcoming-deadlines-list');
        const scheduleList = document.getElementById('daily-schedule-list');

        const upcomingAssignments = events
            .filter(e => e.type === 'assignment' && e.status !== 'completed')
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 5);

        deadlinesList.innerHTML = '';
        if (upcomingAssignments.length > 0) {
            upcomingAssignments.forEach(item => {
                const li = document.createElement('li');
                li.className = 'dashboard-list-item';
                const dueDate = new Date(item.date + 'T00:00:00');
                li.innerHTML = `
                    <span class="item-name">${item.name} (${item.course || ''})</span>
                    <span class="item-due">Due: ${dueDate.toLocaleDateString()}${formatTimeAMPM(item.dueTime)}</span>
                `;
                deadlinesList.appendChild(li);
            });
        } else {
            deadlinesList.innerHTML = '<li>No upcoming deadlines!</li>';
        }

        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        const todayDay = today.getDay();

        
        const todaysEvents = events
            .filter(e =>
                (e.type === 'class' && e.dayOfWeek == todayDay) ||
                ((e.type === 'event' || e.type === 'assignment') && e.date === todayStr)
            )
            .sort((a, b) => (a.startTime || a.dueTime || '').localeCompare(b.startTime || b.dueTime || ''));

        scheduleList.innerHTML = '';
        if (todaysEvents.length > 0) {
            todaysEvents.forEach(item => {
                const li = document.createElement('li');
                li.className = 'dashboard-list-item';
                // Use different display logic for assignments vs events/classes
                if (item.type === 'assignment') {
                    li.innerHTML = `<span class="item-time">Due Today${formatTimeAMPM(item.dueTime)}</span><span class="item-name">${item.name}</span>`;
                } else {
                    li.innerHTML = `<span class="item-time">${item.startTime} - ${item.endTime}</span><span class="item-name">${item.name}</span>`;
                }
                scheduleList.appendChild(li);
            });
        } else {
            scheduleList.innerHTML = '<li>Nothing scheduled for today.</li>';
        }
    }

    function renderAssignments() {
        document.querySelectorAll('.tasks').forEach(col => col.innerHTML = '');
        const assignments = events.filter(e => e.type === 'assignment');
        assignments.forEach(assignment => {
            const status = assignment.status || 'todo';
            const column = document.getElementById(`${status}-tasks`);
            if (column) {
                const newTask = document.createElement('div');
                newTask.className = 'task';
                newTask.draggable = true;
                newTask.dataset.id = assignment.id;
                const dueDateObj = new Date(assignment.date + 'T00:00:00');
                const formattedDate = dueDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const formattedTime = formatTimeAMPM(assignment.dueTime);
                newTask.innerHTML = `
                    <button class="delete-task-btn">&times;</button>
                    <span class="task-course">${assignment.course || ''}</span>
                    <span class="task-title">${assignment.name}</span>
                    <span class="task-due-date">Due: ${formattedDate}${formattedTime}</span>
                `;
                makeTaskDraggable(newTask);
                column.appendChild(newTask);
            }
        });
    }

    function renderCalendar() {
        document.querySelectorAll('.calendar-event').forEach(e => e.remove());
        const calendarItems = events.filter(e => e.type === 'class' || e.type === 'event' || e.type === 'assignment');
        const startOfWeek = getStartOfWeek(currentDate);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        calendarItems.forEach(event => {
            let eventDate, dayOfWeek;
            if (event.type === 'class') { dayOfWeek = event.dayOfWeek; }
            else { eventDate = new Date(event.date + 'T00:00:00'); dayOfWeek = eventDate.getDay(); }
            if ((event.type === 'class') || (eventDate >= startOfWeek && eventDate <= endOfWeek)) {
                const column = document.querySelector(`.day-column[data-day="${dayOfWeek}"]`);
                if (event.type === 'assignment') { event.startTime = event.dueTime || '23:59'; event.endTime = event.dueTime || '23:59'; }
                const position = calculateEventPosition(event.startTime, event.endTime);
                if (column && position) {
                    const eventElement = document.createElement('div');
                    eventElement.className = 'calendar-event';
                    eventElement.dataset.id = event.id;
                    if (event.type === 'class') { eventElement.style.backgroundColor = '#27ae60'; }
                    else if (event.type === 'assignment') { eventElement.style.backgroundColor = '#e74c3c'; }
                    eventElement.style.top = `${position.top}%`;
                    eventElement.style.height = `${position.height}%`;
                    eventElement.innerHTML = `<div class="event-name">${event.name}</div>`;
                    column.appendChild(eventElement);
                }
            }
        });
        const options = { month: 'short', day: 'numeric' };
        if(weekDisplay) weekDisplay.textContent = `${startOfWeek.toLocaleDateString(undefined, options)} - ${endOfWeek.toLocaleDateString(undefined, options)}`;
    }

    // =================================================================
    // --- EVENT HANDLERS & HELPERS ---
    // =================================================================

    // --- Form Submissions ---
    document.getElementById('add-assignment-btn').addEventListener('click', () => assignmentModal.classList.add('visible'));
    document.getElementById('assignment-form').addEventListener('submit', e => {
        e.preventDefault();
        saveData({ name: document.getElementById('assignment-name').value, course: document.getElementById('assignment-course').value, date: document.getElementById('assignment-due-date').value, dueTime: document.getElementById('assignment-due-time').value, type: 'assignment', status: 'todo' });
        assignmentModal.classList.remove('visible');
        e.target.reset();
    });
    document.getElementById('add-event-btn').addEventListener('click', () => eventModal.classList.add('visible'));
    document.getElementById('event-form').addEventListener('submit', e => {
        e.preventDefault();
        saveData({ name: document.getElementById('event-name').value, date: document.getElementById('event-date').value, startTime: document.getElementById('start-time').value, endTime: document.getElementById('end-time').value, location: document.getElementById('event-location').value, type: 'event' });
        eventModal.classList.remove('visible');
        e.target.reset();
    });
    document.getElementById('add-class-btn').addEventListener('click', () => classModal.classList.add('visible'));
    document.getElementById('class-form').addEventListener('submit', e => {
        e.preventDefault();
        const name = document.getElementById('class-name').value, startTime = document.getElementById('class-start-time').value, endTime = document.getElementById('class-end-time').value, location = document.getElementById('class-location').value;
        document.querySelectorAll('input[name="class-day"]:checked').forEach(day => {
            saveData({ name, startTime, endTime, location, dayOfWeek: parseInt(day.value), type: 'class' });
        });
        classModal.classList.remove('visible');
        e.target.reset();
    });

    // --- Deletion ---
    document.querySelector('.kanban-board').addEventListener('click', e => {
        if (e.target.classList.contains('delete-task-btn')) {
            const taskElement = e.target.closest('.task');
            if (taskElement && confirm("Are you sure you want to delete this assignment?")) {
                deleteData(taskElement.dataset.id);
            }
        }
    });
    document.getElementById('delete-event-btn').addEventListener('click', e => {
        const eventId = e.target.dataset.id;
        if (eventId && confirm("Are you sure you want to delete this item?")) {
            deleteData(eventId);
            detailsModal.classList.remove('visible');
        }
    });

    // --- Draggable Tasks ---
    function makeTaskDraggable(task) { task.addEventListener('dragstart', () => task.classList.add('dragging')); task.addEventListener('dragend', () => task.classList.remove('dragging')); }
    document.querySelectorAll('.kanban-column .tasks').forEach(column => {
        column.addEventListener('dragover', e => { e.preventDefault(); column.classList.add('drag-over'); });
        column.addEventListener('dragleave', () => column.classList.remove('drag-over'));
        column.addEventListener('drop', e => {
            e.preventDefault();
            column.classList.remove('drag-over');
            const draggingTask = document.querySelector('.dragging');
            if (draggingTask) {
                const taskId = draggingTask.dataset.id, newStatus = column.id.replace('-tasks', '');
                updateData(taskId, { status: newStatus });
            }
        });
    });

    // --- Calendar Navigation and Details ---
    document.getElementById('prev-week-btn').addEventListener('click', () => { currentDate.setDate(currentDate.getDate() - 7); renderCalendar(); });
    document.getElementById('next-week-btn').addEventListener('click', () => { currentDate.setDate(currentDate.getDate() + 7); renderCalendar(); });
    document.querySelector('.calendar-container').addEventListener('click', (e) => {
        const clickedEventEl = e.target.closest('.calendar-event');
        if (clickedEventEl) {
            const eventData = events.find(ev => ev.id === clickedEventEl.dataset.id);
            if(eventData) showEventDetails(eventData);
        }
    });
    function showEventDetails(event) {
        document.getElementById('details-name').textContent = event.name;
        document.getElementById('details-time').textContent = `${event.startTime || (event.dueTime || '')} - ${event.endTime || ''}`;
        document.getElementById('details-location').textContent = event.location || 'N/A';
        document.getElementById('details-type').textContent = event.type;
        document.getElementById('details-day').textContent = event.date ? new Date(event.date + 'T00:00:00').toLocaleDateString() : `Every ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][event.dayOfWeek]}`;
        document.getElementById('delete-event-btn').dataset.id = event.id;
        detailsModal.classList.add('visible');
    }

    // --- Other Helper functions ---
    const VIEW_START_HOUR = 5, VIEW_END_HOUR = 24, TOTAL_HOURS_IN_VIEW = VIEW_END_HOUR - VIEW_START_HOUR;
    function formatTimeAMPM(time) { if (!time) return ''; let [h, m] = time.split(':'); h = parseInt(h); const ampm = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return ` at ${h}:${m} ${ampm}`; }
    function getStartOfWeek(date) { const d = new Date(date); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); const start = new Date(d.setDate(diff)); start.setHours(0,0,0,0); return start; }
    function calculateEventPosition(startTime, endTime) { if (!startTime || !endTime) return null; const tMinV = TOTAL_HOURS_IN_VIEW * 60; const vSMin = VIEW_START_HOUR * 60; const [sH, sM] = startTime.split(':').map(Number); const sTMin = sH * 60 + sM; const [eH, eM] = endTime.split(':').map(Number); const eTMin = eH * 60 + eM; if (eTMin < vSMin) return null; const rSMin = Math.max(sTMin, vSMin); const aStart = rSMin - vSMin; const aEnd = eTMin - vSMin; const top = (aStart / tMinV) * 100; let height = ((aEnd - aStart) / tMinV) * 100; if (height < 0) height = 0; if (top > 100) return null; return { top, height }; }
    function generateTimeStamps() { const tc = document.querySelector('.time-column'); if (!tc || tc.childElementCount > 0) return; for (let h = VIEW_START_HOUR; h < VIEW_END_HOUR; h++) { const mFVStart = (h - VIEW_START_HOUR) * 60; const top = (mFVStart / (TOTAL_HOURS_IN_VIEW * 60)) * 100; const tl = document.createElement('div'); tl.className = 'time-label'; tl.style.top = `${top}%`; const ampm = h >= 12 ? 'PM' : 'AM'; const dH = h % 12 || 12; tl.textContent = `${dH} ${ampm}`; tc.appendChild(tl); } }

    // --- Universal modal closing ---
    [eventModal, classModal, detailsModal, assignmentModal].forEach(modal => {
        if(modal) {
            modal.querySelector('.close-btn').addEventListener('click', () => modal.classList.remove('visible'));
            window.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('visible'); });
        }
    });

    // --- Initial Load ---
    generateTimeStamps();
});