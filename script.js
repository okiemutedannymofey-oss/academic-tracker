
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
        addModuleButton.addEventListener("click", () => openStructureDialog(course.id, "module"));

        const addUnitButton = document.createElement("button");
        addUnitButton.type = "button";
        addUnitButton.className = "secondary-button";
        addUnitButton.textContent = "+ Add unit";
        addUnitButton.addEventListener("click", () => openStructureDialog(course.id, "unit"));

        actions.append(addModuleButton, addUnitButton);

        card.append(top, progressCopy, track, moduleList, actions);
        container.appendChild(card);
    });
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

function openStructureDialog(courseId, mode) {
    const course = appData.courses.find(item => item.id === courseId);
    if (!course) return;

    structureCourseId = courseId;
    structureMode = mode;

    const dialog = document.getElementById("structure-dialog");
    const moduleSelect = document.getElementById("structure-module");
    const newModuleField = document.getElementById("new-module-field");
    const unitNameInput = document.getElementById("structure-unit-name");

    document.getElementById("structure-form").reset();
    document.getElementById("structure-form-error").textContent = "";
    document.getElementById("structure-course-name").textContent =
        `${course.code} · ${course.name}`;

    moduleSelect.replaceChildren();

    course.modules.forEach(module => {
        const option = document.createElement("option");
        option.value = module.id;
        option.textContent = module.name;
        moduleSelect.appendChild(option);
    });

    const needsModule = mode === "module";
    document.getElementById("structure-dialog-title").textContent =
        needsModule ? "Add a module" : "Add a unit or topic";

    newModuleField.hidden = !needsModule;
    moduleSelect.disabled = needsModule;

    if (needsModule) {
        unitNameInput.closest("label")?.removeAttribute("hidden");
        unitNameInput.placeholder = "Optional: enter a unit title too";
    } else {
        unitNameInput.placeholder = "Enter the actual title from your material";
    }

    if (!needsModule && course.modules.length === 0) {
        alert("Add a module first, then add units to it.");
        return;
    }

    dialog.showModal();
}

function closeStructureDialog() {
    document.getElementById("structure-dialog").close();
    structureCourseId = null;
}

function saveStructureFromForm(event) {
    event.preventDefault();

    const course = appData.courses.find(
        item => item.id === structureCourseId
    );

    if (!course) return;

    const error = document.getElementById("structure-form-error");
    error.textContent = "";

    const moduleName = document.getElementById("new-module-name").value.trim();
    const unitName = document.getElementById("structure-unit-name").value.trim();

    if (structureMode === "module") {
        if (!moduleName) {
            error.textContent = "Enter a module name.";
            return;
        }

        const module = {
            id: makeId(),
            name: moduleName,
            units: []
        };

        course.modules.push(module);

        // Add a unit at the same time if the user supplied its title.
        if (unitName) {
            module.units.push({
                id: makeId(),
                name: unitName,
                status: "new",
                lastStudied: null
            });
        }
    } else {
        const moduleId = document.getElementById("structure-module").value;
        const module = course.modules.find(item => item.id === moduleId);

        if (!module) {
            error.textContent = "Choose a module first.";
            return;
        }

        if (!unitName) {
            error.textContent = "Enter the actual unit or topic title.";
            return;
        }

        module.units.push({
            id: makeId(),
            name: unitName,
            status: "new",
            lastStudied: null
        });
    }

    // Regenerate today's tasks so newly added units can be considered.
    delete appData.questsByDate[todayKey()];

    saveData();
    closeStructureDialog();
    generateQuests();
    renderAll();
}

/* Show explicitly marked revision topics and only very recent missed tasks. */
function renderReview() {
    const container = document.getElementById("review-list");
    container.replaceChildren();
    const items = [];

    appData.courses.forEach(course => {
        course.modules.forEach(module => {
            module.units.forEach(unit => {
                if (unit.status === "needs-practice") {
                    items.push({
                        title: unit.name,
                        detail: `${course.code} · ${module.name} · Needs practice`
                    });
                }
            });
        });
    });

    // A daily reminder is temporary. Keep at most the two previous days visible.
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 2);
    const cutoffKey = todayKey(cutoff);
    Object.entries(appData.questsByDate).forEach(([date, quests]) => {
        if (date >= todayKey() || date < cutoffKey) return;
        quests.forEach(quest => {
            if (!quest.completed) {
                items.push({
                    title: quest.title,
                    detail: `Unfinished daily task · ${date}`
                });
            }
        });
    });

    if (!items.length) {
        const empty = document.createElement("p");
        empty.className = "empty-state";
        empty.textContent =
            "Your revision board is clear. Mark a unit 'Needs practice' to keep that topic here.";
        container.appendChild(empty);
        return;
    }

    items.forEach(item => {
        const row = document.createElement("div");
        row.className = "review-item";
        const title = document.createElement("strong");
        title.textContent = item.title;
        const detail = document.createElement("p");
        detail.textContent = item.detail;
        row.append(title, detail);
        container.appendChild(row);
    });
}

