export type OGPMeta = {
  title?: string
  description?: string
  url?: string
  image?: string
  siteName?: string
  twitterSite?: string
}

function setOrUpdateMeta(attr: 'name' | 'property', key: string, content?: string) {
  const selector = `meta[${attr}="${key}"]`
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!content) {
    if (el) el.remove()
    return
  }
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export function applyOgp(meta: OGPMeta) {
  if (meta.title) {
    document.title = meta.title
    setOrUpdateMeta('property', 'og:title', meta.title)
    setOrUpdateMeta('name', 'twitter:title', meta.title)
  }
  if (meta.description) {
    setOrUpdateMeta('name', 'description', meta.description)
    setOrUpdateMeta('property', 'og:description', meta.description)
    setOrUpdateMeta('name', 'twitter:description', meta.description)
  }
  if (meta.url) {
    setOrUpdateMeta('property', 'og:url', meta.url)
  }
  if (meta.image) {
    setOrUpdateMeta('property', 'og:image', meta.image)
    setOrUpdateMeta('name', 'twitter:image', meta.image)
  }
  setOrUpdateMeta('property', 'og:type', 'website')
  setOrUpdateMeta('property', 'og:site_name', meta.siteName ?? '同人メーター')
  setOrUpdateMeta('name', 'twitter:card', 'summary_large_image')
  setOrUpdateMeta('name', 'twitter:site', meta.twitterSite ?? '@aokikyuran')
}


