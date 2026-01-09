
const API_URL = "http://cat-facts-api.std-900.ist.mospolytech.ru/api"; 
const API_KEY = "d9a18028-7248-445e-ac17-495db91197d5"; 

// Состояние приложения
let state = {
    courses: [],
    tutors: [],
    orders: [],
    currentPage: 1,
    itemsPerPage: 5,
    currentCourse: null, 
    currentOrderId: null 
};

document.addEventListener('DOMContentLoaded', () => {
    // Определяем, на какой мы странице по наличию уникальных элементов
    const isMainPage = !!document.getElementById('courses-container');
    const isDashboard = !!document.getElementById('orders-tbody');

    if (isMainPage) {
        loadCourses();
        loadTutors();
        setupTutorFilters();
        setupOrderModalListeners();
    }

    if (isDashboard) {
        loadOrders();
        setupDashboardListeners();
    }
});

/* ============================================================
   БАЗОВЫЕ ФУНКЦИИ API (Имитация для демо)
   ============================================================ */
async function fetchData(endpoint) {
    // В реальном проекте здесь будет fetch к API
    console.log(`Fetching data from ${endpoint}`);
    return []; // Возвращаем пустоту, так как данные ниже замоканы
}

/* ============================================================
   УВЕДОМЛЕНИЯ И ПАГИНАЦИЯ (UI)
   ============================================================ */
function showNotification(message, type = 'success') {
    const container = document.querySelector('.container') || document.body;
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show fixed-top m-3 shadow`;
    alertDiv.style.zIndex = '2000';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
}

function renderPagination(totalItems, containerId, callback) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    const totalPages = Math.ceil(totalItems / state.itemsPerPage);
    if (totalPages <= 1) return;

    // Previous
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${state.currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#">&laquo;</a>`;
    prevLi.onclick = (e) => { e.preventDefault(); if (state.currentPage > 1) { state.currentPage--; callback(); } };
    container.appendChild(prevLi);

    // Pages
    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === state.currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        li.onclick = (e) => { e.preventDefault(); state.currentPage = i; callback(); };
        container.appendChild(li);
    }

    // Next
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${state.currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#">&raquo;</a>`;
    nextLi.onclick = (e) => { e.preventDefault(); if (state.currentPage < totalPages) { state.currentPage++; callback(); } };
    container.appendChild(nextLi);
}

/* ============================================================
   ГЛАВНАЯ: КУРСЫ
   ============================================================ */
async function loadCourses() {
    // MOCK DATA (Имитация API для проверки работы)
    state.courses = [
        { id: 1, name: "Английский для IT", teacher: "Alice Smith", level: "B2", pricePerHour: 500, totalHours: 40, weekHours: 4 },
        { id: 2, name: "Интенсив Немецкий", teacher: "Hans Mueller", level: "A1", pricePerHour: 400, totalHours: 60, weekHours: 10 }, 
        { id: 3, name: "Французский с нуля", teacher: "Jean Reno", level: "A1", pricePerHour: 450, totalHours: 30, weekHours: 3 },
        { id: 4, name: "Испанский Базовый", teacher: "Maria Lopez", level: "A2", pricePerHour: 420, totalHours: 20, weekHours: 2 },
        { id: 5, name: "Китайский Бизнес", teacher: "Li Wei", level: "C1", pricePerHour: 800, totalHours: 50, weekHours: 5 },
        { id: 6, name: "Японский для всех", teacher: "Kenji Sato", level: "A1", pricePerHour: 700, totalHours: 40, weekHours: 4 }
    ];
    renderCourses();
}

