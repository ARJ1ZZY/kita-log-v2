// Custom Date Picker - Matches KITA-LOG Theme
class DatePicker {
    constructor(options = {}) {
        this.input = options.input;
        this.onSelect = options.onSelect || function() {};
        this.format = options.format || 'Y-m-d';
        this.minDate = options.minDate || null;
        this.maxDate = options.maxDate || null;

        // Parse initial value if exists
        if (this.input.value) {
            this.selectedDate = new Date(this.input.value + 'T12:00:00');
        } else {
            this.selectedDate = null;
        }

        this.currentDate = new Date();
        this.currentMonth = this.currentDate.getMonth();
        this.currentYear = this.currentDate.getFullYear();

        this.init();
    }

    init() {
        // Create modal element
        this.createModal();

        // Add click event to input
        this.input.addEventListener('click', (e) => {
            e.preventDefault();
            this.show();
        });

        // Add read-only attribute to prevent keyboard input
        this.input.setAttribute('readonly', true);
        this.input.style.cursor = 'pointer';
        this.input.style.backgroundColor = '#fff';
    }

    createModal() {
        // Check if modal already exists
        if (document.getElementById('datepicker-modal-' + this.input.id)) {
            this.modal = document.getElementById('datepicker-modal-' + this.input.id);
            return;
        }

        // Create modal container with unique ID
        const modalId = 'datepicker-modal-' + (this.input.id || Math.random().toString(36).substr(2, 9));
        this.modal = document.createElement('div');
        this.modal.id = modalId;
        this.modal.className = 'custom-datepicker-modal';
        this.modal.innerHTML = `
            <div class="datepicker-overlay"></div>
            <div class="datepicker-container">
                <div class="datepicker-header">
                    <h5 class="datepicker-title"><i class="fas fa-calendar-alt"></i> Select Date</h5>
                    <button type="button" class="datepicker-close">&times;</button>
                </div>
                <div class="datepicker-body">
                    <div class="datepicker-nav">
                        <button type="button" class="datepicker-nav-btn" id="prevMonth-${modalId}">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <span class="datepicker-month-year" id="monthYearDisplay-${modalId}"></span>
                        <button type="button" class="datepicker-nav-btn" id="nextMonth-${modalId}">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    <div class="datepicker-weekdays">
                        <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                    </div>
                    <div class="datepicker-days" id="daysContainer-${modalId}"></div>
                </div>
                <div class="datepicker-footer">
                    <button type="button" class="datepicker-btn datepicker-btn-today" id="todayBtn-${modalId}">Today</button>
                    <button type="button" class="datepicker-btn datepicker-btn-cancel" id="cancelBtn-${modalId}">Cancel</button>
                    <button type="button" class="datepicker-btn datepicker-btn-select" id="selectBtn-${modalId}">Select</button>
                </div>
            </div>
        `;

        document.body.appendChild(this.modal);

        // Get elements
        this.overlay = this.modal.querySelector('.datepicker-overlay');
        this.container = this.modal.querySelector('.datepicker-container');
        this.monthYearDisplay = this.modal.querySelector(`#monthYearDisplay-${modalId}`);
        this.daysContainer = this.modal.querySelector(`#daysContainer-${modalId}`);
        this.prevBtn = this.modal.querySelector(`#prevMonth-${modalId}`);
        this.nextBtn = this.modal.querySelector(`#nextMonth-${modalId}`);
        this.closeBtn = this.modal.querySelector('.datepicker-close');
        this.todayBtn = this.modal.querySelector(`#todayBtn-${modalId}`);
        this.cancelBtn = this.modal.querySelector(`#cancelBtn-${modalId}`);
        this.selectBtn = this.modal.querySelector(`#selectBtn-${modalId}`);

        // Bind events
        this.bindEvents();
    }

    bindEvents() {
        this.overlay.addEventListener('click', () => this.hide());
        this.closeBtn.addEventListener('click', () => this.hide());
        this.cancelBtn.addEventListener('click', () => this.hide());
        this.prevBtn.addEventListener('click', () => this.changeMonth(-1));
        this.nextBtn.addEventListener('click', () => this.changeMonth(1));
        this.todayBtn.addEventListener('click', () => this.goToToday());

        this.selectBtn.addEventListener('click', () => {
            if (this.selectedDate) {
                const formattedDate = this.formatDate(this.selectedDate);
                this.input.value = formattedDate;
                this.onSelect(this.selectedDate);
                this.hide();
            }
        });
    }

