// Admin Dashboard JavaScript
class AdminDashboard {
    constructor() {
        this.currentSection = "dashboard";
        this.currentEditId = null;
        this.apiBase = "/api";
        this.originalFileUrls = {}; // Track original file URLs for edit mode
        this.hasNewFiles = {}; // Track which files have been changed
        this.pendingModalAction = null; // Store pending modal action for URL routing

        // Check authentication first
        if (!this.checkAuth()) {
            return;
        }

        this.initializeEventListeners();
        this.initializeRouting();
        this.setupUserInfo();
    }

    // Check if user is authenticated
    checkAuth() {
        const accessToken = localStorage.getItem("admin_access_token");
        if (!accessToken) {
            this.redirectToLogin();
            return false;
        }
        return true;
    }

    // Redirect to login page
    redirectToLogin() {
        window.location.href = "/admin/auth";
    }

    // Get access token for API calls
    getAccessToken() {
        return localStorage.getItem("admin_access_token");
    }

    // Get user info
    getUserInfo() {
        const userStr = localStorage.getItem("admin_user");
        return userStr ? JSON.parse(userStr) : null;
    }

    // Setup user info display
    setupUserInfo() {
        const user = this.getUserInfo();
        if (user) {
            const userNameElement = document.getElementById("user-name");
            if (userNameElement) {
                userNameElement.textContent =
                    user.display_name || user.username;
            }

            // Update user info tooltip
            const userInfoElement = document.getElementById("user-info");
            if (userInfoElement) {
                userInfoElement.title = `Logged in as: ${user.email}`;
            }

            console.log("Logged in as:", user.username);
        }
    }

    // Handle API authentication
    async makeAuthenticatedRequest(url, options = {}) {
        const token = this.getAccessToken();
        if (!token) {
            this.redirectToLogin();
            throw new Error("No access token");
        }

        const authOptions = {
            ...options,
            headers: {
                ...options.headers,
                Authorization: `Bearer ${token}`,
            },
        };

        const response = await fetch(url, authOptions);

        // If token expired, try to refresh
        if (response.status === 401) {
            const refreshed = await this.refreshToken();
            if (refreshed) {
                // Retry with new token
                authOptions.headers[
                    "Authorization"
                ] = `Bearer ${this.getAccessToken()}`;
                return fetch(url, authOptions);
            } else {
                this.redirectToLogin();
                throw new Error("Authentication failed");
            }
        }

        return response;
    }

