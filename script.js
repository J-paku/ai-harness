// ===== 表示設定: テーマ切替 =====
const settings = document.getElementById('settings')
const settingsBtn = document.getElementById('settingsBtn')
const settingsMenu = document.getElementById('settingsMenu')
const themeOpts = Array.from(settingsMenu.querySelectorAll('[data-set-theme]'))

const readTheme = () => {
  try { return localStorage.getItem('hp-theme') || 'system' } catch (e) { return 'system' }
}
const applyTheme = (mode) => {
  if (mode === 'system') document.documentElement.removeAttribute('data-theme')
  else document.documentElement.setAttribute('data-theme', mode)
  themeOpts.forEach((o) => o.setAttribute('aria-checked', String(o.dataset.setTheme === mode)))
  try { mode === 'system' ? localStorage.removeItem('hp-theme') : localStorage.setItem('hp-theme', mode) } catch (e) { /* 保存不可でも切替自体は成立させる */ }
}
applyTheme(readTheme())

const openSettings = (open) => {
  settingsMenu.hidden = !open
  settingsBtn.setAttribute('aria-expanded', String(open))
}
settingsBtn.addEventListener('click', () => openSettings(settingsMenu.hidden))
themeOpts.forEach((o) => o.addEventListener('click', () => {
  applyTheme(o.dataset.setTheme)
  openSettings(false)
  settingsBtn.focus()
}))
document.addEventListener('click', (e) => {
  if (!settings.contains(e.target)) openSettings(false)
})
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !settingsMenu.hidden) {
    openSettings(false)
    settingsBtn.focus()
  }
})

// セクションドットナビ生成
const panels = Array.from(document.querySelectorAll('.panel'))

// 1画面に収まらないパネルをスナップ対象から外す。
// スナップ対象のまま高さを超えると先頭へ引き戻され、下へ進めなくなるため。
const syncTallPanels = () => {
  panels.forEach((p) => {
    p.classList.remove('is-tall')
    const inner = p.querySelector('.panel__inner')
    const cs = getComputedStyle(p)
    const need = inner.scrollHeight + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)
    if (need > window.innerHeight) p.classList.add('is-tall')
  })
}
syncTallPanels()
let resizeTimer
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(syncTallPanels, 150)
})
const dots = document.getElementById('dots')
panels.forEach((p) => {
  const a = document.createElement('a')
  a.href = '#' + p.id
  a.setAttribute('aria-label', p.dataset.nav || p.id)
  a.title = p.dataset.nav || p.id
  a.addEventListener('click', (e) => {
    e.preventDefault()
    p.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
  dots.appendChild(a)
})
const dotLinks = Array.from(dots.children)

// 出現アニメーション + カウントアップ + 棒グラフ伸長
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return
    entry.target.classList.add('is-in')
    revealObserver.unobserve(entry.target)
  })
}, { threshold: 0.12 })
document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el))

// 数値カウントアップ(初回のみ)
const countObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return
    const el = entry.target
    countObserver.unobserve(el)
    // 動きを抑える設定、または非表示タブではHTMLの最終値をそのまま残す
    // (非表示タブはrAFが止まり、途中の値で固まるため)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.hidden) return
    const target = parseFloat(el.dataset.count)
    const suffix = el.dataset.suffix || ''
    const decimals = (el.dataset.count.split('.')[1] || '').length
    const start = performance.now()
    const dur = 900
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur)
      const eased = 1 - Math.pow(1 - t, 3)
      const v = target * eased
      el.textContent = v.toLocaleString('ja-JP', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
}, { threshold: 0.5 })
document.querySelectorAll('[data-count]').forEach((el) => countObserver.observe(el))

// 棒グラフは可視化時に幅を伸ばす
const barObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return
    const el = entry.target
    barObserver.unobserve(el)
    requestAnimationFrame(() => { el.style.width = el.dataset.w + '%' })
  })
}, { threshold: 0.4 })
document.querySelectorAll('.bar__fill').forEach((el) => {
  el.style.width = '0%'
  barObserver.observe(el)
})

// 現在地の追従(ドット + 上部プログレス)
const fill = document.getElementById('progressFill')
const activeObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return
    const i = panels.indexOf(entry.target)
    dotLinks.forEach((d, di) => d.classList.toggle('is-active', di === i))
    fill.style.width = ((i + 1) / panels.length * 100) + '%'
  })
}, { threshold: 0.55 })
panels.forEach((p) => activeObserver.observe(p))