    show() {
        // Set current month/year based on selected date or current date
        if (this.selectedDate) {
            this.currentMonth = this.selectedDate.getMonth();
            this.currentYear = this.selectedDate.getFullYear();
        } else {
            const today = new Date();
            this.currentMonth = today.getMonth();
            this.currentYear = today.getFullYear();
        }
        this.modal.classList.add('show');
        this.render();
    }

    hide() {
        this.modal.classList.remove('show');
    }

    changeMonth(delta) {
        this.currentMonth += delta;
        if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        } else if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        }
        this.render();
    }

    goToToday() {
        const today = new Date();
        this.currentMonth = today.getMonth();
        this.currentYear = today.getFullYear();
        this.selectedDate = today;
        this.render();
    }

    render() {
        // Update month/year display
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.monthYearDisplay.textContent = `${monthNames[this.currentMonth]} ${this.currentYear}`;

        // Generate days
        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
        const startDay = firstDay.getDay(); // 0 = Sunday
        const totalDays = lastDay.getDate();

        let daysHtml = '';

        // Previous month days
        const prevMonthLastDay = new Date(this.currentYear, this.currentMonth, 0).getDate();
        for (let i = startDay - 1; i >= 0; i--) {
            const day = prevMonthLastDay - i;
            daysHtml += `<span class="datepicker-day datepicker-day-other">${day}</span>`;
        }

        // Current month days
        for (let i = 1; i <= totalDays; i++) {
            const date = new Date(this.currentYear, this.currentMonth, i);
            const isToday = this.isToday(date);
            const isSelected = this.isSelected(date);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;

            let classes = 'datepicker-day';
            if (isToday) classes += ' datepicker-day-today';
            if (isSelected) classes += ' datepicker-day-selected';
            if (isWeekend) classes += ' datepicker-day-weekend';

            daysHtml += `<span class="${classes}" data-date="${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}">${i}</span>`;
        }

        // Next month days - fill to make 6 rows (42 cells)
        const nextMonthDays = 42 - (startDay + totalDays);
        for (let i = 1; i <= nextMonthDays; i++) {
            daysHtml += `<span class="datepicker-day datepicker-day-other">${i}</span>`;
        }

        this.daysContainer.innerHTML = daysHtml;

        // Add click events to days
        this.daysContainer.querySelectorAll('.datepicker-day[data-date]').forEach(day => {
            day.addEventListener('click', () => {
                const dateStr = day.dataset.date;
                this.selectedDate = new Date(dateStr + 'T12:00:00');

                // Remove selected class from all days
                this.daysContainer.querySelectorAll('.datepicker-day').forEach(d => {
                    d.classList.remove('datepicker-day-selected');
                });

                // Add selected class to clicked day
                day.classList.add('datepicker-day-selected');
            });
        });
    }

    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    }

    isSelected(date) {
        if (!this.selectedDate) return false;
        return date.getDate() === this.selectedDate.getDate() &&
            date.getMonth() === this.selectedDate.getMonth() &&
            date.getFullYear() === this.selectedDate.getFullYear();
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        switch (this.format) {
            case 'd-m-Y':
                return `${day}-${month}-${year}`;
            case 'm/d/Y':
                return `${month}/${day}/${year}`;
            case 'd/m/Y':
                return `${day}/${month}/${year}`;
            default:
                return `${year}-${month}-${day}`;
        }
    }
}

// Initialize all date inputs when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DatePicker: Initializing');

    // Initialize all inputs with class 'datepicker-input'
    document.querySelectorAll('.datepicker-input').forEach(input => {
        // Ensure each input has a unique ID for the modal
        if (!input.id) {
            input.id = 'datepicker-' + Math.random().toString(36).substr(2, 9);
        }
        new DatePicker({
            input: input,
            format: input.dataset.format || 'Y-m-d',
            onSelect: function(date) {
                // Trigger change event for any listeners
                input.dispatchEvent(new Event('change', { bubbles: true }));
                console.log('Date selected:', date);
            }
        });
    });

    console.log('DatePicker: Initialization complete');
});