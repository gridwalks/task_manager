import { useEffect, useRef } from 'react'

// Debounced autosave alone isn't enough — switching tabs or apps (especially
// on mobile, where backgrounding a tab can suspend or discard it) can happen
// before the debounce timer fires, silently dropping the pending edit. This
// flushes an immediate save the moment the page is about to be hidden.
export function useFlushSaveOnHide(form, save, autosaveTimerRef) {
  const formRef = useRef(form)
  useEffect(() => { formRef.current = form }, [form])

  useEffect(() => {
    const flush = () => {
      clearTimeout(autosaveTimerRef.current)
      save(formRef.current)
    }
    const onVisibility = () => { if (document.visibilityState === 'hidden') flush() }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', flush)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', flush)
    }
  }, [save, autosaveTimerRef])
}
