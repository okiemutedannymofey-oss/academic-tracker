
/* ==========================================
   ACADEMIC TRACKER 1.0
   Study planning and progress management
   ========================================== */

const STORAGE_KEY = "academicTrackerDmofey_v3";
const THEME_KEY = "academicTrackerDmofeyTheme_v2";

/* Create CYB 203 with four modules and four units per module.
   Unit titles are placeholders until the actual PDF titles are entered. */

function createCYB203() {
    return {
        id: "cyb203",
        code: "CYB 203",
        name: "Cybercrime, Law and Countermeasures",
        credits: 2,
        modules: Array.from({ length: 4 }, (_, moduleIndex) => ({
            id: `cyb203-m${moduleIndex + 1}`,
            name: `Module ${moduleIndex + 1}`,
            units: Array.from({ length: 4 }, (_, unitIndex) => ({
                id: `cyb203-m${moduleIndex + 1}-u${unitIndex + 1}`,
                name: `Unit ${unitIndex + 1}`,
                status:
                    moduleIndex === 0 && unitIndex === 0
                        ? "completed"
                        : moduleIndex === 0 && unitIndex === 1
                            ? "in-progress"
                            : "new",
                lastStudied: null
            }))
        }))
    };
}

/* Starter courses use the known semester information.
   Only CYB 203 is initially divided into modules and units. */

function createStarterCourses() {
    return [
        {
            id: "ent211",
            code: "ENT 211",
            name: "Entrepreneurship and Innovation",
            credits: 2,
            modules: []
        },
        {
            id: "cos201",
            code: "COS 201",
            name: "Computer Programming I",
            credits: 3,
            modules: []
        },
        {
            id: "cyb201",
            code: "CYB 201",
            name: "Introduction to Cybersecurity and Strategy",
            credits: 2,
            modules: []
        },
        {
            id: "sen201",
            code: "SEN 201",
            name: "Introduction to Software Engineering",
            credits: 2,
            modules: []
        },
        createCYB203(),
        {
            id: "cyb207",
            code: "FUPRE-CYB 207",
            name: "Introduction to Problem Solving with Web Application Development",
            credits: 2,
            modules: []
        },
        {
            id: "math205",
            code: "FUPRE-MATH 205",
            name: "Linear Algebra I",
            credits: 2,
            modules: []
        }
    ];
}

/* The weekly schedule identifies courses to recall on each day.
   Sunday is reserved for weekly review and preparation. */

const weeklyFocus = {
    0: [],
    1: ["ENT 211", "SEN 201"],
    2: ["CYB 203"],
    3: ["COS 201"],
    4: ["CYB 201", "FUPRE-MATH 205", "FUPRE-CYB 207"],
    5: ["CYB 203"],
    6: ["COS 201", "FUPRE-CYB 207"]
};

/* Format a date as YYYY-MM-DD using local time. */

function todayKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

/* Create a simple unique identifier for new courses and units. */

function makeId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/* Define the initial saved data structure. */

function freshData() {
    return {
        courses: createStarterCourses(),
        questsByDate: {},
        totalXP: 0,
        completedQuestIds: [],
        studyDates: [],
        awardedAchievements: []
    };
}

/* Read previously saved data from this browser.
   Invalid or missing data falls back to the starter structure. */

function loadData() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved) {
            const data = JSON.parse(saved);

            if (
                data &&
                Array.isArray(data.courses) &&
                data.questsByDate &&
                Array.isArray(data.studyDates)
            ) {
                data.totalXP = Number(data.totalXP) || 0;
                data.completedQuestIds ??= [];
                data.awardedAchievements ??= [];

                return data;
            }
        }
    } catch (error) {
        console.error("Could not load tracker data:", error);
    }

    return freshData();
}

let appData = loadData();

/* Save the current application state locally. */

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    } catch (error) {
        console.error("Could not save tracker data:", error);
        alert("Your browser could not save this change. Check available storage.");
    }
}

/* Flatten a course's modules into a list of units for calculations. */

function allUnits(course) {
    return course.modules.flatMap(module =>
        module.units.map(unit => ({
            ...unit,
            moduleId: module.id,
            moduleName: module.name,
            courseId: course.id,
            courseCode: course.code
        }))
    );
}

/* Calculate how much of a course has been completed. */

