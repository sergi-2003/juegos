// ============================================
// JUEGO DE CÁNCER DE COLON - NIVEL FINAL
// ============================================

class ColonCancerGame {
    constructor() {
        console.log('🎮 Inicializando Centro de Prevención del Colon...');
        
        this.currentPhase = 'intro';
        this.score = 0;
        this.lives = 3;
        this.gameTime = 480; // 8 minutos
        this.isPaused = false;
        this.timer = null;
        this.startTime = null;
        this.gameOverByLoss = false;
        
        // Progress tracking
        this.phaseProgress = {
            riskFactors: { completed: 0, total: 12, perfect: true },
            polyps: { completed: 0, total: 8, perfect: true },
            diet: { completed: 0, total: 15, perfect: true },
            symptoms: { completed: 0, total: 10, perfect: true },
            screening: { completed: false, perfect: true }
        };
        
        this.achievements = [];
        this.draggedElement = null;
        this.currentPolypIndex = 0;
        this.currentCaseIndex = 0;
        this.currentScenarioIndex = 0;
        this.plateScore = 0;
        
        this.init();
    }
    
    init() {
        console.log('🏥 Configurando Centro de Prevención del Colon...');
        
        // Event listeners
        document.getElementById('start-game').addEventListener('click', () => this.startGame());
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('retry-btn')?.addEventListener('click', () => location.reload());
        document.getElementById('menu-btn')?.addEventListener('click', () => window.location.href = 'index.html');
        
        // Hide loading screen
        setTimeout(() => {
            document.getElementById('loading-screen').classList.add('hidden');
        }, 2000);
    }
    
    startGame() {
        console.log('🚀 Iniciando nivel de colon...');
        this.startTime = Date.now();
        this.startTimer();
        this.showPhase('risk-factors');
        this.initRiskFactorsPhase();
    }
    
    showPhase(phaseName) {
        document.querySelectorAll('.game-phase').forEach(phase => {
            phase.classList.remove('active');
        });
        
        const phase = document.getElementById(`${phaseName}-phase`);
        if (phase) {
            phase.classList.add('active');
            this.currentPhase = phaseName;
        }
    }
    
    // ============================================
    // FASE 1: FACTORES DE RIESGO
    // ============================================
    
    initRiskFactorsPhase() {
        console.log('⚖️ Iniciando fase de factores de riesgo...');
        this.createRiskItems();
        this.setupRiskDragDrop();
        this.setupContinueButton();
        this.updateProgress('risk');
        
        // DETECTAR BOTÓN CADA MEDIO SEGUNDO - SÚPER AGRESIVO
        this.completionChecker = setInterval(() => {
            const progressElement = document.getElementById('risk-progress');
            const floatingButton = document.getElementById('floating-continue');
            
            if (progressElement && floatingButton) {
                const progressText = progressElement.textContent.trim();
                const isComplete = progressText === '12/12';
                const isButtonHidden = floatingButton.style.display === 'none' || 
                                      window.getComputedStyle(floatingButton).display === 'none';
                
                if (isComplete && isButtonHidden) {
                    console.log('🚨 FORZANDO BOTÓN: Progreso 12/12 detectado');
                    floatingButton.style.display = 'block';
                    floatingButton.style.visibility = 'visible';
                    floatingButton.style.opacity = '1';
                    floatingButton.style.zIndex = '99999';
                    
                    clearInterval(this.completionChecker);
                    this.completionChecker = null;
                }
            }
        }, 500);
        
        // Hacer la instancia global para debugging
        window.colonGame = this;
        
        // BOTÓN DE EMERGENCIA - SI NO APARECE EN 15 SEGUNDOS, FORZAR
        setTimeout(() => {
            const progressElement = document.getElementById('risk-progress');
            const floatingButton = document.getElementById('floating-continue');
            
            if (progressElement && progressElement.textContent === '12/12' && 
                floatingButton && floatingButton.style.display === 'none') {
                console.log('🚨 EMERGENCIA: Forzando botón después de 15s');
                floatingButton.style.display = 'block';
            }
        }, 15000);
        
        // Función global de emergencia manual
        window.showButton = () => {
            const floatingButton = document.getElementById('floating-continue');
            if (floatingButton) {
                floatingButton.style.display = 'block';
                console.log('🚨 BOTÓN FORZADO MANUALMENTE');
            }
        };
    }
    