/* Define milestones around consistent study and actual academic progress. */

const achievements = [
    {
        id: "first-task",
        symbol: "✓",
        name: "First step",
        description: "Complete your first study task.",
        unlocked: () => appData.completedQuestIds.length >= 1
    },
    {
        id: "five-tasks",
        symbol: "↗",
        name: "Finding rhythm",
        description: "Complete five study tasks.",
        unlocked: () => appData.completedQuestIds.length >= 5
    },
    {
        id: "hundred-xp",
        symbol: "✦",
        name: "Steady effort",
        description: "Earn 100 study XP.",
        unlocked: () => appData.totalXP >= 100
    },
    {
        id: "three-day-streak",
        symbol: "◷",
        name: "Three-day rhythm",
        description: "Maintain a three-day study streak.",
        unlocked: () => calculateStreak() >= 3
    },
    {
        id: "first-unit",
        symbol: "▤",
        name: "Unit completed",
        description: "Complete your first course unit.",
        unlocked: () => appData.courses.some(course =>
            allUnits(course).some(unit => unit.status === "completed")
        )
    },
    {
        id: "five-units",
        symbol: "◆",
        name: "Building knowledge",
        description: "Complete five course units.",
        unlocked: () => appData.courses.reduce(
            (sum, course) => sum + courseProgress(course).completed,
            0
        ) >= 5
    }
];

/* Render the milestone cards and remember which ones were earned. */

function renderAchievements() {
    const container = document.getElementById("achievement-list");
    container.replaceChildren();

    let unlockedCount = 0;

    achievements.forEach(achievement => {
        const unlocked = achievement.unlocked();

        if (unlocked) {
            unlockedCount++;

            if (!appData.awardedAchievements.includes(achievement.id)) {
                appData.awardedAchievements.push(achievement.id);
            }
        }

        const card = document.createElement("article");
        card.className = `achievement-card${unlocked ? "" : " locked"}`;

        const symbol = document.createElement("span");
        symbol.className = "achievement-symbol";
        symbol.textContent = achievement.symbol;

        const title = document.createElement("strong");
        title.textContent = achievement.name;

        const description = document.createElement("p");
        description.textContent = achievement.description;

        card.append(symbol, title, description);
        container.appendChild(card);
    });

    document.getElementById("achievement-count").textContent =
        `${unlockedCount} earned`;
}

/* Apply a selected palette and appearance mode without changing saved study data. */

const PALETTE_KEY = "academicTrackerDmofeyPalette_v1";
const PALETTES = {
    "arctic-burgundy": "Arctic Burgundy",
    "ocean": "Ocean",
    "forest": "Forest",
    "black-crimson": "Black Crimson",
    "slate-violet": "Slate Violet"
};

function readAppearance() {
    try {
        const saved = JSON.parse(localStorage.getItem(PALETTE_KEY) || "{}");
        return {
            palette: Object.hasOwn(PALETTES, saved.palette) ? saved.palette : "slate-violet",
            mode: ["light", "dark", "system"].includes(saved.mode) ? saved.mode : null
        };
    } catch {
        return { palette: "slate-violet", mode: null };
    }
}

function saveAppearance(preferences) {
    try {
        localStorage.setItem(PALETTE_KEY, JSON.stringify(preferences));
    } catch (error) {
        console.warn("Could not save appearance settings:", error);
    }
}