    // Refresh access token
    async refreshToken() {
        const refreshToken = localStorage.getItem("admin_refresh_token");
        if (!refreshToken) {
            return false;
        }

        try {
            const response = await fetch(`${this.apiBase}/auth/refresh-token`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${refreshToken}`,
                },
            });

            if (response.ok) {
                const result = await response.json();
                localStorage.setItem("admin_access_token", result.access_token);
                return true;
            }
        } catch (error) {
            console.error("Token refresh error:", error);
        }

        return false;
    }

    // Logout function with confirmation
    logout() {
        if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
            // Clear all stored data
            localStorage.removeItem("admin_access_token");
            localStorage.removeItem("admin_refresh_token");
            localStorage.removeItem("admin_user");

            // Show notification
            this.showNotification("Đăng xuất thành công!", "success");

            // Redirect after short delay
            setTimeout(() => {
                this.redirectToLogin();
            }, 1000);
        }
    }

    // Initialize all event listeners
    initializeEventListeners() {
        // Sidebar navigation
        document.querySelectorAll(".menu-item").forEach((item) => {
            item.addEventListener("click", (e) => {
                e.preventDefault();
                const section = e.currentTarget.dataset.section;
                this.navigateToSection(section);
            });
        });

        // Add new button
        document
            .getElementById("add-new-btn")
            .addEventListener("click", async () => {
                this.navigateToSection(this.currentSection, 'create');
            });

        // Modal controls
        document.querySelector(".modal-close").addEventListener("click", () => {
            this.closeModalAndNavigateBack();
        });

        document.getElementById("cancel-btn").addEventListener("click", () => {
            this.closeModalAndNavigateBack();
        });

        // Form submission
        document
            .getElementById("modal-form")
            .addEventListener("submit", (e) => {
                e.preventDefault();
                this.handleSubmit();
            });

        // Close modal on backdrop click
        document.getElementById("modal").addEventListener("click", (e) => {
            if (e.target.id === "modal") {
                this.closeModalAndNavigateBack();
            }
        });

        // Event delegation for edit and delete buttons
        document.addEventListener("click", (e) => {
            if (e.target.closest(".btn-edit")) {
                e.preventDefault();
                const button = e.target.closest(".btn-edit");
                const section = button.dataset.section;
                const id = button.dataset.id;
                console.log("Edit clicked:", section, id);
                this.navigateToSection(section, 'edit', id);
            }

            if (e.target.closest(".btn-delete")) {
                e.preventDefault();
                const button = e.target.closest(".btn-delete");
                const section = button.dataset.section;
                const id = button.dataset.id;
                console.log("Delete clicked:", section, id);
                this.deleteItem(section, id);
            }

            if (e.target.closest(".clear-file-btn")) {
                e.preventDefault();
                const button = e.target.closest(".clear-file-btn");
                const inputName = button.dataset.inputName;
                console.log("Clear file clicked:", inputName);
                this.clearFileSelection(inputName);
            }
        });

        // Logout button event listener
        document.getElementById("logout-btn").addEventListener("click", (e) => {
            e.preventDefault();
            this.logout();
        });
    }

    // Initialize URL-based routing
    initializeRouting() {
        // Handle browser back/forward buttons
        window.addEventListener('popstate', (e) => {
            const path = window.location.pathname;
            this.handleRoute(path, false); // false = don't push to history again
        });

        // Handle initial page load
        const currentPath = window.location.pathname;
        this.handleRoute(currentPath, false);
    }

    // Handle route changes
    handleRoute(path, pushToHistory = true) {
        console.log('Handling route:', path);
        
        // Parse the path
        const pathParts = path.split('/').filter(part => part !== '');
        
        // Default to dashboard if just /admin
        if (pathParts.length === 1 && pathParts[0] === 'admin') {
            this.switchSection('dashboard');
            return;
        }

        // Handle /admin/section routes
        if (pathParts.length >= 2 && pathParts[0] === 'admin') {
            const section = pathParts[1];
            const action = pathParts[2]; // create, edit
            const id = pathParts[3]; // for edit

            // Validate section
            const validSections = ['dashboard', 'users', 'artists', 'albums', 'tracks', 'playlists'];
            if (!validSections.includes(section)) {
                this.navigateToSection('dashboard');
                return;
            }

            // Store the pending modal action
            this.pendingModalAction = { action, id };

            this.switchSection(section);
        }
    }

    // Navigate to section with URL update
    navigateToSection(section, action = null, id = null) {
        let url = `/admin/${section}`;
        
        if (action === 'create') {
            url += '/create';
        } else if (action === 'edit' && id) {
            url += `/edit/${id}`;
        }

        // Update URL without page reload
        window.history.pushState({ section, action, id }, '', url);
        
        // Store the pending modal action if there's an action
        if (action) {
            this.pendingModalAction = { action, id };
        }
        
        // Switch to the section
        this.switchSection(section);
    }

    // Switch between sections
    switchSection(section) {
        const wasAlreadyInSection = this.currentSection === section;
        
        // Update sidebar active state
        document.querySelectorAll(".menu-item").forEach((item) => {
            item.classList.remove("active");
        });
        document
            .querySelector(`[data-section="${section}"]`)
            .classList.add("active");

        // Update content sections
        document.querySelectorAll(".content-section").forEach((section) => {
            section.classList.remove("active");
        });
        document.getElementById(`${section}-section`).classList.add("active");

        // Update page title and controls
        this.currentSection = section;
        this.updatePageTitle(section);
        this.updateHeaderControls(section);

        // Load section data only if we're switching to a different section
        // or if the section doesn't have data yet
        if (section !== "dashboard") {
            const tableBody = document.querySelector(`#${section}-table tbody`);
            const hasExistingData = tableBody && tableBody.innerHTML.trim() !== '';
            
            if (!wasAlreadyInSection || !hasExistingData) {
                this.loadSectionData(section);
            }
        } else if (!wasAlreadyInSection) {
            this.loadDashboard();
        }

        // Handle pending modal action after section load
        this.handlePendingModalAction();
    }

    // Handle pending modal action after section loads
    async handlePendingModalAction() {
        if (!this.pendingModalAction) return;

        const { action, id } = this.pendingModalAction;
        
        // Clear the pending action
        this.pendingModalAction = null;

        if (action === 'create') {
            // For create, we can open modal immediately for dashboard
            if (this.currentSection === 'dashboard') {
                await this.openModal('add');
            } else {
                // Check if we already have section data loaded
                const tableBody = document.querySelector(`#${this.currentSection}-table tbody`);
                const hasExistingData = tableBody && tableBody.innerHTML.trim() !== '';
                
                if (hasExistingData) {
                    // Data already loaded, open modal immediately
                    await this.openModal('add');
                } else {
                    // Wait for data to load
                    this.waitForSectionDataLoad().then(() => {
                        this.openModal('add');
                    });
                }
            }
        } else if (action === 'edit' && id) {
            // For edit, check if data is already loaded
            const tableBody = document.querySelector(`#${this.currentSection}-table tbody`);
            const hasExistingData = tableBody && tableBody.innerHTML.trim() !== '';
            
            if (hasExistingData) {
                // Data already loaded, open modal immediately
                await this.openModal('edit', id);
            } else {
                // Wait for data to load
                this.waitForSectionDataLoad().then(() => {
                    this.openModal('edit', id);
                });
            }
        }
    }

    // Wait for section data to load
    waitForSectionDataLoad() {
        return new Promise((resolve) => {
            if (this.currentSection === 'dashboard') {
                // Dashboard loads immediately
                resolve();
                return;
            }

            let attempts = 0;
            const maxAttempts = 50; // 2.5 seconds max wait
            
            const checkDataLoaded = () => {
                attempts++;
                const tableBody = document.querySelector(`#${this.currentSection}-table tbody`);
                const hasData = tableBody && tableBody.innerHTML.trim() !== '';
                
                if (hasData || attempts >= maxAttempts) {
                    console.log(`Section data loaded after ${attempts} attempts`);
                    resolve();
                } else {
                    setTimeout(checkDataLoaded, 50);
                }
            };
            
            // Start checking after a minimal delay
            setTimeout(checkDataLoaded, 100);
        });
    }

    // Update page title
    updatePageTitle(section) {
        const titles = {
            dashboard: "Dashboard",
            users: "Users Management",
            artists: "Artists Management",
            albums: "Albums Management",
            tracks: "Tracks Management",
            playlists: "Playlists Management",
        };
        document.getElementById("page-title").textContent = titles[section];
    }

    // Update header controls
    updateHeaderControls(section) {
        const addBtn = document.getElementById("add-new-btn");
        if (section === "dashboard") {
            addBtn.style.display = "none";
        } else {
            addBtn.style.display = "flex";
            addBtn.querySelector("span").textContent = `Add New ${section.slice(
                0,
                -1
            )}`;
        }
    }

    // Load dashboard stats
    async loadDashboard() {
        this.showLoading();
        try {
            const stats = await this.fetchData("stats");

            document.getElementById("total-users").textContent =
                stats.users || 0;
            document.getElementById("total-artists").textContent =
                stats.artists || 0;
            document.getElementById("total-albums").textContent =
                stats.albums || 0;
            document.getElementById("total-tracks").textContent =
                stats.tracks || 0;
            document.getElementById("total-playlists").textContent =
                stats.playlists || 0;
        } catch (error) {
            console.error("Error loading dashboard:", error);
            this.showNotification("Error loading dashboard data", "error");
        }
        this.hideLoading();
    }

    // Load section data
    async loadSectionData(section) {
        this.showLoading();
        try {
            const data = await this.fetchData(section);
            this.renderTable(section, data);
        } catch (error) {
            console.error(`Error loading ${section}:`, error);
            this.showNotification(`Error loading ${section} data`, "error");
        }
        this.hideLoading();
    }

    // Fetch data from API with authentication
    async fetchData(endpoint) {
        try {
            let url = `${this.apiBase}/${endpoint}`;

            // Special handling for some endpoints
            if (endpoint === "users") {
                url = `${this.apiBase}/admin/users`;
            } else if (endpoint === "playlists") {
                url = `${this.apiBase}/admin/playlists`;
            } else if (endpoint === "stats") {
                url = `${this.apiBase}/admin/stats`;
                const response = await this.makeAuthenticatedRequest(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const result = await response.json();
                return result.data;
            }

            const response = await this.makeAuthenticatedRequest(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return (
                result.data ||
                result.artists ||
                result.albums ||
                result.tracks ||
                result.playlists ||
                result
            );
        } catch (error) {
            console.error(`Error fetching ${endpoint}:`, error);
            return [];
        }
    }

    // Render table for a section
    renderTable(section, data) {
        const tableBody = document.querySelector(`#${section}-table tbody`);
        if (!tableBody) return;

        tableBody.innerHTML = "";

        if (!data || data.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="100%" class="text-center text-muted">No ${section} found</td>
                </tr>
            `;
            return;
        }

        data.forEach((item) => {
            const row = this.createTableRow(section, item);
            tableBody.appendChild(row);
        });
    }

    // Create table row for an item
    createTableRow(section, item) {
        const row = document.createElement("tr");

        switch (section) {
            case "users":
                row.innerHTML = this.createUserRow(item);
                break;
            case "artists":
                row.innerHTML = this.createArtistRow(item);
                break;
            case "albums":
                row.innerHTML = this.createAlbumRow(item);
                break;
            case "tracks":
                row.innerHTML = this.createTrackRow(item);
                break;
            case "playlists":
                row.innerHTML = this.createPlaylistRow(item);
                break;
        }

        return row;
    }

    // Create user table row
    createUserRow(user) {
        return `
            <td>
                <img src="${
                    user.avatar_url || "/static/admin/default-avatar.svg"
                }" 
                     alt="${user.display_name}" 
                     onerror="this.src='/static/admin/default-avatar.svg'">
            </td>
            <td>${user.email}</td>
            <td>${user.username}</td>
            <td>${user.display_name || "-"}</td>
            <td>${new Date(user.created_at).toLocaleDateString()}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-edit btn-sm" data-section="users" data-id="${
                        user.id
                    }" title="Edit User">
                        <i class="fas fa-edit"></i>
                        <span class="btn-text">Edit</span>
                    </button>
                    <button class="btn btn-danger btn-sm btn-delete" data-section="users" data-id="${
                        user.id
                    }" title="Delete User">
                        <i class="fas fa-trash"></i>
                        <span class="btn-text">Delete</span>
                    </button>
                </div>
            </td>
        `;
    }

    // Create artist table row
    createArtistRow(artist) {
        return `
            <td>
                <img src="${
                    artist.image_url || "/static/admin/default-artist.svg"
                }" 
                     alt="${artist.name}" 
                     onerror="this.src='/static/admin/default-artist.svg'">
            </td>
            <td>${artist.name}</td>
            <td>${(artist.monthly_listeners || 0).toLocaleString()}</td>
            <td>
                <span class="badge ${
                    artist.is_verified ? "badge-success" : "badge-danger"
                }">
                    ${artist.is_verified ? "Verified" : "Not Verified"}
                </span>
            </td>
            <td>${new Date(artist.created_at).toLocaleDateString()}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-edit btn-sm" data-section="artists" data-id="${
                        artist.id
                    }" title="Edit Artist">
                        <i class="fas fa-edit"></i>
                        <span class="btn-text">Edit</span>
                    </button>
                    <button class="btn btn-danger btn-sm btn-delete" data-section="artists" data-id="${
                        artist.id
                    }" title="Delete Artist">
                        <i class="fas fa-trash"></i>
                        <span class="btn-text">Delete</span>
                    </button>
                </div>
            </td>
        `;
    }

    // Create album table row
    createAlbumRow(album) {
        return `
            <td>
                <img src="${
                    album.cover_image_url || "/static/admin/default-album.svg"
                }" 
                     alt="${album.title}" 
                     class="album-cover"
                     onerror="this.src='/static/admin/default-album.svg'">
            </td>
            <td>${album.title}</td>
            <td>${album.artist_name || "-"}</td>
            <td>${new Date(album.release_date).toLocaleDateString()}</td>
            <td>${album.total_tracks || 0}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-edit btn-sm" data-section="albums" data-id="${
                        album.id
                    }" title="Edit Album">
                        <i class="fas fa-edit"></i>
                        <span class="btn-text">Edit</span>
                    </button>
                    <button class="btn btn-danger btn-sm btn-delete" data-section="albums" data-id="${
                        album.id
                    }" title="Delete Album">
                        <i class="fas fa-trash"></i>
                        <span class="btn-text">Delete</span>
                    </button>
                </div>
            </td>
        `;
    }

    // Create track table row
    createTrackRow(track) {
        const duration = this.formatDuration(track.duration);
        return `
            <td>
                <img src="${
                    track.image_url ||
                    track.album_cover_image_url ||
                    "/static/admin/default-track.svg"
                }" 
                     alt="${track.title}" 
                     class="track-image"
                     onerror="this.src='/static/admin/default-track.svg'">
            </td>
            <td>${track.title}</td>
            <td>${track.artist_name || "-"}</td>
            <td>${track.album_title || "-"}</td>
            <td>${duration}</td>
            <td>${(track.play_count || 0).toLocaleString()}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-edit btn-sm" data-section="tracks" data-id="${
                        track.id
                    }" title="Edit Track">
                        <i class="fas fa-edit"></i>
                        <span class="btn-text">Edit</span>
                    </button>
                    <button class="btn btn-danger btn-sm btn-delete" data-section="tracks" data-id="${
                        track.id
                    }" title="Delete Track">
                        <i class="fas fa-trash"></i>
                        <span class="btn-text">Delete</span>
                    </button>
                </div>
            </td>
        `;
    }

    // Create playlist table row
    createPlaylistRow(playlist) {
        const currentUser = this.getUserInfo();
        const isOwner = currentUser && playlist.user_id === currentUser.id;
        
        // Only show edit/delete buttons if current user is the owner
        const actionButtons = isOwner ? `
            <button class="btn btn-edit btn-sm" data-section="playlists" data-id="${
                playlist.id
            }" title="Edit Playlist">
                <i class="fas fa-edit"></i>
                <span class="btn-text">Edit</span>
            </button>
            <button class="btn btn-danger btn-sm btn-delete" data-section="playlists" data-id="${
                playlist.id
            }" title="Delete Playlist">
                <i class="fas fa-trash"></i>
                <span class="btn-text">Delete</span>
            </button>
        ` : `
            <span class="text-muted" style="font-size: 0.8rem;">Not Owner</span>
        `;

        return `
            <td>
                <img src="${
                    playlist.image_url || "/static/admin/default-playlist.svg"
                }" 
                     alt="${playlist.name}" 
                     onerror="this.src='/static/admin/default-playlist.svg'">
            </td>
            <td>${playlist.name}</td>
            <td>${playlist.user_username || "-"}</td>
            <td>
                <span class="badge ${
                    playlist.is_public ? "badge-success" : "badge-danger"
                }">
                    ${playlist.is_public ? "Public" : "Private"}
                </span>
            </td>
            <td>${playlist.total_tracks || 0}</td>
            <td>${new Date(playlist.created_at).toLocaleDateString()}</td>
            <td>
                <div class="action-buttons">
                    ${actionButtons}
                </div>
            </td>
        `;
    }

    // Open modal for add/edit
    async openModal(mode, itemId = null) {
        console.log("openModal called:", mode, itemId, this.currentSection);
        this.currentEditId = itemId;
        const modal = document.getElementById("modal");
        const title = document.getElementById("modal-title");
        const formFields = document.getElementById("form-fields");

        title.textContent =
            mode === "add"
                ? `Add New ${this.currentSection.slice(0, -1)}`
                : `Edit ${this.currentSection.slice(0, -1)}`;

        formFields.innerHTML = this.generateFormFields(
            this.currentSection,
            mode
        );

        // Load select options first
        await this.loadSelectOptions();

        // Add file input change listeners
        this.setupFileInputs();

        if (mode === "edit" && itemId) {
            await this.populateForm(itemId);
        } else {
            // Reset file tracking for add mode
            this.originalFileUrls = {};
            this.hasNewFiles = {};
        }

        modal.classList.add("show");
        console.log("Modal should be visible now");
    }

    // Close modal
    closeModal() {
        console.log("Closing modal");
        const modal = document.getElementById("modal");
        modal.classList.remove("show");
        this.currentEditId = null;

        // Clear form
        const form = document.getElementById("modal-form");
        if (form) {
            form.reset();
        }

        // Reset file tracking
        this.originalFileUrls = {};
        this.hasNewFiles = {};

        // Clear all file previews
        const previews = document.querySelectorAll('[id$="_preview"]');
        previews.forEach((preview) => {
            preview.innerHTML = "";
        });
    }

    // Close modal and navigate back to section list
    closeModalAndNavigateBack() {
        this.closeModal();
        // Clear any pending modal action
        this.pendingModalAction = null;
        this.navigateToSection(this.currentSection);
    }

    // Generate form fields for a section
    generateFormFields(section, mode = "add") {
        const fields = this.getFieldsConfig(section);
        return fields
            .map((field) => {
                // Make audio file optional for edit mode (since existing tracks already have audio)
                if (
                    field.type === "file" &&
                    field.name === "audio_file" &&
                    mode === "edit"
                ) {
                    field = { ...field, required: false };
                }
                
                // Make password optional for edit mode (admin doesn't change passwords)
                if (
                    field.type === "password" &&
                    field.name === "password" &&
                    mode === "edit"
                ) {
                    field = { ...field, required: false };
                }

                if (field.type === "select") {
                    return this.createSelectField(field);
                } else if (field.type === "checkbox") {
                    return this.createCheckboxField(field);
                } else if (field.type === "textarea") {
                    return this.createTextareaField(field);
                } else {
                    return this.createInputField(field);
                }
            })
            .join("");
    }

    // Get fields configuration for each section
    getFieldsConfig(section) {
        const configs = {
            users: [
                {
                    name: "email",
                    label: "Email",
                    type: "email",
                    required: true,
                },
                {
                    name: "username",
                    label: "Username",
                    type: "text",
                    required: false,  // Username is optional in API
                },
                {
                    name: "password",
                    label: "Password",
                    type: "password",
                    required: true,  // Required for creating new users
                },
                { name: "display_name", label: "Display Name", type: "text" },
                {
                    name: "avatar_file",
                    label: "Avatar Image",
                    type: "file",
                    accept: "image/*",
                },
            ],
            artists: [
                { name: "name", label: "Name", type: "text", required: true },
                { name: "bio", label: "Bio", type: "textarea" },
                {
                    name: "image_file",
                    label: "Artist Image",
                    type: "file",
                    accept: "image/*",
                },
                {
                    name: "background_file",
                    label: "Background Image",
                    type: "file",
                    accept: "image/*",
                },
                {
                    name: "monthly_listeners",
                    label: "Monthly Listeners",
                    type: "number",
                },
                {
                    name: "is_verified",
                    label: "Verified Artist",
                    type: "checkbox",
                },
            ],
            albums: [
                { name: "title", label: "Title", type: "text", required: true },
                { name: "description", label: "Description", type: "textarea" },
                {
                    name: "cover_file",
                    label: "Cover Image",
                    type: "file",
                    accept: "image/*",
                },
                {
                    name: "release_date",
                    label: "Release Date",
                    type: "date",
                    required: true,
                },
                {
                    name: "artist_id",
                    label: "Artist",
                    type: "select",
                    required: true,
                    options: "artists",
                },
            ],
            tracks: [
                { name: "title", label: "Title", type: "text", required: true },
                {
                    name: "audio_file",
                    label: "Audio File",
                    type: "file",
                    accept: "audio/*",
                    required: true,
                },
                {
                    name: "image_file",
                    label: "Track Image",
                    type: "file",
                    accept: "image/*",
                },
                {
                    name: "artist_id",
                    label: "Artist",
                    type: "select",
                    required: true,
                    options: "artists",
                },
                {
                    name: "album_id",
                    label: "Album",
                    type: "select",
                    options: "albums",
                },
            ],
            playlists: [
                { name: "name", label: "Name", type: "text", required: true },
                { name: "description", label: "Description", type: "textarea" },
                {
                    name: "cover_file",
                    label: "Cover Image",
                    type: "file",
                    accept: "image/*",
                },
                {
                    name: "is_public",
                    label: "Public Playlist",
                    type: "checkbox",
                },
            ],
        };
        return configs[section] || [];
    }

    // Create input field HTML
    createInputField(field) {
        if (field.type === "file") {
            return `
                <div class="form-group">
                    <label for="${field.name}">${field.label}${
                field.required ? " *" : ""
            }</label>
                    <input 
                        type="file" 
                        id="${field.name}" 
                        name="${field.name}" 
                        class="form-control"
                        accept="${field.accept || "*"}"
                        ${field.required ? "required" : ""}
                    />
                    <div class="file-preview" id="${
                        field.name
                    }_preview" style="margin-top: 10px;"></div>
                </div>
            `;
        }

        return `
            <div class="form-group">
                <label for="${field.name}">${field.label}${
            field.required ? " *" : ""
        }</label>
                <input 
                    type="${field.type}" 
                    id="${field.name}" 
                    name="${field.name}" 
                    class="form-control"
                    ${field.required ? "required" : ""}
                />
            </div>
        `;
    }

    // Create textarea field HTML
    createTextareaField(field) {
        return `
            <div class="form-group">
                <label for="${field.name}">${field.label}${
            field.required ? " *" : ""
        }</label>
                <textarea 
                    id="${field.name}" 
                    name="${field.name}" 
                    class="form-control"
                    rows="3"
                    ${field.required ? "required" : ""}
                ></textarea>
            </div>
        `;
    }

    // Create checkbox field HTML
    createCheckboxField(field) {
        return `
            <div class="form-group">
                <label>
                    <input 
                        type="checkbox" 
                        id="${field.name}" 
                        name="${field.name}"
                    />
                    ${field.label}
                </label>
            </div>
        `;
    }

    // Create select field HTML
    createSelectField(field) {
        return `
            <div class="form-group">
                <label for="${field.name}">${field.label}${
            field.required ? " *" : ""
        }</label>
                <select 
                    id="${field.name}" 
                    name="${field.name}" 
                    class="form-control"
                    data-options="${field.options}"
                    ${field.required ? "required" : ""}
                >
                    <option value="">Select ${field.label}</option>
                </select>
            </div>
        `;
    }

    // Format duration from seconds to MM:SS
    formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    }



    // Populate form with existing data
    async populateForm(id) {
        try {
            let url = `${this.apiBase}/${this.currentSection}/${id}`;
            if (this.currentSection === "users") {
                url = `${this.apiBase}/admin/users/${id}`;
            }

            const response = await this.makeAuthenticatedRequest(url);
            if (!response.ok) {
                throw new Error("Failed to fetch item data");
            }

            const result = await response.json();
            const data = result.data || result;

            // Reset file tracking for edit mode
            this.originalFileUrls = {};
            this.hasNewFiles = {};

            // Populate form fields
            Object.keys(data).forEach((key) => {
                const field = document.getElementById(key);
                if (field) {
                    if (field.type === "checkbox") {
                        field.checked = data[key];
                    } else if (field.type === "date" && data[key]) {
                        field.value = data[key].split("T")[0]; // Format date for input
                    } else {
                        field.value = data[key] || "";
                    }
                }
            });

            // Hide password field for user edit (admin doesn't change existing passwords)
            if (this.currentSection === "users") {
                const passwordField = document.getElementById("password");
                if (passwordField) {
                    const passwordGroup = passwordField.closest('.form-group');
                    if (passwordGroup) {
                        passwordGroup.style.display = 'none';
                    }
                }
            }

            // Handle file URL fields - show existing file previews
            const fileUrlMapping = {
                avatar_url: "avatar_file",
                image_url:
                    this.currentSection === "playlists"
                        ? "cover_file"
                        : "image_file",
                background_image_url: "background_file",
                cover_image_url: "cover_file",
                audio_url: "audio_file",
            };

            Object.keys(fileUrlMapping).forEach((urlField) => {
                const fileInputName = fileUrlMapping[urlField];
                const fileUrl = data[urlField];

                if (fileUrl) {
                    // Store original URL
                    this.originalFileUrls[fileInputName] = fileUrl;
                    this.hasNewFiles[fileInputName] = false;

                    // Show existing file preview
                    this.showExistingFilePreview(fileInputName, fileUrl);
                }
            });

            // Handle select fields by loading options first
            await this.loadSelectOptions();

            // Set select field values after options are loaded
            // Handle artist_id first, then album_id for dependency
            if (data.artist_id) {
                const artistField = document.getElementById("artist_id");
                if (artistField) {
                    artistField.value = data.artist_id;
                    // Update album options based on selected artist
                    await this.updateAlbumOptions(data.artist_id);
                }
            }

            // Then set other select values including album_id
            Object.keys(data).forEach((key) => {
                const field = document.getElementById(key);
                if (field && field.tagName === "SELECT") {
                    field.value = data[key] || "";
                }
            });
        } catch (error) {
            console.error("Error populating form:", error);
            this.showNotification("Error loading item data", "error");
        }
    }

    // Load options for select fields
    async loadSelectOptions() {
        const selects = document.querySelectorAll("select[data-options]");
        for (const select of selects) {
            const optionsType = select.dataset.options;
            if (optionsType === "artists") {
                const artists = await this.fetchData("artists");
                select.innerHTML = '<option value="">Select Artist</option>';
                artists.forEach((artist) => {
                    const option = document.createElement("option");
                    option.value = artist.id;
                    option.textContent = artist.name;
                    select.appendChild(option);
                });

                // Add change listener for artist select to update album options
                if (select.id === "artist_id") {
                    select.addEventListener("change", () => {
                        this.updateAlbumOptions(select.value);
                    });
                }
            } else if (optionsType === "albums") {
                // Load all albums initially, will be filtered by artist
                const albums = await this.fetchData("albums");
                this.allAlbums = albums; // Store for filtering
                this.updateAlbumOptions(null); // Initial load with no filter
            }
        }
    }

    // Update album options based on selected artist
    async updateAlbumOptions(artistId) {
        const albumSelect = document.getElementById("album_id");
        if (!albumSelect) return;

        // Ensure we have albums data
        if (!this.allAlbums) {
            this.allAlbums = await this.fetchData("albums");
        }

        albumSelect.innerHTML = '<option value="">Select Album</option>';

        // Filter albums by artist if artistId is provided
        const filteredAlbums = artistId
            ? this.allAlbums.filter((album) => album.artist_id === artistId)
            : this.allAlbums;

        filteredAlbums.forEach((album) => {
            const option = document.createElement("option");
            option.value = album.id;
            option.textContent = `${album.title}${
                album.artist_name ? ` - ${album.artist_name}` : ""
            }`;
            albumSelect.appendChild(option);
        });
    }

    // Setup file input change listeners and preview
    setupFileInputs() {
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach((input) => {
            input.addEventListener("change", (e) => {
                this.previewFile(e.target);
            });
        });
    }

    // Show existing file preview from URL
    showExistingFilePreview(inputName, fileUrl) {
        const preview = document.getElementById(`${inputName}_preview`);
        if (!preview) return;

        // Convert relative path to full URL if needed
        const fullUrl = this.convertToFullUrl(fileUrl);

        if (this.isImageFile(fileUrl)) {
            preview.innerHTML = `
                <div class="existing-file-preview">
                    <img src="${fullUrl}" 
                         style="max-width: 100px; max-height: 100px; border-radius: 5px; border: 1px solid #ddd;" 
                         alt="Current file" onerror="this.style.display='none'">
                    <p style="margin-top: 5px; font-size: 0.8rem; color: #666;">
                        <i class="fas fa-image" style="margin-right: 5px;"></i>
                        Current image
                    </p>
                    <button type="button" class="btn btn-sm btn-outline clear-file-btn" data-input-name="${inputName}"
                            style="margin-top: 5px; padding: 2px 8px; font-size: 0.7rem;">
                        <i class="fas fa-times"></i> Change
                    </button>
                </div>
            `;
        } else if (this.isAudioFile(fileUrl)) {
            preview.innerHTML = `
                <div class="existing-file-preview" style="padding: 10px; background: #f5f5f5; border-radius: 5px; border: 1px solid #ddd;">
                    <p style="margin: 0 0 5px 0; font-size: 0.8rem; color: #666;">
                        <i class="fas fa-music" style="margin-right: 5px;"></i>
                        Current audio file
                    </p>
                    <audio controls style="width: 100%; margin-bottom: 5px;">
                        <source src="${fullUrl}" type="audio/mpeg">
                        Your browser does not support the audio element.
                    </audio>
                    <button type="button" class="btn btn-sm btn-outline" class="clear-file-btn" data-input-name="${inputName}" 
                            style="padding: 2px 8px; font-size: 0.7rem;">
                        <i class="fas fa-times"></i> Change
                    </button>
                </div>
            `;
        } else {
            preview.innerHTML = `
                <div class="existing-file-preview" style="padding: 10px; background: #f5f5f5; border-radius: 5px; border: 1px solid #ddd;">
                    <p style="margin: 0 0 5px 0; font-size: 0.8rem; color: #666;">
                        <i class="fas fa-file" style="margin-right: 5px;"></i>
                        Current file
                    </p>
                    <button type="button" class="btn btn-sm btn-outline" class="clear-file-btn" data-input-name="${inputName}" 
                            style="padding: 2px 8px; font-size: 0.7rem;">
                        <i class="fas fa-times"></i> Change
                    </button>
                </div>
            `;
        }
    }

    // Preview uploaded file
    previewFile(input) {
        const file = input.files[0];
        const preview = document.getElementById(`${input.name}_preview`);

        if (!file || !preview) return;

        // Mark as having new file
        this.hasNewFiles[input.name] = true;

        if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.innerHTML = `
                    <div class="new-file-preview">
                        <img src="${e.target.result}" 
                             style="max-width: 100px; max-height: 100px; border-radius: 5px; border: 1px solid #ddd;" 
                             alt="New file preview">
                        <p style="margin-top: 5px; font-size: 0.8rem; color: #666;">
                            <i class="fas fa-upload" style="margin-right: 5px; color: #1DB954;"></i>
                            New: ${file.name}
                        </p>
                        <button type="button" class="btn btn-sm btn-outline" class="clear-file-btn" data-input-name="${input.name}" 
                                style="margin-top: 5px; padding: 2px 8px; font-size: 0.7rem;">
                            <i class="fas fa-undo"></i> Revert
                        </button>
                    </div>
                `;
            };
            reader.readAsDataURL(file);
        } else if (file.type.startsWith("audio/")) {
            preview.innerHTML = `
                <div class="new-file-preview" style="padding: 10px; background: #f0f8ff; border-radius: 5px; border: 1px solid #1DB954;">
                    <p style="margin: 0 0 5px 0; font-size: 0.8rem; color: #666;">
                        <i class="fas fa-upload" style="margin-right: 5px; color: #1DB954;"></i>
                        New: ${file.name}
                    </p>
                    <audio controls style="width: 100%; margin-bottom: 5px;">
                        <source src="${URL.createObjectURL(file)}" type="${
                file.type
            }">
                    </audio>
                    <button type="button" class="btn btn-sm btn-outline" onclick="adminDashboard.clearFileSelection('${
                        input.name
                    }')" 
                            style="padding: 2px 8px; font-size: 0.7rem;">
                        <i class="fas fa-undo"></i> Revert
                    </button>
                </div>
            `;
        } else {
            preview.innerHTML = `
                <div class="new-file-preview" style="padding: 10px; background: #f0f8ff; border-radius: 5px; border: 1px solid #1DB954;">
                    <p style="margin: 0; font-size: 0.8rem; color: #666;">
                        <i class="fas fa-upload" style="margin-right: 5px; color: #1DB954;"></i>
                        New: ${file.name}
                    </p>
                    <button type="button" class="btn btn-sm btn-outline" class="clear-file-btn" data-input-name="${input.name}" 
                            style="margin-top: 5px; padding: 2px 8px; font-size: 0.7rem;">
                        <i class="fas fa-undo"></i> Revert
                    </button>
                </div>
            `;
        }
    }

    // Utility functions for file handling
    convertToFullUrl(url) {
        if (!url) return "";
        if (url.startsWith("http://") || url.startsWith("https://")) {
            return url;
        }
        // Handle relative URLs
        const baseUrl = window.location.origin;
        return url.startsWith("/") ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
    }

    isImageFile(url) {
        if (!url) return false;
        const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i;
        return imageExtensions.test(url);
    }

    isAudioFile(url) {
        if (!url) return false;
        const audioExtensions = /\.(mp3|wav|flac|m4a|aac|ogg)$/i;
        return audioExtensions.test(url);
    }

    // Clear file selection and revert to original file
    clearFileSelection(inputName) {
        const fileInput = document.getElementById(inputName);
        const preview = document.getElementById(`${inputName}_preview`);

        if (fileInput) {
            fileInput.value = ""; // Clear the file input
        }

        this.hasNewFiles[inputName] = false;

        // Show original file preview if exists
        if (this.originalFileUrls[inputName]) {
            this.showExistingFilePreview(
                inputName,
                this.originalFileUrls[inputName]
            );
        } else {
            // No original file, clear preview
            if (preview) {
                preview.innerHTML = "";
            }
        }
    }

    // Upload file to server with authentication
    async uploadFile(file, type = "image", fieldName = null) {
        const formData = new FormData();

        // Determine the correct endpoint and field name based on type and field
        let endpoint;
        let fieldKey;
        let needsResourceId = false;

        if (fieldName === "avatar_file" || type === "avatar") {
            // Use avatar upload endpoint for user avatars
            endpoint = `${this.apiBase}/upload/avatar`;
            fieldKey = "avatar";
        } else if (
            fieldName === "image_file" &&
            this.currentSection === "artists"
        ) {
            // Artist image upload - needs artist ID
            endpoint = `${this.apiBase}/upload/artist/{resourceId}/image`;
            fieldKey = "image";
            needsResourceId = true;
        } else if (
            fieldName === "background_file" &&
            this.currentSection === "artists"
        ) {
            // Artist background image upload - needs artist ID
            endpoint = `${this.apiBase}/upload/artist/{resourceId}/background`;
            fieldKey = "background";
            needsResourceId = true;
        } else if (
            fieldName === "cover_file" &&
            this.currentSection === "albums"
        ) {
            // Album cover upload - needs album ID
            endpoint = `${this.apiBase}/upload/album/{resourceId}/cover`;
            fieldKey = "cover";
            needsResourceId = true;
        } else if (
            fieldName === "cover_file" &&
            this.currentSection === "playlists"
        ) {
            // Playlist cover upload - needs playlist ID
            endpoint = `${this.apiBase}/upload/playlist/{resourceId}/cover`;
            fieldKey = "cover";
            needsResourceId = true;
        } else if (
            fieldName === "audio_file" &&
            this.currentSection === "tracks"
        ) {
            // Track audio upload - needs track ID
            endpoint = `${this.apiBase}/upload/track/{resourceId}/audio`;
            fieldKey = "audio";
            needsResourceId = true;
        } else if (
            fieldName === "image_file" &&
            this.currentSection === "tracks"
        ) {
            // Track image upload - needs track ID
            endpoint = `${this.apiBase}/upload/track/{resourceId}/image`;
            fieldKey = "image";
            needsResourceId = true;
        } else {
            // Use generic images endpoint for other images (fallback)
            endpoint = `${this.apiBase}/upload/images`;
            fieldKey = "images";
        }

        // For resource-specific uploads, we need to handle this differently
        // if the resource doesn't exist yet (create mode)
        if (needsResourceId && !this.currentEditId) {
            // Fall back to generic upload for new resources
            endpoint = `${this.apiBase}/upload/images`;
            fieldKey = "images";
        } else if (needsResourceId && this.currentEditId) {
            // Replace placeholder with actual ID
            endpoint = endpoint.replace("{resourceId}", this.currentEditId);
        }

        formData.append(fieldKey, file);

        try {
            const response = await this.makeAuthenticatedRequest(endpoint, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || "Upload failed");
            }

            const result = await response.json();
            console.log("Upload result:", result);

            // Handle different response structures
            if (
                fieldKey === "avatar" ||
                fieldKey === "image" ||
                fieldKey === "cover" ||
                fieldKey === "background" ||
                fieldKey === "audio"
            ) {
                // Specific resource upload response: { file: { url, filename, size } }
                return result.file?.url || result.file?.filename;
            } else {
                // Generic images upload response: { data: [{ url, filename }] }
                if (
                    result.data &&
                    Array.isArray(result.data) &&
                    result.data.length > 0
                ) {
                    return result.data[0].url || result.data[0].filename;
                }
                return (
                    result.data?.url ||
                    result.file?.url ||
                    result.url ||
                    result.filename
                );
            }
        } catch (error) {
            console.error("Error uploading file:", error);
            throw error;
        }
    }

    // Handle album creation with cover image upload
    async handleAlbumCreation(form, formData, data) {
        try {
            // Step 1: Prepare album data (without cover image)
            const albumData = {};

            // Handle form fields (excluding file inputs)
            for (const [key, value] of formData.entries()) {
                if (!key.endsWith("_file") && value !== "") {
                    albumData[key] = value;
                }
            }

            // Handle checkboxes
            const checkboxes = form.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach((checkbox) => {
                albumData[checkbox.name] = checkbox.checked;
            });

            console.log("Creating album with data:", albumData);

            // Step 2: Create album first
            const createResponse = await this.makeAuthenticatedRequest(
                `${this.apiBase}/albums`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(albumData),
                }
            );

            if (!createResponse.ok) {
                const errorData = await createResponse.json();
                throw new Error(
                    errorData.error?.message || "Failed to create album"
                );
            }

            const createResult = await createResponse.json();
            const albumId = createResult.album.id;
            console.log("Album created successfully with ID:", albumId);

            // Step 3: Upload cover image if provided
            const coverFileInput = form.querySelector(
                'input[name="cover_file"]'
            );
            if (
                coverFileInput &&
                coverFileInput.files &&
                coverFileInput.files[0]
            ) {
                const coverFile = coverFileInput.files[0];
                console.log("Uploading cover image for album:", albumId);

                try {
                    // Upload cover image using album-specific endpoint
                    const formData = new FormData();
                    formData.append("cover", coverFile);

                    const uploadResponse = await this.makeAuthenticatedRequest(
                        `${this.apiBase}/upload/album/${albumId}/cover`,
                        {
                            method: "POST",
                            body: formData,
                        }
                    );

                    if (!uploadResponse.ok) {
                        const errorData = await uploadResponse.json();
                        console.warn("Cover image upload failed:", errorData);
                        // Don't fail the entire operation, just log the warning
                    } else {
                        const uploadResult = await uploadResponse.json();
                        console.log(
                            "Cover image uploaded successfully:",
                            uploadResult
                        );
                    }
                } catch (uploadError) {
                    console.error("Error uploading cover image:", uploadError);
                    // Don't fail the entire operation, just log the error
                }
            }

            // Step 4: Show success and refresh
            this.showNotification("Album created successfully!", "success");
            this.closeModalAndNavigateBack();
            this.loadSectionData(this.currentSection);
        } catch (error) {
            console.error("Error in album creation:", error);
            this.showNotification(error.message, "error");
            this.hideLoading();
        }
    }

    // Handle track creation with audio/image files upload
    async handleTrackCreation(form, formData, data) {
        try {
            // Step 1: Prepare track data (without audio/image files)
            const trackData = {};

            // Handle form fields (excluding file inputs)
            for (const [key, value] of formData.entries()) {
                if (!key.endsWith("_file") && value !== "") {
                    trackData[key] = value;
                }
            }

            // Handle checkboxes
            const checkboxes = form.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach((checkbox) => {
                trackData[checkbox.name] = checkbox.checked;
            });

            console.log("Creating track with data:", trackData);

            // Step 2: Create track first
            const createResponse = await this.makeAuthenticatedRequest(
                `${this.apiBase}/tracks`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(trackData),
                }
            );

            if (!createResponse.ok) {
                const errorData = await createResponse.json();
                throw new Error(
                    errorData.error?.message || "Failed to create track"
                );
            }

            const createResult = await createResponse.json();
            const trackId = createResult.track.id;
            console.log("Track created successfully with ID:", trackId);

            // Step 3: Upload audio file if provided
            const audioFileInput = form.querySelector(
                'input[name="audio_file"]'
            );
            if (
                audioFileInput &&
                audioFileInput.files &&
                audioFileInput.files[0]
            ) {
                const audioFile = audioFileInput.files[0];
                console.log("Uploading audio file for track:", trackId);

                try {
                    // Upload audio file using track-specific endpoint
                    const formData = new FormData();
                    formData.append("audio", audioFile);

                    const uploadResponse = await this.makeAuthenticatedRequest(
                        `${this.apiBase}/upload/track/${trackId}/audio`,
                        {
                            method: "POST",
                            body: formData,
                        }
                    );

                    if (!uploadResponse.ok) {
                        const errorData = await uploadResponse.json();
                        console.warn("Audio file upload failed:", errorData);
                        // Don't fail the entire operation, just log the warning
                    } else {
                        const uploadResult = await uploadResponse.json();
                        console.log(
                            "Audio file uploaded successfully:",
                            uploadResult
                        );
                    }
                } catch (uploadError) {
                    console.error("Error uploading audio file:", uploadError);
                    // Don't fail the entire operation, just log the error
                }
            }

            // Step 4: Upload image file if provided
            const imageFileInput = form.querySelector(
                'input[name="image_file"]'
            );
            if (
                imageFileInput &&
                imageFileInput.files &&
                imageFileInput.files[0]
            ) {
                const imageFile = imageFileInput.files[0];
                console.log("Uploading image file for track:", trackId);

                try {
                    // Upload image file using track-specific endpoint
                    const formData = new FormData();
                    formData.append("image", imageFile);

                    const uploadResponse = await this.makeAuthenticatedRequest(
                        `${this.apiBase}/upload/track/${trackId}/image`,
                        {
                            method: "POST",
                            body: formData,
                        }
                    );

                    if (!uploadResponse.ok) {
                        const errorData = await uploadResponse.json();
                        console.warn("Image file upload failed:", errorData);
                        // Don't fail the entire operation, just log the warning
                    } else {
                        const uploadResult = await uploadResponse.json();
                        console.log(
                            "Image file uploaded successfully:",
                            uploadResult
                        );
                    }
                } catch (uploadError) {
                    console.error("Error uploading image file:", uploadError);
                    // Don't fail the entire operation, just log the error
                }
            }

            // Step 5: Show success and refresh
            this.showNotification("Track created successfully!", "success");
            this.closeModalAndNavigateBack();
            this.loadSectionData(this.currentSection);
        } catch (error) {
            console.error("Error in track creation:", error);
            this.showNotification(error.message, "error");
            this.hideLoading();
        }
    }

    // Handle artist creation with image/background files upload
    async handleArtistCreation(form, formData, data) {
        try {
            // Step 1: Prepare artist data (without image/background files)
            const artistData = {};

            // Handle form fields (excluding file inputs)
            for (const [key, value] of formData.entries()) {
                if (!key.endsWith("_file") && value !== "") {
                    artistData[key] = value;
                }
            }

            // Handle checkboxes
            const checkboxes = form.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach((checkbox) => {
                artistData[checkbox.name] = checkbox.checked;
            });

            console.log("Creating artist with data:", artistData);

            // Step 2: Create artist first
            const createResponse = await this.makeAuthenticatedRequest(
                `${this.apiBase}/artists`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(artistData),
                }
            );

            if (!createResponse.ok) {
                const errorData = await createResponse.json();
                throw new Error(
                    errorData.error?.message || "Failed to create artist"
                );
            }

            const createResult = await createResponse.json();
            const artistId = createResult.artist.id;
            console.log("Artist created successfully with ID:", artistId);

            // Step 3: Upload image file if provided
            const imageFileInput = form.querySelector(
                'input[name="image_file"]'
            );
            if (
                imageFileInput &&
                imageFileInput.files &&
                imageFileInput.files[0]
            ) {
                const imageFile = imageFileInput.files[0];
                console.log("Uploading image file for artist:", artistId);

                try {
                    // Upload image file using artist-specific endpoint
                    const formData = new FormData();
                    formData.append("image", imageFile);

                    const uploadResponse = await this.makeAuthenticatedRequest(
                        `${this.apiBase}/upload/artist/${artistId}/image`,
                        {
                            method: "POST",
                            body: formData,
                        }
                    );

                    if (!uploadResponse.ok) {
                        const errorData = await uploadResponse.json();
                        console.warn("Image file upload failed:", errorData);
                        // Don't fail the entire operation, just log the warning
                    } else {
                        const uploadResult = await uploadResponse.json();
                        console.log(
                            "Image file uploaded successfully:",
                            uploadResult
                        );
                    }
                } catch (uploadError) {
                    console.error("Error uploading image file:", uploadError);
                    // Don't fail the entire operation, just log the error
                }
            }

            // Step 4: Upload background file if provided
            const backgroundFileInput = form.querySelector(
                'input[name="background_file"]'
            );
            if (
                backgroundFileInput &&
                backgroundFileInput.files &&
                backgroundFileInput.files[0]
            ) {
                const backgroundFile = backgroundFileInput.files[0];
                console.log("Uploading background file for artist:", artistId);

                try {
                    // Upload background file using artist-specific endpoint
                    const formData = new FormData();
                    formData.append("background", backgroundFile);

                    const uploadResponse = await this.makeAuthenticatedRequest(
                        `${this.apiBase}/upload/artist/${artistId}/background`,
                        {
                            method: "POST",
                            body: formData,
                        }
                    );

                    if (!uploadResponse.ok) {
                        const errorData = await uploadResponse.json();
                        console.warn(
                            "Background file upload failed:",
                            errorData
                        );
                        // Don't fail the entire operation, just log the warning
                    } else {
                        const uploadResult = await uploadResponse.json();
                        console.log(
                            "Background file uploaded successfully:",
                            uploadResult
                        );
                    }
                } catch (uploadError) {
                    console.error(
                        "Error uploading background file:",
                        uploadError
                    );
                    // Don't fail the entire operation, just log the error
                }
            }

            // Step 5: Show success and refresh
            this.showNotification("Artist created successfully!", "success");
            this.closeModalAndNavigateBack();
            this.loadSectionData(this.currentSection);
        } catch (error) {
            console.error("Error in artist creation:", error);
            this.showNotification(error.message, "error");
            this.hideLoading();
        }
    }

    // Delete item
    async deleteItem(section, id) {
        console.log("deleteItem called:", section, id);
        if (!confirm("Are you sure you want to delete this item?")) {
            return;
        }

        this.showLoading();
        try {
            let url = `${this.apiBase}/${section}/${id}`;
            if (section === "users") {
                url = `${this.apiBase}/admin/users/${id}`;
            }

            const response = await this.makeAuthenticatedRequest(url, {
                method: "DELETE",
            });

            if (response.ok) {
                this.showNotification("Item deleted successfully", "success");
                this.loadSectionData(section);
                this.loadDashboard(); // Update stats
            } else {
                throw new Error("Delete failed");
            }
        } catch (error) {
            console.error("Error deleting item:", error);
            this.showNotification("Error deleting item", "error");
        }
        this.hideLoading();
    }

    // Handle form submission
    async handleSubmit() {
        const form = document.getElementById("modal-form");
        const formData = new FormData(form);
        const data = {};

        this.showLoading();

        try {
            // Special handling for album creation with cover image
            if (this.currentSection === "albums" && !this.currentEditId) {
                // Create album first, then upload cover image if provided
                return await this.handleAlbumCreation(form, formData, data);
            }

            // Special handling for track creation with audio/image files
            if (this.currentSection === "tracks" && !this.currentEditId) {
                // Create track first, then upload audio/image files if provided
                return await this.handleTrackCreation(form, formData, data);
            }

            // Special handling for artist creation with image/background files
            if (this.currentSection === "artists" && !this.currentEditId) {
                // Create artist first, then upload image/background files if provided
                return await this.handleArtistCreation(form, formData, data);
            }

            // Handle file uploads first - only upload if there are new files
            const fileInputs = form.querySelectorAll('input[type="file"]');
            for (const input of fileInputs) {
                // Check if this input has a new file and should be uploaded
                if (
                    input.files &&
                    input.files[0] &&
                    this.hasNewFiles[input.name]
                ) {
                    const file = input.files[0];
                    let uploadType = "image";

                    // Determine upload type based on field name
                    if (input.name.includes("audio")) {
                        uploadType = "audio";
                    } else if (input.name === "avatar_file") {
                        uploadType = "avatar";
                    } else if (
                        input.name.includes("image") ||
                        input.name.includes("cover") ||
                        input.name.includes("background")
                    ) {
                        uploadType = "image";
                    }

                    try {
                        const uploadedUrl = await this.uploadFile(
                            file,
                            uploadType,
                            input.name
                        );

                        // Map file field names to URL field names
                        const fieldMapping = {
                            avatar_file: "avatar_url",
                            image_file: "image_url",
                            background_file: "background_image_url",
                            cover_file:
                                this.currentSection === "playlists"
                                    ? "image_url"
                                    : "cover_image_url",
                            audio_file: "audio_url",
                        };

                        const urlFieldName =
                            fieldMapping[input.name] ||
                            input.name.replace("_file", "_url");
                        data[urlFieldName] = uploadedUrl;
                    } catch (uploadError) {
                        console.error("Error uploading file:", uploadError);
                        this.showNotification(
                            `Error uploading ${input.files[0].name}`,
                            "error"
                        );
                        this.hideLoading();
                        return;
                    }
                } else if (
                    !this.hasNewFiles[input.name] &&
                    this.originalFileUrls[input.name]
                ) {
                    // No new file, but we have an original URL - keep the original
                    const fieldMapping = {
                        avatar_file: "avatar_url",
                        image_file: "image_url",
                        background_file: "background_image_url",
                        cover_file:
                            this.currentSection === "playlists"
                                ? "image_url"
                                : "cover_image_url",
                        audio_file: "audio_url",
                    };

                    const urlFieldName =
                        fieldMapping[input.name] ||
                        input.name.replace("_file", "_url");
                    data[urlFieldName] = this.originalFileUrls[input.name];
                }
            }

            // Handle other form fields
            for (const [key, value] of formData.entries()) {
                if (!key.endsWith("_file") && value !== "") {
                    // Skip password for user updates (admin doesn't change existing passwords)
                    if (
                        this.currentSection === "users" &&
                        this.currentEditId &&
                        key === "password"
                    ) {
                        continue;
                    }
                    data[key] = value;
                }
            }

            // Handle checkboxes
            const checkboxes = form.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach((checkbox) => {
                data[checkbox.name] = checkbox.checked;
            });

            const method = this.currentEditId ? "PUT" : "POST";
            let url;

            if (this.currentSection === "users") {
                url = this.currentEditId
                    ? `${this.apiBase}/admin/users/${this.currentEditId}`
                    : `${this.apiBase}/admin/users`;
            } else {
                url = this.currentEditId
                    ? `${this.apiBase}/${this.currentSection}/${this.currentEditId}`
                    : `${this.apiBase}/${this.currentSection}`;
            }

            // Debug logging for track and album operations
            if (this.currentSection === "tracks") {
                console.log("Track form data being sent:", data);
                console.log("Track operation:", method, url);
            } else if (this.currentSection === "albums") {
                console.log("Album form data being sent:", data);
                console.log("Album operation:", method, url);
            }

            const response = await this.makeAuthenticatedRequest(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                this.showNotification(
                    `${this.currentSection.slice(0, -1)} ${
                        this.currentEditId ? "updated" : "created"
                    } successfully`,
                    "success"
                );
                this.closeModalAndNavigateBack();
                this.loadSectionData(this.currentSection);
                this.loadDashboard(); // Update stats
            } else {
                const errorData = await response.json();

                // Handle validation errors in admin forms
                if (
                    errorData.error?.code === "VALIDATION_ERROR" &&
                    errorData.error?.details
                ) {
                    this.showValidationErrorsInForm(errorData.error.details);
                    throw new Error("Validation failed");
                } else {
                    throw new Error(errorData.error?.message || "Save failed");
                }
            }
        } catch (error) {
            console.error("Error saving item:", error);

            // Try to parse error response for validation details
            if (error.message && error.message.includes("Save failed")) {
                // This might be a validation error, try to get more details
                this.showNotification(
                    "Vui lòng kiểm tra lại thông tin đã nhập",
                    "error"
                );
            } else {
                this.showNotification(
                    error.message || "Error saving item",
                    "error"
                );
            }
        }
        this.hideLoading();
    }

    // Show loading spinner
    showLoading() {
        document.getElementById("loading").classList.add("show");
    }

    // Hide loading spinner
    hideLoading() {
        document.getElementById("loading").classList.remove("show");
    }

    // Show notification
    showNotification(message, type = "info") {
        // Create notification element
        const notification = document.createElement("div");
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);

        // Remove on click
        notification
            .querySelector(".notification-close")
            .addEventListener("click", () => {
                notification.remove();
            });
    }

    // Show validation errors in admin forms
    showValidationErrorsInForm(validationDetails) {
        let errorMessage = "Vui lòng kiểm tra lại các trường sau:\n";

        validationDetails.forEach((detail) => {
            errorMessage += `• ${this.getFieldDisplayName(detail.field)}: ${
                detail.message
            }\n`;
        });

        this.showNotification(errorMessage.replace(/\n/g, "<br>"), "error");
    }

    // Get display name for fields
    getFieldDisplayName(fieldName) {
        const fieldNames = {
            email: "Email",
            username: "Username",
            password: "Password",
            display_name: "Display Name",
            name: "Name",
            title: "Title",
            bio: "Bio",
            description: "Description",
            release_date: "Release Date",
            artist_id: "Artist",
            album_id: "Album",
            monthly_listeners: "Monthly Listeners",
            is_verified: "Verified Status",
            is_public: "Public Status",
        };

        return fieldNames[fieldName] || fieldName;
    }
}

// AdminDashboard initialization moved to the end of file

// Add notification styles to head
const notificationStyles = `
<style>
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 4000;
    max-width: 400px;
    animation: slideInRight 0.3s ease;
}

.notification-content {
    background: white;
    border-radius: 5px;
    padding: 1rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-left: 4px solid #007bff;
}

.notification-success .notification-content {
    border-left-color: #28a745;
}

.notification-error .notification-content {
    border-left-color: #dc3545;
}

.notification-close {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    color: #999;
    margin-left: 1rem;
}

@keyframes slideInRight {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
}
</style>
`;

document.head.insertAdjacentHTML("beforeend", notificationStyles);

// Initialize the dashboard when the page loads
document.addEventListener("DOMContentLoaded", () => {
    window.adminDashboard = new AdminDashboard();
});