    createRiskItems() {
        const container = document.getElementById('risk-items');
        if (!container) {
            console.error('❌ ERROR: No se encontró el contenedor risk-items');
            return;
        }
        container.innerHTML = '';
        
        // Mezclar factores
        const shuffled = [...COLON_DATA.riskFactors].sort(() => Math.random() - 0.5);
        console.log(`📦 Creando ${shuffled.length} elementos de riesgo:`, shuffled.map(f => f.name));
        
        shuffled.forEach(factor => {
            const item = document.createElement('div');
            item.className = 'risk-item';
            item.draggable = true;
            item.dataset.id = factor.id;
            item.dataset.type = factor.type;
            item.innerHTML = `
                <div class="item-icon">${factor.icon}</div>
                <div class="item-name">${factor.name}</div>
            `;
            
            item.addEventListener('dragstart', (e) => this.handleDragStart(e));
            item.addEventListener('dragend', (e) => this.handleDragEnd(e));
            
            container.appendChild(item);
        });
        
        console.log(`✅ ${container.children.length} elementos creados correctamente`);
    }
    
    setupRiskDragDrop() {
        const zones = document.querySelectorAll('.zone-content[data-zone]');
        zones.forEach(zone => {
            zone.addEventListener('dragover', (e) => this.handleDragOver(e));
            zone.addEventListener('drop', (e) => this.handleRiskDrop(e));
        });
    }
    
   handleDragStart(e) {
    this.draggedElement = e.currentTarget; // ✅ el .food-item o .risk-item real
    e.currentTarget.classList.add('dragging');

    // Mejora compatibilidad (especialmente Firefox)
    if (e.dataTransfer) {
        e.dataTransfer.setData('text/plain', '');
        e.dataTransfer.effectAllowed = 'move';
    }
}

handleDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
}

    
    handleDragOver(e) {
        e.preventDefault();
    }
    
    handleRiskDrop(e) {
        e.preventDefault();
        
        console.log('🎯 Drop detectado');
        
        if (!this.draggedElement) {
            console.warn('⚠️ No hay elemento siendo arrastrado');
            return;
        }
        
        const zone = e.target.closest('[data-zone]');
        if (!zone) {
            console.warn('⚠️ No se encontró zona válida');
            return;
        }
        
        const zoneType = zone.dataset.zone;
        const itemType = this.draggedElement.dataset.type;
        const itemId = this.draggedElement.dataset.id;
        
        console.log(`🧩 Evaluando: ${this.draggedElement.querySelector('.item-name').textContent} (tipo: ${itemType}) en zona: ${zoneType}`);
        
        const factor = COLON_DATA.riskFactors.find(f => f.id === itemId);
        console.log(`🔍 Buscando factor con ID: "${itemId}" - Encontrado:`, factor);
        
        if ((zoneType === 'protection' && itemType === 'protection') ||
            (zoneType === 'danger' && itemType === 'danger')) {
            // Correcto
            this.draggedElement.classList.add('correct');
            this.draggedElement.draggable = false;
            zone.appendChild(this.draggedElement);
            this.addScore(factor.points);
            this.showFeedback('✅ ¡Correcto! ' + factor.explanation, 'success');
            this.phaseProgress.riskFactors.completed++;
            this.updateProgress('risk');
            
            // Verificar si completó la fase (IGUAL QUE CERVICAL)
            if (this.phaseProgress.riskFactors.completed === this.phaseProgress.riskFactors.total) {
                setTimeout(() => this.completeRiskFactorsPhase(), 1000);
            }
        } else {
            // Incorrecto
            this.loseLife();
            this.phaseProgress.riskFactors.perfect = false;
            this.showFeedback('❌ Zona incorrecta. Intenta de nuevo.', 'error');
            console.log(`❌ Factor incorrecto: ${itemType} no va en ${zoneType}`);
        }
        
        this.draggedElement = null;
    }
    
    
