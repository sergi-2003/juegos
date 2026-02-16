'use strict';

// ============================================
// JUEGO DE CÁNCER CERVICAL
// ============================================

class CervicalCancerGame {
  constructor() {
    console.log('🎮 Inicializando Laboratorio Cervical...');

    this.currentPhase = 'intro';
    this.score = 0;
    this.lives = 3;

    // ✅ Tiempo total del nivel (10 minutos)
 this.TOTAL_TIME = GAME_CONFIG.totalTime; // ✅ usa config
this.gameTime = this.TOTAL_TIME;


    this.isPaused = false;
    this.timer = null;
    this.startTime = null;

    // Progress tracking
    this.phaseProgress = {
      timeline: { completed: 0, total: 5, perfect: true },
      pap: { completed: 0, total: 8, perfect: true },
      risks: { completed: 0, total: 12, perfect: true },
      myths: { completed: 0, total: 10, perfect: true },
      calendar: { completed: false, perfect: true },
    };

    this.achievements = [];
    this.draggedElement = null;

    // Flags
    this.gameOverByLoss = false;

    this.init();
  }

  init() {
    this.hideLoading();
    this.attachEventListeners();
    this.showPhase('intro');
    this.updateHUD(); // ✅ refleja 10:00 al cargar
  }

  hideLoading() {
    setTimeout(() => {
      const loading = document.getElementById('loading-screen');
      if (!loading) return;

      loading.style.opacity = '0';
      setTimeout(() => {
        loading.style.display = 'none';
      }, 500);
    }, 2000);
  }

  attachEventListeners() {
    // Botones principales
    document.getElementById('start-game-btn')?.addEventListener('click', () => this.startGame());
    document.getElementById('pause-btn')?.addEventListener('click', () => this.togglePause());
    document.getElementById('resume-btn')?.addEventListener('click', () => this.togglePause());
    document.getElementById('restart-btn')?.addEventListener('click', () => this.restartGame());
    document.getElementById('exit-btn')?.addEventListener('click', () => this.exitGame());

    // Botones de victoria
    document.getElementById('next-level-btn')?.addEventListener('click', () => this.nextLevel());
    document.getElementById('replay-btn')?.addEventListener('click', () => this.restartGame());
    document.getElementById('menu-btn')?.addEventListener('click', () => this.exitGame());

    // Controles del microscopio (stubs si no existen en tu clase)
    document.getElementById('zoom-in')?.addEventListener('click', () => this.zoom(1.2));
    document.getElementById('zoom-out')?.addEventListener('click', () => this.zoom(0.8));
    document.getElementById('rotate')?.addEventListener('click', () => this.rotateSample());

    // Debug: saltar fases (eliminar al terminar)
    document.addEventListener('keydown', (e) => {
      if (e.key === '1') {
        this.showPhase('timeline');
        this.initTimelinePhase();
      }
      if (e.key === '3') {
        this.showPhase('risk-factors');
        this.initRiskFactorsPhase();
      }
      if (e.key === '4') {
        this.showPhase('myths');
        this.initMythsPhase();
      }
      if (e.key === '9') {
        this.completeGame();
      }
    });
  }

  // Stubs para evitar errores si aún no implementas microscopio:
  zoom() {}
  rotateSample() {}

  startGame() {
    console.log('🎮 Iniciando juego...');
    this.startTime = Date.now();
    this.startTimer();
    this.showPhase('timeline');
    this.initTimelinePhase();
  }

  showPhase(phaseName) {
    document.querySelectorAll('.game-phase').forEach((phase) => phase.classList.remove('active'));

    const phase = document.getElementById(`${phaseName}-phase`);
    if (phase) {
      phase.classList.add('active');
      this.currentPhase = phaseName;
    }
  }

  // ============================================
  // FASE 1: LÍNEA DE TIEMPO VPH
  // ============================================

  initTimelinePhase() {
    console.log('📅 Iniciando fase de línea de tiempo...');
    this.createAgeMarkers();
    this.createVaccinationCards();
    this.updateProgress('timeline');
  }

