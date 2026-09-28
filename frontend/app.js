const API_URL = "";

let currentUsername =
    localStorage.getItem("mygapino_username") || "";

const $ = (id) => document.getElementById(id);


// =========================
// API
// =========================

async function apiRequest(url, options = {}) {
    const response = await fetch(API_URL + url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
}


// =========================
// Server
// =========================

async function loadServer() {

    try {

        const data = await apiRequest("/api/server");

        if ($("serverName")) {
            $("serverName").textContent =
                data.name || "MyGapino My Summer Car";
        }

        if ($("serverIP")) {
            $("serverIP").textContent =
                data.ip || "-";
        }

        if ($("serverPort")) {
            $("serverPort").textContent =
                data.port || "-";
        }

        if ($("playerCount")) {
            $("playerCount").textContent =
                data.players ?? 0;
        }

        if ($("maxPlayers")) {
            $("maxPlayers").textContent =
                data.max_players ?? 32;
        }


        // =========================
        // Real server status
        // =========================

        const online =
            data.status === "online";

        if ($("serverStatus")) {

            $("serverStatus").textContent =
                online
                    ? "آنلاین"
                    : "آفلاین";
        }


        if ($("serverBadge")) {

            $("serverBadge").textContent =
                online
                    ? "ONLINE"
                    : "OFFLINE";
        }


        // تغییر ظاهر وضعیت
        const statusElements = [
            $("serverStatus"),
            $("serverBadge")
        ];

        statusElements.forEach((element) => {

            if (!element) return;

            element.classList.remove(
                "online",
                "offline"
            );

            element.classList.add(
                online
                    ? "online"
                    : "offline"
            );
        });

    } catch (error) {

        console.error(
            "Server request failed:",
            error
        );

        if ($("serverStatus")) {
            $("serverStatus").textContent =
                "خطا در اتصال";
        }

        if ($("serverBadge")) {
            $("serverBadge").textContent =
                "ERROR";
        }
    }
}


// =========================
// Players
// =========================

async function loadPlayers() {

    try {

        const data =
            await apiRequest("/api/players");

        if ($("playerCount")) {

            $("playerCount").textContent =
                data.count ?? 0;
        }


        if (!$("playersList")) {
            return;
        }


        $("playersList").innerHTML = "";


        if (!data.players || data.players.length === 0) {

            const empty =
                document.createElement("div");

            empty.className = "player-empty";

            empty.textContent =
                "فعلاً بازیکنی آنلاین نیست.";

            $("playersList").appendChild(empty);

        } else {

            data.players.forEach((player) => {

                const item =
                    document.createElement("div");

                item.className =
                    "player-item";


                const name =
                    document.createElement("span");

                name.className =
                    "player-name";

                name.textContent =
                    player.username;


                const status =
                    document.createElement("span");

                status.className =
                    "player-online";

                status.textContent =
                    "آنلاین";


                item.appendChild(name);
                item.appendChild(status);

                $("playersList").appendChild(item);
            });
        }


        if ($("playersBadge")) {

            $("playersBadge").textContent =
                `${data.count ?? 0} بازیکن`;
        }

    } catch (error) {

        console.error(
            "Players request failed:",
            error
        );
    }
}


// =========================
// Login Modal
// =========================

function openLoginModal() {

    if (!$("loginModal")) return;

    $("loginModal").classList.add("show");

    if ($("usernameInput")) {
        $("usernameInput").focus();
    }
}


function closeLoginModal() {

    if (!$("loginModal")) return;

    $("loginModal").classList.remove("show");
}


// =========================
// Login
// =========================

async function login() {

    const input =
        $("usernameInput");

    const message =
        $("loginMessage");

    if (!input) return;

    const username =
        input.value.trim();


    if (!username) {

        if (message) {
            message.textContent =
                "نام کاربری را وارد کنید.";
        }

        return;
    }


    if (message) {
        message.textContent =
            "در حال ورود...";
    }


    try {

        const data =
            await apiRequest(
                "/api/login",
                {
                    method: "POST",
                    body: JSON.stringify({
                        username
                    })
                }
            );


        if (!data.success) {

            if (message) {
                message.textContent =
                    data.message ||
                    "ورود انجام نشد.";
            }

            return;
        }


        currentUsername =
            data.username;

        localStorage.setItem(
            "mygapino_username",
            currentUsername
        );


        if (message) {
            message.textContent =
                "ورود موفق بود.";
        }


        closeLoginModal();

        await sendHeartbeat();

        await loadPlayers();

    } catch (error) {

        console.error(error);

        if (message) {
            message.textContent =
                "خطا در اتصال به سرور.";
        }
    }
}


// =========================
// Heartbeat
// =========================

async function sendHeartbeat() {

    if (!currentUsername) {
        return;
    }

    try {

        await apiRequest(
            "/api/heartbeat",
            {
                method: "POST",
                body: JSON.stringify({
                    username:
                        currentUsername
                })
            }
        );

        await loadPlayers();

    } catch (error) {

        console.error(
            "Heartbeat failed:",
            error
        );
    }
}


// =========================
// Logout
// =========================

async function logout() {

    if (!currentUsername) {
        return;
    }

    try {

        await apiRequest(
            "/api/logout",
            {
                method: "POST",
                body: JSON.stringify({
                    username:
                        currentUsername
                })
            }
        );

    } catch (error) {

        console.error(error);
    }


    currentUsername = "";

    localStorage.removeItem(
        "mygapino_username"
    );

    await loadPlayers();
}


// =========================
// Refresh
// =========================

async function refreshAll() {

    await Promise.all([
        loadServer(),
        loadPlayers()
    ]);
}


// =========================
// Events
// =========================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const loginButton =
            $("loginButton");

        if (loginButton) {
            loginButton.addEventListener(
                "click",
                openLoginModal
            );
        }


        const closeButton =
            $("closeModal");

        if (closeButton) {
            closeButton.addEventListener(
                "click",
                closeLoginModal
            );
        }


        const submitButton =
            $("submitLogin");

        if (submitButton) {
            submitButton.addEventListener(
                "click",
                login
            );
        }


        const refreshButton =
            $("refreshButton");

        if (refreshButton) {
            refreshButton.addEventListener(
                "click",
                refreshAll
            );
        }


        const input =
            $("usernameInput");

        if (input) {

            input.addEventListener(
                "keydown",
                (event) => {

                    if (event.key === "Enter") {
                        login();
                    }

                    if (event.key === "Escape") {
                        closeLoginModal();
                    }
                }
            );
        }


        const modal =
            $("loginModal");

        if (modal) {

            modal.addEventListener(
                "click",
                (event) => {

                    if (event.target === modal) {
                        closeLoginModal();
                    }
                }
            );
        }


        // بارگذاری اولیه
        refreshAll();


        // بررسی وضعیت سرور هر 10 ثانیه
        setInterval(
            loadServer,
            10000
        );


        // Heartbeat هر 10 ثانیه
        setInterval(
            sendHeartbeat,
            10000
        );
    }
);


// =========================
// خروج هنگام بستن صفحه
// =========================

window.addEventListener(
    "beforeunload",
    () => {

        if (!currentUsername) {
            return;
        }

        const blob =
            new Blob(
                [
                    JSON.stringify({
                        username:
                            currentUsername
                    })
                ],
                {
                    type:
                        "application/json"
                }
            );

        navigator.sendBeacon(
            "/api/logout",
            blob
        );
    }
);