function renderCourses() {
    const container = document.getElementById('courses-container');
    if (!container) return;
    container.innerHTML = '';
    
    const start = (state.currentPage - 1) * state.itemsPerPage;
    const end = start + state.itemsPerPage;
    const items = state.courses.slice(start, end);

    items.forEach(course => {
        const div = document.createElement('div');
        div.className = 'col';
        div.innerHTML = `
            <div class="card h-100 shadow-sm course-card">
                <div class="card-body">
                    <h5 class="card-title fw-bold">${course.name}</h5>
                    <p class="card-text text-muted mb-1">Уровень: <span class="badge bg-secondary">${course.level}</span></p>
                    <p class="card-text small">Преподаватель: ${course.teacher}</p>
                    <p class="card-text small">Длительность: ${course.totalHours} ч.</p>
                    <div class="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                        <span class="fw-bold text-primary">${course.pricePerHour} ₽/час</span>
                        <button class="btn btn-outline-primary rounded-pill btn-sm" onclick="openOrderModal(${course.id})">
                            Подать заявку
                        </button>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(div);
    });

    renderPagination(state.courses.length, 'courses-pagination', renderCourses);
}

/* ============================================================
   ГЛАВНАЯ: РЕПЕТИТОРЫ
   ============================================================ */
async function loadTutors() {
    state.tutors = [
        { id: 101, name: "Анна Иванова", language: "Английский", level: "C1", exp: 5, price: 1000 },
        { id: 102, name: "Петр Петров", language: "Немецкий", level: "B2", exp: 3, price: 900 },
        { id: 103, name: "John Doe", language: "Английский", level: "C2", exp: 10, price: 2000 },
        { id: 104, name: "Marie Curie", language: "Французский", level: "B1", exp: 4, price: 1200 },
    ];
    renderTutors(state.tutors);
}

function renderTutors(tutorList) {
    const container = document.getElementById('tutors-container');
    if (!container) return;
    container.innerHTML = '';

    tutorList.forEach(tutor => {
        const div = document.createElement('div');
        div.className = 'col-md-6 col-lg-4';
        div.innerHTML = `
            <div class="card border-0 shadow-sm h-100">
                <div class="card-body">
                    <div class="d-flex align-items-center mb-3">
                        <div class="bg-light rounded-circle p-2 me-3"><i class="bi bi-person h4"></i></div>
                        <div>
                            <h6 class="fw-bold mb-0">${tutor.name}</h6>
                            <small class="text-muted">Опыт: ${tutor.exp} лет</small>
                        </div>
                    </div>
                    <ul class="list-unstyled small mb-3">
                        <li><strong>Язык:</strong> ${tutor.language}</li>
                        <li><strong>Уровень:</strong> ${tutor.level}</li>
                        <li><strong>Цена:</strong> ${tutor.price} ₽/час</li>
                    </ul>
                    <button class="btn btn-sm btn-outline-dark w-100 rounded-pill">Выбрать</button>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

function setupTutorFilters() {
    const levelSelect = document.getElementById('filter-level');
    const langSelect = document.getElementById('filter-lang');
    const resetBtn = document.getElementById('btn-reset-filter');

    if (!levelSelect) return;

    const filter = () => {
        const level = levelSelect.value;
        const lang = langSelect.value;
        
        const filtered = state.tutors.filter(t => {
            const matchLevel = level ? t.level.includes(level) : true;
            const matchLang = lang ? t.language === lang : true;
            return matchLevel && matchLang;
        });
        renderTutors(filtered);
    };

    levelSelect.addEventListener('change', filter);
    langSelect.addEventListener('change', filter);
    
    resetBtn.addEventListener('click', () => {
        levelSelect.value = '';
        langSelect.value = '';
        renderTutors(state.tutors);
    });
}

/* ============================================================
   МОДАЛЬНОЕ ОКНО И РАСЧЕТ ЦЕНЫ
   ============================================================ */
window.openOrderModal = function(courseId) {
    const course = state.courses.find(c => c.id === courseId);
    if (!course) return;

    state.currentCourse = course;

    document.getElementById('course-id').value = course.id;
    document.getElementById('course-name').value = course.name;
    document.getElementById('course-teacher').value = course.teacher;
    document.getElementById('course-duration').value = course.totalHours;
    
    // Сброс полей
    document.getElementById('order-date').value = '';
    const timeSelect = document.getElementById('order-time');
    timeSelect.innerHTML = '<option value="">Выберите дату...</option>';
    timeSelect.disabled = true;
    document.getElementById('order-students').value = 1;
    document.getElementById('total-price').innerText = '0 ₽';
    document.getElementById('discounts-badges').innerHTML = '';
    
    document.querySelectorAll('.option-check').forEach(cb => cb.checked = false);

    const modal = new bootstrap.Modal(document.getElementById('orderModal'));
    modal.show();
};

function setupOrderModalListeners() {
    const dateInput = document.getElementById('order-date');
    const timeSelect = document.getElementById('order-time');
    const studentsInput = document.getElementById('order-students');
    const checkboxes = document.querySelectorAll('.option-check');
    const form = document.getElementById('order-form');

    if (!form) return;

    // При выборе даты генерируем время
    dateInput.addEventListener('change', (e) => {
        const dateVal = e.target.value;
        if (!dateVal) {
            timeSelect.disabled = true;
            return;
        }
        
        // Генерация доступного времени
        timeSelect.innerHTML = '';
        const times = ["09:00", "11:00", "14:00", "18:00", "19:00"]; 
        times.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t;
            opt.textContent = t;
            timeSelect.appendChild(opt);
        });
        timeSelect.disabled = false;
        
        // Выбираем первое время по умолчанию для расчета
        timeSelect.selectedIndex = 0;
        calculatePrice();
    });

    timeSelect.addEventListener('change', calculatePrice);
    studentsInput.addEventListener('input', calculatePrice);
    checkboxes.forEach(cb => cb.addEventListener('change', calculatePrice));

    // Отправка формы (POST)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        // В реальности здесь сбор данных и fetch POST
        showNotification('Заявка успешно оформлена!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('orderModal')).hide();
    });
}