  createAgeMarkers() {
    const container = document.getElementById('age-markers');
    if (!container) return;

    container.innerHTML = '';

    // Crear marcadores de edad de 5 a 30 años
    for (let age = 5; age <= 30; age += 1) {
      const marker = document.createElement('div');
      marker.className = 'age-marker';
      marker.dataset.age = String(age);
      marker.innerHTML = `
        <div class="marker-line"></div>
        ${age % 5 === 0 ? `<span class="age-label">${age}</span>` : ''}
      `;

      // Zona de drop desktop
      marker.addEventListener('dragover', (e) => this.handleDragOver(e));
      marker.addEventListener('drop', (e) => this.handleTimelineDrop(e, age));

      container.appendChild(marker);
    }
  }

  // ---------- MOBILE (Timeline) ----------
  handlePointerDownTimeline(e) {
    if (e.pointerType === 'mouse') return;
    e.preventDefault();

    const card = e.currentTarget;
    if (card.classList.contains('correct') || card.draggable === false) return;

    this.draggedElement = card;
    card.classList.add('dragging');

    const rect = card.getBoundingClientRect();
    card.style.position = 'fixed';
    card.style.left = rect.left + 'px';
    card.style.top = rect.top + 'px';
    card.style.width = rect.width + 'px';
    card.style.zIndex = 9999;
    card.style.pointerEvents = 'none';

    card.dataset.offsetX = String(e.clientX - rect.left);
    card.dataset.offsetY = String(e.clientY - rect.top);

    card.setPointerCapture(e.pointerId);

    this._onTimelineMove = (ev) => this.handlePointerMoveTimeline(ev);
    this._onTimelineUp = (ev) => this.handlePointerUpTimeline(ev);

    card.addEventListener('pointermove', this._onTimelineMove);
    card.addEventListener('pointerup', this._onTimelineUp);
    card.addEventListener('pointercancel', this._onTimelineUp);
  }

  handlePointerMoveTimeline(e) {
    if (!this.draggedElement) return;
    e.preventDefault();

    const card = this.draggedElement;
    const ox = parseFloat(card.dataset.offsetX || '0');
    const oy = parseFloat(card.dataset.offsetY || '0');

    card.style.left = e.clientX - ox + 'px';
    card.style.top = e.clientY - oy + 'px';
  }

  handlePointerUpTimeline(e) {
    if (!this.draggedElement) return;
    e.preventDefault();

    const card = this.draggedElement;

    card.removeEventListener('pointermove', this._onTimelineMove);
    card.removeEventListener('pointerup', this._onTimelineUp);
    card.removeEventListener('pointercancel', this._onTimelineUp);

    const el = document.elementFromPoint(e.clientX, e.clientY);
    const marker = el?.closest('.age-marker');

    if (marker) {
      const age = parseInt(marker.dataset.age || '0', 10);
      this.handleTimelineDrop({ preventDefault() {}, currentTarget: marker, target: marker }, age);
    }

    // si no quedó correcto, reset
    if (!card.classList.contains('correct')) this.resetDraggedStyles(card);

    this.draggedElement = null;
  }

  createVaccinationCards() {
    const container = document.getElementById('vaccination-cards');
    if (!container) return;

    container.innerHTML = '';

    const shuffled = [...CERVICAL_DATA.vaccinationTimeline].sort(() => Math.random() - 0.5);

    shuffled.forEach((card) => {
      const cardEl = document.createElement('div');
      cardEl.className = 'vaccination-card';
      cardEl.draggable = true;
      cardEl.dataset.id = String(card.id);
      cardEl.dataset.correctAge = String(card.correctAge);

      cardEl.innerHTML = `
        <div class="card-icon">💉</div>
        <div class="card-content">
          <h4>${card.description}</h4>
          <p class="age-hint">${card.ageRange}</p>
        </div>
      `;

      // Desktop (drag nativo)
      cardEl.addEventListener('dragstart', (e) => this.handleDragStart(e));
      cardEl.addEventListener('dragend', (e) => this.handleDragEnd(e));

      // Mobile (iOS/Android): pointer drag
      if (navigator.maxTouchPoints > 0) {
        cardEl.addEventListener('pointerdown', (e) => this.handlePointerDownTimeline(e));
      }

      container.appendChild(cardEl);
    });
  }