function courseProgress(course) {
    const units = allUnits(course);
    const completed = units.filter(unit => unit.status === "completed").length;

    return {
        total: units.length,
        completed,
        percent: units.length
            ? Math.round((completed / units.length) * 100)
            : 0
    };
}

/* Find a unit in its original saved course/module structure. */

function findUnit(courseId, moduleId, unitId) {
    const course = appData.courses.find(item => item.id === courseId);
    const module = course?.modules.find(item => item.id === moduleId);
    const unit = module?.units.find(item => item.id === unitId);

    return { course, module, unit };
}

/* Show today's date in a friendly format. */

function renderDate() {
    document.getElementById("today-date").textContent =
        new Date().toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
}

/* Calculate a streak from consecutive calendar days with completed tasks. */

function calculateStreak() {
    const studyDates = new Set(appData.studyDates);
    const cursor = new Date();

    cursor.setHours(0, 0, 0, 0);

    // If today has no completed study task yet, allow yesterday's streak to continue.
    if (!studyDates.has(todayKey(cursor))) {
        cursor.setDate(cursor.getDate() - 1);
    }

    let streak = 0;

    while (studyDates.has(todayKey(cursor))) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
}

/* Update the dashboard statistics. */

function renderStats() {
    document.getElementById("xp-count").innerHTML =
        `${appData.totalXP} <small>XP</small>`;

    const completedTasks = Object.values(appData.questsByDate)
        .flat()
        .filter(quest => quest.completed).length;

    document.getElementById("completed-count").textContent = completedTasks;

    const completedUnits = appData.courses.reduce(
        (sum, course) => sum + courseProgress(course).completed,
        0
    );

    document.getElementById("units-completed-count").textContent = completedUnits;
    document.getElementById("course-count").textContent =
        `${appData.courses.length} courses`;
}

/* Generate today's tasks only once.
   This keeps the checklist stable when the page is refreshed. */

function generateQuests() {
    const date = todayKey();

    if (appData.questsByDate[date]) return;

    const weekday = new Date().getDay();
    const focusCodes = weeklyFocus[weekday] || [];
    const quests = [];

    function addQuest(title, description, type, xp, unitRef = null) {
        quests.push({
            id: makeId(),
            title,
            description,
            type,
            xp,
            completed: false,
            unitRef
        });
    }

    // Sunday focuses on consolidating the week's learning.
    if (weekday === 0) {
        addQuest(
            "Recall this week's learning",
            "Write down the important ideas you remember before checking your notes.",
            "Recall",
            10
        );

        const weakUnit = appData.courses
            .flatMap(course => allUnits(course))
            .find(unit => unit.status === "needs-practice");

        if (weakUnit) {
            addQuest(
                `Practise ${weakUnit.name}`,
                `${weakUnit.courseCode} · ${weakUnit.moduleName}`,
                "Practice",
                15,
                weakUnit
            );
        } else {
            addQuest(
                "Review a difficult topic",
                "Choose one topic that still needs more explanation or practice.",
                "Review",
                10
            );
        }

        addQuest(
            "Prepare for the new week",
            "Check unfinished work and identify your next priorities.",
            "Planning",
            5
        );
    } else {
        // Same-day recall is the main priority for scheduled courses.
        focusCodes.forEach(code => {
            const course = appData.courses.find(item => item.code === code);

            if (!course || quests.length >= 3) return;

            const activeUnit = allUnits(course).find(
                unit => unit.status === "in-progress"
            );

            const description = activeUnit
                ? `Recall what you learned about ${activeUnit.name} today before checking your notes.`
                : "Recall today's lecture or study session. Write the key ideas before checking your notes.";

            addQuest(
                `Recall ${course.code}`,
                description,
                "Recall",
                10,
                activeUnit || null
            );
        });

        // Use any available space for a weak topic, without exceeding three tasks.
        if (quests.length < 3) {
            const weakUnit = appData.courses
                .flatMap(course => allUnits(course))
                .find(unit =>
                    unit.status === "needs-practice" &&
                    !quests.some(quest =>
                        quest.unitRef && quest.unitRef.id === unit.id
                    )
                );

            if (weakUnit) {
                addQuest(
                    `Practise ${weakUnit.name}`,
                    `${weakUnit.courseCode} · ${weakUnit.moduleName}`,
                    "Practice",
                    15,
                    weakUnit
                );
            }
        }

        // A lighter review task fills a short day if needed.
        if (quests.length < 2) {
            addQuest(
                "Review an earlier topic",
                "Spend a short session strengthening something you have studied before.",
                "Review",
                10
            );
        }

        // On days without scheduled classes, give the user a useful study task.
        if (quests.length === 0) {
            addQuest(
                "Choose your next topic",
                "Open a course and add the real module or topic title from your materials.",
                "Planning",
                5
            );
        }
    }

    appData.questsByDate[date] = quests.slice(0, 3);
    saveData();
}

