// ============================================
// MANAGER DE AUTENTICACIÓN CON FORMULARIOS
// ============================================

class AuthManager {
    constructor() {
        this.authClient = window.authClient;
        this.init();
    }

    init() {
        this.bindFormEvents();
        this.bindAuthButtons();
        this.setupAuthStateListener();
        this.setupUserDataListener();

        // Verificar estado de autenticación al cargar
        this.updateUIBasedOnAuthState();
    }

    setupUserDataListener() {
        // Escuchar actualizaciones de datos de usuario
        window.addEventListener('userDataUpdated', (event) => {
            console.log('📊 Datos de usuario actualizados:', event.detail);
            this.updateUserInfo(event.detail);
        });
    }

    bindFormEvents() {
        // Formulario de registro
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        // Formulario de login
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
    }

    bindAuthButtons() {
        // Botón de registro
        const registerBtn = document.getElementById('btn-register');
        if (registerBtn) {
            registerBtn.addEventListener('click', () => {
                if (this.authClient.isAuthenticated()) {
                    this.handleLogout();
                } else {
                    this.showModal('register-modal');
                }
            });
        }

        // Botón de login
        const loginBtn = document.getElementById('btn-login');
        if (loginBtn) {
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                if (this.authClient.isAuthenticated()) {
                    // Usuario autenticado - SOLO mostrar perfil
                    this.showUserProfile();
                } else {
                    // Usuario NO autenticado - mostrar login
                    this.showModal('login-modal');
                }
            });
        }

        // Botones de cerrar modal
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modalId = e.target.closest('button').dataset.modal;
                this.hideModal(modalId);
            });
        });
    }

    setupAuthStateListener() {
        // Configurar callback para cambios de autenticación
        this.authClient.setAuthChangeCallback((isAuthenticated, user) => {
            this.updateUIBasedOnAuthState();

            if (isAuthenticated) {
                this.showWelcomeNotification(user);
                // ✅ Si quedó logueado, revisar si es admin y cargar panel
                this.checkIfAdminAndLoad();
            }
        });
    }

    // ==========================================================
    // ✅ ADMIN: Mostrar panel y cargar tablas users y game_scores
    // ==========================================================
    async checkIfAdminAndLoad() {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        try {
            const me = await fetch('/api/auth/verify', {
                headers: { Authorization: `Bearer ${token}` }
            }).then(r => r.json());

            const adminSection = document.getElementById('admin-section');

            if (me?.user?.role === 'admin') {
                if (adminSection) adminSection.classList.remove('hidden');

                this.setupAdminTabs();
                await this.loadAdminDashboard(token);
                await this.loadAdminUsers(token);
                await this.loadAdminScores(token);
            } else {
                // Si NO es admin, ocultar panel
                if (adminSection) adminSection.classList.add('hidden');
            }
        } catch (err) {
            console.error('❌ Error verificando admin:', err);
        }
    }

    setupAdminTabs() {
        const tabs = document.querySelectorAll('.admin-tab');

        tabs.forEach(btn => {
            // Evitar duplicar listeners
            if (btn.dataset.bound === '1') return;
            btn.dataset.bound = '1';

            btn.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                btn.classList.add('active');

                const tabId = btn.dataset.tab;
                document.querySelectorAll('.admin-tab-panel').forEach(p => p.classList.add('hidden'));
                const panel = document.getElementById(tabId);
                if (panel) panel.classList.remove('hidden');
            });
        });

        const btnUsers = document.getElementById('admin-users-reload');
        const btnScores = document.getElementById('admin-scores-reload');

        if (btnUsers && btnUsers.dataset.bound !== '1') {
            btnUsers.dataset.bound = '1';
            btnUsers.addEventListener('click', () => this.loadAdminUsers(localStorage.getItem('accessToken')));
        }

        if (btnScores && btnScores.dataset.bound !== '1') {
            btnScores.dataset.bound = '1';
            btnScores.addEventListener('click', () => this.loadAdminScores(localStorage.getItem('accessToken')));
        }
    }

    async loadAdminDashboard(token) {
        const dash = await fetch('/api/admin/dashboard', {
            headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json());

        const elUsers = document.getElementById('admin-total-users');
        const elGames = document.getElementById('admin-total-games');
        const elAt = document.getElementById('admin-generated-at');

        if (elUsers) elUsers.textContent = dash?.totals?.total_users ?? 0;
        if (elGames) elGames.textContent = dash?.totals?.total_games ?? 0;
        if (elAt) elAt.textContent = dash?.generated_at ? ('Actualizado: ' + dash.generated_at) : '';
    }

    async loadAdminUsers(token) {
        const body = document.getElementById('admin-users-body');
        if (!body) return;

        body.innerHTML = `<tr><td colspan="10" class="muted">Cargando...</td></tr>`;

        const data = await fetch('/api/admin/users?limit=50&offset=0', {
            headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json());

        const rows = data?.rows || [];
        if (!rows.length) {
            body.innerHTML = `<tr><td colspan="10" class="muted">Sin datos</td></tr>`;
            return;
        }

        body.innerHTML = rows.map(u => `
            <tr>
                <td>${u.id}</td>
                <td>${u.username ?? ''}</td>
                <td>${u.email ?? ''}</td>
                <td>${u.full_name ?? ''}</td>
                <td>${u.role ?? ''}</td>
                <td>${u.total_score ?? 0}</td>
                <td>${u.games_played ?? 0}</td>
                <td>${u.levels_completed ?? 0}</td>
                <td>${u.is_active ? '✅' : '❌'}</td>
                <td>${u.created_at ?? ''}</td>
            </tr>
        `).join('');
    }

    async loadAdminScores(token) {
        const body = document.getElementById('admin-scores-body');
        if (!body) return;

        body.innerHTML = `<tr><td colspan="9" class="muted">Cargando...</td></tr>`;

        const data = await fetch('/api/admin/game-scores?limit=50&offset=0', {
            headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json());

        const rows = data?.rows || [];
        if (!rows.length) {
            body.innerHTML = `<tr><td colspan="9" class="muted">Sin datos</td></tr>`;
            return;
        }

        body.innerHTML = rows.map(s => `
            <tr>
                <td>${s.id}</td>
                <td>${s.user_id}</td>
                <td>${s.level_type ?? ''}</td>
                <td>${s.score ?? 0}</td>
                <td>${s.time_taken ?? 0}</td>
                <td>${s.anomalies_found ?? 0}</td>
                <td>${s.total_anomalies ?? 0}</td>
                <td>${Number(s.accuracy_percentage ?? 0).toFixed(2)}</td>
                <td>${s.completed_at ?? ''}</td>
            </tr>
        `).join('');
    }

    // ==========================================
    // REGISTER
    // ==========================================
    async handleRegister() {
        try {
            this.showLoading('Creando tu cuenta de héroe...');

            const formData = {
                username: document.getElementById('register-username').value.trim(),
                email: document.getElementById('register-email').value.trim(),
                password: document.getElementById('register-password').value,
                full_name: document.getElementById('register-username').value.trim()
            };

            if (!this.validateRegistrationData(formData)) {
                this.hideLoading();
                return;
            }

            const result = await this.authClient.register(formData);

            this.hideLoading();
            this.hideModal('register-modal');

            window.UIManager.showNotification(
                `¡Bienvenido, ${result.user.username}! Tu cuenta ha sido creada exitosamente.`,
                'success'
            );

            window.dispatchEvent(new CustomEvent('user-logged-in', {
                detail: { user: result.user }
            }));

            document.getElementById('register-form').reset();

            // ✅ si se registra y queda logueado, revisar admin
            this.checkIfAdminAndLoad();

        } catch (error) {
            this.hideLoading();
            console.error('Error en registro:', error);
            this.handleRegistrationError(error);
        }
    }

    handleRegistrationError(error) {
        try {
            let errorData = null;
            if (error.responseText) {
                errorData = JSON.parse(error.responseText);
            } else if (error.message && error.message.startsWith('{')) {
                errorData = JSON.parse(error.message);
            }

            if (errorData && errorData.details && Array.isArray(errorData.details)) {
                const validationErrors = errorData.details;
                const passwordError = validationErrors.find(err => err.path === 'password');

                if (passwordError) {
                    window.UIManager.showNotification(
                        `🔐 Formato de contraseña incorrecto:\n\n` +
                        `• Mínimo 6 caracteres\n` +
                        `• Al menos una letra mayúscula (A-Z)\n` +
                        `• Al menos una letra minúscula (a-z)\n` +
                        `• Al menos un número (0-9)\n\n` +
                        `Ejemplo: MiClave123`,
                        'warning',
                        8000
                    );
                    return;
                }

                const usernameError = validationErrors.find(err => err.path === 'username');
                if (usernameError) {
                    window.UIManager.showNotification(
                        `📝 Nombre de usuario inválido:\n\n` +
                        `• 3-30 caracteres\n` +
                        `• Solo letras, números y guión bajo (_)\n` +
                        `• Sin espacios ni caracteres especiales`,
                        'warning',
                        6000
                    );
                    return;
                }

                const emailError = validationErrors.find(err => err.path === 'email');
                if (emailError) {
                    window.UIManager.showNotification(
                        `📧 Email inválido:\n\nPor favor, ingresa un email válido como: ejemplo@correo.com`,
                        'warning',
                        5000
                    );
                    return;
                }
            }

            if (error.message.includes('ya existe') || error.message.includes('already exists')) {
                window.UIManager.showNotification(
                    `⚠️ Usuario ya registrado:\n\n` +
                    `Este email o nombre de usuario ya está en uso.\n` +
                    `¿Ya tienes cuenta? Intenta iniciar sesión en su lugar.`,
                    'warning',
                    6000
                );
                return;
            }

            window.UIManager.showNotification(
                `❌ Error al crear cuenta:\n\n` +
                `${error.message || 'Error desconocido'}\n\n` +
                `Por favor, inténtalo de nuevo.`,
                'error'
            );

        } catch (parseError) {
            console.error('Error parsing registration error:', parseError);
            window.UIManager.showNotification(
                `❌ Error al crear cuenta:\n\n` +
                `${error.message || 'Error de conexión'}\n\n` +
                `Verifica tu conexión e inténtalo de nuevo.`,
                'error'
            );
        }
    }

    // ==========================================
    // LOGIN
    // ==========================================
    async handleLogin() {
        try {
            this.showLoading('Iniciando sesión...');

            const credentials = {
                login: document.getElementById('login-email').value.trim(),
                password: document.getElementById('login-password').value
            };

            if (!credentials.login || !credentials.password) {
                window.UIManager.showNotification('Por favor, completa todos los campos', 'warning');
                this.hideLoading();
                return;
            }

            const result = await this.authClient.login(credentials);

            // ✅ Guardar tokens para que isAuthenticated() funcione
if (result?.tokens?.access) {
  localStorage.setItem('accessToken', result.tokens.access);
}
if (result?.tokens?.refresh) {
  localStorage.setItem('refreshToken', result.tokens.refresh);
}

// ✅ Guardar user (opcional, pero ayuda)
if (result?.user) {
  localStorage.setItem('user', JSON.stringify(result.user));
}

            this.hideLoading();
            this.hideModal('login-modal');

            window.UIManager.showNotification(
                `¡Bienvenido de vuelta, ${result.user.username}!`,
                'success'
            );

            window.dispatchEvent(new CustomEvent('user-logged-in', {
                detail: { user: result.user }
            }));

            document.getElementById('login-form').reset();

            // ✅ al loguear: revisar si es admin y cargar panel
            await this.checkIfAdminAndLoad();

        } catch (error) {
            this.hideLoading();
            console.error('Error en login:', error);

            let errorMessage = 'Error al iniciar sesión. ';
            if (error.message.includes('incorrectos') || error.message.includes('inválidas')) {
                errorMessage += 'Credenciales incorrectas.';
            } else {
                errorMessage += 'Por favor, inténtalo de nuevo.';
            }

            window.UIManager.showNotification(errorMessage, 'error');
        }
    }

    async handleLogout() {
        try {
            this.hideProfileModal();

            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.remove('show');
                modal.classList.add('hidden');
            });

            await this.authClient.logout();
            window.UIManager.showNotification('Sesión cerrada correctamente', 'info');

            window.dispatchEvent(new CustomEvent('user-logged-out'));

            // ✅ ocultar panel admin al salir
            const adminSection = document.getElementById('admin-section');
            if (adminSection) adminSection.classList.add('hidden');

        } catch (error) {
            console.error('Error en logout:', error);
            window.UIManager.showNotification('Error al cerrar sesión', 'error');
        }
    }

    validateRegistrationData(data) {
        if (data.username.length < 3) {
            window.UIManager.showNotification(
                `📝 Nombre de héroe muy corto:\n\n` +
                `• Mínimo 3 caracteres\n` +
                `• Máximo 30 caracteres\n` +
                `• Solo letras, números y guión bajo (_)`,
                'warning'
            );
            return false;
        }

        if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
            window.UIManager.showNotification(
                `📝 Formato de nombre inválido:\n\n` +
                `Solo se permiten:\n` +
                `• Letras (A-Z, a-z)\n` +
                `• Números (0-9)\n` +
                `• Guión bajo (_)\n\n` +
                `No se permiten espacios ni caracteres especiales.`,
                'warning'
            );
            return false;
        }

        if (!this.isValidEmail(data.email)) {
            window.UIManager.showNotification(
                `📧 Email inválido:\n\n` +
                `Por favor, ingresa un email válido.\n` +
                `Ejemplo: tunombre@correo.com`,
                'warning'
            );
            return false;
        }

        if (!this.isValidPassword(data.password)) {
            return false;
        }

        return true;
    }

    isValidPassword(password) {
        if (password.length < 6) {
            window.UIManager.showNotification(
                `🔐 Contraseña muy corta:\n\n` +
                `Tu contraseña debe tener al menos 6 caracteres.`,
                'warning'
            );
            return false;
        }

        if (!/(?=.*[a-z])/.test(password)) {
            window.UIManager.showNotification(
                `🔐 Falta letra minúscula:\n\n` +
                `Tu contraseña debe incluir al menos una letra minúscula (a-z).\n` +
                `Ejemplo: MiClave123`,
                'warning'
            );
            return false;
        }

        if (!/(?=.*[A-Z])/.test(password)) {
            window.UIManager.showNotification(
                `🔐 Falta letra mayúscula:\n\n` +
                `Tu contraseña debe incluir al menos una letra mayúscula (A-Z).\n` +
                `Ejemplo: MiClave123`,
                'warning'
            );
            return false;
        }

        if (!/(?=.*\d)/.test(password)) {
            window.UIManager.showNotification(
                `🔐 Falta número:\n\n` +
                `Tu contraseña debe incluir al menos un número (0-9).\n` +
                `Ejemplo: MiClave123`,
                'warning'
            );
            return false;
        }

        return true;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    updateUIBasedOnAuthState() {
        const isAuthenticated = this.authClient.isAuthenticated();
        const user = this.authClient.getUser();

        const registerBtn = document.getElementById('btn-register');
        const loginBtn = document.getElementById('btn-login');

        if (isAuthenticated && user) {
            if (registerBtn) {
                registerBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i><span>Cerrar Sesión</span>';
            }

            if (loginBtn) {
                loginBtn.innerHTML = '<i class="fas fa-user"></i><span>Mi Perfil</span>';
            }

            this.addUserInfoToHeader(user);

            // ✅ si ya está autenticado al cargar, revisar admin
            this.checkIfAdminAndLoad();

        } else {
            if (registerBtn) {
                registerBtn.innerHTML = '<i class="fas fa-user-plus"></i><span>Unirse a la Causa</span>';
            }

            if (loginBtn) {
                loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i><span>Iniciar Sesión</span>';
            }

            this.removeUserInfoFromHeader();

            // Ocultar admin
            const adminSection = document.getElementById('admin-section');
            if (adminSection) adminSection.classList.add('hidden');
        }
    }

    addUserInfoToHeader(user) {
        this.removeUserInfoFromHeader();

        const healthStats = document.querySelector('.health-stats');
        if (healthStats) {
            const userInfo = document.createElement('div');
            userInfo.className = 'user-info-header';
            userInfo.innerHTML = `
                <div class="user-avatar">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="user-details">
                    <span class="username" style="color:#078930;font-weight:600;">${user.username}</span>
                    <span class="user-stats" style="color:#078930;">${user.total_score || 0} pts | Nivel ${Math.floor((user.total_score || 0) / 200) + 1}</span>
                </div>
            `;

            healthStats.appendChild(userInfo);
            this.addUserHeaderStyles();
            this.addLogoutButton();
        }
    }

    removeUserInfoFromHeader() {
        const userInfo = document.querySelector('.user-info-header');
        if (userInfo) userInfo.remove();
        this.removeLogoutButton();
    }

    updateUserInfo(userData) {
        const userStatsElement = document.querySelector('.user-stats');
        if (userStatsElement) {
            const level = Math.floor((userData.total_score || 0) / 200) + 1;
            userStatsElement.textContent = `${userData.total_score || 0} pts | Nivel ${level}`;
        }
        console.log('🔄 Información de usuario actualizada en UI');
    }

    showUserProfile() {
        const user = this.authClient.getUser();
        if (!user) return;

        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
            modal.classList.add('hidden');
        });

        const profileModal = document.createElement('div');
        profileModal.id = 'profile-modal';
        profileModal.className = 'modal';
        profileModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-user"></i> Perfil de ${user.username}</h3>
                    <button class="close-modal" onclick="authManager.hideProfileModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="profile-info">
                        <div class="profile-avatar">
                            <i class="fas fa-user-circle"></i>
                        </div>
                        <div class="profile-details">
                            <h4>${user.username}</h4>
                            <p>Héroe de la Prevención</p>
                            <div class="profile-stats">
                                <div class="stat-item">
                                    <i class="fas fa-star"></i>
                                    <span>${user.total_score || 0} puntos</span>
                                </div>
                                <div class="stat-item">
                                    <i class="fas fa-gamepad"></i>
                                    <span>${user.games_played || 0} partidas</span>
                                </div>
                                <div class="stat-item">
                                    <i class="fas fa-trophy"></i>
                                    <span>${user.levels_completed || 0} niveles</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="profile-actions">
                        <button class="btn-logout-profile" onclick="authManager.handleLogout();">
                            <i class="fas fa-sign-out-alt"></i>
                            <span>Cerrar Sesión</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(profileModal);
        this.addProfileStyles();

        profileModal.addEventListener('click', (e) => {
            if (e.target === profileModal) {
                e.stopPropagation();
                this.hideProfileModal();
            }
        });

        setTimeout(() => profileModal.classList.add('show'), 10);
    }

    addLogoutButton() {
        let logoutBtn = document.getElementById('btn-logout-main');

        if (!logoutBtn) {
            logoutBtn = document.createElement('button');
            logoutBtn.id = 'btn-logout-main';
            logoutBtn.className = 'btn-logout-header';
            logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i>';
            logoutBtn.title = 'Cerrar Sesión';
            logoutBtn.onclick = () => this.handleLogout();

            const userInfo = document.querySelector('.user-info-header');
            if (userInfo) {
                userInfo.appendChild(logoutBtn);
                this.addLogoutButtonStyles();
            }
        }
    }

    removeLogoutButton() {
        const logoutBtn = document.getElementById('btn-logout-main');
        if (logoutBtn) logoutBtn.remove();
    }

    hideProfileModal() {
        const modal = document.getElementById('profile-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    }

    showWelcomeNotification(user) {
        if (user) {
            const message = `¡Bienvenido, ${user.username}! Tu misión para salvar vidas comienza ahora.`;
            window.UIManager.showNotification(message, 'success', 7000);
        }
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('show');
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('show');
        }
    }

    showLoading(message = 'Cargando...') {
        window.UIManager.showLoading(message);
    }

    hideLoading() {
        window.UIManager.hideLoading();
    }

    addUserHeaderStyles() {
        if (document.getElementById('user-header-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'user-header-styles';
        styles.textContent = `
            .user-info-header {
                display: flex;
                align-items: center;
                gap: 10px;
                background: rgba(255,255,255,0.1);
                padding: 8px 15px;
                border-radius: 20px;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.2);
            }
            .user-info-header .user-avatar {
                font-size: 24px;
                color: #48cae4;
            }
            .user-info-header .user-details {
                display: flex;
                flex-direction: column;
                line-height: 1.2;
            }
            .user-info-header .username {
                font-weight: 600;
                color: white;
                font-size: 14px;
            }
            .user-info-header .user-stats {
                font-size: 12px;
                color: rgba(255,255,255,0.8);
            }
        `;
        document.head.appendChild(styles);
    }

    addLogoutButtonStyles() {
        if (document.getElementById('logout-button-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'logout-button-styles';
        styles.textContent = `
            .btn-logout-header {
                background: rgba(231, 76, 60, 0.8);
                border: none;
                color: white;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                font-size: 12px;
                margin-left: 10px;
            }
            .btn-logout-header:hover {
                background: rgba(231, 76, 60, 1);
                transform: scale(1.1);
            }
        `;
        document.head.appendChild(styles);
    }

    addProfileStyles() {
        if (document.getElementById('profile-modal-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'profile-modal-styles';
        styles.textContent = `
            #profile-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 99999;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            #profile-modal.show { opacity: 1; }
        `;
        document.head.appendChild(styles);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    const initAuthManager = () => {
        if (window.authClient && window.UIManager) {
            window.authManager = new AuthManager();
            console.log('AuthManager inicializado correctamente');
        } else {
            setTimeout(initAuthManager, 100);
        }
    };

    initAuthManager();
});