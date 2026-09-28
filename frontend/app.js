const API_URL = "";

let currentUsername =
    localStorage.getItem("mygapino_username") || "";

let heartbeatTimer = null;


// ------------------------------------
// Elements
// ------------------------------------

const statusDot =
    document.getElementById("statusDot");

const statusText =
    document.getElementById("statusText");

const serverName =
    document.getElementById("serverName");

const serverBadge =
    document.getElementById("serverBadge");

const serverStatus =
    document.getElementById("serverStatus");

const playerCount =
    document.getElementById("playerCount");

const maxPlayers =
    document.getElementById("maxPlayers");

const serverIP =
    document.getElementById("serverIP");

const serverPort =
    document.getElementById("serverPort");

const playersList =
    document.getElementById("playersList");

const playersBadge =
    document.getElementById("playersBadge");

const loginButton =
    document.getElementById("loginButton");

const refreshButton =
    document.getElementById("refreshButton");

const loginModal =
    document.getElementById("loginModal");

const closeModal =
    document.getElementById("closeModal");

const usernameInput =
    document.getElementById("usernameInput");

const submitLogin =
    document.getElementById("submitLogin");

const loginMessage =
    document.getElementById("loginMessage");


// ------------------------------------
// Server status
// ------------------------------------

async function loadServerStatus() {

    try {

        const response =
            await fetch("/api/server");

        if (!response.ok) {
            throw new Error("Server error");
        }

        const data =
            await response.json();

        serverName.textContent =
            data.name ||
            "MyGapino My Summer Car";

        playerCount.textContent =
            data.players ?? 0;

        maxPlayers.textContent =
            data.max_players ?? 32;

        serverIP.textContent =
            data.ip || "-";

        serverPort.textContent =
            data.port || "-";


        if (data.status === "online") {

            setOnlineStatus();

        } else {

            setOfflineStatus();

        }

    } catch (error) {

        console.error(error);

        setOfflineStatus();
    }
}


// ------------------------------------
// Online
// ------------------------------------

function setOnlineStatus() {

    statusDot.classList.remove("offline");
    statusDot.classList.add("online");

    statusText.textContent =
        "سرور آنلاین است";

    serverBadge.classList.remove("offline");
    serverBadge.classList.add("online");

    serverBadge.textContent =
        "ONLINE";

    serverStatus.textContent =
        "آنلاین";
}


// ------------------------------------
// Offline
// ------------------------------------

function setOfflineStatus() {

    statusDot.classList.remove("online");
    statusDot.classList.add("offline");

    statusText.textContent =
        "سرور آفلاین است";

    serverBadge.classList.remove("online");
    serverBadge.classList.add("offline");

    serverBadge.textContent =
        "OFFLINE";

    serverStatus.textContent =
        "آفلاین";
}


// ------------------------------------
// Players
// ------------------------------------

async function loadPlayers() {

    try {

        const response =
            await fetch("/api/players");

        if (!response.ok) {
            throw new Error(
                "Players request failed"
            );
        }

        const data =
            await response.json();

        const players =
            Array.isArray(data.players)
                ? data.players
                : [];

        playersBadge.textContent =
            players.length;

        playerCount.textContent =
            players.length;

        renderPlayers(players);

    } catch (error) {

        console.error(error);

        playersBadge.textContent = "0";

        renderPlayers([]);
    }
}


// ------------------------------------
// Render players
// ------------------------------------

function renderPlayers(players) {

    if (!players.length) {

        playersList.innerHTML = `
            <div class="empty-players">
                هنوز بازیکنی آنلاین نیست.
            </div>
        `;

        return;
    }

    playersList.innerHTML = "";

    players.forEach((username) => {

        const playerElement =
            document.createElement("div");

        playerElement.className =
            "player";

        playerElement.innerHTML = `
            <span class="player-name">
                ${escapeHtml(username)}
            </span>

            <span class="player-online">
                ● آنلاین
            </span>
        `;

        playersList.appendChild(
            playerElement
        );
    });
}


// ------------------------------------
// Login modal
// ------------------------------------

loginButton.addEventListener(
    "click",
    () => {

        loginMessage.textContent = "";

        usernameInput.value =
            currentUsername;

        loginModal.classList.remove(
            "hidden"
        );

        setTimeout(
            () => usernameInput.focus(),
            100
        );
    }
);


closeModal.addEventListener(
    "click",
    closeLoginModal
);


loginModal.addEventListener(
    "click",
    (event) => {

        if (event.target === loginModal) {
            closeLoginModal();
        }
    }
);


function closeLoginModal() {

    loginModal.classList.add(
        "hidden"
    );
}


// ------------------------------------
// Login
// ------------------------------------

submitLogin.addEventListener(
    "click",
    login
);


usernameInput.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Enter") {
            login();
        }
    }
);


async function login() {

    const username =
        usernameInput.value.trim();


    if (!username) {

        loginMessage.textContent =
            "نام کاربری را وارد کنید.";

        return;
    }


    if (username.length < 3) {

        loginMessage.textContent =
            "نام کاربری باید حداقل ۳ کاراکتر باشد.";

        return;
    }


    submitLogin.disabled = true;

    submitLogin.textContent =
        "در حال ورود...";


    try {

        const response =
            await fetch(
                "/api/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        username: username
                    })
                }
            );


        const data =
            await response.json();


        if (!data.success) {

            loginMessage.textContent =
                data.message ||
                "ورود انجام نشد.";

            return;
        }


        currentUsername =
            data.username;

        localStorage.setItem(
            "mygapino_username",
            currentUsername
        );


        closeLoginModal();

        startHeartbeat();

        await sendHeartbeat();

        await loadPlayers();

    } catch (error) {

        console.error(error);

        loginMessage.textContent =
            "ارتباط با سرور برقرار نشد.";

    } finally {

        submitLogin.disabled = false;

        submitLogin.textContent =
            "ورود";
    }
}


// ------------------------------------
// Heartbeat
// ------------------------------------

async function sendHeartbeat() {

    if (!currentUsername) {
        return;
    }


    try {

        const response =
            await fetch(
                "/api/heartbeat",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        username:
                            currentUsername
                    })
                }
            );


        const data =
            await response.json();


        if (data.success) {

            playerCount.textContent =
                data.players;

            playersBadge.textContent =
                data.players;

            setOnlineStatus();

            await loadPlayers();
        }

    } catch (error) {

        console.error(
            "Heartbeat error:",
            error
        );
    }
}


// ------------------------------------
// Start heartbeat
// ------------------------------------

function startHeartbeat() {

    if (heartbeatTimer) {

        clearInterval(
            heartbeatTimer
        );
    }


    sendHeartbeat();


    heartbeatTimer =
        setInterval(
            sendHeartbeat,
            10000
        );
}


// ------------------------------------
// Refresh
// ------------------------------------

refreshButton.addEventListener(
    "click",
    async () => {

        refreshButton.disabled = true;

        refreshButton.textContent =
            "در حال بروزرسانی...";


        await loadServerStatus();

        await loadPlayers();


        refreshButton.disabled = false;

        refreshButton.textContent =
            "بروزرسانی وضعیت";
    }
);


// ------------------------------------
// HTML protection
// ------------------------------------

function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent = value;

    return div.innerHTML;
}


// ------------------------------------
// Initial
// ------------------------------------

async function initialize() {

    await loadServerStatus();

    await loadPlayers();


    if (currentUsername) {

        startHeartbeat();
    }
}


initialize();