/* Return the saved quest list for today. */

function getTodayQuests() {
    return appData.questsByDate[todayKey()] || [];
}

/* Render daily tasks using DOM methods and textContent. */

function renderQuests() {
    const container = document.getElementById("task-list");
    const quests = getTodayQuests();

    container.replaceChildren();

    const completed = quests.filter(quest => quest.completed).length;

    document.getElementById("task-count").textContent =
        `${completed} / ${quests.length} complete`;

    if (!quests.length) {
        const empty = document.createElement("p");
        empty.className = "empty-state";
        empty.textContent = "No tasks available yet.";
        container.appendChild(empty);
        return;
    }

    quests.forEach(quest => {
        const card = document.createElement("article");
        card.className = `quest-card${quest.completed ? " is-complete" : ""}`;

        const check = document.createElement("button");
        check.type = "button";
        check.className = "quest-check";
        check.textContent = quest.completed ? "✓" : "";
        check.setAttribute(
            "aria-label",
            quest.completed ? "Mark task incomplete" : "Complete task"
        );

        check.addEventListener("click", () => toggleQuest(quest.id));

        const content = document.createElement("div");
        content.className = "quest-content";

        const title = document.createElement("h3");
        title.textContent = quest.title;

        const description = document.createElement("p");
        description.textContent = quest.description;

        const meta = document.createElement("div");
        meta.className = "quest-meta";

        const tag = document.createElement("span");
        tag.className = "quest-tag";
        tag.textContent = quest.type;

        meta.appendChild(tag);
        content.append(title, description, meta);

        const xp = document.createElement("span");
        xp.className = "quest-xp";
        xp.textContent = `+${quest.xp} XP`;

        card.append(check, content, xp);
        container.appendChild(card);
    });
}

/* Completing a task awards XP once.
   Unchecking it does not award XP again. */

function toggleQuest(questId) {
    const quest = getTodayQuests().find(item => item.id === questId);
    if (!quest) return;

    if (!quest.completed) {
        quest.completed = true;

        if (!appData.completedQuestIds.includes(quest.id)) {
            appData.completedQuestIds.push(quest.id);
            appData.totalXP += quest.xp;
        }

        const date = todayKey();

        if (!appData.studyDates.includes(date)) {
            appData.studyDates.push(date);
        }

        // Update the linked unit's last-studied date when applicable.
        if (quest.unitRef) {
            const ref = quest.unitRef;
            const found = findUnit(ref.courseId, ref.moduleId, ref.id);

            if (found.unit) {
                found.unit.lastStudied = date;
            }
        }
    } else {
        quest.completed = false;
    }

    saveData();
    renderAll();
}

/* Display the weekly streak as Monday through Sunday. */

function renderWeeklyStreak() {
    const container = document.getElementById("weekly-streak-days");
    container.replaceChildren();

    const names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const today = new Date();
    const monday = new Date(today);

    // Work backwards to the Monday of the current week.
    const weekday = (today.getDay() + 6) % 7;
    monday.setDate(today.getDate() - weekday);
    monday.setHours(0, 0, 0, 0);

    names.forEach((name, index) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + index);

        const key = todayKey(date);
        const studied = appData.studyDates.includes(key);
        const isToday = key === todayKey();

        const day = document.createElement("div");
        day.className = "streak-day";

        if (studied) day.classList.add("studied");
        if (isToday) day.classList.add("today");

        const label = document.createElement("span");
        label.className = "day-name";
        label.textContent = name;

        const number = document.createElement("span");
        number.className = "day-number";
        number.textContent = date.getDate();

        const mark = document.createElement("span");
        mark.className = "day-mark";
        mark.textContent = studied ? "✓" : "·";

        day.append(label, number, mark);
        container.appendChild(day);
    });

    const streak = calculateStreak();
    document.getElementById("streak-count").textContent = streak;

    document.getElementById("streak-message").textContent =
        streak > 0
            ? `${streak} consecutive ${streak === 1 ? "day" : "days"} of showing up. Keep your rhythm going.`
            : "Complete a study task today to begin your streak.";
}

