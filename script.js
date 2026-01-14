
const API_KEY = "d9a18028-7248-445e-ac17-495db91197d5"; 
const API_URL = "http://exam-api-courses.std-900.ist.mospolytech.ru/api";

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
   БАЗОВЫЕ ФУНКЦИИ API
   ============================================================ */
async function fetchData(endpoint, method = "GET", data = null) {
    const url = new URL(`${API_URL}${endpoint}`);
    url.searchParams.append("api_key", API_KEY);

    const options = {
        method: method,
        headers: {
            "Content-Type": "application/json"
        }
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || `Ошибка: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        showNotification(error.message, 'danger');
        console.error(error);
        return null;
    }
}

/* ============================================================
   UI HELPERS
   ============================================================ */
function showNotification(message, type = 'success') {
    const container = document.getElementById('alerts-container');
    if(!container) return;

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show border-0`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    container.appendChild(alertDiv);
    
    // Автоудаление через 5 сек
    setTimeout(() => {
        if(alertDiv) alertDiv.remove();
    }, 5000);
}

function renderPagination(totalItems, containerId, callback) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    const totalPages = Math.ceil(totalItems / state.itemsPerPage);
    if (totalPages <= 1) return;

    // Кнопка "Назад"
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${state.currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#">&laquo;</a>`;
    prevLi.onclick = (e) => { 
        e.preventDefault(); 
        if (state.currentPage > 1) { state.currentPage--; callback(); } 
    };
    container.appendChild(prevLi);

    // Номера страниц
    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === state.currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        li.onclick = (e) => { 
            e.preventDefault(); 
            state.currentPage = i; 
            callback(); 
        };
        container.appendChild(li);
    }

    // Кнопка "Вперед"
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${state.currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#">&raquo;</a>`;
    nextLi.onclick = (e) => { 
        e.preventDefault(); 
        if (state.currentPage < totalPages) { state.currentPage++; callback(); } 
    };
    container.appendChild(nextLi);
}

/* ============================================================
   ГЛАВНАЯ: КУРСЫ
   ============================================================ */
async function loadCourses() {
    const courses = await fetchData('/courses'); 
    if (courses) {
        state.courses = courses;
        renderCourses();
    }
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
                    <p class="card-text small">Длительность: ${course.total_length} нед. (${course.week_length} ч/нед)</p>
                    <div class="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                        <span class="fw-bold text-primary">${course.course_fee_per_hour} ₽/час</span>
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
    const tutors = await fetchData('/tutors');
    if (tutors) {
        state.tutors = tutors;
        renderTutors(state.tutors);
    }
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
                            <small class="text-muted">Опыт: ${tutor.work_experience} лет</small>
                        </div>
                    </div>
                    <ul class="list-unstyled small mb-3">
                        <li><strong>Языки:</strong> ${tutor.languages_spoken.join(', ')}</li>
                        <li><strong>Уровень:</strong> ${tutor.language_level}</li>
                        <li><strong>Цена:</strong> ${tutor.price_per_hour} ₽/час</li>
                    </ul>
                    <button class="btn btn-sm btn-outline-dark w-100 rounded-pill">Связаться</button>
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
            const matchLevel = level ? t.language_level.includes(level) : true;
            const matchLang = lang ? t.languages_spoken.includes(lang) : true;
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
   МОДАЛЬНОЕ ОКНО И РАСЧЕТ ЦЕНЫ (CREATE)
   ============================================================ */
window.openOrderModal = function(courseId) {
    const course = state.courses.find(c => c.id === courseId);
    if (!course) return;

    state.currentCourse = course;

    document.getElementById('course-id').value = course.id;
    document.getElementById('course-name').value = course.name;
    document.getElementById('course-teacher').value = course.teacher;
    
    const durationHours = course.total_length * course.week_length;
    document.getElementById('course-duration').value = durationHours;
    
    // Сброс
    const dateInput = document.getElementById('order-date');
    dateInput.value = '';
    
    const timeSelect = document.getElementById('order-time');
    timeSelect.innerHTML = '<option value="">Сначала выберите дату</option>';
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

    // Выбор даты
    dateInput.addEventListener('change', (e) => {
        const dateVal = e.target.value;
        if (!dateVal) {
            timeSelect.disabled = true;
            return;
        }
        
        // Генерация часов 9:00 - 20:00
        timeSelect.innerHTML = '';
        const times = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"]; 
        times.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t;
            opt.textContent = t;
            timeSelect.appendChild(opt);
        });
        timeSelect.disabled = false;
        timeSelect.selectedIndex = 0;
        calculatePrice();
    });

    timeSelect.addEventListener('change', calculatePrice);
    studentsInput.addEventListener('input', calculatePrice);
    checkboxes.forEach(cb => cb.addEventListener('change', calculatePrice));

    // Submit POST
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!state.currentCourse) return;

        // Данные для POST
        const formData = {
            course_id: state.currentCourse.id,
            date_start: document.getElementById('order-date').value,
            time_start: document.getElementById('order-time').value,
            duration: parseInt(document.getElementById('course-duration').value),
            persons: parseInt(document.getElementById('order-students').value),
            price: parseInt(document.getElementById('total-price').innerText.replace(/\D/g, '')),
            early_registration: isEarlyRegistration(document.getElementById('order-date').value),
            group_enrollment: parseInt(document.getElementById('order-students').value) >= 5,
            intensive_course: state.currentCourse.week_length >= 5, 
            supplementary: document.getElementById('opt-supplementary').checked,
            personalized: document.getElementById('opt-personalized').checked,
            excursions: document.getElementById('opt-excursions').checked,
            assessment: document.getElementById('opt-assessment').checked,
            interactive: document.getElementById('opt-interactive').checked
        };

        const result = await fetchData('/orders', 'POST', formData);
        
        if (result) {
            showNotification('Заявка успешно оформлена!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('orderModal')).hide();
        }
    });
}

