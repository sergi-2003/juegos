// ============================================
// NIVEL CÁNCER DE PRÓSTATA - MEJORADO
// ============================================

class ProstateCancerGame {
    constructor() {
        console.log('🎮 Inicializando Nivel de Cáncer de Próstata...');
        
        // Estado del juego
        this.currentPhase = 'intro';
        this.score = 0;
        this.lives = 3;
        this.maxLives = 3;
        this.gameTime = 360; // 6 minutos
        this.gameStartTime = null;
        this.timer = null;
        this.isPaused = false;
        
        // Progreso del tutorial
        this.tutorialStep = 0;
        this.totalTutorialSteps = 5;
        
        // Progreso del quiz
        this.currentQuestion = 0;
        this.correctAnswers = 0;
        this.totalQuestions = window.prostateCancerQuestions.length;
        this.currentShuffledAnswers = []; // Para tracking de respuestas aleatorizadas
        
        // Progreso de casos clínicos
        this.currentCase = 0;
        this.casesCompleted = 0;
        
        // Logros y estadísticas
        this.achievements = [];
        this.hintsUsed = 0;
        this.detectedAnomalies = 0;
        this.totalAnomalies = 3; // Para compatibilidad con sistema de puntuación
        
        console.log('✅ Nivel inicializado correctamente');
    }
    
    // ============================================
    // INICIALIZACIÓN Y NAVEGACIÓN
    // ============================================
    