function applyTheme(mode) {
    const preferences = readAppearance();
    const selectedMode = preferences.mode || (["light", "dark"].includes(mode) ? mode : "dark");
    const isDark = selectedMode === "system"
        ? Boolean(window.matchMedia?.("(prefers-color-scheme: dark)").matches)
        : selectedMode === "dark";
    const resolvedMode = isDark ? "dark" : "light";

    document.body.classList.toggle("light-theme", !isDark);
    document.body.dataset.theme = preferences.palette;
    document.body.dataset.mode = resolvedMode;

    const icon = document.getElementById("theme-icon");
    const label = document.getElementById("theme-label");
    if (icon) icon.textContent = isDark ? "☼" : "☾";
    if (label) label.textContent = isDark ? "Light mode" : "Dark mode";

    const meta = document.querySelector('meta[name="theme-color"]');
    const background = getComputedStyle(document.body).getPropertyValue("--bg").trim();
    if (meta && background) meta.content = background;

    const paletteSelect = document.getElementById("palette-select");
    const modeSelect = document.getElementById("appearance-mode-select");
    if (paletteSelect) paletteSelect.value = preferences.palette;
    if (modeSelect) modeSelect.value = selectedMode;
}

function initialiseTheme() {
    let legacyMode = "dark";
    try {
        legacyMode = localStorage.getItem(THEME_KEY) || "dark";
    } catch (error) {
        console.warn("Could not load theme preference:", error);
    }

    const preferences = readAppearance();
    if (!preferences.mode) {
        preferences.mode = ["light", "dark"].includes(legacyMode) ? legacyMode : "dark";
        saveAppearance(preferences);
    }
    applyTheme(preferences.mode);

    const toggle = document.getElementById("theme-toggle");
    toggle?.addEventListener("click", () => {
        const current = readAppearance();
        const next = document.body.dataset.mode === "dark" ? "light" : "dark";
        current.mode = next;
        saveAppearance(current);
        try { localStorage.setItem(THEME_KEY, next); } catch {}
        applyTheme(next);
    });

    document.getElementById("palette-select")?.addEventListener("change", event => {
        const current = readAppearance();
        if (!Object.hasOwn(PALETTES, event.target.value)) return;
        current.palette = event.target.value;
        saveAppearance(current);
        applyTheme(current.mode);
    });

    document.getElementById("appearance-mode-select")?.addEventListener("change", event => {
        const current = readAppearance();
        if (!["light", "dark", "system"].includes(event.target.value)) return;
        current.mode = event.target.value;
        saveAppearance(current);
        try { localStorage.setItem(THEME_KEY, event.target.value); } catch {}
        applyTheme(current.mode);
    });

    window.matchMedia?.("(prefers-color-scheme: dark)")
        .addEventListener?.("change", () => {
            if (readAppearance().mode === "system") applyTheme("system");
        });
}

/* Refresh all visible dashboard sections after a change. */

function renderAll() {
    renderStats();
    renderQuests();
    renderWeeklyStreak();
    renderCourses();
    renderReview();
    renderAchievements();
}

/* Progress, navigation and the in-app Version 1.5 view. */

function readSavedTrackerData() {
    try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
        return data && Array.isArray(data.courses) ? data : null;
    } catch {
        return null;
    }
}

function savedCourseUnits(course) {
    return (course.modules || []).flatMap(module =>
        (module.units || []).map(unit => ({
            ...unit,
            moduleName: module.name
        }))
    );
}