/* Render course cards, modules, units and unit-status controls. */

function renderCourses() {
    const container = document.getElementById("course-list");
    container.replaceChildren();

    appData.courses.forEach(course => {
        const progress = courseProgress(course);
        const card = document.createElement("article");
        card.className = "course-card";

        const top = document.createElement("div");
        top.className = "course-topline";

        const heading = document.createElement("div");

        const code = document.createElement("p");
        code.className = "course-code";
        code.textContent = course.code;

        const name = document.createElement("h3");
        name.textContent = course.name;

        heading.append(code, name);

        const credits = document.createElement("span");
        credits.className = "course-units";
        credits.textContent = `${course.credits} credit units`;

        top.append(heading, credits);

        const progressCopy = document.createElement("div");
        progressCopy.className = "course-progress-copy";

        const label = document.createElement("span");
        label.textContent = progress.total
            ? `${progress.completed} of ${progress.total} units completed`
            : "Study structure not added yet";

        const percent = document.createElement("strong");
        percent.textContent = `${progress.percent}%`;

        progressCopy.append(label, percent);

        const track = document.createElement("div");
        track.className = "progress-track";

        const fill = document.createElement("div");
        fill.className = "progress-fill";
        fill.style.width = `${progress.percent}%`;

        track.appendChild(fill);

        const moduleList = document.createElement("div");
        moduleList.className = "module-list";

        course.modules.forEach(module => {
            const moduleBox = document.createElement("div");
            moduleBox.className = "module-item";

            const completed = module.units.filter(
                unit => unit.status === "completed"
            ).length;

            const moduleHead = document.createElement("div");
            moduleHead.className = "module-head";

            const moduleName = document.createElement("strong");
            moduleName.textContent = module.name;

            const moduleCount = document.createElement("span");
            moduleCount.textContent =
                `${completed}/${module.units.length} completed`;

            moduleHead.append(moduleName, moduleCount);

            const details = document.createElement("details");
            details.className = "module-details";

            const summary = document.createElement("summary");
            summary.textContent = "View units";

            const unitList = document.createElement("div");
            unitList.className = "unit-list";

            module.units.forEach(unit => {
                const row = document.createElement("div");
                row.className = "unit-row";

                const unitLabel = document.createElement("label");
                unitLabel.textContent = unit.name;

                const select = document.createElement("select");
                select.setAttribute("aria-label", `Status for ${unit.name}`);

                const statuses = [
                    ["new", "Not started"],
                    ["in-progress", "In progress"],
                    ["needs-practice", "Needs practice"],
                    ["completed", "Completed"]
                ];

                statuses.forEach(([value, text]) => {
                    const option = document.createElement("option");
                    option.value = value;
                    option.textContent = text;
                    select.appendChild(option);
                });

                select.value = unit.status;

                select.addEventListener("change", () => {
                    unit.status = select.value;

                    if (unit.status === "completed") {
                        unit.lastStudied = todayKey();
                    }

                    saveData();
                    renderAll();
                });

                const status = document.createElement("span");
                status.className = "unit-status";
                status.textContent =
                    unit.status === "completed" ? "Done" :
                    unit.status === "in-progress" ? "In progress" :
                    unit.status === "needs-practice" ? "Review" :
                    "New";

                row.append(unitLabel, select, status);
                unitList.appendChild(row);
            });

            details.append(summary, unitList);
            moduleBox.append(moduleHead, details);
            moduleList.appendChild(moduleBox);
        });

        const actions = document.createElement("div");
        actions.className = "course-actions";

        const addModuleButton = document.createElement("button");
        addModuleButton.type = "button";
        addModuleButton.className = "secondary-button";
        addModuleButton.textContent = "+ Add module";
        addModuleButton.addEventListener("click", () =>
            openCourseConfigDialog(course.id, "modules")
        );

        const addUnitButton = document.createElement("button");
        addUnitButton.type = "button";
        addUnitButton.className = "secondary-button";
        addUnitButton.textContent = "+ Add unit";
        addUnitButton.addEventListener("click", () => openStructureDialog(course.id, "unit"));

        const editCourseButton = document.createElement("button");
        editCourseButton.type = "button";
        editCourseButton.className = "secondary-button";
        editCourseButton.textContent = "Edit";
        editCourseButton.addEventListener("click", () =>
            openCourseConfigDialog(course.id, "edit")
        );

        actions.append(addModuleButton, addUnitButton, editCourseButton);

        card.append(top, progressCopy, track, moduleList, actions);
        container.appendChild(card);
    });
}

