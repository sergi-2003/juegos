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
            }
        });
    }
    
    async handleRegister() {
        try {
            this.showLoading('Creando tu cuenta de héroe...');
            
            const formData = {
                username: document.getElementById('register-username').value.trim(),
                email: document.getElementById('register-email').value.trim(),
                password: document.getElementById('register-password').value,
                full_name: document.getElementById('register-username').value.trim() // Usar username como full_name por ahora
            };
            
            // Validaciones básicas
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
            
            // Disparar evento de login inmediatamente tras registro
            window.dispatchEvent(new CustomEvent('user-logged-in', {
                detail: { user: result.user }
            }));
            
            // Limpiar formulario
            document.getElementById('register-form').reset();
            
        } catch (error) {
            this.hideLoading();
            console.error('Error en registro:', error);
            
            // Manejar errores específicos del servidor
            this.handleRegistrationError(error);
        }
    }
    
    handleRegistrationError(error) {
        try {
            // Intentar parsear el error como JSON si viene del servidor
            let errorData = null;
            if (error.responseText) {
                errorData = JSON.parse(error.responseText);
            } else if (error.message && error.message.startsWith('{')) {
                errorData = JSON.parse(error.message);
            }
            
            // Si tenemos detalles de validación específicos
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
            
            // Errores específicos de duplicados
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
            
            // Error genérico
            window.UIManager.showNotification(
                `❌ Error al crear cuenta:\n\n` +
                `${error.message || 'Error desconocido'}\n\n` +
                `Por favor, inténtalo de nuevo.`,
                'error'
            );
            
        } catch (parseError) {
            // Si no podemos parsear el error, mostrar mensaje genérico
            console.error('Error parsing registration error:', parseError);
            window.UIManager.showNotification(
                `❌ Error al crear cuenta:\n\n` +
                `${error.message || 'Error de conexión'}\n\n` +
                `Verifica tu conexión e inténtalo de nuevo.`,
                'error'
            );
        }
    }
    
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
            
            this.hideLoading();
            this.hideModal('login-modal');
            
            window.UIManager.showNotification(
                `¡Bienvenido de vuelta, ${result.user.username}!`,
                'success'
            );
            
            // Disparar evento de login inmediatamente
            window.dispatchEvent(new CustomEvent('user-logged-in', {
                detail: { user: result.user }
            }));
            
            // Limpiar formulario
            document.getElementById('login-form').reset();
            
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
            // Cerrar modal de perfil primero
            this.hideProfileModal();
            
            // Cerrar TODOS los modales
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.remove('show');
                modal.classList.add('hidden');
            });
            
            await this.authClient.logout();
            window.UIManager.showNotification('Sesión cerrada correctamente', 'info');
            
            // Disparar evento de logout inmediatamente
            window.dispatchEvent(new CustomEvent('user-logged-out'));
            
            // Evitar que se abra cualquier modal después del logout
            // No recargar la página, solo actualizar UI
        } catch (error) {
            console.error('Error en logout:', error);
            window.UIManager.showNotification('Error al cerrar sesión', 'error');
        }
    }
    
    validateRegistrationData(data) {
        // Validar username
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
        
        // Validar email
        if (!this.isValidEmail(data.email)) {
            window.UIManager.showNotification(
                `📧 Email inválido:\n\n` +
                `Por favor, ingresa un email válido.\n` +
                `Ejemplo: tunombre@correo.com`,
                'warning'
            );
            return false;
        }
        
        // Validar contraseña con criterios específicos
        if (!this.isValidPassword(data.password)) {
            return false; // El método isValidPassword ya muestra el mensaje
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
            // Usuario autenticado
            if (registerBtn) {
                registerBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i><span>Cerrar Sesión</span>';
            }
            
            if (loginBtn) {
                loginBtn.innerHTML = '<i class="fas fa-user"></i><span>Mi Perfil</span>';
            }
            
            this.addUserInfoToHeader(user);
            
        } else {
            // Usuario no autenticado
            if (registerBtn) {
                registerBtn.innerHTML = '<i class="fas fa-user-plus"></i><span>Unirse a la Causa</span>';
            }
            
            if (loginBtn) {
                loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i><span>Iniciar Sesión</span>';
            }
            
            this.removeUserInfoFromHeader();
        }
    }
    
    addUserInfoToHeader(user) {
        // Remover info anterior si existe
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
            this.addLogoutButton(); // Agregar botón de logout
        }
    }
    
    removeUserInfoFromHeader() {
        const userInfo = document.querySelector('.user-info-header');
        if (userInfo) {
            userInfo.remove();
        }
        this.removeLogoutButton();
    }
    
    updateUserInfo(userData) {
        // Actualizar información del usuario en el header si está presente
        const userStatsElement = document.querySelector('.user-stats');
        if (userStatsElement) {
            const level = Math.floor((userData.total_score || 0) / 200) + 1;
            userStatsElement.textContent = `${userData.total_score || 0} pts | Nivel ${level}`;
        }
        
        // Si hay un modal de perfil abierto, actualizarlo también
        const profileModal = document.getElementById('profile-modal');
        if (profileModal) {
            const totalScoreElement = profileModal.querySelector('.total-score');
            const levelElement = profileModal.querySelector('.user-level');
            const gamesPlayedElement = profileModal.querySelector('.games-played');
            
            if (totalScoreElement) totalScoreElement.textContent = userData.total_score || 0;
            if (levelElement) levelElement.textContent = Math.floor((userData.total_score || 0) / 200) + 1;
            if (gamesPlayedElement) gamesPlayedElement.textContent = userData.games_played || 0;
        }
        
        console.log('🔄 Información de usuario actualizada en UI');
    }
    
    showUserProfile() {
        const user = this.authClient.getUser();
        if (!user) return;
        
        // CERRAR TODOS LOS MODALES ANTES DE MOSTRAR PERFIL
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
            modal.classList.add('hidden');
        });
        
        // Crear modal de perfil dinámicamente
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
        
        // Event listener para cerrar al hacer clic fuera del modal
        profileModal.addEventListener('click', (e) => {
            if (e.target === profileModal) {
                e.stopPropagation(); // IMPORTANTE: Detener la propagación del evento
                this.hideProfileModal();
            }
        });
        
        // Mostrar modal
        setTimeout(() => {
            profileModal.classList.add('show');
        }, 10);
    }
    
    // Método para mostrar botón de logout en la interfaz principal
    addLogoutButton() {
        // Buscar si ya existe un botón de logout
        let logoutBtn = document.getElementById('btn-logout-main');
        
        if (!logoutBtn) {
            // Crear botón de logout
            logoutBtn = document.createElement('button');
            logoutBtn.id = 'btn-logout-main';
            logoutBtn.className = 'btn-logout-header';
            logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i>';
            logoutBtn.title = 'Cerrar Sesión';
            logoutBtn.onclick = () => this.handleLogout();
            
            // Agregar el botón al header
            const userInfo = document.querySelector('.user-info-header');
            if (userInfo) {
                userInfo.appendChild(logoutBtn);
                this.addLogoutButtonStyles();
            }
        }
    }
    
    removeLogoutButton() {
        const logoutBtn = document.getElementById('btn-logout-main');
        if (logoutBtn) {
            logoutBtn.remove();
        }
    }
    
    hideProfileModal() {
        const modal = document.getElementById('profile-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
            }, 300);
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
            
            #profile-modal.show {
                opacity: 1;
            }
            
            .profile-info {
                text-align: center;
                margin-bottom: 20px;
            }
            
            .profile-avatar {
                font-size: 60px;
                color: #48cae4;
                margin-bottom: 15px;
            }
            
            .profile-details h4 {
                margin-bottom: 5px;
                color: #2d3436;
            }
            
            .profile-details p {
                color: #636e72;
                margin-bottom: 20px;
            }
            
            .profile-stats {
                display: flex;
                gap: 20px;
                justify-content: center;
                flex-wrap: wrap;
            }
            
            .profile-stats .stat-item {
                display: flex;
                align-items: center;
                gap: 5px;
                padding: 8px 12px;
                background: rgba(72,202,228,0.1);
                border-radius: 15px;
                font-size: 14px;
            }
            
            .profile-stats .stat-item i {
                color: #48cae4;
            }
            
            .profile-actions {
                text-align: center;
                padding-top: 20px;
                border-top: 1px solid #ddd;
            }
            
            .btn-logout-profile {
                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
                color: white;
                border: none;
                padding: 14px 32px;
                border-radius: 25px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                gap: 10px;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
            }
            
            .btn-logout-profile:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
                background: linear-gradient(135deg, #ee5a6f 0%, #ff6b6b 100%);
            }
            
            .btn-logout-profile:active {
                transform: translateY(0);
            }
            
            .btn-logout-profile i {
                font-size: 18px;
            }
        `;
        document.head.appendChild(styles);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Esperar a que authClient esté disponible
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