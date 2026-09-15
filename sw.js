const CACHE_VERSION = "v5";
const CACHE_NAME = `rotina-manutencao-${CACHE_VERSION}`;
const URLS_TO_CACHE = ["./", "./index.html", "./manifest.json"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_CACHE))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Estratégia "network-first": sempre tenta buscar a versão mais recente na rede.
// Só usa o cache como reserva quando não há conexão (modo offline).
// Isso garante que toda atualização publicada no GitHub chegue a todos os
// celulares assim que tiverem internet, sem precisar desinstalar nada.
//
// IMPORTANTE: só interceptamos requisições GET. Requisições POST/PUT/PATCH
// (uploads de foto, salvamento de dados no Supabase, etc.) precisam passar
// direto para a rede sem passar pelo cache — a Cache API não suporta cachear
// métodos que não sejam GET, e tentar fazer isso quebra o upload silenciosamente.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return; // deixa passar direto para a rede, sem interceptar
  }
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
