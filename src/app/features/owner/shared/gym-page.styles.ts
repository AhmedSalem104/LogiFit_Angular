// Shared inline styles string used by gym-management list pages for consistency.
// Keeps each component file lean while matching the rest of the app's look & feel.
export const GYM_PAGE_STYLES = `
  :host { display: block; }
  .gym-page { padding: 0; }
  .header-actions { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }

  .stats-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  .mini-stat {
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: 14px;
    padding: 1rem 1.25rem;
    display: flex;
    align-items: center;
    gap: 0.875rem;
    transition: transform .2s ease, box-shadow .2s ease;
  }
  .mini-stat:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }
  .mini-stat__icon {
    width: 44px; height: 44px; border-radius: 12px;
    display:flex; align-items:center; justify-content:center;
    color:white; font-size:1.15rem; flex-shrink: 0;
  }
  .mini-stat__icon.blue   { background: linear-gradient(135deg,#3b82f6,#2563eb); }
  .mini-stat__icon.green  { background: linear-gradient(135deg,#10b981,#059669); }
  .mini-stat__icon.orange { background: linear-gradient(135deg,#f59e0b,#d97706); }
  .mini-stat__icon.red    { background: linear-gradient(135deg,#ef4444,#dc2626); }
  .mini-stat__icon.purple { background: linear-gradient(135deg,#8b5cf6,#7c3aed); }
  .mini-stat__icon.cyan   { background: linear-gradient(135deg,#06b6d4,#0891b2); }
  .mini-stat__icon.gray   { background: linear-gradient(135deg,#64748b,#475569); }
  .mini-stat__content { display:flex; flex-direction:column; gap:.15rem; }
  .mini-stat__value { font-size: 1.4rem; font-weight: 700; color: var(--text-primary); line-height: 1; }
  .mini-stat__label { font-size: .8rem; color: var(--text-secondary); }

  .toolbar {
    display: flex; gap: .75rem; align-items: center; flex-wrap: wrap;
    padding: 1rem 1.25rem; background: var(--card-bg);
    border: 1px solid var(--card-border); border-radius: 14px;
    margin-bottom: 1rem;
  }
  .toolbar .flex-fill { flex: 1 1 220px; }
  .toolbar .search-input {
    position: relative;
    flex: 1 1 260px;
  }
  .toolbar .search-input i {
    position: absolute; top: 50%; right: 1rem; transform: translateY(-50%);
    color: var(--text-muted); pointer-events: none;
  }
  :host-context([dir="ltr"]) .toolbar .search-input i {
    right: auto; left: 1rem;
  }
  .toolbar input.form-input { padding-right: 2.5rem; }
  :host-context([dir="ltr"]) .toolbar input.form-input { padding-right: 1rem; padding-left: 2.5rem; }

  .data-card {
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: 16px;
    overflow: hidden;
  }
  .data-card :host ::ng-deep .p-datatable .p-datatable-thead > tr > th {
    background: var(--bg-secondary);
    color: var(--text-secondary);
    font-weight: 600;
    font-size: .8rem;
  }
  .empty-state {
    padding: 3rem 1rem;
    text-align: center;
    color: var(--text-muted);
  }
  .empty-state i { font-size: 2.75rem; display:block; margin-bottom: .75rem; opacity: .5; }
  .empty-state p { font-size: .95rem; }

  .action-btn {
    width: 34px; height: 34px; padding: 0; border: 1px solid var(--border-color);
    background: var(--bg-secondary); color: var(--text-secondary);
    border-radius: 8px; cursor: pointer; transition: all .2s ease;
    display: inline-flex; align-items: center; justify-content: center;
    margin: 0 .15rem;
  }
  .action-btn:hover { background: var(--primary-50); color: var(--primary-500); border-color: var(--primary-500); }
  .action-btn.danger:hover { background: rgba(239,68,68,.1); color: #ef4444; border-color: #ef4444; }
  .action-btn.success:hover { background: rgba(16,185,129,.1); color: #10b981; border-color: #10b981; }

  .badge {
    display: inline-flex; padding: .25rem .65rem; border-radius: 999px;
    font-size: .75rem; font-weight: 600;
  }
  .badge.green  { background: rgba(16,185,129,.15); color: #10b981; }
  .badge.red    { background: rgba(239,68,68,.15); color: #ef4444; }
  .badge.orange { background: rgba(245,158,11,.15); color: #f59e0b; }
  .badge.blue   { background: rgba(59,130,246,.15); color: #3b82f6; }
  .badge.gray   { background: rgba(100,116,139,.15); color: #64748b; }
  .badge.purple { background: rgba(139,92,246,.15); color: #8b5cf6; }

  .dialog-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
  }
  .dialog-grid .full { grid-column: 1 / -1; }
  .dialog-actions {
    display: flex; justify-content: flex-end; gap: .5rem;
    margin-top: 1.25rem; padding-top: 1rem;
    border-top: 1px solid var(--border-color);
  }

  .section-title {
    display: flex; align-items: center; gap: .5rem;
    font-size: 1rem; font-weight: 600; color: var(--text-primary);
    margin: 0 0 1rem; padding-bottom: .5rem;
    border-bottom: 1px solid var(--border-color);
  }
  .section-title i { color: var(--primary-500); }
`;
