'use client'

import { useEffect } from 'react'

export default function PWARegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('✅ Service Worker registrado:', registration.scope)
            console.log('📱 Manifest:', document.querySelector('link[rel="manifest"]')?.getAttribute('href'))
          })
          .catch((error) => {
            console.error('❌ Erro ao registrar Service Worker:', error)
          })
      })
    }

    // Verificar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('📲 PWA já está instalado')
    }

    // Listener para evento de instalação
    let deferredPrompt: any = null

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      deferredPrompt = e
      console.log('🎯 Prompt de instalação disponível!', e)
    })

    // Expor função global para debug (opcional)
    if (typeof window !== 'undefined') {
      ;(window as any).showInstallPrompt = () => {
        if (deferredPrompt) {
          deferredPrompt.prompt()
          deferredPrompt.userChoice.then((choiceResult: any) => {
            console.log('Escolha do usuário:', choiceResult.outcome)
            deferredPrompt = null
          })
        } else {
          console.log('Prompt de instalação não está disponível')
        }
      }
    }
  }, [])

  return null
}