/* Edit course details or configure its complete module/unit structure. */

let courseConfigId = null;
let courseConfigMode = "edit";

function openCourseConfigDialog(courseId, mode) {
    const course = appData.courses.find(item => item.id === courseId);
    if (!course) return;

    courseConfigId = courseId;
    courseConfigMode = mode;
    const dialog = document.getElementById("course-config-dialog");
    const form = document.getElementById("course-config-form");
    const fields = document.getElementById("course-config-fields");
    const isEdit = mode === "edit";

    document.getElementById("course-config-title").textContent =
        isEdit ? "Edit course" : "Configure course modules";
    document.getElementById("save-course-config").textContent =
        isEdit ? "Save course" : "Save modules";
    document.getElementById("course-config-error").textContent = "";

    fields.innerHTML = isEdit ? `
        <label for="config-course-code">Course code</label>
        <input id="config-course-code" name="courseCode" required maxlength="30">
        <label for="config-course-credits">Credit unit</label>
        <input id="config-course-credits" name="courseCredits" type="number"
            min="0" max="30" required>
        <label for="config-course-name">Course title</label>
        <input id="config-course-name" name="courseName" required maxlength="120">
        <label for="config-module-count">Number of modules</label>
        <select id="config-module-count" name="moduleCount"></select>
        <div id="config-module-list"></div>
    ` : `
        <p id="config-course-caption" class="muted"></p>
        <label for="config-module-count">Number of modules</label>
        <select id="config-module-count" name="moduleCount"></select>
        <div id="config-module-list"></div>
    `;

    if (isEdit) {
        document.getElementById("config-course-code").value = course.code;
        document.getElementById("config-course-credits").value = course.credits;
        document.getElementById("config-course-name").value = course.name;
    } else {
        document.getElementById("config-course-caption").textContent =
            `${course.code} · ${course.name}`;
    }

    const countSelect = document.getElementById("config-module-count");
    const moduleList = document.getElementById("config-module-list");
    const currentCount = course.modules.length;
    const maxCount = Math.max(20, currentCount);

    function moduleDrafts() {
        return [...moduleList.querySelectorAll(".config-module")].map(section => ({
            id: section.dataset.moduleId,
            unitCount: Number(section.querySelector(".config-unit-count").value),
            units: [...section.querySelectorAll(".config-unit-status")].map(select => ({
                id: select.dataset.unitId,
                status: select.value
            }))
        }));
    }

    function renderModules(drafts = []) {
        const count = Number(countSelect.value) || 0;
        moduleList.innerHTML = Array.from({ length: count }, (_, index) => {
            const saved = course.modules[index];
            const draft = drafts[index];
            const moduleId = draft?.id || saved?.id || makeId();
            const unitCount = draft?.unitCount ?? saved?.units?.length ?? 0;
            const units = Array.from({ length: unitCount }, (unused, unitIndex) => {
                const savedUnit = saved?.units?.[unitIndex];
                const draftUnit = draft?.units?.[unitIndex];
                const unitId = draftUnit?.id || savedUnit?.id || makeId();
                const status = draftUnit?.status || savedUnit?.status || "new";
                return `
                    <div class="config-unit-row">
                        <span>Unit ${unitIndex + 1}</span>
                        <select class="config-unit-status" data-unit-id="${unitId}"
                            aria-label="Progress for Module ${index + 1}, Unit ${unitIndex + 1}">
                            <option value="new" ${status === "new" ? "selected" : ""}>Not started</option>
                            <option value="in-progress" ${status === "in-progress" ? "selected" : ""}>In progress</option>
                            <option value="needs-practice" ${status === "needs-practice" ? "selected" : ""}>Needs practice</option>
                            <option value="completed" ${status === "completed" ? "selected" : ""}>Completed</option>
                        </select>
                    </div>`;
            }).join("");

            return `
                <section class="config-module" data-module-id="${moduleId}">
                    <h3>Module ${index + 1}</h3>
                    <label for="config-units-${index}">Number of units in Module ${index + 1}</label>
                    <select id="config-units-${index}" class="config-unit-count">
                        ${Array.from({ length: 31 }, (unused, n) =>
                            `<option value="${n}" ${n === unitCount ? "selected" : ""}>${n} unit${n === 1 ? "" : "s"}</option>`
                        ).join("")}
                    </select>
                    <div class="config-unit-list">${units}</div>
                </section>`;
        }).join("");
    }

    countSelect.replaceChildren();
    for (let count = 0; count <= maxCount; count += 1) {
        const option = document.createElement("option");
        option.value = count;
        option.textContent = `${count} module${count === 1 ? "" : "s"}`;
        option.selected = count === currentCount;
        countSelect.appendChild(option);
    }
    countSelect.addEventListener("change", () => renderModules(moduleDrafts()));
    moduleList.addEventListener("change", event => {
        if (!event.target.matches(".config-unit-count")) return;
        const section = event.target.closest(".config-module");
        const index = [...moduleList.children].indexOf(section);
        const draft = moduleDrafts()[index];
        const saved = course.modules[index];
        const amount = Number(event.target.value) || 0;
        section.querySelector(".config-unit-list").innerHTML =
            Array.from({ length: amount }, (unused, unitIndex) => {
                const old = draft?.units?.[unitIndex] || saved?.units?.[unitIndex];
                const unitId = old?.id || makeId();
                const status = old?.status || "new";
                return `<div class="config-unit-row"><span>Unit ${unitIndex + 1}</span>
                    <select class="config-unit-status" data-unit-id="${unitId}"
                        aria-label="Progress for Module ${index + 1}, Unit ${unitIndex + 1}">
                        <option value="new" ${status === "new" ? "selected" : ""}>Not started</option>
                        <option value="in-progress" ${status === "in-progress" ? "selected" : ""}>In progress</option>
                        <option value="needs-practice" ${status === "needs-practice" ? "selected" : ""}>Needs practice</option>
                        <option value="completed" ${status === "completed" ? "selected" : ""}>Completed</option>
                    </select></div>`;
            }).join("");
    });

    renderModules();
    dialog.showModal();
}

