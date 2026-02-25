function setActiveTab(tabsEl, key) {
  tabsEl?.querySelectorAll('[data-settings-tab]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.settingsTab === key);
  });
}

export function getActiveSectionKey(panelBodyEl) {
  const sections = panelBodyEl?.querySelectorAll('[data-settings-section]');
  if (!sections?.length) return null;
  const top = panelBodyEl.scrollTop + 12;
  let active = sections[0];
  sections.forEach((section) => {
    if (section.offsetTop <= top) active = section;
  });
  return active?.dataset.settingsSection ?? null;
}

export function initSettingsTabsNav(panelBodyEl, tabsEl) {
  if (!panelBodyEl || !tabsEl) return () => {};
  const onClick = (e) => {
    const btn = e.target.closest('[data-settings-tab]');
    if (!btn) return;
    const key = btn.dataset.settingsTab;
    const section = panelBodyEl.querySelector(`[data-settings-section="${key}"]`);
    if (!section) return;
    const top = Math.max(0, section.offsetTop - tabsEl.offsetHeight - 8);
    panelBodyEl.scrollTo({ top, behavior: 'smooth' });
    setActiveTab(tabsEl, key);
  };
  const onScroll = () => {
    if (panelBodyEl.scrollHeight <= panelBodyEl.clientHeight) return;
    const key = getActiveSectionKey(panelBodyEl);
    if (key) setActiveTab(tabsEl, key);
  };
  tabsEl.addEventListener('click', onClick);
  panelBodyEl.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  return () => {
    tabsEl.removeEventListener('click', onClick);
    panelBodyEl.removeEventListener('scroll', onScroll);
  };
}
