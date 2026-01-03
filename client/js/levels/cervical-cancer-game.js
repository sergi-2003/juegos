// ============================================
// JUEGO DE CÁNCER CERVICAL
// ============================================

class CervicalCancerGame {
    constructor() {
        console.log('🎮 Inicializando Laboratorio Cervical...');
        
        this.currentPhase = 'intro';
        this.score = 0;
        this.lives = 3;
        this.gameTime = 420; // 7 minutos
        this.isPaused = false;
        this.timer = null;
        this.startTime = null;
        
        // Progress tracking
        this.phaseProgress = {
            timeline: { completed: 0, total: 5, perfect: true },
            pap: { completed: 0, total: 8, perfect: true },
            risks: { completed: 0, total: 12, perfect: true },
            myths: { completed: 0, total: 10, perfect: true },
            calendar: { completed: false, perfect: true }
        };
        
        this.achievements = [];
        this.draggedElement = null;
        
        this.init();
    }
    
    init() {
        this.hideLoading();
        this.attachEventListeners();
        this.showPhase('intro');
    }
    
    hideLoading() {
        setTimeout(() => {
            document.getElementById('loading-screen').style.opacity = '0';
            setTimeout(() => {
                document.getElementById('loading-screen').style.display = 'none';
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

  // Controles del microscopio
  document.getElementById('zoom-in')?.addEventListener('click', () => this.zoom(1.2));
  document.getElementById('zoom-out')?.addEventListener('click', () => this.zoom(0.8));
  document.getElementById('rotate')?.addEventListener('click', () => this.rotateSample());

  // Debug: saltar fases (eliminar al terminar)
  document.addEventListener('keydown', (e) => {
    if (e.key === '1') { this.showPhase('timeline'); this.initTimelinePhase(); }
    if (e.key === '3') { this.showPhase('risk-factors'); this.initRiskFactorsPhase(); }
    if (e.key === '4') { this.showPhase('myths'); this.initMythsPhase(); }
    if (e.key === '9') { this.completeGame(); }
  });
}

    
    startGame() {
        console.log('🎮 Iniciando juego...');
        this.startTime = Date.now();
        this.startTimer();
        this.showPhase('timeline');
        this.initTimelinePhase();
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
        container.innerHTML = '';
        
        // Crear marcadores de edad de 5 a 30 años
        for (let age = 5; age <= 30; age += 1) {
            const marker = document.createElement('div');
            marker.className = 'age-marker';
            marker.dataset.age = age;
            marker.innerHTML = `
                <div class="marker-line"></div>
                ${age % 5 === 0 ? `<span class="age-label">${age}</span>` : ''}
            `;
            
            // Zona de drop
            marker.addEventListener('dragover', (e) => this.handleDragOver(e));
            marker.addEventListener('drop', (e) => this.handleTimelineDrop(e, age));
            
            container.appendChild(marker);
        }
    }
    

  handlePointerDown(e) {
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

  // ✅ clave: permite detectar el marcador debajo al soltar
  card.style.pointerEvents = 'none';

  card.dataset.offsetX = (e.clientX - rect.left);
  card.dataset.offsetY = (e.clientY - rect.top);

  card.setPointerCapture(e.pointerId);

  card.addEventListener('pointermove', this._onPointerMove = (ev) => this.handlePointerMove(ev));
  card.addEventListener('pointerup', this._onPointerUp = (ev) => this.handlePointerUp(ev));
  card.addEventListener('pointercancel', this._onPointerUp);
}


handlePointerMove(e) {
  if (!this.draggedElement) return;

  e.preventDefault();

  const card = this.draggedElement;
  const offsetX = parseFloat(card.dataset.offsetX || '0');
  const offsetY = parseFloat(card.dataset.offsetY || '0');

  card.style.left = (e.clientX - offsetX) + 'px';
  card.style.top  = (e.clientY - offsetY) + 'px';
}

handlePointerUp(e) {
  if (!this.draggedElement) return;
  e.preventDefault();

  const card = this.draggedElement;

  const el = document.elementFromPoint(e.clientX, e.clientY);
  const marker = el?.closest('.age-marker');

  card.removeEventListener('pointermove', this._onPointerMove);
  card.removeEventListener('pointerup', this._onPointerUp);
  card.removeEventListener('pointercancel', this._onPointerUp);

  const resetCardPosition = () => {
    card.classList.remove('dragging');
    card.style.position = '';
    card.style.left = '';
    card.style.top = '';
    card.style.width = '';
    card.style.zIndex = '';
    card.style.pointerEvents = ''; // ✅ restaurar
  };

  if (marker) {
    const age = parseInt(marker.dataset.age, 10);

    this.handleTimelineDrop(
      { preventDefault() {}, currentTarget: marker, target: marker },
      age
    );

    if (!card.classList.contains('correct')) resetCardPosition();
  } else {
    resetCardPosition();
  }

  this.draggedElement = null;
}

createVaccinationCards() {
  const container = document.getElementById('vaccination-cards');
  if (!container) return;

  container.innerHTML = '';

  const shuffled = [...CERVICAL_DATA.vaccinationTimeline].sort(() => Math.random() - 0.5);

  shuffled.forEach(card => {
    const cardEl = document.createElement('div');
    cardEl.className = 'vaccination-card';
    cardEl.draggable = true;
    cardEl.dataset.id = card.id;
    cardEl.dataset.correctAge = card.correctAge;

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
      cardEl.addEventListener('pointerdown', (e) => this.handlePointerDown(e));
    }

    container.appendChild(cardEl);
  });
}

   handleDragStart(e) {
  this.draggedElement = e.currentTarget;     // ✅
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
        e.dataTransfer.dropEffect = 'move';
    }
    
   handleTimelineDrop(e, age) {
  e.preventDefault();
  if (!this.draggedElement) return;

  const correctAge = parseInt(this.draggedElement.dataset.correctAge, 10);
  const cardId = parseInt(this.draggedElement.dataset.id, 10);
  const tolerance = 2;

  if (Math.abs(age - correctAge) <= tolerance) {
    this.draggedElement.classList.add('correct');
    this.draggedElement.draggable = false;

    const cardData = CERVICAL_DATA.vaccinationTimeline.find(c => c.id === cardId);
    this.addScore(cardData.points);
    this.showFeedback('✅ ¡Correcto! ' + cardData.info, 'success');

    this.phaseProgress.timeline.completed++;
    this.updateProgress('timeline');

    const marker = e.currentTarget;               // ✅ este sí es el .age-marker
    marker.appendChild(this.draggedElement);
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

    setTimeout(() => this.draggedElement.classList.remove('incorrect'), 1000);
  }

  this.draggedElement = null;
}

    
   completeTimelinePhase() {
  this.showFeedback('🎉 ¡Fase de vacunación completada!', 'success');

  if (this.phaseProgress.timeline.perfect) {
    this.addScore(500); // Bonus por perfecto
    this.unlockAchievement('perfect_timeline');
  }

  setTimeout(() => {
    // Saltar directo a factores de riesgo (sin fase PAP)
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

    handlePointerDownRisk(e) {
  if (e.pointerType === 'mouse') return; // en desktop usa drag nativo
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

  // clave: para detectar la zona debajo del dedo
  item.style.pointerEvents = 'none';

  item.dataset.offsetX = (e.clientX - rect.left);
  item.dataset.offsetY = (e.clientY - rect.top);

  item.setPointerCapture(e.pointerId);

  item.addEventListener('pointermove', this._onRiskMove = (ev) => this.handlePointerMoveRisk(ev));
  item.addEventListener('pointerup', this._onRiskUp = (ev) => this.handlePointerUpRisk(ev));
  item.addEventListener('pointercancel', this._onRiskUp);
}

handlePointerMoveRisk(e) {
  if (!this.draggedElement) return;
  e.preventDefault();

  const item = this.draggedElement;
  const ox = parseFloat(item.dataset.offsetX || '0');
  const oy = parseFloat(item.dataset.offsetY || '0');

  item.style.left = (e.clientX - ox) + 'px';
  item.style.top  = (e.clientY - oy) + 'px';
}

handlePointerUpRisk(e) {
  if (!this.draggedElement) return;
  e.preventDefault();

  const item = this.draggedElement;

  // ¿sobre qué cayó?
  const el = document.elementFromPoint(e.clientX, e.clientY);
  const healthy = el?.closest('#healthy-items');
  const danger  = el?.closest('#danger-items');

  item.removeEventListener('pointermove', this._onRiskMove);
  item.removeEventListener('pointerup', this._onRiskUp);
  item.removeEventListener('pointercancel', this._onRiskUp);

  const reset = () => {
    item.classList.remove('dragging');
    item.style.position = '';
    item.style.left = '';
    item.style.top = '';
    item.style.width = '';
    item.style.zIndex = '';
    item.style.pointerEvents = '';
  };

  if (healthy) {
    this.handleRiskDrop({ preventDefault() {}, currentTarget: healthy }, 'healthy');
    if (!item.classList.contains('correct')) reset();
  } else if (danger) {
    this.handleRiskDrop({ preventDefault() {}, currentTarget: danger }, 'danger');
    if (!item.classList.contains('correct')) reset();
  } else {
    reset();
  }

  this.draggedElement = null;
}

    
 createRiskItems() {
  const container = document.getElementById('risk-items');
  container.innerHTML = '';

  const shuffled = [...CERVICAL_DATA.riskFactors].sort(() => Math.random() - 0.5);

  shuffled.forEach(item => {
    const itemEl = document.createElement('div');
    itemEl.className = 'risk-item';
    itemEl.draggable = true;
    itemEl.dataset.id = item.id;
    itemEl.dataset.type = item.type;

    itemEl.innerHTML = `
      <div class="item-icon">${item.icon}</div>
      <p class="item-name">${item.name}</p>
    `;

    // Desktop
    itemEl.addEventListener('dragstart', (e) => this.handleDragStart(e));
    itemEl.addEventListener('dragend',   (e) => this.handleDragEnd(e));

    // Mobile
    if (navigator.maxTouchPoints > 0) {
      itemEl.addEventListener('pointerdown', (e) => this.handlePointerDownRisk(e));
    }

    container.appendChild(itemEl);
  });

  // Zonas drop desktop (importante: que el drop sea en el contenedor)
  const healthy = document.getElementById('healthy-items');
  const danger  = document.getElementById('danger-items');

  healthy.addEventListener('dragover', (e) => this.handleDragOver(e));
  healthy.addEventListener('drop', (e) => this.handleRiskDrop(e, 'healthy'));

  danger.addEventListener('dragover', (e) => this.handleDragOver(e));
  danger.addEventListener('drop', (e) => this.handleRiskDrop(e, 'danger'));
}

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

   
   handleRiskDrop(e, zone) {
  e.preventDefault();
  if (!this.draggedElement) return;

  const item = this.draggedElement;
  const itemType = item.dataset.type;
  const itemId = item.dataset.id;

  if (itemType === zone) {
    const itemData = CERVICAL_DATA.riskFactors.find(r => r.id === itemId);

    // ✅ quitar “modo flotante” ANTES de insertarlo
    this.resetDraggedStyles(item);

    this.addScore(itemData.points);
    this.phaseProgress.risks.completed++;

    e.currentTarget.appendChild(item);
    item.classList.add('correct');
    item.draggable = false;

    this.showFeedback(`✅ ${itemData.explanation}`, 'success');

    if (this.phaseProgress.risks.completed === this.phaseProgress.risks.total) {
      setTimeout(() => this.completeRiskPhase(), 1000);
    }
  } else {
    this.loseLife();
    this.phaseProgress.risks.perfect = false;
    item.classList.add('incorrect');
    this.showFeedback('❌ Zona incorrecta', 'error');

    setTimeout(() => item.classList.remove('incorrect'), 1000);

    // si fue incorrecto, también vuelve a estado normal
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

  // ✅ clave para detectar el dropzone debajo
  card.style.pointerEvents = 'none';

  card.dataset.offsetX = (e.clientX - rect.left);
  card.dataset.offsetY = (e.clientY - rect.top);

  card.setPointerCapture(e.pointerId);

  card.addEventListener('pointermove', this._onPointerMoveMyth = (ev) => this.handlePointerMoveMyth(ev));
  card.addEventListener('pointerup', this._onPointerUpMyth = (ev) => this.handlePointerUpMyth(ev));
  card.addEventListener('pointercancel', this._onPointerUpMyth);
}

handlePointerMoveMyth(e) {
  if (!this.draggedElement) return;
  e.preventDefault();

  const card = this.draggedElement;
  const offsetX = parseFloat(card.dataset.offsetX || '0');
  const offsetY = parseFloat(card.dataset.offsetY || '0');

  card.style.left = (e.clientX - offsetX) + 'px';
  card.style.top  = (e.clientY - offsetY) + 'px';
}

handlePointerUpMyth(e) {
  if (!this.draggedElement) return;
  e.preventDefault();

  const card = this.draggedElement;

  // Limpia listeners
  card.removeEventListener('pointermove', this._onPointerMoveMyth);
  card.removeEventListener('pointerup', this._onPointerUpMyth);
  card.removeEventListener('pointercancel', this._onPointerUpMyth);

  // Detectar dropzone real bajo el dedo
  const el = document.elementFromPoint(e.clientX, e.clientY);
  const zoneEl = el?.closest('#reality-zone, #myth-zone');

  const resetCardPosition = () => {
    card.classList.remove('dragging');
    card.style.position = '';
    card.style.left = '';
    card.style.top = '';
    card.style.width = '';
    card.style.zIndex = '';
    card.style.pointerEvents = '';
  };

  if (zoneEl) {
    const expectedIsMyth = zoneEl.id === 'myth-zone';

    // ✅ llamamos a la lógica, pero garantizando currentTarget
    this.handleMythDrop(
      { preventDefault() {}, currentTarget: zoneEl, target: zoneEl },
      expectedIsMyth
    );

    // Si no quedó correct, resetea estilos
    if (!card.classList.contains('correct')) resetCardPosition();
    else resetCardPosition(); // ✅ igual resetea para que no quede "fixed"
  } else {
    resetCardPosition();
  }

  this.draggedElement = null;
}

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

  // ✅ clave para detectar el dropzone debajo
  card.style.pointerEvents = 'none';

  card.dataset.offsetX = (e.clientX - rect.left);
  card.dataset.offsetY = (e.clientY - rect.top);

  card.setPointerCapture(e.pointerId);

  card.addEventListener('pointermove', this._onPointerMoveMyth = (ev) => this.handlePointerMoveMyth(ev));
  card.addEventListener('pointerup', this._onPointerUpMyth = (ev) => this.handlePointerUpMyth(ev));
  card.addEventListener('pointercancel', this._onPointerUpMyth);
}

handlePointerMoveMyth(e) {
  if (!this.draggedElement) return;
  e.preventDefault();

  const card = this.draggedElement;
  const offsetX = parseFloat(card.dataset.offsetX || '0');
  const offsetY = parseFloat(card.dataset.offsetY || '0');

  card.style.left = (e.clientX - offsetX) + 'px';
  card.style.top  = (e.clientY - offsetY) + 'px';
}

handlePointerUpMyth(e) {
  if (!this.draggedElement) return;
  e.preventDefault();

  const card = this.draggedElement;

  // Limpia listeners
  card.removeEventListener('pointermove', this._onPointerMoveMyth);
  card.removeEventListener('pointerup', this._onPointerUpMyth);
  card.removeEventListener('pointercancel', this._onPointerUpMyth);

  // Detectar dropzone real bajo el dedo
  const el = document.elementFromPoint(e.clientX, e.clientY);
  const zoneEl = el?.closest('#reality-zone, #myth-zone');

  const resetCardPosition = () => {
    card.classList.remove('dragging');
    card.style.position = '';
    card.style.left = '';
    card.style.top = '';
    card.style.width = '';
    card.style.zIndex = '';
    card.style.pointerEvents = '';
  };

  if (zoneEl) {
    const expectedIsMyth = zoneEl.id === 'myth-zone';

    // ✅ llamamos a la lógica, pero garantizando currentTarget
    this.handleMythDrop(
      { preventDefault() {}, currentTarget: zoneEl, target: zoneEl },
      expectedIsMyth
    );

    // Si no quedó correct, resetea estilos
    if (!card.classList.contains('correct')) resetCardPosition();
    else resetCardPosition(); // ✅ igual resetea para que no quede "fixed"
  } else {
    resetCardPosition();
  }

  this.draggedElement = null;
}


handlePointerMoveMyth(e) {
  if (!this.draggedElement) return;
  e.preventDefault();

  const card = this.draggedElement;
  const offsetX = parseFloat(card.dataset.offsetX || '0');
  const offsetY = parseFloat(card.dataset.offsetY || '0');

  card.style.left = (e.clientX - offsetX) + 'px';
  card.style.top  = (e.clientY - offsetY) + 'px';
}

handlePointerUpMyth(e) {
  if (!this.draggedElement) return;
  e.preventDefault();

  const card = this.draggedElement;

  const el = document.elementFromPoint(e.clientX, e.clientY);
  const mythZone = el?.closest('#myth-zone');
  const realityZone = el?.closest('#reality-zone');

  card.removeEventListener('pointermove', this._onPointerMove);
  card.removeEventListener('pointerup', this._onPointerUp);
  card.removeEventListener('pointercancel', this._onPointerUp);

  const reset = () => {
    card.classList.remove('dragging');
    card.style.position = '';
    card.style.left = '';
    card.style.top = '';
    card.style.width = '';
    card.style.zIndex = '';
    card.style.pointerEvents = '';
  };

  if (mythZone) {
    this.handleMythDrop(
      { preventDefault() {}, currentTarget: mythZone },
      true
    );
    if (!card.classList.contains('correct')) reset();
  } else if (realityZone) {
    this.handleMythDrop(
      { preventDefault() {}, currentTarget: realityZone },
      false
    );
    if (!card.classList.contains('correct')) reset();
  } else {
    reset();
  }

  this.draggedElement = null;
}

createMythCards() {
  const container = document.getElementById('myth-statements');
  container.innerHTML = '';

  const shuffled = [...CERVICAL_DATA.mythsAndFacts].sort(() => Math.random() - 0.5);

  shuffled.forEach(myth => {
    const cardEl = document.createElement('div');
    cardEl.className = 'myth-card';
    cardEl.draggable = true;
    cardEl.dataset.id = myth.id;
    cardEl.dataset.isMyth = myth.isMyth;

    cardEl.innerHTML = `
      <p class="myth-statement">${myth.statement}</p>
      <div class="drag-hint"><i class="fas fa-hand-pointer"></i> Arrastra</div>
    `;

    // Desktop
    cardEl.addEventListener('dragstart', (e) => this.handleDragStart(e));
    cardEl.addEventListener('dragend', (e) => this.handleDragEnd(e));

    // ✅ Mobile
    if (navigator.maxTouchPoints > 0) {
      cardEl.addEventListener('pointerdown', (e) => this.handlePointerDownMyth(e));
    }

    container.appendChild(cardEl);
  });

  // Zonas drop (desktop)
  const realityZone = document.getElementById('reality-zone');
  const mythZone = document.getElementById('myth-zone');

  realityZone.addEventListener('dragover', (e) => this.handleDragOver(e));
  realityZone.addEventListener('drop', (e) => this.handleMythDrop(e, false));

  mythZone.addEventListener('dragover', (e) => this.handleDragOver(e));
  mythZone.addEventListener('drop', (e) => this.handleMythDrop(e, true));
}

handleMythDrop(e, isMyth) {
  e.preventDefault();
  if (!this.draggedElement) return;

  const cardIsMyth = this.draggedElement.dataset.isMyth === 'true';
  const cardId = parseInt(this.draggedElement.dataset.id, 10);

  const dropZone = e.currentTarget || e.target?.closest('#reality-zone, #myth-zone');
  if (!dropZone) return;

  if (cardIsMyth === isMyth) {
    const mythData = CERVICAL_DATA.mythsAndFacts.find(m => m.id === cardId);

    // ✅ CLAVE: limpiar modo "fixed" antes de insertarlo
    this.resetDraggedStyles(this.draggedElement);

    this.addScore(mythData.points);
    this.phaseProgress.myths.completed++;

    dropZone.appendChild(this.draggedElement);
    this.draggedElement.classList.add('correct');
    this.draggedElement.draggable = false;

    this.showFeedback(`✅ ${mythData.explanation}`, 'success');

    if (this.phaseProgress.myths.completed === this.phaseProgress.myths.total) {
      setTimeout(() => this.completeMythsPhase(), 1000);
    }
  } else {
    this.loseLife();
    this.phaseProgress.myths.perfect = false;
    this.draggedElement.classList.add('incorrect');
    this.showFeedback('❌ Clasificación incorrecta', 'error');
    setTimeout(() => this.draggedElement.classList.remove('incorrect'), 1000);

    // ✅ también resetea si fue incorrecto (evita quedarse fixed)
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
    // Ir directo a victoria (sin calendario)
    this.completeGame();
  }, 2000);
}

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

    
    // ============================================
    // FASE 5: CALENDARIO DE PREVENCIÓN
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
        const progress = this.phaseProgress[phase];
        const element = document.getElementById(`${phase}-progress`);
        if (element) {
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
        
        setTimeout(() => {
            feedback.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            feedback.classList.remove('show');
            setTimeout(() => feedback.remove(), 300);
        }, 3000);
    }
    
    unlockAchievement(achievementId) {
        const achievement = CERVICAL_DATA.achievements.find(a => a.id === achievementId);
        if (achievement && !this.achievements.includes(achievementId)) {
            this.achievements.push(achievementId);
            this.showFeedback(`🏆 Logro desbloqueado: ${achievement.name}`, 'achievement');
        }
    }
    
    getDifficultyText(difficulty) {
        const texts = {
            easy: 'Fácil',
            medium: 'Medio',
            hard: 'Difícil'
        };
        return texts[difficulty] || difficulty;
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        const modal = document.getElementById('pause-modal');
        modal.style.display = this.isPaused ? 'flex' : 'none';
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
        
        // Marcar que el juego terminó por pérdida
        this.gameOverByLoss = true;
        
        // Forzar mostrar pantalla de victoria inmediatamente
        this.completeGame();
    }
    
    async completeGame() {
        console.log('🏆 Complete Game llamado');
        clearInterval(this.timer);
        
        const totalTime = Math.floor((Date.now() - this.startTime) / 1000);
        const timeTaken = 420 - this.gameTime; // 7 minutos total
        
        // Calcular bonificaciones solo si no perdió
        if (!this.gameOverByLoss) {
            if (timeTaken < 300) { // Menos de 5 minutos = velocista
                this.unlockAchievement('speed_demon');
                this.addScore(1000);
            }
            
            if (this.lives === 3) {
                this.unlockAchievement('flawless_victory');
                this.addScore(1500);
            }
        }
        
        // Mostrar pantalla de victoria
        console.log('📺 Mostrando pantalla de victoria...');
        this.showVictoryScreen(timeTaken);
        
        // Guardar puntuación solo si hay autenticación
        if (window.authClient && window.authClient.isAuthenticated()) {
            try {
                await this.submitScore(timeTaken);
            } catch (error) {
                // Error ya manejado en submitScore, no hacer nada
            }
        } else {
            console.log('⚠️ Usuario no autenticado - Jugando sin guardar puntuación');
        }
    }
    
    showVictoryScreen(timeTaken) {
        console.log('🎬 showVictoryScreen llamado');
        
        // Cambiar título y trofeo dependiendo si ganó o perdió
        const victoryTitle = document.querySelector('.victory-title');
        const trophyIcon = document.querySelector('.trophy-animation i');
        const nextLevelBtn = document.getElementById('next-level-btn');
        
        if (this.gameOverByLoss) {
            // Perdió el nivel
            if (victoryTitle) {
                victoryTitle.textContent = '¡Nivel Fallido!';
                victoryTitle.style.color = '#ef4444';
            }
            if (trophyIcon) {
                trophyIcon.className = 'fas fa-times-circle';
                trophyIcon.style.color = '#ef4444';
            }
            // Ocultar botón de siguiente nivel cuando pierde
            if (nextLevelBtn) {
                nextLevelBtn.style.display = 'none';
            }
        } else {
            // Ganó el nivel
            if (victoryTitle) {
                victoryTitle.textContent = '¡Laboratorio Completado!';
                victoryTitle.style.color = '#06b6d4';
            }
            if (trophyIcon) {
                trophyIcon.className = 'fas fa-trophy';
                trophyIcon.style.color = '#fbbf24';
            }
            // Mostrar botón de siguiente nivel cuando gana
            if (nextLevelBtn) {
                nextLevelBtn.style.display = 'inline-flex';
            }
        }
        
        const finalScoreEl = document.getElementById('final-score');
        const finalTimeEl = document.getElementById('final-time');
        const finalAccuracyEl = document.getElementById('final-accuracy');
        
        if (finalScoreEl) finalScoreEl.textContent = this.score;
        if (finalTimeEl) {
            finalTimeEl.textContent = 
                `${Math.floor(timeTaken / 60)}:${(timeTaken % 60).toString().padStart(2, '0')}`;
        }
        
        if (finalAccuracyEl) {
            const accuracy = Math.round((this.score / GAME_CONFIG.maxScore) * 100);
            finalAccuracyEl.textContent = `${accuracy}%`;
        }
        
        // Mostrar logros
        const achievementsList = document.getElementById('achievements-list');
        if (achievementsList) {
            achievementsList.innerHTML = this.achievements.map(achId => {
                const ach = CERVICAL_DATA.achievements.find(a => a.id === achId);
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
        }
        
        // Puntos de aprendizaje
        const learningList = document.getElementById('learning-points');
        if (learningList) {
            learningList.innerHTML = CERVICAL_DATA.learningPoints.map(point => 
                `<li>${point}</li>`
            ).join('');
        }
        
        console.log('✅ Mostrando fase de victoria');
        
        // Ocultar todas las fases primero
        document.querySelectorAll('.game-phase').forEach(phase => {
            phase.classList.remove('active');
        });
        
        // Mostrar pantalla de victoria
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
            const correctAnswers = Object.values(this.phaseProgress)
                .reduce((sum, phase) => sum + (phase.completed || 0), 0);
            
            const totalQuestions = Object.values(this.phaseProgress)
                .reduce((sum, phase) => sum + (phase.total || 0), 0);
            
            const scoreData = {
                level_type: 'cervical',
                score: this.score,
                time_taken: timeTaken,
                anomalies_found: correctAnswers,
                total_anomalies: totalQuestions
            };
            
            await window.authClient.submitScore(scoreData);
            
            // Disparar evento de completado
            window.dispatchEvent(new CustomEvent('level-completed', {
                detail: {
                    levelType: 'cervical',
                    score: this.score,
                    success: true
                }
            }));
            
            // Notificar al sistema de progresión
            if (window.levelProgressionManager) {
                window.levelProgressionManager.onLevelCompleted('cervical', this.score);
            }
            
            console.log('✅ Puntuación guardada exitosamente');
        } catch (error) {
            // Registrar error solo en consola, no mostrar al usuario
            console.error('❌ Error al guardar puntuación:', error.message);
        }
    }
}

// Inicializar juego cuando cargue el DOM
document.addEventListener('DOMContentLoaded', () => {
    window.cervicalGame = new CervicalCancerGame();
});