completeRiskFactorsPhase() {
  this.showFeedback(
    '✅ ¡Fase de Factores de Riesgo completada! Iniciando Nutrición Preventiva...',
    'success'
  );

  if (this.phaseProgress.riskFactors.perfect) {
    this.unlockAchievement('risk_master');
    this.addScore(500);
  }

  setTimeout(() => {
    this.showPhase('diet');
    this.initDietPhase();
  }, 1500);
}


setupContinueButton() {
  const button = document.getElementById('continue-to-colonoscopy');
  if (!button) return;

  button.addEventListener('click', () => {
    if (this.completionChecker) {
      clearInterval(this.completionChecker);
      this.completionChecker = null;
    }

    this.showPhase('diet');
    this.initDietPhase();
  });
}


    
    showContinueButton() {
        const button = document.getElementById('continue-to-colonoscopy');
        if (button) {
            button.disabled = false;
            button.classList.remove('disabled');
           button.innerHTML = `
  <i class="fas fa-search"></i>
  <span>Continuar a Pólipos</span>
  <i class="fas fa-arrow-right"></i>
`;

            console.log('✅ Botón habilitado - Todas las tarjetas colocadas');
        }
    }
    
    // Función de emergencia para contar elementos colocados
    checkCompletionManually() {
        try {
            // Verificar por múltiples métodos
            const protectionZone = document.querySelector('[data-zone="protection"]');
            const dangerZone = document.querySelector('[data-zone="danger"]');
            
            const protectionCount = protectionZone ? protectionZone.children.length : 0;
            const dangerCount = dangerZone ? dangerZone.children.length : 0;
            const total = protectionCount + dangerCount;
            
            // También verificar por el progreso visual 
            const progressElement = document.getElementById('risk-progress');
            const progressText = progressElement ? progressElement.textContent : '0/12';
            
            console.log(`🔢 Verificación: DOM=${total}, Progreso=${progressText}`);
            
            // Si detecta 12 elementos colocados o progreso 12/12, MOSTRAR BOTÓN
            if (total >= 12 || progressText === '12/12') {
                console.log('🎯 ¡COMPLETITUD DETECTADA! Mostrando botón verde...');
                
                const floatingButton = document.getElementById('floating-continue');
                if (floatingButton) {
                    floatingButton.style.display = 'block';
                    console.log('✅ ¡BOTÓN VERDE VISIBLE!');
                }
                
                // Detener el checker
                if (this.completionChecker) {
                    clearInterval(this.completionChecker);
                    this.completionChecker = null;
                }
                
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('❌ Error en checkCompletionManually:', error);
            // En caso de error, forzar habilitación si el progreso dice 12/12
            const progressElement = document.getElementById('risk-progress');
            if (progressElement && progressElement.textContent === '12/12') {
                this.forceShowContinueButton();
            }
            return false;
        }
    }
    
    // Función para habilitar el botón cuando se completa
    forceShowContinueButton() {
  console.log('🎯 ¡12 elementos colocados! Habilitando botón...');
  const button = document.getElementById('continue-to-colonoscopy');
  if (button) {
    button.disabled = false;
    button.classList.remove('disabled');
    button.innerHTML = `
      <i class="fas fa-search"></i>
      <span>Continuar a Pólipos</span>
      <i class="fas fa-arrow-right"></i>
    `;
    console.log('✅ Botón habilitado - Listo para continuar');
  }
}

    
    // ============================================
    // FASE 2: COLONOSCOPÍA VIRTUAL
    // ============================================
    
    
    // ============================================
    // FASE 3: DETECTOR DE PÓLIPOS
    // ============================================
    
        
    // ============================================
    // FASE 4: DIETA SALUDABLE
    // ============================================
   // ============================================
// FASE 2: NUTRICIÓN (DIET) - FIX PC + MÓVIL
// ============================================

initDietPhase() {
  console.log('🍎 Iniciando fase de nutrición...');
  this.plateScore = 0;
  this.phaseProgress.diet.completed = 0;
  this.phaseProgress.diet.perfect = true;

  this.createFoodItems();
  this.setupPlateDragDrop();
  this.setupPlateTouchDrag();     // ✅ MÓVIL
  this.updateProgress('diet');
}

createFoodItems() {
  const container = document.getElementById('food-items');
  if (!container) {
    console.error('❌ No existe #food-items');
    return;
  }

  container.innerHTML = '';

  COLON_DATA.foods.forEach(food => {
    const item = document.createElement('div');
    item.className = 'food-item';
    item.draggable = true;

    item.dataset.id = food.id;
    item.dataset.category = food.category;
    item.dataset.score = food.healthScore;

    item.innerHTML = `
      <div class="food-icon">${food.icon}</div>
      <div class="food-name">${food.name}</div>
      <div class="food-score">${food.healthScore}</div>
    `;

    // ✅ Desktop drag
    item.addEventListener('dragstart', (e) => this.handleDragStart(e));
    item.addEventListener('dragend', (e) => this.handleDragEnd(e));

    // ✅ Recomendado móvil (no selecciona texto / permite scroll normal)
    item.style.userSelect = 'none';
    item.style.touchAction = 'pan-y';

    container.appendChild(item);
  });
}

setupPlateDragDrop() {
  const sections = document.querySelectorAll('.plate-section');
  sections.forEach(section => {
    section.addEventListener('dragover', (e) => this.handleDragOver(e));
    section.addEventListener('drop', (e) => this.handleFoodDrop(e));
  });

  // ✅ No dupliques listeners si entras/sales de fases
  const verifyBtn = document.getElementById('verify-plate');
  if (verifyBtn) {
    verifyBtn.onclick = () => this.verifyPlate();
  }
}

// ✅ PC (drop nativo)
handleFoodDrop(e) {
  e.preventDefault();
  if (!this.draggedElement) return;

  const section = e.target.closest('.plate-section');
  if (!section) {
    this.showFeedback('❌ Suelta el alimento dentro de una sección del plato', 'error');
    this.draggedElement = null; // ✅ evita que quede “pegado”
    return;
  }

  this.processFoodDrop(section, this.draggedElement);
  this.draggedElement = null;
}

// ✅ lógica común (PC + móvil)
processFoodDrop(section, item) {
  const foodCategory = item.dataset.category;
  const sectionCategory = section.dataset.category;

  if (foodCategory === sectionCategory) {
    section.appendChild(item);
    item.classList.add('on-plate');

    item.draggable = false;
    item.setAttribute('draggable', 'false');

    const score = parseInt(item.dataset.score, 10) || 0;
    this.plateScore += score;

    this.updatePlateScore();
    this.phaseProgress.diet.completed++;
    this.updateProgress('diet');
  } else {
    const label = section.querySelector('.section-label')?.textContent || 'esa sección';
    this.phaseProgress.diet.perfect = false;
    this.showFeedback(`❌ Este alimento no pertenece a ${label}`, 'error');
  }
}

// ✅ MÓVIL/TABLET - Touch drag con long-press
setupPlateTouchDrag() {
  if (!this.isTouchDevice || !this.isTouchDevice()) return;

  const host = document.getElementById('food-items');
  if (!host) return;

  const dropTargetsSelector = '.plate-section';

  host.addEventListener('pointerdown', (e) => {
    const item = e.target.closest('.food-item');
    if (!item) return;
    if (item.draggable === false || item.getAttribute('draggable') === 'false') return;

    let dragging = false;
    const startX = e.clientX;
    const startY = e.clientY;
    const prevOverflow = document.body.style.overflow;

    const startDrag = () => {
      dragging = true;
      this.draggedElement = item;

      document.body.style.overflow = 'hidden';

      item.classList.add('dragging-touch');
      item.style.position = 'fixed';
      item.style.zIndex = '999999';
      item.style.pointerEvents = 'none';
      item.style.transform = 'translate(-50%, -50%)';

      item.style.left = e.clientX + 'px';
      item.style.top = e.clientY + 'px';
    };

    const pressTimer = setTimeout(startDrag, 180);

    const onMove = (ev) => {
      const dx = Math.abs(ev.clientX - startX);
      const dy = Math.abs(ev.clientY - startY);

      // si el usuario se mueve antes del long-press: era scroll
      if (!dragging && (dx > 8 || dy > 8)) {
        clearTimeout(pressTimer);
        cleanup(false);
        return;
      }

      if (!dragging) return;
      ev.preventDefault();

      item.style.left = ev.clientX + 'px';
      item.style.top = ev.clientY + 'px';
    };

    const onUp = (ev) => {
      clearTimeout(pressTimer);

      if (!dragging) {
        cleanup(false);
        return;
      }

      const targets = Array.from(document.querySelectorAll(dropTargetsSelector));
      const droppedSection = this.findDropTargetByIntersection(item, targets);

      cleanup(true);

      if (droppedSection) {
        this.processFoodDrop(droppedSection, item);
      } else {
        this.showFeedback('❌ Suelta dentro de una sección del plato', 'error');
      }

      this.draggedElement = null;
    };

    const cleanup = (wasDragging) => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);

      if (wasDragging) {
        item.classList.remove('dragging-touch');
        item.style.position = '';
        item.style.left = '';
        item.style.top = '';
        item.style.zIndex = '';
        item.style.pointerEvents = '';
        item.style.transform = '';
        document.body.style.overflow = prevOverflow;
      }
    };

    document.addEventListener('pointermove', onMove, { passive: false });
    document.addEventListener('pointerup', onUp, { passive: false });
  }, { passive: true });
}

