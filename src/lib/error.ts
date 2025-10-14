import axios from 'axios'

export function getErrorMessage(err: unknown, fallback: string = 'エラーが発生しました'): string {
  // AxiosError handling
  if (axios.isAxiosError(err)) {
    const status = err.response?.status
    const data = err.response?.data as any
    // Backend may return { error: "..." } or field errors or non-field errors
    if (data) {
      if (typeof data === 'string') return data
      if (typeof data.error === 'string') return data.error
      // Flatten dict or array errors to first message
      if (Array.isArray(data)) {
        const first = data[0]
        if (typeof first === 'string') return first
      } else if (typeof data === 'object') {
        for (const key of Object.keys(data)) {
          const v = (data as any)[key]
          if (Array.isArray(v) && v.length > 0) {
            if (typeof v[0] === 'string') return v[0]
          } else if (typeof v === 'string') {
            return v
          }
        }
      }
    }
    // status based fallbacks (Japanese)
    if (status === 400) return 'リクエストが不正です'
    if (status === 401) return '認証に失敗しました'
    if (status === 403) return '権限がありません'
    if (status === 404) return '対象が見つかりません'
    if (status && status >= 500) return 'サーバーエラーが発生しました'
    return err.message || fallback
  }
  // Generic Error
  if (err instanceof Error) return err.message || fallback
  return fallback
}


