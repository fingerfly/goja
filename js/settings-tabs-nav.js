function setActiveTab(tabsEl, key) {
  tabsEl?.querySelectorAll('[data-settings-tab]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.settingsTab === key);
  });
}

export function getActiveSectionKey(panelBodyEl) {
  const sections = panelBodyEl?.querySelectorAll('[data-settings-section]');
  if (!sections?.length) return null;
  const top = panelBodyEl.scrollTop + (panelBodyEl.querySelector('#settingsSectionTabs')?.offsetHeight || 0) + 12;
  let active = sections[0];
  sections.forEach((section) => {
    if (section.offsetTop <= top) active = section;
  });
  return active?.dataset.settingsSection ?? null;
}

export function initSettingsTabsNav(panelBodyEl, tabsEl) {
  if (!panelBodyEl || !tabsEl) return () => {};
  let lockedKey = null;
  let lockUntil = 0;
  const onClick = (e) => {
    const btn = e.target.closest('[data-settings-tab]');
    if (!btn) return;
    const key = btn.dataset.settingsTab;
    const section = panelBodyEl.querySelector(`[data-settings-section="${key}"]`);
    if (!section) return;
    section.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'auto' });
    lockedKey = key;
    lockUntil = Date.now() + 300;
    setActiveTab(tabsEl, key);
  };
  const onScroll = () => {
    if (panelBodyEl.scrollHeight <= panelBodyEl.clientHeight) return;
    if (lockedKey && Date.now() < lockUntil) {
      setActiveTab(tabsEl, lockedKey);
      return;
    }
    lockedKey = null;
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
