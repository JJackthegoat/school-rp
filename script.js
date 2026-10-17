
document.addEventListener("DOMContentLoaded", () => {
    const startButton = document.getElementById("startSchoolDay");
    const status = document.getElementById("schoolDayStatus");
    const schoolSection = document.getElementById("schoolDay");

    if (!startButton || !status || !schoolSection) return;

    const schedule = [
        { time: 435, name: "Morning Preparation" },
        { time: 480, name: "Homeroom" },
        { time: 500, name: "Period 1" },
        { time: 550, name: "Period 2" },
        { time: 600, name: "Period 3" },
        { time: 650, name: "Planning Period" },
        { time: 700, name: "Lunch" },
        { time: 735, name: "Period 5" },
        { time: 785, name: "Period 6" },
        { time: 835, name: "Period 7" },
        { time: 885, name: "Student Dismissal" },
        { time: 890, name: "After-School Preparation" },
        { time: 950, name: "Teacher Dismissal" }
    ];

    let currentMinutes = 435;
    let running = false;
    let timer = null;

    const controls = document.createElement("div");
    controls.style.marginTop = "15px";

    const pauseButton = document.createElement("button");
    pauseButton.textContent = "Pause";
    pauseButton.style.marginRight = "8px";

    const nextButton = document.createElement("button");
    nextButton.textContent = "Next Period";
    nextButton.style.marginRight = "8px";

    const resetButton = document.createElement("button");
    resetButton.textContent = "Reset Day";

    controls.append(pauseButton, nextButton, resetButton);
    startButton.after(controls);

    const clockDisplay = document.createElement("h2");
    clockDisplay.id = "simulationClock";
    controls.after(clockDisplay);

    function formatTime(minutes) {
        const hours24 = Math.floor(minutes / 60);
        const mins = minutes % 60;
        const period = hours24 >= 12 ? "PM" : "AM";
        const hours12 = hours24 % 12 || 12;

        return `${hours12}:${String(mins).padStart(2, "0")} ${period}`;
    }

    function getCurrentActivity() {
        let activity = schedule[0].name;

        for (const item of schedule) {
            if (currentMinutes >= item.time) {
                activity = item.name;
            }
        }

        return activity;
    }

    function updateDisplay() {
        clockDisplay.textContent = formatTime(currentMinutes);

        status.textContent =
            `Status: ${running ? "Running" : "Paused / Not Started"} | ` +
            `Current Activity: ${getCurrentActivity()}`;

        if (currentMinutes >= 950) {
            status.textContent = "School Day Complete — Teacher Dismissal";
            stopClock();
        }
    }

    function stopClock() {
        running = false;
        clearInterval(timer);
        timer = null;
    }

    function startClock() {
        if (running || currentMinutes >= 950) return;

        running = true;

        timer = setInterval(() => {
            currentMinutes++;

            if (currentMinutes >= 950) {
                currentMinutes = 950;
                stopClock();
            }

            updateDisplay();
        }, 1000);

        updateDisplay();
    }

    startButton.addEventListener("click", startClock);

    pauseButton.addEventListener("click", () => {
        stopClock();
        updateDisplay();
    });

    nextButton.addEventListener("click", () => {
        stopClock();

        const next = schedule.find(item => item.time > currentMinutes);

        if (next) {
            currentMinutes = next.time;
        }

        updateDisplay();
    });

    resetButton.addEventListener("click", () => {
        stopClock();
        currentMinutes = 435;
        updateDisplay();
    });

    updateDisplay();
});