function renderProgressPage() {
    const container = document.getElementById("progress-content");
    if (!container) return;
    const data = readSavedTrackerData();

    if (!data) {
        container.textContent = "Your saved study statistics will appear here.";
        return;
    }

    const courses = data.courses;
    const allUnits = courses.flatMap(course =>
        savedCourseUnits(course).map(unit => ({ ...unit, courseCode: course.code }))
    );
    const completed = allUnits.filter(unit => unit.status === "completed").length;
    const unfinished = allUnits.length - completed;
    const overall = allUnits.length ? Math.round(completed / allUnits.length * 100) : 0;
    const tasks = Object.entries(data.questsByDate || {}).flatMap(([date, list]) =>
        (Array.isArray(list) ? list : []).map(task => ({ ...task, date }))
    );
    const completedTasks = tasks.filter(task => task.completed);
    const dates = new Set(Array.isArray(data.studyDates) ? data.studyDates : []);

    const summary = document.createElement("div");
    summary.className = "v1-progress-summary";
    summary.innerHTML =
        '<article><span>Overall course progress</span><strong>' + overall + '%</strong></article>' +
        '<article><span>Completed units</span><strong>' + completed + '</strong></article>' +
        '<article><span>Unfinished units</span><strong>' + unfinished + '</strong></article>' +
        '<article><span>Study XP</span><strong>' + (Number(data.totalXP) || 0) + '</strong></article>';

    const track = document.createElement("div");
    track.className = "v1-overall-track";
    const fill = document.createElement("span");
    fill.style.width = overall + "%";
    track.appendChild(fill);

    const list = document.createElement("div");
    list.className = "v1-course-progress-list";
    courses.forEach(course => {
        const units = savedCourseUnits(course);
        const done = units.filter(unit => unit.status === "completed").length;
        const percent = units.length ? Math.round(done / units.length * 100) : 0;
        const row = document.createElement("article");
        row.className = "v1-course-progress";
        const heading = document.createElement("div");
        heading.innerHTML = "<strong></strong><span></span>";
        heading.querySelector("strong").textContent = course.code + " · " + course.name;
        heading.querySelector("span").textContent = units.length
            ? done + " of " + units.length + " units · " + percent + "%"
            : "No units added yet";
        const bar = document.createElement("div");
        bar.className = "v1-overall-track";
        const barFill = document.createElement("span");
        barFill.style.width = percent + "%";
        bar.appendChild(barFill);
        row.append(heading, bar);
        list.appendChild(row);
    });

    const history = document.createElement("div");
    history.className = "v1-activity-history";
    const recentDates = [...dates].sort().reverse().slice(0, 7);
    if (recentDates.length) {
        recentDates.forEach(date => {
            const dateTasks = completedTasks.filter(task => task.date === date);
            const item = document.createElement("p");
            item.textContent = new Date(date + "T12:00:00").toLocaleDateString("en-GB", {
                weekday: "short", day: "numeric", month: "short"
            }) + " · " + (dateTasks.length ? dateTasks.length + " task(s) completed" : "Study activity recorded");
            history.appendChild(item);
        });
    } else {
        history.textContent = "No study activity recorded yet.";
    }

    container.replaceChildren(summary, track, list);
    const historyTitle = document.createElement("h3");
    historyTitle.textContent = "Recent study activity";
    container.append(historyTitle, history);
}

function openVersion15(page) {
    const dialog = document.getElementById("version-15-dialog");
    const frame = document.getElementById("version-15-frame");
    if (!dialog || !frame) return;
    const target = page === "study-group" ? "study-group" : "home";
    frame.src = "https://okiemutedannymofey-oss.github.io/academic-tracker-1.5/Academic%20Tracker%201.5%20version%202/#" + target;
    if (!dialog.open) dialog.showModal();
}

function initialiseVersion15Navigation() {
    document.querySelectorAll("[data-open-v15]").forEach(link => {
        link.addEventListener("click", event => {
            event.preventDefault();
            openVersion15(link.dataset.openV15);
        });
    });

    document.getElementById("close-version-15")?.addEventListener("click", () => {
        const dialog = document.getElementById("version-15-dialog");
        const frame = document.getElementById("version-15-frame");
        dialog?.close();
        if (frame) frame.src = "";
        applyTheme(readAppearance().mode || "dark");
    });

    document.querySelectorAll(".tracker-navigation a[href^='#']").forEach(link => {
        link.addEventListener("click", () => {
            document.querySelectorAll(".tracker-navigation a").forEach(item =>
                item.classList.toggle("active", item === link)
            );
        });
    });

    window.addEventListener("message", event => {
        if (event.origin !== location.origin || event.data?.source !== "academic-tracker-15-theme") return;
        const color = String(event.data.background || "");
        if (!/^#[\da-f]{3,8}$/i.test(color)) return;
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.content = color;
        document.documentElement.style.backgroundColor = color;
        document.body.style.backgroundColor = color;
    });

    renderProgressPage();

    document.getElementById("export-tracker-data")?.addEventListener("click", () => {
        const data = readSavedTrackerData();
        const feedback = document.getElementById("settings-feedback");
        if (!data) {
            if (feedback) feedback.textContent = "There is no saved tracker data to download yet.";
            return;
        }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "academic-tracker-backup-" + todayKey() + ".json";
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        if (feedback) feedback.textContent = "Your backup has been downloaded.";
    });
}

const originalRenderAllForProgress = renderAll;
renderAll = function() {
    originalRenderAllForProgress();
    renderProgressPage();
};

document.addEventListener("DOMContentLoaded", initialiseVersion15Navigation);

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

    document.getElementById("close-structure-dialog")
        .addEventListener("click", closeStructureDialog);

    document.getElementById("cancel-structure-button")
        .addEventListener("click", closeStructureDialog);

    document.getElementById("structure-form")
        .addEventListener("submit", saveStructureFromForm);

    renderAll();
});
