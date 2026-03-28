const CACHE_NAME = 'smart-mercado-v1'
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
]

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto')
        return cache.addAll(urlsToCache)
      })
  )
})

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
  // Ignora requisições de extensões do Chrome e outros esquemas não suportados
  if (!event.request.url.startsWith('http://') && !event.request.url.startsWith('https://')) {
    return
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retorna do cache se encontrado
        if (response) {
          return response
        }

        // Clona a requisição
        const fetchRequest = event.request.clone()

        return fetch(fetchRequest).then((response) => {
          // Verifica se a resposta é válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response
          }

          // Clona a resposta
          const responseToCache = response.clone()

          // Adiciona ao cache
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache)
            })
            .catch((err) => {
              console.log('Erro ao adicionar ao cache:', err)
            })

          return response
        })
        .catch(() => {
          // Retorna erro silencioso se o fetch falhar
          return new Response('', { status: 408, statusText: 'Offline' })
        })
      })
  )
})

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Cache antigo removido:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})