function calculatePrice() {
    const course = state.currentCourse;
    if (!course) return;

    const dateStr = document.getElementById('order-date').value;
    const timeStr = document.getElementById('order-time').value;
    const students = parseInt(document.getElementById('order-students').value) || 1;

    let pricePerHour = course.pricePerHour;
    let duration = course.totalHours;
    
    let isWeekend = 1;
    if (dateStr) {
        const d = new Date(dateStr);
        const day = d.getDay(); 
        if (day === 0 || day === 6) isWeekend = 1.5;
    }

    let surcharge = 0;
    if (timeStr) {
        const hour = parseInt(timeStr.split(':')[0]);
        if (hour >= 9 && hour <= 12) surcharge = 400;
        if (hour >= 18 && hour <= 20) surcharge = 1000;
    }

    // Базовая стоимость с учетом коэф. выходного дня и фиксированной надбавки за час/занятие
    // Для демо используем логику: (ЦенаЧаса * Часы * Коэф) + Надбавка
    let baseCostPerStudent = (pricePerHour * duration * isWeekend) + surcharge;
    let totalCost = baseCostPerStudent * students;

    // === ОПЦИИ ===
    let badges = [];

    // Early registration (-10%)
    if (dateStr && isEarlyRegistration(dateStr)) {
        totalCost *= 0.90;
        badges.push('<span class="badge bg-success me-1">-10% Early</span>');
    }

    // Group (-15%)
    if (students >= 5) {
        totalCost *= 0.85;
        badges.push('<span class="badge bg-success me-1">-15% Group</span>');
    }

    // Intensive (+20%)
    if (course.weekHours >= 5) {
        totalCost *= 1.20;
        badges.push('<span class="badge bg-warning text-dark me-1">+20% Intensive</span>');
    }

    // Доп опции
    if (document.getElementById('opt-supplementary').checked) totalCost += (2000 * students);
    
    if (document.getElementById('opt-personalized').checked) {
        const weeks = Math.ceil(duration / course.weekHours);
        totalCost += (1500 * weeks); 
    }

    if (document.getElementById('opt-excursions').checked) totalCost *= 1.25;

    if (document.getElementById('opt-assessment').checked) totalCost += 300; 

    if (document.getElementById('opt-interactive').checked) totalCost *= 1.5;

    document.getElementById('total-price').innerText = Math.round(totalCost) + ' ₽';
    document.getElementById('discounts-badges').innerHTML = badges.join('');
}

function isEarlyRegistration(dateStr) {
    const selectedDate = new Date(dateStr);
    const today = new Date();
    const diffTime = selectedDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays >= 30; 
}

/* ============================================================
   ЛИЧНЫЙ КАБИНЕТ: ЗАЯВКИ
   ============================================================ */
