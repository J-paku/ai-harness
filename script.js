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

// ===== 表示設定: 言語切替 =====
const langOpts = Array.from(settingsMenu.querySelectorAll('[data-set-lang]'))
const i18nHtmlOriginals = new Map()
const i18nAriaOriginals = new Map()
const i18nNavOriginals = new Map()
const i18nSuffixOriginals = new Map()
// 助数詞(件/個)の日本語→韓国語マッピング。ここに無いsuffix(%・x等)はそのまま
const suffixMapJaToKo = { '件': '건', '個': '개' }

const getLang = () => {
  try { return localStorage.getItem('hp-lang') === 'ko' ? 'ko' : 'ja' } catch (e) { return 'ja' }
}

const captureI18nOriginals = () => {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    if (!i18nHtmlOriginals.has(el)) i18nHtmlOriginals.set(el, el.innerHTML)
  })
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    if (!i18nAriaOriginals.has(el)) i18nAriaOriginals.set(el, el.getAttribute('aria-label'))
  })
  document.querySelectorAll('[data-i18n-nav]').forEach((el) => {
    if (!i18nNavOriginals.has(el)) i18nNavOriginals.set(el, el.getAttribute('data-nav'))
  })
  document.querySelectorAll('[data-suffix]').forEach((el) => {
    if (!i18nSuffixOriginals.has(el)) i18nSuffixOriginals.set(el, el.dataset.suffix)
  })
}

// 生成済みの点ナビ(dots内の<a>)のtitle・aria-labelを、各パネルの現在のdata-navへ再同期
const syncDotsNav = () => {
  panels.forEach((p, i) => {
    const label = p.dataset.nav || p.id
    const a = dotLinks[i]
    if (!a) return
    a.title = label
    a.setAttribute('aria-label', label)
  })
}

// チップの助数詞(件/個)を現在言語へ差し替える。数値・カンマ書式は保持し末尾のみ置換する
// (カウントアップ発火前ならdata-suffix更新のみで足り、発火時にその値がそのまま使われる)
const applySuffixLang = (lang) => {
  document.querySelectorAll('[data-suffix]').forEach((el) => {
    const original = i18nSuffixOriginals.get(el)
    const mapped = suffixMapJaToKo[original]
    if (!mapped) return
    const next = lang === 'ko' ? mapped : original
    const current = el.dataset.suffix
    if (current === next) return
    if (el.textContent.endsWith(current)) {
      el.textContent = el.textContent.slice(0, -current.length) + next
    }
    el.dataset.suffix = next
  })
}

const applyLang = (lang) => {
  captureI18nOriginals()
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const ko = window.I18N_KO?.[el.dataset.i18n]
    el.innerHTML = lang === 'ko' && ko != null ? ko : i18nHtmlOriginals.get(el)
  })
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    const ko = window.I18N_KO?.[el.dataset.i18nAria]
    el.setAttribute('aria-label', lang === 'ko' && ko != null ? ko : i18nAriaOriginals.get(el))
  })
  document.querySelectorAll('[data-i18n-nav]').forEach((el) => {
    const ko = window.I18N_KO?.[el.dataset.i18nNav]
    el.setAttribute('data-nav', lang === 'ko' && ko != null ? ko : i18nNavOriginals.get(el))
  })
  applySuffixLang(lang)
  syncDotsNav()
  document.documentElement.setAttribute('lang', lang)
  langOpts.forEach((o) => o.setAttribute('aria-checked', String(o.dataset.setLang === lang)))
  try { localStorage.setItem('hp-lang', lang) } catch (e) { /* 保存不可でも切替自体は成立させる */ }
  syncTallPanels()
}
langOpts.forEach((o) => o.addEventListener('click', () => {
  applyLang(o.dataset.setLang)
  openSettings(false)
  settingsBtn.focus()
}))
if (getLang() === 'ko') applyLang('ko')
else langOpts.forEach((o) => o.setAttribute('aria-checked', String(o.dataset.setLang === 'ja')))

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