function closeCourseConfigDialog() {
    document.getElementById("course-config-dialog").close();
    courseConfigId = null;
}

function saveCourseConfig(event) {
    event.preventDefault();
    const course = appData.courses.find(item => item.id === courseConfigId);
    if (!course) return;

    const error = document.getElementById("course-config-error");
    error.textContent = "";
    const codeInput = document.getElementById("config-course-code");
    const nameInput = document.getElementById("config-course-name");
    const creditsInput = document.getElementById("config-course-credits");
    if (courseConfigMode === "edit") {
        const code = codeInput.value.trim().toUpperCase();
        const name = nameInput.value.trim();
        const credits = Number(creditsInput.value);
        if (appData.courses.some(item => item.id !== course.id && item.code === code)) {
            error.textContent = "A course with this code already exists.";
            return;
        }
        if (!Number.isInteger(credits) || credits < 0 || credits > 30) {
            error.textContent = "Enter a valid number of credit units.";
            return;
        }
        course.code = code;
        course.name = name;
        course.credits = credits;
    }

    const count = Number(document.getElementById("config-module-count").value) || 0;
    const existing = course.modules;
    const moduleSections = [...document.querySelectorAll("#config-module-list .config-module")];
    course.modules = moduleSections.map((section, index) => {
        const previous = existing[index];
        const units = [...section.querySelectorAll(".config-unit-status")].map((select, unitIndex) => {
            const oldUnit = previous?.units?.[unitIndex];
            return {
                id: select.dataset.unitId || oldUnit?.id || makeId(),
                name: `Unit ${unitIndex + 1}`,
                status: select.value,
                lastStudied: oldUnit?.lastStudied || null
            };
        });
        return {
            id: section.dataset.moduleId || previous?.id || makeId(),
            name: `Module ${index + 1}`,
            units
        };
    }).slice(0, count);

    delete appData.questsByDate[todayKey()];
    saveData();
    closeCourseConfigDialog();
    generateQuests();
    renderAll();
}