    init() {
        console.log('🎮 Configurando interfaz del juego...');
        this.updateHUD();
        this.showScreen('intro-screen');
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Atajos de teclado
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.togglePause();
        });
    }
    
    showScreen(screenId) {
        document.querySelectorAll('.game-screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('active');
            screen.classList.add('animate-fade-in');
            console.log('📺 Pantalla mostrada:', screenId);
        }
    }
    
    // ============================================
    // CONTROL DEL JUEGO
    // ============================================
    
    startMission() {
        console.log('🚀 Iniciando misión de próstata...');
        this.currentPhase = 'tutorial';
        this.gameStartTime = Date.now();
        this.startTimer();
        this.showScreen('tutorial-screen');
        this.loadTutorialStep(0);
    }
    
    startTimer() {
        if (this.timer) clearInterval(this.timer);
        
        this.timer = setInterval(() => {
            if (!this.isPaused) {
                this.updateTimer();
            }
        }, 1000);
    }
    
    updateTimer() {
        const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
        const remaining = Math.max(0, this.gameTime - elapsed);
        
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        
        const timerElement = document.getElementById('timer-display');
        if (timerElement) {
            timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // Cambiar color cuando queda poco tiempo
            if (remaining <= 60) {
                timerElement.style.color = '#e63946';
                timerElement.classList.add('pulse');
            } else if (remaining <= 120) {
                timerElement.style.color = '#ff9800';
            }
        }
        
        if (remaining === 0) {
            this.timeUp();
        }
    }
    
    timeUp() {
        clearInterval(this.timer);
        this.showAlert(
            'Revisemos tu progreso y analicemos lo aprendido.',
            '⏰ ¡Tiempo Agotado!',
            '⏰'
        ).then(() => {
            this.finishGame();
        });
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        
        const pauseOverlay = document.getElementById('pause-overlay');
        if (pauseOverlay) {
            pauseOverlay.classList.toggle('hidden', !this.isPaused);
        }
    }
    
    // ============================================
    // FASE 1: TUTORIAL INTERACTIVO
    // ============================================
    
    loadTutorialStep(step) {
        this.tutorialStep = step;
        
        const tutorialData = this.getTutorialData(step);
        
        // Actualizar título y contenido
        document.getElementById('tutorial-title').innerHTML = tutorialData.title;
        document.getElementById('tutorial-content').innerHTML = tutorialData.content;
        document.getElementById('tutorial-diagram').innerHTML = tutorialData.diagram;
        
        // Actualizar progreso
        document.getElementById('current-step').textContent = step + 1;
        document.getElementById('total-steps').textContent = this.totalTutorialSteps;
        
        const progress = ((step + 1) / this.totalTutorialSteps) * 100;
        document.getElementById('tutorial-progress').style.width = `${progress}%`;
        
        // Actualizar botones
        document.getElementById('btn-prev').disabled = step === 0;
        
        const btnNext = document.getElementById('btn-next');
        if (step === this.totalTutorialSteps - 1) {
            btnNext.textContent = '¡Comenzar Quiz! 🎯';
            btnNext.classList.add('btn-primary');
        } else {
            btnNext.textContent = 'Siguiente →';
            btnNext.classList.remove('btn-primary');
        }
    }
    
  getTutorialData(step) {
  const steps = [
    {
      title: "🎯 Bienvenido",
      content: `
        <div class="tutorial-intro">
          <div class="intro-hero">
            <div class="hero-text">
              <h4>Detección Temprana </h4>
              <p class="lead">
                El cáncer de próstata es el <strong>segundo cáncer más común en hombres</strong>.
                En etapas tempranas puede no dar síntomas, por eso el control preventivo es clave.
              </p>

              <div class="hero-badges">
                <span class="badge"><i class="fas fa-shield-heart"></i> Prevención</span>
                <span class="badge"><i class="fas fa-stethoscope"></i> Chequeos</span>
                <span class="badge"><i class="fas fa-chart-line"></i> Detección</span>
              </div>

             
            </div>

            <div class="hero-illustration" aria-hidden="true">
              <img
                class="hero-img"
                src="/img/prostata-hero.png"
                alt=""
                loading="lazy"
                draggable="false"
              />
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">👥</div>
              <div class="stat-number">1 de 9</div>
              <div class="stat-label">Hombres son diagnosticados en su vida</div>
              <div class="stat-mini" aria-hidden="true">
                <img src="/img/icon-people.png" alt="" loading="lazy" draggable="false" />
              </div>
            </div>

            <div class="stat-card success">
              <div class="stat-icon">💚</div>
              <div class="stat-number">~100%</div>
              <div class="stat-label">Supervivencia con detección temprana</div>
              <div class="stat-mini" aria-hidden="true">
                <img src="/img/icon-survival.png" alt="" loading="lazy" draggable="false" />
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon">📅</div>
              <div class="stat-number">50+</div>
              <div class="stat-label">Edad para comenzar chequeos</div>
              <div class="stat-mini" aria-hidden="true">
                <img src="/img/icon-calendar.png" alt="" loading="lazy" draggable="false" />
              </div>
            </div>
          </div>

          <div class="info-box">
            <div class="info-icon" aria-hidden="true"><i class="fas fa-lightbulb"></i></div>
            <div class="info-text">
              <p>
                <strong>Dato clave:</strong> En etapas tempranas generalmente <strong>NO presenta síntomas</strong>.
                Por eso, la detección preventiva es crucial.
              </p>
              <p class="info-sub">
                Si tienes antecedentes familiares, consulta antes la edad de inicio del tamizaje.
              </p>
            </div>
          </div>
        </div>
      `,
      diagram: `
        <div class="anatomy-diagram">
          <div class="diagram-header">
            <h4>Anatomía de la Próstata</h4>
            <span class="diagram-pill"><i class="fas fa-map"></i> Zonas principales</span>
          </div>

          <div class="prostate-visual">
            <div class="prostate-image-wrap">
              <img
                class="prostate-base"
                src="/img/prostata-anatomia.png"
                alt="Anatomía de la próstata"
                loading="lazy"
                draggable="false"
              />

              <div class="prostate-hotspots" aria-hidden="true">
                <div class="hotspot hs-1"><span class="dot"></span><span class="tag">Zona periférica</span></div>
                <div class="hotspot hs-2"><span class="dot"></span><span class="tag">Zona de transición</span></div>
                <div class="hotspot hs-3"><span class="dot"></span><span class="tag">Zona central</span></div>
              </div>
            </div>

            <div class="prostate-zones">
              <button class="prostate-zone zone-1" type="button" data-zone="periférica">
                <span class="zone-title">Zona Periférica</span>
                <span class="zone-sub">≈ 70% de cánceres inician aquí</span>
              </button>
              <button class="prostate-zone zone-2" type="button" data-zone="transicional">
                <span class="zone-title">Zona de Transición</span>
                <span class="zone-sub">Crecimiento benigno frecuente</span>
              </button>
              <button class="prostate-zone zone-3" type="button" data-zone="central">
                <span class="zone-title">Zona Central</span>
                <span class="zone-sub">Menor frecuencia de cáncer</span>
              </button>
            </div>
          </div>

          <p class="diagram-note">
            <i class="fas fa-info-circle"></i>
            La mayoría de los cánceres comienzan en la <strong>zona periférica</strong>.
          </p>
        </div>
      `
    },
            {
                title: "⚠️ Factores de Riesgo",
                content: `
                    <div class="risk-factors-section">
                        <div class="risk-category high-risk">
                            <h4>🔴 Alto Riesgo - No Modificables</h4>
                            <ul>
                                <li><strong>Edad:</strong> Riesgo aumenta significativamente después de los 50 años</li>
                                <li><strong>Historial Familiar:</strong> Padre o hermano con cáncer de próstata duplica el riesgo</li>
                                <li><strong>Origen Étnico:</strong> Hombres afroamericanos tienen mayor incidencia</li>
                                <li><strong>Genética:</strong> Mutaciones BRCA1 y BRCA2 aumentan el riesgo</li>
                            </ul>
                        </div>
                        
                        <div class="risk-category medium-risk">
                            <h4>🟡 Factores Modificables</h4>
                            <ul>
                                <li><strong>Dieta:</strong> Alto consumo de grasas saturadas</li>
                                <li><strong>Peso:</strong> Obesidad puede aumentar riesgo de cáncer agresivo</li>
                                <li><strong>Ejercicio:</strong> Sedentarismo incrementa el riesgo</li>
                                <li><strong>Tabaco:</strong> Aumenta riesgo de cáncer más agresivo</li>
                            </ul>
                        </div>
                        
                        <div class="prevention-tips">
                            <h4>✅ Recomendaciones de Prevención</h4>
                            <ul>
                                <li>🥗 Dieta rica en frutas, verduras y tomates (licopeno)</li>
                                <li>🏃 Ejercicio regular (mínimo 150 min/semana)</li>
                                <li>⚖️ Mantener peso corporal saludable</li>
                                <li>🚭 No fumar</li>
                                <li>🩺 Chequeos médicos regulares</li>
                            </ul>
                        </div>
                    </div>
                `,
                diagram: `
                    <div class="risk-calculator">
                        <h4>Evaluador de Riesgo Personal</h4>
                        <div class="interactive-assessment">
                            <p>¿Tienes alguno de estos factores de riesgo?</p>
                            <div class="risk-checklist">
                                <label><input type="checkbox" class="risk-factor" data-risk="age"> Edad mayor a 50 años</label>
                                <label><input type="checkbox" class="risk-factor" data-risk="family"> Historial familiar</label>
                                <label><input type="checkbox" class="risk-factor" data-risk="ethnicity"> Origen afroamericano</label>
                            </div>
                            <button onclick="prostateCancerGame.calculateRisk()" class="btn-calculate">Evaluar Mi Riesgo</button>
                            <div id="risk-result" class="risk-result"></div>
                        </div>
                    </div>
                `
            },
            {
                title: "🔬 Exámenes de Detección: PSA",
                content: `
                    <div class="psa-section">
                        <h4>¿Qué es el PSA?</h4>
                        <p><strong>PSA (Antígeno Prostático Específico)</strong> es una proteína producida 
                        por la próstata que se mide mediante un análisis de sangre simple.</p>
                        
                        <div class="psa-ranges">
                            <div class="psa-range normal">
                                <div class="range-header">
                                    <span class="range-icon">✅</span>
                                    <span class="range-title">Normal</span>
                                </div>
                                <div class="range-value">0-4 ng/mL</div>
                                <div class="range-action">Continuar chequeos regulares</div>
                            </div>
                            
                            <div class="psa-range borderline">
                                <div class="range-header">
                                    <span class="range-icon">⚠️</span>
                                    <span class="range-title">Límite</span>
                                </div>
                                <div class="range-value">4-10 ng/mL</div>
                                <div class="range-action">Evaluación adicional necesaria</div>
                            </div>
                            
                            <div class="psa-range elevated">
                                <div class="range-header">
                                    <span class="range-icon">🚨</span>
                                    <span class="range-title">Elevado</span>
                                </div>
                                <div class="range-value">>10 ng/mL</div>
                                <div class="range-action">Consulta urológica inmediata</div>
                            </div>
                        </div>
                        
                        <div class="warning-box">
                            <i class="fas fa-info-circle"></i>
                            <p><strong>Importante:</strong> Un PSA elevado NO siempre significa cáncer. Puede elevarse por:</p>
                            <ul>
                                <li>Infección de próstata (prostatitis)</li>
                                <li>Agrandamiento benigno de próstata (HPB)</li>
                                <li>Ejercicio intenso o ciclismo reciente</li>
                                <li>Relaciones sexuales recientes</li>
                            </ul>
                        </div>
                    </div>
                `,
                diagram: `
                    <div class="psa-simulator">
                        <h4>Simulador de Análisis PSA</h4>
                        <div class="blood-test-visual">
                            <div class="test-tube">
                                <div class="blood-sample"></div>
                            </div>
                            <div class="test-results">
                                <div class="result-display">
                                    <span class="result-label">Resultado PSA:</span>
                                    <span class="result-value" id="psa-value">--</span>
                                </div>
                                <input type="range" min="0" max="20" value="2" step="0.5" 
                                       id="psa-slider" oninput="prostateCancerGame.updatePSAVisual(this.value)">
                                <div class="psa-interpretation" id="psa-interpretation"></div>
                            </div>
                        </div>
                    </div>
                `
            },
            {
                title: "👨‍⚕️ Examen Digital Rectal (DRE)",
                content: `
                    <div class="dre-section">
                        <h4>¿En qué consiste el examen?</h4>
                        <p>El tacto rectal digital (DRE) permite al médico examinar físicamente 
                        la próstata para detectar anormalidades.</p>
                        
                        <div class="exam-details">
                            <div class="exam-aspect">
                                <h5>✅ Qué detecta:</h5>
                                <ul>
                                    <li>Tamaño de la próstata</li>
                                    <li>Textura (debe ser suave)</li>
                                    <li>Nódulos o áreas duras</li>
                                    <li>Asimetrías</li>
                                </ul>
                            </div>
                            
                            <div class="exam-aspect">
                                <h5>⏱️ Duración:</h5>
                                <p>Solo toma unos 10-15 segundos</p>
                            </div>
                            
                            <div class="exam-aspect">
                                <h5>💡 Limitaciones:</h5>
                                <ul>
                                    <li>Solo detecta tumores grandes</li>
                                    <li>Solo acceso a parte posterior de próstata</li>
                                    <li>Debe combinarse con PSA para mejor detección</li>
                                </ul>
                            </div>
                        </div>
                        
                        <div class="info-box success">
                            <i class="fas fa-check-circle"></i>
                            <p><strong>Recomendación:</strong> El DRE y el PSA son complementarios. 
                            Juntos ofrecen la mejor detección temprana.</p>
                        </div>
                    </div>
                `,
                diagram: `
                    <div class="dre-visual">
                        <h4>Hallazgos Normales vs Anormales</h4>
                        <div class="findings-comparison">
                            <div class="finding normal-finding">
                                <div class="finding-icon">✅</div>
                                <h5>Normal</h5>
                                <ul>
                                    <li>Textura suave y gomosa</li>
                                    <li>Tamaño de una nuez</li>
                                    <li>Simétrica</li>
                                    <li>Sin nódulos</li>
                                </ul>
                            </div>
                            
                            <div class="finding abnormal-finding">
                                <div class="finding-icon">⚠️</div>
                                <h5>Requiere Evaluación</h5>
                                <ul>
                                    <li>Nódulos duros</li>
                                    <li>Asimetría marcada</li>
                                    <li>Textura irregular</li>
                                    <li>Muy agrandada</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                `
            },
            {
                title: "🚨 Síntomas y Señales de Alerta",
                content: `
                    <div class="symptoms-section">
                        <div class="alert-box warning">
                            <i class="fas fa-exclamation-triangle"></i>
                            <p><strong>Recuerda:</strong> El cáncer de próstata temprano raramente causa síntomas. 
                            ¡Por eso la detección preventiva es tan importante!</p>
                        </div>
                        
                        <h4>Síntomas que requieren atención médica:</h4>
                        
                        <div class="symptoms-grid">
                            <div class="symptom-category urinary">
                                <h5>🚽 Síntomas Urinarios</h5>
                                <ul>
                                    <li>Dificultad para iniciar o detener la micción</li>
                                    <li>Flujo urinario débil o interrumpido</li>
                                    <li>Necesidad frecuente de orinar (especialmente de noche)</li>
                                    <li>Sensación de no vaciar completamente la vejiga</li>
                                    <li>Urgencia urinaria súbita</li>
                                    <li>Sangre en la orina</li>
                                </ul>
                            </div>
                            
                            <div class="symptom-category sexual">
                                <h5>💊 Síntomas Sexuales</h5>
                                <ul>
                                    <li>Disfunción eréctil</li>
                                    <li>Sangre en el semen</li>
                                    <li>Dolor al eyacular</li>
                                    <li>Disminución del líquido eyaculado</li>
                                </ul>
                            </div>
                            
                            <div class="symptom-category advanced">
                                <h5>🦴 Síntomas Avanzados</h5>
                                <ul>
                                    <li>Dolor en espalda baja, caderas o pelvis</li>
                                    <li>Dolor óseo que no desaparece</li>
                                    <li>Pérdida de peso inexplicable</li>
                                    <li>Fatiga extrema</li>
                                </ul>
                            </div>
                        </div>
                        
                        <div class="action-box">
                            <i class="fas fa-phone-alt"></i>
                            <h5>¿Cuándo consultar al médico?</h5>
                            <p>Si experimentas cualquiera de estos síntomas, <strong>consulta a tu médico de inmediato</strong>. 
                            Aunque pueden tener causas benignas, es importante descartar cáncer.</p>
                        </div>
                        
                        <div class="prevention-reminder">
                            <h5>🛡️ La Mejor Defensa</h5>
                            <p><strong>No esperes a tener síntomas.</strong> Los chequeos preventivos regulares 
                            son tu mejor herramienta para detectar el cáncer en etapas tempranas y curables.</p>
                        </div>
                    </div>
                `,
                diagram: `
                    <div class="screening-schedule">
                        <h4>📅 Calendario de Chequeos Recomendado</h4>
                        <div class="schedule-timeline">
                            <div class="age-group">
                                <div class="age-badge">40-44</div>
                                <div class="recommendation">
                                    <strong>Alto Riesgo:</strong>
                                    <p>Comenzar conversación con médico</p>
                                </div>
                            </div>
                            
                            <div class="age-group active">
                                <div class="age-badge">45-49</div>
                                <div class="recommendation">
                                    <strong>Riesgo Elevado:</strong>
                                    <p>Chequeo anual (PSA + DRE)</p>
                                </div>
                            </div>
                            
                            <div class="age-group active">
                                <div class="age-badge">50+</div>
                                <div class="recommendation">
                                    <strong>Riesgo Promedio:</strong>
                                    <p>Chequeo anual recomendado</p>
                                </div>
                            </div>
                            
                            <div class="age-group">
                                <div class="age-badge">75+</div>
                                <div class="recommendation">
                                    <strong>Individualizado:</strong>
                                    <p>Consultar con médico</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `
            }
        ];
        
        return steps[step];
    }
    
    previousStep() {
        if (this.tutorialStep > 0) {
            this.loadTutorialStep(this.tutorialStep - 1);
        }
    }
    
    nextStep() {
        if (this.tutorialStep < this.totalTutorialSteps - 1) {
            this.loadTutorialStep(this.tutorialStep + 1);
        } else {
            // Tutorial completado, iniciar quiz
            this.startQuiz();
        }
    }
    
    // ============================================
    // FASE 2: QUIZ EDUCATIVO
    // ============================================
    
    startQuiz() {
        console.log('🎯 Iniciando quiz educativo...');
        this.currentPhase = 'quiz';
        this.showScreen('quiz-screen');
        this.loadQuestion(0);
        this.addScore(500); // Bonus por completar tutorial
    }
    
    loadQuestion(index) {
        this.currentQuestion = index;
        const question = window.prostateCancerQuestions[index];
        
        // Actualizar UI
        document.getElementById('question-number').textContent = index + 1;
        document.getElementById('total-questions').textContent = this.totalQuestions;
        document.getElementById('question-text').textContent = question.question;
        
        // Actualizar barra de progreso
        const progress = ((index + 1) / this.totalQuestions) * 100;
        document.getElementById('quiz-progress').style.width = `${progress}%`;
        
        // Aleatorizar orden de respuestas
        const answersWithIndex = question.answers.map((answer, idx) => ({
            text: answer,
            originalIndex: idx,
            isCorrect: idx === question.correctAnswer
        }));
        
        const shuffledAnswers = this.shuffleArray(answersWithIndex);
        
        // Guardar el mapeo para validación
        this.currentShuffledAnswers = shuffledAnswers;
        
        // Cargar opciones de respuesta aleatorizadas
        const answersContainer = document.getElementById('answers-container');
        answersContainer.innerHTML = '';
        
        shuffledAnswers.forEach((answer, displayIndex) => {
            const answerButton = document.createElement('button');
            answerButton.className = 'answer-option';
            answerButton.innerHTML = `
                <span class="answer-letter">${String.fromCharCode(65 + displayIndex)}</span>
                <span class="answer-text">${answer.text}</span>
            `;
            answerButton.onclick = () => this.selectAnswer(displayIndex);
            answersContainer.appendChild(answerButton);
        });
        
        // Limpiar explicación anterior
        document.getElementById('explanation-text').textContent = '';
        document.getElementById('answer-explanation').style.display = 'none';
    }
    
    selectAnswer(displayIndex) {
        const question = window.prostateCancerQuestions[this.currentQuestion];
        const selectedAnswer = this.currentShuffledAnswers[displayIndex];
        const isCorrect = selectedAnswer.isCorrect;
        
        // Marcar respuesta seleccionada
        const answerButtons = document.querySelectorAll('.answer-option');
        answerButtons.forEach(btn => btn.classList.remove('selected', 'correct', 'incorrect'));
        
        // Marcar la selección del usuario
        answerButtons[displayIndex].classList.add('selected');
        answerButtons[displayIndex].classList.add(isCorrect ? 'correct' : 'incorrect');
        
        // Marcar la respuesta correcta (puede ser diferente a la seleccionada)
        this.currentShuffledAnswers.forEach((answer, idx) => {
            if (answer.isCorrect && idx !== displayIndex) {
                answerButtons[idx].classList.add('correct');
            }
        });
        
        // Mostrar explicación
        document.getElementById('explanation-text').textContent = question.explanation;
        document.getElementById('answer-explanation').style.display = 'block';
        
        // Actualizar puntuación y estadísticas
        if (isCorrect) {
            this.correctAnswers++;
            this.detectedAnomalies++; // Para sistema de puntuación
            this.addScore(300);
            this.showFeedback('¡Correcto! 🎉', 'success');
        } else {
            this.lives--;
            this.updateHUD();
            this.showFeedback('Incorrecto. Aprende de esta explicación. 📚', 'error');
            
            if (this.lives === 0) {
                setTimeout(() => this.gameOver(), 2000);
                return;
            }
        }
        
        // Habilitar botón de siguiente pregunta
        setTimeout(() => {
            const btnNext = document.getElementById('btn-next-question');
            if (btnNext) {
                btnNext.disabled = false;
                btnNext.focus();
            }
        }, 1500);
    }
    
    nextQuestion() {
        document.getElementById('btn-next-question').disabled = true;
        
        if (this.currentQuestion < this.totalQuestions - 1) {
            this.loadQuestion(this.currentQuestion + 1);
        } else {
            // Quiz completado
            this.finishQuiz();
        }
    }
    
    finishQuiz() {
        console.log('✅ Quiz completado');
        const accuracy = (this.correctAnswers / this.totalQuestions) * 100;
        
        if (accuracy >= 70) {
            this.addScore(1000); // Bonus por buen desempeño
            this.finishGame();
        } else {
            this.showAlert(
                `Has respondido correctamente ${this.correctAnswers} de ${this.totalQuestions} preguntas (${accuracy.toFixed(0)}%). Necesitas al menos 70% para continuar. ¡Repasemos los conceptos importantes!`,
                '📚 Repaso Necesario',
                '📖'
            ).then(() => {
                this.startQuiz(); // Reintentar
            });
        }
    }
    
    // ============================================
    // SISTEMA DE PUNTUACIÓN Y FINALIZACIÓN
    // ============================================
    
    updateHUD() {
        // Actualizar vidas
        const livesContainer = document.getElementById('lives-count');
        if (livesContainer) {
            livesContainer.textContent = this.lives;
            
            // Cambiar color según vidas restantes
            if (this.lives === 1) {
                livesContainer.style.color = '#e63946';
            } else if (this.lives === 2) {
                livesContainer.style.color = '#ff9800';
            } else {
                livesContainer.style.color = '#06d6a0';
            }
        }
        
        // Actualizar puntuación
        const scoreContainer = document.getElementById('score-count');
        if (scoreContainer) {
            scoreContainer.textContent = this.score;
        }
    }
    
    addScore(points) {
        this.score += points;
        this.updateHUD();
        
        // Animación de puntuación
        this.showScoreAnimation(points);
    }
    
    showScoreAnimation(points) {
        const animation = document.createElement('div');
        animation.className = 'score-popup';
        animation.textContent = `+${points}`;
        animation.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 3rem;
            font-weight: bold;
            color: #06d6a0;
            animation: scoreFloat 1s ease-out forwards;
            z-index: 10000;
            pointer-events: none;
        `;
        
        document.body.appendChild(animation);
        setTimeout(() => animation.remove(), 1000);
    }
    
    showFeedback(message, type) {
        const feedback = document.createElement('div');
        feedback.className = `feedback-message ${type}`;
        feedback.textContent = message;
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            background: ${type === 'success' ? '#06d6a0' : '#e63946'};
            color: white;
            border-radius: 8px;
            font-weight: bold;
            animation: slideIn 0.3s ease-out;
            z-index: 10000;
        `;
        
        document.body.appendChild(feedback);
        setTimeout(() => feedback.remove(), 3000);
    }
    
    async finishGame() {
        console.log('🏁 Finalizando juego...');
        clearInterval(this.timer);
        
        this.currentPhase = 'results';
        
        // Calcular tiempo usado
        const timeTaken = Math.floor((Date.now() - this.gameStartTime) / 1000);
        const accuracy = (this.correctAnswers / this.totalQuestions) * 100;
        
        // Mostrar pantalla de resultados
        this.showResults(timeTaken, accuracy);
        
        // Guardar puntuación
        if (window.authClient && window.authClient.isAuthenticated()) {
            await this.submitScore(timeTaken);
        }
    }
    
    showResults(timeTaken, accuracy) {
        // Actualizar elementos de resultado
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-accuracy').textContent = accuracy.toFixed(1) + '%';
        document.getElementById('final-time').textContent = this.formatTime(timeTaken);
        document.getElementById('questions-correct').textContent = `${this.correctAnswers}/${this.totalQuestions}`;
        
        // Determinar calificación
        let grade, message;
        if (accuracy >= 90) {
            grade = 'A+';
            message = '¡Excelente! Eres un experto en salud prostática 🏆';
        } else if (accuracy >= 80) {
            grade = 'A';
            message = '¡Muy bien! Tienes sólidos conocimientos 🌟';
        } else if (accuracy >= 70) {
            grade = 'B';
            message = 'Buen trabajo. Sigue aprendiendo 📚';
        } else {
            grade = 'C';
            message = 'Repasa los conceptos importantes 📖';
        }
        
        document.getElementById('final-grade').textContent = grade;
        document.getElementById('result-message').textContent = message;
        
        this.showScreen('results-screen');
    }
    
    async submitScore(timeTaken) {
        try {
            console.log('💾 Guardando puntuación...');
            
            // Para el nivel de próstata usamos respuestas correctas, no anomalías
            const scoreData = {
                level_type: 'prostata',
                score: this.score,
                time_taken: timeTaken,
                anomalies_found: this.correctAnswers,  // Respuestas correctas del quiz
                total_anomalies: this.totalQuestions    // Total de preguntas
            };
            
            console.log('📊 Datos a enviar:', scoreData);
            
            const result = await window.authClient.submitScore(scoreData);
            console.log('✅ Puntuación guardada:', result);
            
        } catch (error) {
            console.error('❌ Error guardando puntuación:', error);
            // Mostrar notificación al usuario
            this.showNotification('Error al guardar puntuación. Inténtalo de nuevo.', 'error');
        }
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    gameOver() {
        this.showAlert(
            'Has perdido todas tus vidas. No te preocupes, el aprendizaje es un proceso. ¿Quieres intentarlo de nuevo?',
            '💔 Game Over',
            '💔'
        ).then(() => {
            window.location.reload();
        });
    }
    
    // ============================================
    // FUNCIONES AUXILIARES
    // ============================================
    
    calculateRisk() {
        const checkedFactors = document.querySelectorAll('.risk-factor:checked');
        const riskCount = checkedFactors.length;
        
        let riskLevel, message, color;
        
        if (riskCount === 0) {
            riskLevel = 'Riesgo Promedio';
            message = 'Continúa con chequeos regulares a partir de los 50 años.';
            color = '#06d6a0';
        } else if (riskCount === 1) {
            riskLevel = 'Riesgo Moderado';
            message = 'Considera comenzar chequeos a los 45 años. Consulta con tu médico.';
            color = '#ff9800';
        } else {
            riskLevel = 'Riesgo Alto';
            message = 'Habla con tu médico sobre comenzar chequeos a los 40-45 años.';
            color = '#e63946';
        }
        
        const resultDiv = document.getElementById('risk-result');
        resultDiv.innerHTML = `
            <div style="padding: 15px; background: ${color}20; border-left: 4px solid ${color}; margin-top: 15px;">
                <h5 style="color: ${color}; margin: 0 0 10px 0;">${riskLevel}</h5>
                <p style="margin: 0;">${message}</p>
            </div>
        `;
    }
    
    updatePSAVisual(value) {
        document.getElementById('psa-value').textContent = value + ' ng/mL';
        
        let interpretation, color;
        
        if (value <= 4) {
            interpretation = '✅ Normal - Continuar con chequeos regulares';
            color = '#06d6a0';
        } else if (value <= 10) {
            interpretation = '⚠️ Límite - Se requiere evaluación adicional';
            color = '#ff9800';
        } else {
            interpretation = '🚨 Elevado - Consulta urológica inmediata necesaria';
            color = '#e63946';
        }
        
        const interpDiv = document.getElementById('psa-interpretation');
        interpDiv.textContent = interpretation;
        interpDiv.style.color = color;
        interpDiv.style.fontWeight = 'bold';
    }
    
    showNotification(message, type = 'info') {
        const container = document.getElementById('notifications');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icon = type === 'success' ? '✅' : 
                    type === 'error' ? '❌' : 
                    type === 'warning' ? '⚠️' : 'ℹ️';
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.5rem;">${icon}</span>
                <span>${message}</span>
            </div>
        `;
        
        container.appendChild(notification);
        
        // Eliminar después de 4 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }
    
    // Modal personalizado para reemplazar alert()
    showAlert(message, title = '¡Atención!', icon = '⚠️') {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'custom-modal-overlay';
            
            overlay.innerHTML = `
                <div class="custom-modal">
                    <div class="modal-icon warning">${icon}</div>
                    <h3 class="modal-title">${title}</h3>
                    <p class="modal-message">${message}</p>
                    <div class="modal-actions">
                        <button class="modal-btn modal-btn-primary" id="modal-ok-btn">
                            <i class="fas fa-check"></i>
                            Aceptar
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(overlay);
            
            const okBtn = overlay.querySelector('#modal-ok-btn');
            okBtn.addEventListener('click', () => {
                overlay.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => {
                    overlay.remove();
                    resolve(true);
                }, 300);
            });
        });
    }
    
    // Modal personalizado para reemplazar confirm()
    showConfirm(message, title = '¿Confirmar?', confirmText = 'Sí', cancelText = 'No') {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'custom-modal-overlay';
            
            overlay.innerHTML = `
                <div class="custom-modal">
                    <div class="modal-icon warning">⚠️</div>
                    <h3 class="modal-title">${title}</h3>
                    <p class="modal-message">${message}</p>
                    <div class="modal-actions">
                        <button class="modal-btn modal-btn-secondary" id="modal-cancel-btn">
                            <i class="fas fa-times"></i>
                            ${cancelText}
                        </button>
                        <button class="modal-btn modal-btn-danger" id="modal-confirm-btn">
                            <i class="fas fa-check"></i>
                            ${confirmText}
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(overlay);
            
            const confirmBtn = overlay.querySelector('#modal-confirm-btn');
            const cancelBtn = overlay.querySelector('#modal-cancel-btn');
            
            const closeModal = (result) => {
                overlay.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => {
                    overlay.remove();
                    resolve(result);
                }, 300);
            };
            
            confirmBtn.addEventListener('click', () => closeModal(true));
            cancelBtn.addEventListener('click', () => closeModal(false));
            
            // Cerrar con ESC
            overlay.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') closeModal(false);
            });
        });
    }
    
    // Función para aleatorizar array (Fisher-Yates shuffle)
    shuffleArray(array) {
        const shuffled = [...array]; // Crear copia
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    goBack() {
        this.showConfirm(
            'Se perderá todo tu progreso actual.',
            '¿Salir del nivel?',
            'Salir',
            'Continuar jugando'
        ).then(confirmed => {
            if (confirmed) {
                window.location.href = '/index.html';
            }
        });
    }
    
    restartLevel() {
        window.location.reload();
    }
    
    returnToMenu() {
        window.location.href = '/index.html';
    }
}

// ============================================
// INICIALIZAR JUEGO
// ============================================

let prostateCancerGame;

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Página de Cáncer de Próstata cargada');
    
    // Inicializar AuthClient
    if (!window.authClient) {
        window.authClient = new AuthClient();
    }
    
    // Crear instancia del juego
    prostateCancerGame = new ProstateCancerGame();
    prostateCancerGame.init();
    
    console.log('✅ Juego de Cáncer de Próstata listo');
});

console.log('📦 Módulo de Cáncer de Próstata cargado');