async function loadOrders() {
    // MOCK ORDERS
    state.orders = [
        { id: 1024, courseName: "Английский для IT", teacher: "Alice Smith", date: "2023-10-25", time: "18:00", price: 5000, persons: 1 },
        { id: 1025, courseName: "Немецкий B1 (Интенсив)", teacher: "Hans Mueller", date: "2023-10-28", time: "09:00", price: 4500, persons: 2 },
        { id: 1026, courseName: "Французский с нуля", teacher: "Jean Reno", date: "2023-11-01", time: "14:00", price: 4200, persons: 1 },
        { id: 1027, courseName: "Испанский Базовый", teacher: "Maria Lopez", date: "2023-11-05", time: "18:00", price: 3800, persons: 1 },
        { id: 1028, courseName: "Китайский Бизнес", teacher: "Li Wei", date: "2023-11-10", time: "12:00", price: 6000, persons: 3 },
        { id: 1029, courseName: "Японский для всех", teacher: "Kenji Sato", date: "2023-11-15", time: "09:00", price: 5500, persons: 1 },
    ];
    renderOrders();
}

function renderOrders() {
    const tbody = document.getElementById('orders-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const start = (state.currentPage - 1) * state.itemsPerPage;
    const end = start + state.itemsPerPage;
    const items = state.orders.slice(start, end);

    items.forEach(order => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <th scope="row">${order.id}</th>
            <td class="text-start fw-semibold">${order.courseName}</td>
            <td>${order.date} <br><small class="text-muted">${order.time}</small></td>
            <td>${order.price} ₽</td>
            <td>
                <div class="btn-group" role="group">
                     <button type="button" class="btn btn-sm btn-outline-info" title="Подробнее" onclick="viewOrder(${order.id})"><i class="bi bi-eye"></i></button>
                    <button type="button" class="btn btn-sm btn-outline-warning" title="Изменить" onclick="editOrder(${order.id})"><i class="bi bi-pencil"></i></button>
                    <button type="button" class="btn btn-sm btn-outline-danger" title="Удалить" onclick="deleteOrderPrompt(${order.id})"><i class="bi bi-trash"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    renderPagination(state.orders.length, 'orders-pagination', renderOrders);
}

// 1. Просмотр
window.viewOrder = function(id) {
    const order = state.orders.find(o => o.id === id);
    if(order) {
        document.getElementById('view-course-name').textContent = order.courseName;
        document.getElementById('view-teacher-name').textContent = "Преподаватель: " + (order.teacher || "Не указан");
        document.getElementById('view-date').textContent = `${order.date} в ${order.time}`;
        document.getElementById('view-price').textContent = `${order.price} ₽`;
        
        const modal = new bootstrap.Modal(document.getElementById('viewModal'));
        modal.show();
    }
};

// 2. Редактирование
window.editOrder = function(id) {
    state.currentOrderId = id;
    const order = state.orders.find(o => o.id === id);
    if(order) {
        // Заполняем форму данными
        document.getElementById('edit-course-name').value = order.courseName;
        document.getElementById('edit-date').value = order.date; // Формат YYYY-MM-DD
        document.getElementById('edit-time').value = order.time;
        document.getElementById('edit-persons').value = order.persons || 1;

        const modal = new bootstrap.Modal(document.getElementById('editModal'));
        modal.show();
    }
};

// 3. Удаление
window.deleteOrderPrompt = function(id) {
    state.currentOrderId = id;
    const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    modal.show();
};

function setupDashboardListeners() {
    // Сохранение редактирования
    const saveBtn = document.getElementById('save-edit-btn');
    if (saveBtn) {
        saveBtn.onclick = () => {
            const order = state.orders.find(o => o.id === state.currentOrderId);
            if(order) {
                // Обновляем данные локально
                order.date = document.getElementById('edit-date').value;
                order.time = document.getElementById('edit-time').value;
                order.persons = document.getElementById('edit-persons').value;
                
                showNotification(`Заказ №${order.id} обновлен`, 'success');
                bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
                renderOrders();
            }
        };
    }

    // Подтверждение удаления
    const delBtn = document.getElementById('confirmDeleteBtn');
    if (delBtn) {
        delBtn.addEventListener('click', () => {
            state.orders = state.orders.filter(o => o.id !== state.currentOrderId);
            showNotification('Заявка удалена', 'warning');
            bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
            renderOrders();
        });
    }
}