function calculatePrice() {
    const course = state.currentCourse;
    if (!course) return;

    const dateStr = document.getElementById('order-date').value;
    const timeStr = document.getElementById('order-time').value;
    const students = parseInt(document.getElementById('order-students').value) || 1;

    // Базовые параметры курса
    const courseFeePerHour = course.course_fee_per_hour;
    const durationInHours = course.total_length * course.week_length;
    
    // Выходные (Сб, Вс) = x1.5
    let isWeekendOrHoliday = 1;
    if (dateStr) {
        const d = new Date(dateStr);
        const day = d.getDay(); 
        if (day === 0 || day === 6) isWeekendOrHoliday = 1.5;
    }

    // Надбавки за время
    let surcharge = 0;
    if (timeStr) {
        const hour = parseInt(timeStr.split(':')[0]);
        if (hour >= 9 && hour <= 12) surcharge = 400; // Утро
        if (hour >= 18 && hour <= 20) surcharge = 1000; // Вечер
    }

    // Формула: ((ЦенаЧас * Часы * Коэф) + Надбавка) * Студенты
    let totalCost = ((courseFeePerHour * durationInHours * isWeekendOrHoliday) + surcharge) * students;

    let badges = [];

    // Скидки и опции
    if (dateStr && isEarlyRegistration(dateStr)) {
        totalCost *= 0.90;
        badges.push('<span class="badge bg-success me-1">-10% Early</span>');
    }

    if (students >= 5) {
        totalCost *= 0.85;
        badges.push('<span class="badge bg-success me-1">-15% Group</span>');
    }

    if (course.week_length >= 5) {
        totalCost *= 1.20;
        badges.push('<span class="badge bg-warning text-dark me-1">+20% Intensive</span>');
    }

    if (document.getElementById('opt-supplementary').checked) totalCost += (2000 * students);
    if (document.getElementById('opt-personalized').checked) totalCost += (1500 * course.total_length); 
    if (document.getElementById('opt-excursions').checked) totalCost *= 1.25;
    if (document.getElementById('opt-assessment').checked) totalCost += 300; 
    if (document.getElementById('opt-interactive').checked) totalCost *= 1.5;

    document.getElementById('total-price').innerText = Math.round(totalCost) + ' ₽';
    document.getElementById('discounts-badges').innerHTML = badges.join('');
}

function isEarlyRegistration(dateStr) {
    if(!dateStr) return false;
    const selectedDate = new Date(dateStr);
    const today = new Date();
    // > 30 дней разницы
    const diffTime = selectedDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays >= 30; 
}

/* ============================================================
   ЛИЧНЫЙ КАБИНЕТ: ЗАЯВКИ
   ============================================================ */
async function loadOrders() {
    // Грузим заказы и курсы (чтобы получить названия)
    const [orders, courses] = await Promise.all([
        fetchData('/orders'),
        fetchData('/courses')
    ]);

    if (orders && courses) {
        state.orders = orders;
        state.courses = courses; 
        renderOrders();
    }
}

