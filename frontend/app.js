const API_URL = "";

let currentUsername =
    localStorage.getItem("mygapino_username") || "";

const $ = (id) => document.getElementById(id);


// =========================
// API
// =========================

async function apiRequest(url, options = {}) {

    const response = await fetch(
        API_URL + url,
        {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        }
    );

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

        const data =
            await apiRequest("/api/server");


        // نام سرور

        if ($("serverName")) {

            $("serverName").textContent =
                data.name ||
                "MyGapino My Summer Car";
        }


        // IP

        if ($("serverIP")) {

            $("serverIP").textContent =
                data.ip || "-";
        }


        // Port

        if ($("serverPort")) {

            $("serverPort").textContent =
                data.port || "-";
        }


        // Players

        if ($("playerCount")) {

            $("playerCount").textContent =
                data.players ?? 0;
        }


        // Max players

        if ($("maxPlayers")) {

            $("maxPlayers").textContent =
                data.max_players ?? 32;
        }


        // وضعیت واقعی سرور

        const online =
            data.status === "online";


        if ($("serverStatus")) {

            $("serverStatus").textContent =
                online
                    ? "آنلاین"
                    : "آفلاین";
        }


        if ($("serverStatusText")) {

            $("serverStatusText").textContent =
                online
                    ? "آنلاین"
                    : "آفلاین";
        }


        if ($("serverBadge")) {

            $("serverBadge").textContent =
                online
                    ? "ONLINE"
                    : "OFFLINE";

            $("serverBadge").classList.remove(
                "online",
                "offline"
            );

            $("serverBadge").classList.add(
                online
                    ? "online"
                    : "offline"
            );
        }


        // وضعیت دکمه ورود

        const joinButton =
            $("joinGameButton");

        if (joinButton) {

            if (online) {

                joinButton.disabled = false;

                joinButton.textContent =
                    "ورود به بازی";

            } else {

                joinButton.disabled = true;

                joinButton.textContent =
                    "سرور آفلاین است";
            }
        }


    } catch (error) {

        console.error(
            "Server request failed:",
            error
        );


        if ($("serverStatus")) {

            $("serverStatus").textContent =
                "خطا در اتصال";
        }


        if ($("serverStatusText")) {

            $("serverStatusText").textContent =
                "خطا در اتصال";
        }


        if ($("serverBadge")) {

            $("serverBadge").textContent =
                "ERROR";

            $("serverBadge").classList.remove(
                "online",
                "offline"
            );

            $("serverBadge").classList.add(
                "offline"
            );
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


        if ($("playersBadge")) {

            $("playersBadge").textContent =
                `${data.count ?? 0} بازیکن`;
        }


        if (!$("playersList")) {
            return;
        }


        $("playersList").innerHTML = "";


        if (
            !data.players ||
            data.players.length === 0
        ) {

            const empty =
                document.createElement("div");

            empty.className =
                "player-empty";

            empty.textContent =
                "فعلاً بازیکنی آنلاین نیست.";

            $("playersList").appendChild(
                empty
            );

            return;
        }


        data.players.forEach(
            (player) => {

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

                $("playersList").appendChild(
                    item
                );
            }
        );


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

    const modal =
        $("loginModal");

    if (!modal) {
        return;
    }

    modal.classList.add("show");


    if ($("usernameInput")) {

        $("usernameInput").focus();
    }
}


function closeLoginModal() {

    const modal =
        $("loginModal");

    if (!modal) {
        return;
    }

    modal.classList.remove("show");
}


// =========================
// Login
// =========================

async function login() {

    const input =
        $("usernameInput");

    const message =
        $("loginMessage");


    if (!input) {
        return;
    }


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
                        username: username
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
// Join Game
// =========================

async function joinGame() {

    try {

        const data =
            await apiRequest(
                "/api/server"
            );


        if (data.status !== "online") {

            alert(
                "سرور بازی در حال حاضر آفلاین است."
            );

            return;
        }


        if (!currentUsername) {

            openLoginModal();

            return;
        }


        await sendHeartbeat();


        /*
         * فعلاً پروتکل اتصال مستقیم
         * به بازی را نداریم.
         *
         * بنابراین فعلاً اطلاعات اتصال
         * سرور را نمایش می‌دهیم.
         */

        const address =
            `${data.ip}:${data.port}`;


        alert(
            `ورود به سرور آماده است.\n\n` +
            `نام کاربری: ${currentUsername}\n` +
            `سرور: ${data.name}\n` +
            `آدرس: ${address}`
        );


    } catch (error) {

        console.error(
            "Join game failed:",
            error
        );


        alert(
            "اتصال به سرور انجام نشد."
        );
    }
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


        // Header Login

        const loginButton =
            $("loginButton");

        if (loginButton) {

            loginButton.addEventListener(
                "click",
                openLoginModal
            );
        }


        // Hero Login

        const loginButtonHero =
            $("loginButtonHero");

        if (loginButtonHero) {

            loginButtonHero.addEventListener(
                "click",
                openLoginModal
            );
        }


        // Close Modal

        const closeButton =
            $("closeModal");

        if (closeButton) {

            closeButton.addEventListener(
                "click",
                closeLoginModal
            );
        }


        // Submit Login

        const submitButton =
            $("submitLogin");

        if (submitButton) {

            submitButton.addEventListener(
                "click",
                login
            );
        }


        // Server Join

        const joinButton =
            $("joinGameButton");

        if (joinButton) {

            joinButton.addEventListener(
                "click",
                joinGame
            );
        }


        // Server Refresh

        const refreshButton =
            $("refreshButton");

        if (refreshButton) {

            refreshButton.addEventListener(
                "click",
                refreshAll
            );
        }


        // Hero Refresh

        const refreshButtonHero =
            $("refreshButtonHero");

        if (refreshButtonHero) {

            refreshButtonHero.addEventListener(
                "click",
                refreshAll
            );
        }


        // Username input

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


        // Close modal by clicking outside

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


        // Initial load

        refreshAll();


        // Server status every 10 seconds

        setInterval(
            loadServer,
            10000
        );


        // Heartbeat every 10 seconds

        setInterval(
            sendHeartbeat,
            10000
        );

    }
);


// =========================
// Page close
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