/* Course dialog: add a new course using a proper form. */

function openCourseDialog() {
    const dialog = document.getElementById("course-dialog");
    document.getElementById("course-form").reset();
    document.getElementById("course-form-error").textContent = "";
    dialog.showModal();
}

function closeCourseDialog() {
    document.getElementById("course-dialog").close();
}

function addCourseFromForm(event) {
    event.preventDefault();

    const code = document.getElementById("course-code").value.trim().toUpperCase();
    const name = document.getElementById("course-name").value.trim();
    const credits = Number(document.getElementById("course-credits").value);
    const error = document.getElementById("course-form-error");

    error.textContent = "";

    if (appData.courses.some(course => course.code === code)) {
        error.textContent = "A course with this code already exists.";
        return;
    }

    if (!Number.isInteger(credits) || credits < 0) {
        error.textContent = "Enter a valid number of credit units.";
        return;
    }

    appData.courses.push({
        id: makeId(),
        code,
        name,
        credits,
        modules: []
    });

    saveData();
    closeCourseDialog();
    renderAll();
}

/* Module/unit dialog state. */

let structureCourseId = null;
let structureMode = "unit";

function openStructureDialog(courseId) {
    const course = appData.courses.find(item => item.id === courseId);
    if (!course) return;
    if (!course.modules.length) {
        alert("Add a module first, then add units to it.");
        return;
    }
    structureCourseId = courseId;
    const dialog = document.getElementById("structure-dialog");
    const moduleSelect = document.getElementById("structure-module");
    const countSelect = document.getElementById("structure-unit-count");
    document.getElementById("structure-form").reset();
    document.getElementById("structure-form-error").textContent = "";
    document.getElementById("structure-course-name").textContent = course.code + " · " + course.name;
    moduleSelect.replaceChildren();
    course.modules.forEach(module => {
        const option = document.createElement("option");
        option.value = module.id;
        option.textContent = module.name;
        moduleSelect.appendChild(option);
    });
    countSelect.replaceChildren();
    for (let count = 1; count <= 30; count += 1) {
        const option = document.createElement("option");
        option.value = count;
        option.textContent = count + " unit" + (count === 1 ? "" : "s");
        countSelect.appendChild(option);
    }
    countSelect.value = "1";
    dialog.showModal();
}

function closeStructureDialog() {
    document.getElementById("structure-dialog").close();
    structureCourseId = null;
}

function saveStructureFromForm(event) {
    event.preventDefault();
    const course = appData.courses.find(item => item.id === structureCourseId);
    if (!course) return;
    const error = document.getElementById("structure-form-error");
    error.textContent = "";
    const module = course.modules.find(item => item.id === document.getElementById("structure-module").value);
    const count = Number(document.getElementById("structure-unit-count").value);
    if (!module || !Number.isInteger(count) || count < 1 || count > 30) {
        error.textContent = "Choose a module and how many units to add.";
        return;
    }
    for (let index = 0; index < count; index += 1) {
        module.units.push({ id: makeId(), name: "Unit " + (module.units.length + 1), status: "new", lastStudied: null });
    }
    delete appData.questsByDate[todayKey()];
    saveData();
    closeStructureDialog();
    generateQuests();
    renderAll();
}

/* Connect buttons and forms, then start the application. */

document.addEventListener("DOMContentLoaded", () => {
    initialiseTheme();
    renderDate();
    generateQuests();

    document.getElementById("add-course-button")
        .addEventListener("click", openCourseDialog);

    document.getElementById("close-course-dialog")
        .addEventListener("click", closeCourseDialog);

    document.getElementById("cancel-course-button")
        .addEventListener("click", closeCourseDialog);

    document.getElementById("course-form")
        .addEventListener("submit", addCourseFromForm);

    document.getElementById("close-course-config")
        .addEventListener("click", closeCourseConfigDialog);

    document.getElementById("cancel-course-config")
        .addEventListener("click", closeCourseConfigDialog);

    document.getElementById("course-config-form")
        .addEventListener("submit", saveCourseConfig);

    document.getElementById("close-structure-dialog")
        .addEventListener("click", closeStructureDialog);

    document.getElementById("cancel-structure-button")
        .addEventListener("click", closeStructureDialog);

    document.getElementById("structure-form")
        .addEventListener("submit", saveStructureFromForm);

    renderAll();
});