// ✅ helper para detectar a qué sección lo soltó (por intersección)
findDropTargetByIntersection(dragEl, targets) {
  const r1 = dragEl.getBoundingClientRect();
  let best = null;
  let bestArea = 0;

  targets.forEach(t => {
    const r2 = t.getBoundingClientRect();
    const x = Math.max(0, Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left));
    const y = Math.max(0, Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top));
    const area = x * y;

    if (area > bestArea) {
      bestArea = area;
      best = t;
    }
  });

  return bestArea > 10 ? best : null;
}

updatePlateScore() {
  const maxScore = 100 * 15; // 15 alimentos máximo
  const percentage = Math.min((this.plateScore / maxScore) * 100, 100);

  const fill = document.getElementById('plate-score-fill');
  const txt = document.getElementById('plate-score-text');

  if (fill) fill.style.width = percentage + '%';
  if (txt) txt.textContent = Math.round(percentage) + '/100';
}

verifyPlate() {
  if (this.plateScore >= 1200) {
    this.addScore(this.plateScore);
    this.showFeedback('✅ ¡Plato saludable perfecto!', 'success');
    this.completeDietPhase();
  } else {
    this.showFeedback('⚠️ Mejora tu plato con más alimentos saludables', 'warning');
  }
}

completeDietPhase() {
  if (this.phaseProgress.diet.perfect) {
    this.unlockAchievement?.('nutrition_guru');
    this.addScore(800);
  }

  setTimeout(() => {
    this.showPhase('symptoms');
    this.initSymptomsPhase();
  }, 1500);
}

    
    // ============================================
    // FASE 5: SÍNTOMAS CHECKER
    // ============================================
    
    initSymptomsPhase() {
        console.log('⚠️ Iniciando identificador de síntomas...');
        this.currentCaseIndex = 0;
        this.phaseProgress.symptoms.completed = 0; // Resetear contador
        this.showCurrentCase();
        this.setupSymptomsControls();
        this.updateProgress('symptoms');
    }
    
    showCurrentCase() {
        const caseData = COLON_DATA.symptomCases[this.currentCaseIndex];
        
        document.getElementById('case-number').textContent = this.currentCaseIndex + 1;
        document.getElementById('patient-info').innerHTML = `
            <p><strong>Edad:</strong> ${caseData.age} años</p>
            <p><strong>Género:</strong> ${caseData.gender}</p>
            <p><strong>Duración:</strong> ${caseData.duration}</p>
            <p><strong>Historial familiar:</strong> ${caseData.familyHistory ? 'Sí' : 'No'}</p>
        `;
        
        document.getElementById('symptoms-list').innerHTML = `
            <h4>Síntomas reportados:</h4>
            <ul>
                ${caseData.symptoms.map(s => `<li>${s}</li>`).join('')}
            </ul>
        `;
        
        // Medidor de urgencia
        const urgencyMeter = document.getElementById('urgency-meter');
        urgencyMeter.className = 'urgency-meter ' + caseData.urgencyLevel;
    }
    
    setupSymptomsControls() {
        const buttons = document.querySelectorAll('.action-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => this.evaluateCase(btn.dataset.action));
        });
    }
    
    evaluateCase(action) {
        const caseData = COLON_DATA.symptomCases[this.currentCaseIndex];
        
        if (action === caseData.correctAction) {
            this.addScore(caseData.points);
            this.showFeedback(`✅ Correcto! ${caseData.explanation}`, 'success');
            this.phaseProgress.symptoms.completed++;
            this.updateProgress('symptoms');
            
            this.currentCaseIndex++;
            if (this.currentCaseIndex < COLON_DATA.symptomCases.length) {
                setTimeout(() => this.showCurrentCase(), 1000);
            } else {
                setTimeout(() => this.completeSymptomsPhase(), 1000);
            }
        } else {
            this.loseLife();
            this.phaseProgress.symptoms.perfect = false;
            this.showFeedback('❌ Evaluación incorrecta', 'error');
        }
    }
    
    completeSymptomsPhase() {
        if (this.phaseProgress.symptoms.perfect) {
            this.unlockAchievement('symptom_detective');
            this.addScore(1000);
        }
        this.showFeedback('✅ ¡Fase de síntomas completada!', 'success');
        setTimeout(() => {
            this.completeGame();
        }, 1500);
    }
    
    // ============================================
    // FASE 6: CALENDARIO DE SCREENING
    // ============================================
    
   
    // ============================================
    // SISTEMA DE JUEGO
    // ============================================
    
    startTimer() {
        this.timer = setInterval(() => {
            if (!this.isPaused) {
                this.gameTime--;
                this.updateHUD();
                
                if (this.gameTime <= 0) {
                    this.timeUp();
                }
            }
        }, 1000);
    }
    
    updateHUD() {
        const minutes = Math.floor(this.gameTime / 60);
        const seconds = this.gameTime % 60;
        document.getElementById('timer').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('current-score').textContent = this.score;
    }
    
    updateProgress(phase) {
        // Mapear nombres cortos a nombres completos del objeto
        const phaseMap = {
            'risk': 'riskFactors',
            'polyps': 'polyps',
            'diet': 'diet',
            'symptoms': 'symptoms',
            'screening': 'screening'
        };
        
        const phaseName = phaseMap[phase] || phase;
        const progress = this.phaseProgress[phaseName];
        
        if (!progress) {
            console.warn(`⚠️ Fase no encontrada: ${phase} (buscando ${phaseName})`);
            return;
        }
        
        let element;
        if (phase === 'risk') {
            element = document.getElementById('risk-progress');
        } else {
            element = document.getElementById(`${phase}-progress`);
        }
        
        if (element && progress.total) {
            element.textContent = `${progress.completed}/${progress.total}`;
        }
    }
    
    addScore(points) {
        this.score += points;
        this.updateHUD();
    }
    
    loseLife() {
        if (this.lives > 0) {
            this.lives--;
            const heart = document.getElementById(`heart${this.lives + 1}`);
            if (heart) {
                heart.classList.add('lost');
            }
            
            if (this.lives === 0) {
                this.gameOver();
            }
        }
    }
    
    showFeedback(message, type) {
        const feedback = document.createElement('div');
        feedback.className = `feedback-toast ${type}`;
        feedback.textContent = message;
        document.body.appendChild(feedback);
        
        setTimeout(() => feedback.classList.add('show'), 10);
        setTimeout(() => {
            feedback.classList.remove('show');
            setTimeout(() => feedback.remove(), 300);
        }, 3000);
    }
    
    unlockAchievement(achievementId) {
        if (!this.achievements.includes(achievementId)) {
            this.achievements.push(achievementId);
            const achievement = COLON_DATA.achievements.find(a => a.id === achievementId);
            if (achievement) {
                this.showFeedback(`🏆 ${achievement.name}!`, 'achievement');
            }
        }
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
    }
    
    timeUp() {
        clearInterval(this.timer);
        this.gameOver();
    }
    
    gameOver() {
        console.log('🎮 Game Over llamado');
        clearInterval(this.timer);
        this.gameOverByLoss = true;
        this.completeGame();
    }
    
    async completeGame() {
        console.log('🏆 Complete Game llamado');
        clearInterval(this.timer);
        
        const timeTaken = 480 - this.gameTime;
        
        // Bonificaciones
        if (!this.gameOverByLoss) {
            if (timeTaken < 360) {
                this.unlockAchievement('speed_champion');
                this.addScore(1500);
            }
            
            if (this.lives === 3) {
                this.unlockAchievement('perfect_game');
                this.addScore(2000);
            }
        }
        
        this.showVictoryScreen(timeTaken);
        
        // Guardar puntuación
        if (window.authClient && window.authClient.isAuthenticated()) {
            try {
                await this.submitScore(timeTaken);
                
                // Notificar completación del nivel si no fue por pérdida
                if (!this.gameOverByLoss) {
                    // Disparar evento de nivel completado
                    const levelCompletedEvent = new CustomEvent('level-completed', {
                        detail: {
                            levelType: 'colon',
                            score: this.score,
                            timeTaken: timeTaken,
                            isLastLevel: true
                        }
                    });
                    window.dispatchEvent(levelCompletedEvent);
                    
                    // Notificar al sistema de progresión
                    if (window.levelProgressionManager) {
                        window.levelProgressionManager.onLevelCompleted('colon', this.score);
                    }
                    
                    console.log('🎉 Evento de nivel completado disparado');
                }
                
            } catch (error) {
                console.error('Error guardando puntuación:', error);
            }
        }
    }
    
    showVictoryScreen(timeTaken) {
        const victoryTitle = document.querySelector('.victory-title');
        const trophyIcon = document.querySelector('.trophy-animation i');
        const nextLevelBtn = document.getElementById('next-level-btn');
        
        if (this.gameOverByLoss) {
            if (victoryTitle) {
                victoryTitle.textContent = '¡Nivel Fallido!';
                victoryTitle.style.color = '#ef4444';
            }
            if (trophyIcon) {
                trophyIcon.className = 'fas fa-times-circle';
                trophyIcon.style.color = '#ef4444';
            }
        } else {
            if (victoryTitle) {
                victoryTitle.textContent = '¡Centro Completado!';
            }
        }
        
        // Estadísticas
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-time').textContent = 
            `${Math.floor(timeTaken / 60)}:${(timeTaken % 60).toString().padStart(2, '0')}`;
        
        const accuracy = Math.round((this.score / COLON_GAME_CONFIG.maxScore) * 100);
        document.getElementById('final-accuracy').textContent = `${accuracy}%`;
        
        // Rango
        const rank = COLON_GAME_CONFIG.ranks.find(r => this.score >= r.min);
        const rankElement = document.getElementById('final-rank');
        rankElement.textContent = rank.name;
        rankElement.style.color = rank.color;
        
        // Logros
        const achievementsList = document.getElementById('achievements-list');
        achievementsList.innerHTML = this.achievements.map(achId => {
            const ach = COLON_DATA.achievements.find(a => a.id === achId);
            if (!ach) return '';
            return `
                <div class="achievement-badge">
                    <span class="ach-icon">${ach.icon}</span>
                    <div class="ach-info">
                        <strong>${ach.name}</strong>
                        <p>${ach.description}</p>
                    </div>
                </div>
            `;
        }).join('');
        
        // Puntos de aprendizaje
        document.getElementById('learning-points').innerHTML = 
            COLON_DATA.learningPoints.map(point => `<li>${point}</li>`).join('');
        
        // Mostrar pantalla
        document.querySelectorAll('.game-phase').forEach(phase => {
            phase.classList.remove('active');
        });
        
        const victoryScreen = document.getElementById('victory-screen');
        if (victoryScreen) {
            victoryScreen.classList.add('active');
        }
    }
    
    async submitScore(timeTaken) {
        try {
            const scoreData = {
                level_type: 'colon',
                score: this.score,
                time_taken: timeTaken,
                anomalies_found: Object.values(this.phaseProgress)
                    .reduce((sum, phase) => sum + (phase.completed || 0), 0),
                total_anomalies: Object.values(this.phaseProgress)
                    .reduce((sum, phase) => sum + (phase.total || 0), 0)
            };
            
            await window.authClient.submitScore(scoreData);
            console.log('✅ Puntuación guardada');
        } catch (error) {
            console.error('❌ Error al guardar puntuación:', error.message);
        }
    }
}

// Inicializar juego
document.addEventListener('DOMContentLoaded', () => {
    new ColonCancerGame();
});
