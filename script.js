
document.addEventListener("DOMContentLoaded", () => {
    const nameInput = document.getElementById("teacherName");
    const subjectInput = document.getElementById("teacherSubject");
    const gradeInput = document.getElementById("teacherGrade");
    const saveButton = document.getElementById("saveTeacher");
    const message = document.getElementById("profileMessage");

    const savedProfile = localStorage.getItem("teacherProfile");

    if (savedProfile) {
        try {
            const profile = JSON.parse(savedProfile);

            nameInput.value = profile.name || "";
            subjectInput.value = profile.subject || "Math";
            gradeInput.value = profile.grade || "6";

            message.textContent = "Teacher profile loaded!";
        } catch (error) {
            console.error("Could not load teacher profile:", error);
        }
    }

    saveButton.addEventListener("click", () => {
        const name = nameInput.value.trim();

        if (!name) {
            message.textContent = "Please enter a teacher name.";
            return;
        }

        const profile = {
            name: name,
            subject: subjectInput.value,
            grade: gradeInput.value
        };

        localStorage.setItem(
            "teacherProfile",
            JSON.stringify(profile)
        );

        message.textContent = "Teacher profile saved successfully!";
    });
});
