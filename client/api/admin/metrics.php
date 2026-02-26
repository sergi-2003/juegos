async function openAdminMetrics() {
  const token = localStorage.getItem('accessToken');
  if (!token) return alert('Necesitas iniciar sesión.');

  const modal = document.getElementById('admin-metrics-modal');
  const loading = document.getElementById('admin-metrics-loading');
  const errorEl = document.getElementById('admin-metrics-error');
  const cardsEl = document.getElementById('admin-metrics-cards');
  const topBody = document.getElementById('admin-metrics-top-body');
  const levelBody = document.getElementById('admin-metrics-level-body');

  modal.classList.remove('hidden');
  modal.classList.add('show');

  loading.style.display = 'block';
  errorEl.style.display = 'none';
  errorEl.textContent = '';
  cardsEl.innerHTML = '';
  topBody.innerHTML = `<tr><td colspan="5" class="muted">Cargando...</td></tr>`;
  levelBody.innerHTML = `<tr><td colspan="5" class="muted">Cargando...</td></tr>`;

  try {
    const res = await fetch('/api/admin/metrics', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('No se pudo cargar /api/admin/metrics');
    const data = await res.json();

    const cards = [
      { label: 'Usuarios totales', value: data.totals?.total_users ?? 0 },
      { label: 'Usuarios activos', value: data.totals?.active_users ?? 0 },
      { label: 'Admins', value: data.totals?.admins ?? 0 },
      { label: 'Partidas totales', value: data.totals?.total_games ?? 0 },
      { label: 'Puntaje prom.', value: Math.round(data.totals?.avg_score ?? 0) },
      { label: 'Tiempo prom. (s)', value: Math.round(data.totals?.avg_time ?? 0) },
      { label: 'Precisión prom. (%)', value: Number(data.totals?.avg_accuracy ?? 0).toFixed(2) },
    ];

    cardsEl.innerHTML = cards.map(c => `
      <div class="metrics-card">
        <div class="label">${c.label}</div>
        <div class="value">${c.value}</div>
        <div class="sub">Actualizado: ${data.generated_at ?? '-'}</div>
      </div>
    `).join('');

    const top = data.top_players ?? [];
    topBody.innerHTML = top.length
      ? top.map((p, i) => `
          <tr>
            <td>${i + 1}</td>
            <td>${p.username ?? ('ID ' + p.id)}</td>
            <td>${p.role ?? '-'}</td>
            <td>${p.games_played ?? 0}</td>
            <td>${p.total_score ?? 0}</td>
          </tr>
        `).join('')
      : `<tr><td colspan="5" class="muted">Sin datos</td></tr>`;

    const levels = data.by_level ?? [];
    levelBody.innerHTML = levels.length
      ? levels.map(r => `
          <tr>
            <td>${r.level_type}</td>
            <td>${r.games}</td>
            <td>${Math.round(r.avg_score)}</td>
            <td>${Math.round(r.avg_time_taken)}</td>
            <td>${Number(r.avg_accuracy).toFixed(2)}</td>
          </tr>
        `).join('')
      : `<tr><td colspan="5" class="muted">Sin datos</td></tr>`;

  } catch (err) {
    errorEl.style.display = 'block';
    errorEl.textContent = 'Error: ' + (err.message || err);
  } finally {
    loading.style.display = 'none';
  }
}