function renderOrders() {
    const tbody = document.getElementById('orders-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (state.orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">Нет активных заявок</td></tr>';
        return;
    }

    const start = (state.currentPage - 1) * state.itemsPerPage;
    const end = start + state.itemsPerPage;
    const items = state.orders.slice(start, end);

    items.forEach((order, index) => {
        const course = state.courses.find(c => c.id === order.course_id);
        const courseName = course ? course.name : "Неизвестный курс";

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <th scope="row">${start + index + 1}</th>
            <td class="text-start fw-semibold">${courseName}</td>
            <td>${order.date_start} <br><small class="text-muted">${order.time_start}</small></td>
            <td>${order.price} ₽</td>
            <td>
                <div class="btn-group" role="group">
                     <button type="button" class="btn btn-sm btn-outline-info" onclick="viewOrder(${order.id})"><i class="bi bi-eye"></i></button>
                    <button type="button" class="btn btn-sm btn-outline-warning" onclick="editOrder(${order.id})"><i class="bi bi-pencil"></i></button>
                    <button type="button" class="btn btn-sm btn-outline-danger" onclick="deleteOrderPrompt(${order.id})"><i class="bi bi-trash"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    renderPagination(state.orders.length, 'orders-pagination', renderOrders);
}

// 1. Просмотр заявки
window.viewOrder = function(id) {
    const order = state.orders.find(o => o.id === id);
    const course = state.courses.find(c => c.id === order.course_id);

    if(order) {
        document.getElementById('view-course-name').textContent = course ? course.name : "Курс удален";
        document.getElementById('view-teacher-name').textContent = course ? `Преподаватель: ${course.teacher}` : "";
        document.getElementById('view-date').textContent = `${order.date_start} в ${order.time_start}`;
        document.getElementById('view-persons').textContent = order.persons;
        document.getElementById('view-price').textContent = `${order.price} ₽`;
        
        const modal = new bootstrap.Modal(document.getElementById('viewModal'));
        modal.show();
    }
};

// 2. Редактирование заявки (Заполнение формы)
window.editOrder = function(id) {
    state.currentOrderId = id;
    const order = state.orders.find(o => o.id === id);
    const course = state.courses.find(c => c.id === order.course_id);

    if(order) {
        document.getElementById('edit-course-name').value = course ? course.name : "Неизвестный курс";
        document.getElementById('edit-date').value = order.date_start;
        // Время нужно обрезать до HH:mm если API возвращает HH:mm:ss
        const timeVal = order.time_start.length > 5 ? order.time_start.substring(0, 5) : order.time_start;
        document.getElementById('edit-time').value = timeVal;
        document.getElementById('edit-persons').value = order.persons;
        
        const modal = new bootstrap.Modal(document.getElementById('editModal'));
        modal.show();
    }
};

// 3. Удаление (Confirm)
window.deleteOrderPrompt = function(id) {
    state.currentOrderId = id;
    const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    modal.show();
};

function setupDashboardListeners() {
    // Сохранение изменений (PUT)
    const saveBtn = document.getElementById('save-edit-btn');

    if (saveBtn) {
        saveBtn.onclick = async () => {
            const order = state.orders.find(o => o.id === state.currentOrderId);
            const course = state.courses.find(c => c.id === order.course_id);
            
            if(!course) {
                showNotification("Ошибка: курс не найден", "danger");
                return;
            }

            // Новые данные из формы
            const dateStr = document.getElementById('edit-date').value;
            const timeStr = document.getElementById('edit-time').value;
            const persons = parseInt(document.getElementById('edit-persons').value);

            // ПЕРЕСЧЕТ ЦЕНЫ ДЛЯ PUT
            // Используем старые опции (так как в форме редактирования их нет), но новые дату/время
            const durationInHours = course.total_length * course.week_length;
            
            let isWeekendOrHoliday = 1;
            if (dateStr) {
                const d = new Date(dateStr);
                const day = d.getDay(); 
                if (day === 0 || day === 6) isWeekendOrHoliday = 1.5;
            }

            let surcharge = 0;
            const hour = parseInt(timeStr.split(':')[0]);
            if (hour >= 9 && hour <= 12) surcharge = 400;
            if (hour >= 18 && hour <= 20) surcharge = 1000;

            let totalCost = ((course.course_fee_per_hour * durationInHours * isWeekendOrHoliday) + surcharge) * persons;

            // Применяем сохраненные опции
            if (order.early_registration) totalCost *= 0.90; // (Можно пересчитать по дате, но для простоты оставляем флаг)
            if (persons >= 5) totalCost *= 0.85;
            if (order.intensive_course) totalCost *= 1.20;
            if (order.supplementary) totalCost += (2000 * persons);
            if (order.personalized) totalCost += (1500 * course.total_length);
            if (order.excursions) totalCost *= 1.25;
            if (order.assessment) totalCost += 300;
            if (order.interactive) totalCost *= 1.5;

            const updateData = {
                date_start: dateStr,
                time_start: timeStr,
                persons: persons,
                price: Math.round(totalCost),
                // Важно передать остальные поля, чтобы они не затерлись
                course_id: order.course_id,
                duration: order.duration,
                early_registration: order.early_registration,
                group_enrollment: persons >= 5,
                intensive_course: order.intensive_course,
                supplementary: order.supplementary,
                personalized: order.personalized,
                excursions: order.excursions,
                assessment: order.assessment,
                interactive: order.interactive
            };

            const result = await fetchData(`/orders/${state.currentOrderId}`, 'PUT', updateData);
            
            if(result) {
                showNotification(`Заявка успешно обновлена`, 'success');
                bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
                loadOrders(); 
            }
        };
    }

    // Удаление (DELETE)
    const delBtn = document.getElementById('confirmDeleteBtn');
    if (delBtn) {
        delBtn.addEventListener('click', async () => {
            const result = await fetchData(`/orders/${state.currentOrderId}`, 'DELETE');
            
            if (result) {
                showNotification('Заявка удалена', 'warning');
                bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
                loadOrders();
            }
        });
    }
}