  handleDragStart(e) {
    this.draggedElement = e.currentTarget;
    this.draggedElement.classList.add('dragging');

    // ✅ CLAVE: sin esto, en varios browsers NO inicia el drag
    e.dataTransfer.setData('text/plain', this.draggedElement.dataset.id || '1');
    e.dataTransfer.effectAllowed = 'move';
  }

  handleDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
  }

  handleDragOver(e) {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
  }

  handleTimelineDrop(e, age) {
    e.preventDefault();
    if (!this.draggedElement) return;

    const correctAge = parseInt(this.draggedElement.dataset.correctAge || '0', 10);
    const cardId = parseInt(this.draggedElement.dataset.id || '0', 10);
    const tolerance = 2;

    if (Math.abs(age - correctAge) <= tolerance) {
      this.draggedElement.classList.add('correct');
      this.draggedElement.draggable = false;

      const cardData = CERVICAL_DATA.vaccinationTimeline.find((c) => c.id === cardId);
      if (cardData) {
        this.addScore(cardData.points);
        this.showFeedback('✅ ¡Correcto! ' + cardData.info, 'success');
      }

      this.phaseProgress.timeline.completed++;
      this.updateProgress('timeline');

      const marker = e.currentTarget;
      marker.appendChild(this.draggedElement);

      // ⚠️ Si quieres posicionarlo arriba del marcador:
      this.draggedElement.style.position = 'absolute';
      this.draggedElement.style.top = '-80px';

      if (this.phaseProgress.timeline.completed === this.phaseProgress.timeline.total) {
        setTimeout(() => this.completeTimelinePhase(), 1000);
      }
    } else {
      this.draggedElement.classList.add('incorrect');
      this.loseLife();
      this.phaseProgress.timeline.perfect = false;
      this.showFeedback('❌ Edad incorrecta. Intenta de nuevo.', 'error');

      setTimeout(() => this.draggedElement?.classList.remove('incorrect'), 1000);

      // si es mobile y estaba en fixed, devolver
      this.resetDraggedStyles(this.draggedElement);
    }

    this.draggedElement = null;
  }

  completeTimelinePhase() {
    this.showFeedback('🎉 ¡Fase de vacunación completada!', 'success');

    if (this.phaseProgress.timeline.perfect) {
      this.addScore(500);
      this.unlockAchievement('perfect_timeline');
    }

    setTimeout(() => {
      this.showPhase('risk-factors');
      this.initRiskFactorsPhase();
    }, 2000);
  }

  // ============================================
  // FASE 3: FACTORES DE RIESGO
  // ============================================

  initRiskFactorsPhase() {
    console.log('⚠️ Iniciando fase de factores de riesgo...');
    this.createRiskItems();
    this.updateProgress('risks');
  }

  // ---------- MOBILE (Risk) ----------
  handlePointerDownRisk(e) {
    if (e.pointerType === 'mouse') return;
    e.preventDefault();

    const item = e.currentTarget;
    if (item.classList.contains('correct') || item.draggable === false) return;

    this.draggedElement = item;
    item.classList.add('dragging');

    const rect = item.getBoundingClientRect();
    item.style.position = 'fixed';
    item.style.left = rect.left + 'px';
    item.style.top = rect.top + 'px';
    item.style.width = rect.width + 'px';
    item.style.zIndex = 9999;
    item.style.pointerEvents = 'none';

    item.dataset.offsetX = String(e.clientX - rect.left);
    item.dataset.offsetY = String(e.clientY - rect.top);

    item.setPointerCapture(e.pointerId);

    this._onRiskMove = (ev) => this.handlePointerMoveRisk(ev);
    this._onRiskUp = (ev) => this.handlePointerUpRisk(ev);

    item.addEventListener('pointermove', this._onRiskMove);
    item.addEventListener('pointerup', this._onRiskUp);
    item.addEventListener('pointercancel', this._onRiskUp);
  }

  handlePointerMoveRisk(e) {
    if (!this.draggedElement) return;
    e.preventDefault();

    const item = this.draggedElement;
    const ox = parseFloat(item.dataset.offsetX || '0');
    const oy = parseFloat(item.dataset.offsetY || '0');

    item.style.left = e.clientX - ox + 'px';
    item.style.top = e.clientY - oy + 'px';
  }

  handlePointerUpRisk(e) {
    if (!this.draggedElement) return;
    e.preventDefault();

    const item = this.draggedElement;

    item.removeEventListener('pointermove', this._onRiskMove);
    item.removeEventListener('pointerup', this._onRiskUp);
    item.removeEventListener('pointercancel', this._onRiskUp);

    const el = document.elementFromPoint(e.clientX, e.clientY);
    const healthy = el?.closest('#healthy-items');
    const danger = el?.closest('#danger-items');

    if (healthy) {
      this.handleRiskDrop({ preventDefault() {}, currentTarget: healthy }, 'healthy');
      if (!item.classList.contains('correct')) this.resetDraggedStyles(item);
    } else if (danger) {
      this.handleRiskDrop({ preventDefault() {}, currentTarget: danger }, 'danger');
      if (!item.classList.contains('correct')) this.resetDraggedStyles(item);
    } else {
      this.resetDraggedStyles(item);
    }

    this.draggedElement = null;
  }

  createRiskItems() {
    const container = document.getElementById('risk-items');
    if (!container) return;

    container.innerHTML = '';

    const shuffled = [...CERVICAL_DATA.riskFactors].sort(() => Math.random() - 0.5);

    shuffled.forEach((item) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'risk-item';
      itemEl.draggable = true;
      itemEl.dataset.id = String(item.id);
      itemEl.dataset.type = String(item.type);

      itemEl.innerHTML = `
        <div class="item-icon">${item.icon}</div>
        <p class="item-name">${item.name}</p>
      `;

      // Desktop
      itemEl.addEventListener('dragstart', (e) => this.handleDragStart(e));
      itemEl.addEventListener('dragend', (e) => this.handleDragEnd(e));

      // Mobile
      if (navigator.maxTouchPoints > 0) {
        itemEl.addEventListener('pointerdown', (e) => this.handlePointerDownRisk(e));
      }

      container.appendChild(itemEl);
    });

    // Zonas drop desktop
    const healthy = document.getElementById('healthy-items');
    const danger = document.getElementById('danger-items');
    if (!healthy || !danger) return;

    healthy.addEventListener('dragover', (e) => this.handleDragOver(e));
    healthy.addEventListener('drop', (e) => this.handleRiskDrop(e, 'healthy'));

    danger.addEventListener('dragover', (e) => this.handleDragOver(e));
    danger.addEventListener('drop', (e) => this.handleRiskDrop(e, 'danger'));
  }

  handleRiskDrop(e, zone) {
    e.preventDefault();
    if (!this.draggedElement) return;

    const item = this.draggedElement;
    const itemType = item.dataset.type;
    const itemId = item.dataset.id;

    if (itemType === zone) {
      const itemData = CERVICAL_DATA.riskFactors.find((r) => String(r.id) === String(itemId));

      this.resetDraggedStyles(item);

      if (itemData) this.addScore(itemData.points);
      this.phaseProgress.risks.completed++;

      e.currentTarget.appendChild(item);
      item.classList.add('correct');
      item.draggable = false;

      if (itemData) this.showFeedback(`✅ ${itemData.explanation}`, 'success');

      if (this.phaseProgress.risks.completed === this.phaseProgress.risks.total) {
        setTimeout(() => this.completeRiskPhase(), 1000);
      }
    } else {
      this.loseLife();
      this.phaseProgress.risks.perfect = false;
      item.classList.add('incorrect');
      this.showFeedback('❌ Zona incorrecta', 'error');

      setTimeout(() => item.classList.remove('incorrect'), 1000);

      this.resetDraggedStyles(item);
    }

    this.updateProgress('risks');
    this.draggedElement = null;
  }

  completeRiskPhase() {
    this.showFeedback('🎉 ¡Factores de riesgo identificados!', 'success');

    if (this.phaseProgress.risks.perfect) {
      this.addScore(600);
      this.unlockAchievement('risk_eliminator');
    }

    setTimeout(() => {
      this.showPhase('myths');
      this.initMythsPhase();
    }, 2000);
  }

  // ============================================
  // FASE 4: MITOS VS REALIDADES
  // ============================================

  initMythsPhase() {
    console.log('💡 Iniciando fase de mitos vs realidades...');
    this.createMythCards();
    this.updateProgress('myths');
  }

  // ✅ SOLO UNA versión (sin duplicados)
  handlePointerDownMyth(e) {
    if (e.pointerType === 'mouse') return;
    e.preventDefault();

    const card = e.currentTarget;
    if (card.classList.contains('correct') || card.draggable === false) return;

    this.draggedElement = card;
    card.classList.add('dragging');

    const rect = card.getBoundingClientRect();
    card.style.position = 'fixed';
    card.style.left = rect.left + 'px';
    card.style.top = rect.top + 'px';
    card.style.width = rect.width + 'px';
    card.style.zIndex = 9999;
    card.style.pointerEvents = 'none';

    card.dataset.offsetX = String(e.clientX - rect.left);
    card.dataset.offsetY = String(e.clientY - rect.top);

    card.setPointerCapture(e.pointerId);

    this._onMythMove = (ev) => this.handlePointerMoveMyth(ev);
    this._onMythUp = (ev) => this.handlePointerUpMyth(ev);

    card.addEventListener('pointermove', this._onMythMove);
    card.addEventListener('pointerup', this._onMythUp);
    card.addEventListener('pointercancel', this._onMythUp);
  }

  handlePointerMoveMyth(e) {
    if (!this.draggedElement) return;
    e.preventDefault();

    const card = this.draggedElement;
    const ox = parseFloat(card.dataset.offsetX || '0');
    const oy = parseFloat(card.dataset.offsetY || '0');

    card.style.left = e.clientX - ox + 'px';
    card.style.top = e.clientY - oy + 'px';
  }

  handlePointerUpMyth(e) {
    if (!this.draggedElement) return;
    e.preventDefault();

    const card = this.draggedElement;

    // ✅ remover con los nombres correctos
    card.removeEventListener('pointermove', this._onMythMove);
    card.removeEventListener('pointerup', this._onMythUp);
    card.removeEventListener('pointercancel', this._onMythUp);

    const el = document.elementFromPoint(e.clientX, e.clientY);
    const zoneEl = el?.closest('#reality-zone, #myth-zone');

    if (zoneEl) {
      const dropIsMyth = zoneEl.id === 'myth-zone';
      this.handleMythDrop({ preventDefault() {}, currentTarget: zoneEl, target: zoneEl }, dropIsMyth);
    }

    // si no quedó correcto, vuelve a su estado normal
    if (!card.classList.contains('correct')) this.resetDraggedStyles(card);
    else this.resetDraggedStyles(card);

    this.draggedElement = null;
  }

  createMythCards() {
    const container = document.getElementById('myth-statements');
    if (!container) return;

    container.innerHTML = '';

    const shuffled = [...CERVICAL_DATA.mythsAndFacts].sort(() => Math.random() - 0.5);

    shuffled.forEach((myth) => {
      const cardEl = document.createElement('div');
      cardEl.className = 'myth-card';
      cardEl.draggable = true;
      cardEl.dataset.id = String(myth.id);
      cardEl.dataset.isMyth = String(myth.isMyth);

      cardEl.innerHTML = `
        <p class="myth-statement">${myth.statement}</p>
        <div class="drag-hint"><i class="fas fa-hand-pointer"></i> Arrastra</div>
      `;

      // Desktop
      cardEl.addEventListener('dragstart', (e) => this.handleDragStart(e));
      cardEl.addEventListener('dragend', (e) => this.handleDragEnd(e));

      // Mobile
      if (navigator.maxTouchPoints > 0) {
        cardEl.addEventListener('pointerdown', (e) => this.handlePointerDownMyth(e));
      }

      container.appendChild(cardEl);
    });

    // Zonas drop (desktop)
    const realityZone = document.getElementById('reality-zone');
    const mythZone = document.getElementById('myth-zone');
    if (!realityZone || !mythZone) return;

    realityZone.addEventListener('dragover', (e) => this.handleDragOver(e));
    realityZone.addEventListener('drop', (e) => this.handleMythDrop(e, false));

    mythZone.addEventListener('dragover', (e) => this.handleDragOver(e));
    mythZone.addEventListener('drop', (e) => this.handleMythDrop(e, true));
  }

  handleMythDrop(e, isMyth) {
    e.preventDefault();
    if (!this.draggedElement) return;

    const cardIsMyth = this.draggedElement.dataset.isMyth === 'true';
    const cardId = parseInt(this.draggedElement.dataset.id || '0', 10);

    const dropZone = e.currentTarget || e.target?.closest('#reality-zone, #myth-zone');
    if (!dropZone) return;

    if (cardIsMyth === isMyth) {
      const mythData = CERVICAL_DATA.mythsAndFacts.find((m) => m.id === cardId);

      // ✅ limpiar modo "fixed" antes de insertarlo
      this.resetDraggedStyles(this.draggedElement);

      if (mythData) this.addScore(mythData.points);
      this.phaseProgress.myths.completed++;

      dropZone.appendChild(this.draggedElement);
      this.draggedElement.classList.add('correct');
      this.draggedElement.draggable = false;

      if (mythData) this.showFeedback(`✅ ${mythData.explanation}`, 'success');

      if (this.phaseProgress.myths.completed === this.phaseProgress.myths.total) {
        setTimeout(() => this.completeMythsPhase(), 1000);
      }
    } else {
      this.loseLife();
      this.phaseProgress.myths.perfect = false;
      this.draggedElement.classList.add('incorrect');
      this.showFeedback('❌ Clasificación incorrecta', 'error');
      setTimeout(() => this.draggedElement?.classList.remove('incorrect'), 1000);

      // ✅ evita quedarse fixed
      this.resetDraggedStyles(this.draggedElement);
    }

    this.updateProgress('myths');
    this.draggedElement = null;
  }

  completeMythsPhase() {
    this.showFeedback('🎉 ¡Mitos desmentidos con éxito!', 'success');

    if (this.phaseProgress.myths.perfect) {
      this.addScore(700);
      this.unlockAchievement('myth_buster');
    }

    setTimeout(() => {
      this.completeGame();
    }, 2000);
  }

  // ============================================
  // UTILIDADES / SISTEMA
  // ============================================

  resetDraggedStyles(el) {
    if (!el) return;
    el.classList.remove('dragging');
    el.style.position = '';
    el.style.left = '';
    el.style.top = '';
    el.style.width = '';
    el.style.zIndex = '';
    el.style.pointerEvents = '';
  }

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

    const timerEl = document.getElementById('timer');
    if (timerEl) timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    const scoreEl = document.getElementById('current-score');
    if (scoreEl) scoreEl.textContent = String(this.score);
  }

  updateProgress(phase) {
    const progress = this.phaseProgress[phase];
    const element = document.getElementById(`${phase}-progress`);
    if (element && progress) {
      element.textContent = `${progress.completed}/${progress.total}`;
    }
  }

  addScore(points) {
    this.score += points;
    this.updateHUD();
    this.animateScore(points);
  }

  animateScore(points) {
    const scoreEl = document.getElementById('current-score');
    if (!scoreEl) return;

    const notification = document.createElement('div');
    notification.className = 'score-popup';
    notification.textContent = `+${points}`;
    notification.style.position = 'absolute';
    notification.style.left = scoreEl.offsetLeft + 'px';
    notification.style.top = scoreEl.offsetTop + 'px';
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 1000);
  }

  loseLife() {
    if (this.lives > 0) {
      this.lives--;

      const heart = document.getElementById(`heart${this.lives + 1}`);
      heart?.classList.add('lost');

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
    const achievement = CERVICAL_DATA.achievements.find((a) => a.id === achievementId);
    if (achievement && !this.achievements.includes(achievementId)) {
      this.achievements.push(achievementId);
      this.showFeedback(`🏆 Logro desbloqueado: ${achievement.name}`, 'achievement');
    }
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    const modal = document.getElementById('pause-modal');
    if (modal) modal.style.display = this.isPaused ? 'flex' : 'none';
  }

  restartGame() {
    window.location.reload();
  }

  exitGame() {
    window.location.href = '/index.html';
  }

  nextLevel() {
    sessionStorage.setItem('cervicalLevelCompleted', 'true');
    window.location.href = '/index.html';
  }

  timeUp() {
    clearInterval(this.timer);
    this.gameOver();
  }

  gameOver() {
    console.log('🎮 Game Over llamado');
    clearInterval(this.timer);

    this.gameOverByLoss = true;

    // mostrar pantalla final inmediatamente
    this.completeGame();
  }

  async completeGame() {
    console.log('🏆 Complete Game llamado');
    clearInterval(this.timer);

    // ✅ tiempo tomado real
    const timeTaken = this.TOTAL_TIME - this.gameTime;

    // Bonos solo si no perdió
    if (!this.gameOverByLoss) {
      if (timeTaken < 300) {
        this.unlockAchievement('speed_demon');
        this.addScore(1000);
      }

      if (this.lives === 3) {
        this.unlockAchievement('flawless_victory');
        this.addScore(1500);
      }
    }

    console.log('📺 Mostrando pantalla de victoria...');
    this.showVictoryScreen(timeTaken);

    if (window.authClient && window.authClient.isAuthenticated()) {
      try {
        await this.submitScore(timeTaken);
      } catch (error) {
        // ya manejado en submitScore
      }
    } else {
      console.log('⚠️ Usuario no autenticado - Jugando sin guardar puntuación');
    }
  }

  showVictoryScreen(timeTaken) {
    console.log('🎬 showVictoryScreen llamado');

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
      if (nextLevelBtn) nextLevelBtn.style.display = 'none';
    } else {
      if (victoryTitle) {
        victoryTitle.textContent = '¡Laboratorio Completado!';
        victoryTitle.style.color = '#06b6d4';
      }
      if (trophyIcon) {
        trophyIcon.className = 'fas fa-trophy';
        trophyIcon.style.color = '#fbbf24';
      }
      if (nextLevelBtn) nextLevelBtn.style.display = 'inline-flex';
    }

    const finalScoreEl = document.getElementById('final-score');
    const finalTimeEl = document.getElementById('final-time');
    const finalAccuracyEl = document.getElementById('final-accuracy');

    if (finalScoreEl) finalScoreEl.textContent = String(this.score);
    if (finalTimeEl) {
      finalTimeEl.textContent = `${Math.floor(timeTaken / 60)}:${(timeTaken % 60)
        .toString()
        .padStart(2, '0')}`;
    }

    if (finalAccuracyEl) {
      const accuracy = Math.round((this.score / GAME_CONFIG.maxScore) * 100);
      finalAccuracyEl.textContent = `${accuracy}%`;
    }

    const achievementsList = document.getElementById('achievements-list');
    if (achievementsList) {
      achievementsList.innerHTML = this.achievements
        .map((achId) => {
          const ach = CERVICAL_DATA.achievements.find((a) => a.id === achId);
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
        })
        .join('');
    }

    const learningList = document.getElementById('learning-points');
    if (learningList) {
      learningList.innerHTML = CERVICAL_DATA.learningPoints.map((point) => `<li>${point}</li>`).join('');
    }

    // Ocultar todas las fases
    document.querySelectorAll('.game-phase').forEach((phase) => phase.classList.remove('active'));

    // Mostrar victoria
    const victoryScreen = document.getElementById('victory-screen');
    if (victoryScreen) {
      victoryScreen.classList.add('active');
      this.currentPhase = 'victory';
      console.log('✅ Pantalla de victoria mostrada');
    } else {
      console.error('❌ No se encontró victory-screen');
    }
  }

  async submitScore(timeTaken) {
    try {
      const correctAnswers = Object.values(this.phaseProgress).reduce((sum, phase) => sum + (phase.completed || 0), 0);
      const totalQuestions = Object.values(this.phaseProgress).reduce((sum, phase) => sum + (phase.total || 0), 0);

      const scoreData = {
        level_type: 'cervical',
        score: this.score,
        time_taken: timeTaken,
        anomalies_found: correctAnswers,
        total_anomalies: totalQuestions,
      };

      await window.authClient.submitScore(scoreData);

      window.dispatchEvent(
        new CustomEvent('level-completed', {
          detail: { levelType: 'cervical', score: this.score, success: true },
        })
      );

      if (window.levelProgressionManager) {
        window.levelProgressionManager.onLevelCompleted('cervical', this.score);
      }

      console.log('✅ Puntuación guardada exitosamente');
    } catch (error) {
      console.error('❌ Error al guardar puntuación:', error.message);
    }
  }
}

// Inicializar juego cuando cargue el DOM
document.addEventListener('DOMContentLoaded', () => {
  window.cervicalGame = new CervicalCancerGame();
});
