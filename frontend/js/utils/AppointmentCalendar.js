class AppointmentCalendar {
    constructor(appointmentsManager, onDateSelect) {
        this.manager = appointmentsManager;
        this.onDateSelect = onDateSelect;
        this.currentMonth = new Date();

        // 🔥 NEW: track selected date
        this.selectedDate = null;
    }

    render(containerId = "appointmentsCalendar") {
        const container = document.getElementById(containerId);
        if (!container) return;

        const appointments = this.manager.getAllAppointments();
        const byDate = this.groupByDate(appointments);

        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        let html = `
            <div class="calendar-header">
                <button id="calPrev">‹</button>
                <h3>${this.currentMonth.toLocaleString("en-IN", {
            month: "long",
            year: "numeric"
        })}</h3>
                <button id="calNext">›</button>
            </div>
            <div class="calendar-grid">
        `;

        ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].forEach(d => {
            html += `<div class="calendar-day-label">${d}</div>`;
        });

        for (let i = 0; i < firstDay.getDay(); i++) {
            html += `<div class="calendar-cell empty"></div>`;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayKey =
            today.getFullYear() +
            "-" +
            String(today.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(today.getDate()).padStart(2, "0");

        for (let day = 1; day <= lastDay.getDate(); day++) {
            const cellDate = new Date(year, month, day);
            cellDate.setHours(0, 0, 0, 0);

            const dateKey =
                cellDate.getFullYear() +
                "-" +
                String(cellDate.getMonth() + 1).padStart(2, "0") +
                "-" +
                String(cellDate.getDate()).padStart(2, "0");

            const hasAppointments = !!byDate[dateKey];
            const isPast = cellDate < today;
            const isSelected = this.selectedDate === dateKey;
            const isToday = dateKey === todayKey;

            html += `
                <div class="calendar-cell
                    ${hasAppointments && !isPast ? "has-events" : ""}
                    ${isPast ? "past" : ""}
                    ${isSelected ? "selected" : ""}
                    ${isToday ? "today" : ""}
                "
                data-date="${dateKey}">
                    ${day}
                    ${hasAppointments && !isPast ? `<span class="event-dot"></span>` : ""}
                </div>
            `;
        }

        html += `</div>`;
        container.innerHTML = html;

        // 🔥 Click handling (no past dates)
        container.querySelectorAll(".calendar-cell[data-date]").forEach(cell => {
            cell.addEventListener("click", () => {
                if (cell.classList.contains("past")) return;

                this.selectedDate = cell.dataset.date;
                this.render(containerId);
                this.onDateSelect(new Date(cell.dataset.date));
            });
        });

        document.getElementById("calPrev").onclick = () => {
            this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
            this.render(containerId);
        };

        document.getElementById("calNext").onclick = () => {
            this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
            this.render(containerId);
        };
    }

    groupByDate(appointments) {
        return appointments.reduce((acc, a) => {
            const raw = a.date || a.AppointmentDate;
            if (!raw) return acc;

            const d = new Date(raw);
            const dateKey =
                d.getFullYear() +
                "-" +
                String(d.getMonth() + 1).padStart(2, "0") +
                "-" +
                String(d.getDate()).padStart(2, "0");

            acc[dateKey] = acc[dateKey] || [];
            acc[dateKey].push(a);
            return acc;
        }, {});
    }
}

// ✅ MUST be OUTSIDE the class
window.AppointmentCalendar = AppointmentCalendar;
