import { createContext, useContext, useState, type ReactNode } from 'react'

type PostFormContextValue = {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

const PostFormContext = createContext<PostFormContextValue | undefined>(undefined)

export function PostFormProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)
  const toggle = () => setIsOpen(v => !v)

  return (
    <PostFormContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
    </PostFormContext.Provider>
  )
}

export function usePostForm() {
  const ctx = useContext(PostFormContext)
  if (!ctx) throw new Error('usePostForm must be used within PostFormProvider')
  return ctx
}
