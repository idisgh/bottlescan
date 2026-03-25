<script setup lang="ts">
useHead({ title: 'BottleScan — 매장 찾기' })

const config = useRuntimeConfig()
const { fetchAllStores } = useBottleScan()

const { data: stores } = await useAsyncData('stores', () => fetchAllStores())

const mapRef = ref<HTMLDivElement>()
const isMapLoaded = ref(false)
const selectedStore = ref<any>(null)
const userLat = ref<number | null>(null)
const userLng = ref<number | null>(null)
const searchQuery = ref('')

// 온라인/전국 매장 제외
const physicalStores = computed(() =>
  (stores.value || []).filter(s => s.region !== '온라인' && s.sub_region !== '편의점' && s.region !== '전국')
)

const filteredStores = computed(() => {
  const q = searchQuery.value.toLowerCase()
  if (!q) return physicalStores.value
  return physicalStores.value.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.region.toLowerCase().includes(q) ||
    s.sub_region?.toLowerCase().includes(q)
  )
})

// 카카오맵 초기화
onMounted(async () => {
  await loadKakaoMap()
})

function loadKakaoMap() {
  return new Promise<void>((resolve) => {
    const kakao = (window as any).kakao
    if (kakao?.maps?.Map) {
      initMap()
      resolve()
      return
    }

    const script = document.createElement('script')
    // autoload=true (기본값) — 스크립트 로드 완료 시점에 바로 사용 가능
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${config.public.kakaoJsKey}&libraries=services`
    script.onload = () => {
      nextTick(() => {
        initMap()
        resolve()
      })
    }
    script.onerror = (e) => {
      console.error('카카오맵 SDK 로드 실패 — 도메인 등록 확인 필요', e)
      resolve()
    }
    document.head.appendChild(script)
  })
}

let map: any = null
let markers: any[] = []
let geocoder: any = null
let infowindow: any = null

function initMap() {
  if (!mapRef.value) {
    console.error('mapRef not ready')
    return
  }
  const kakao = (window as any).kakao
  if (!kakao?.maps?.Map) {
    console.error('kakao.maps not ready')
    return
  }

  map = new kakao.maps.Map(mapRef.value, {
    center: new kakao.maps.LatLng(37.5665, 126.9780), // 서울 중심
    level: 8,
  })
  geocoder = new kakao.maps.services.Geocoder()
  infowindow = new kakao.maps.InfoWindow({ zIndex: 1 })
  isMapLoaded.value = true

  // 내 위치
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((pos) => {
      userLat.value = pos.coords.latitude
      userLng.value = pos.coords.longitude
      const myPos = new kakao.maps.LatLng(userLat.value!, userLng.value!)
      map.setCenter(myPos)
      map.setLevel(6)

      // 내 위치 마커
      new kakao.maps.Marker({
        map,
        position: myPos,
        title: '내 위치',
        image: new kakao.maps.MarkerImage(
          'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png',
          new kakao.maps.Size(24, 35)
        ),
      })
    })
  }

  addMarkers(physicalStores.value)
}

function addMarkers(storeList: any[]) {
  if (!map || !geocoder) return
  const kakao = (window as any).kakao

  // 기존 마커 제거
  markers.forEach(m => m.setMap(null))
  markers = []

  storeList.forEach((store) => {
    if (!store.address || store.address === '전국' || store.address === '온라인') return

    geocoder.addressSearch(store.address, (result: any[], status: string) => {
      if (status !== kakao.maps.services.Status.OK) return

      const pos = new kakao.maps.LatLng(result[0].y, result[0].x)
      const marker = new kakao.maps.Marker({ map, position: pos, title: store.name })
      markers.push(marker)

      kakao.maps.event.addListener(marker, 'click', () => {
        selectedStore.value = store
        infowindow.setContent(`
          <div style="padding:8px 12px;font-size:13px;font-weight:600;color:#1a1a1a;max-width:180px">
            ${store.name}
            <div style="font-size:11px;font-weight:400;color:#666;margin-top:2px">${store.address}</div>
          </div>
        `)
        infowindow.open(map, marker)
      })
    })
  })
}

watch(filteredStores, (list) => {
  if (isMapLoaded.value) addMarkers(list)
})

function focusStore(store: any) {
  if (!map || !geocoder || !store.address) return
  const kakao = (window as any).kakao
  selectedStore.value = store

  geocoder.addressSearch(store.address, (result: any[], status: string) => {
    if (status !== kakao.maps.services.Status.OK) return
    const pos = new kakao.maps.LatLng(result[0].y, result[0].x)
    map.setCenter(pos)
    map.setLevel(4)
  })
}
</script>

<template>
  <main class="max-w-6xl mx-auto px-4 sm:px-6 py-8">
    <div class="mb-6">
      <h1 class="font-serif text-3xl font-bold text-white">매장 찾기</h1>
      <p class="text-bs-text-secondary mt-1">위스키를 구매할 수 있는 매장을 지도에서 확인하세요</p>
    </div>

    <div class="flex flex-col lg:flex-row gap-4 h-[calc(100vh-220px)] min-h-[500px]">
      <!-- 좌측: 매장 목록 -->
      <div class="lg:w-80 flex flex-col gap-3 overflow-hidden">
        <!-- 검색 -->
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="매장명 또는 지역 검색"
            class="w-full bg-bs-card border border-bs-border rounded-xl px-4 py-3 text-sm text-bs-text-primary placeholder-bs-text-tertiary focus:outline-none focus:border-bs-gold/50 pr-10"
          />
          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-bs-text-tertiary text-base">🔍</span>
        </div>

        <!-- 매장 리스트 -->
        <div class="flex-1 overflow-y-auto space-y-2 pr-1">
          <p class="text-xs text-bs-text-tertiary px-1">{{ filteredStores.length }}개 매장</p>
          <button
            v-for="store in filteredStores"
            :key="store.id"
            class="w-full text-left bg-bs-card border rounded-xl px-4 py-3.5 transition-all hover:border-bs-gold/30"
            :class="selectedStore?.id === store.id ? 'border-bs-gold/50 bg-bs-gold/5' : 'border-bs-border'"
            @click="focusStore(store)"
          >
            <p class="text-sm font-semibold text-bs-text-primary">{{ store.name }}</p>
            <p class="text-xs text-bs-text-tertiary mt-0.5">{{ store.address }}</p>
            <div class="flex items-center gap-2 mt-1.5">
              <span class="text-[10px] bg-bs-border px-2 py-0.5 rounded text-bs-text-secondary">{{ store.region }}</span>
              <span v-if="store.sub_region" class="text-[10px] text-bs-text-tertiary">{{ store.sub_region }}</span>
            </div>
          </button>

          <div v-if="!filteredStores.length" class="text-center text-bs-text-tertiary py-8 text-sm">
            검색 결과가 없어요
          </div>
        </div>
      </div>

      <!-- 우측: 지도 -->
      <div class="flex-1 relative rounded-2xl overflow-hidden border border-bs-border">
        <div ref="mapRef" class="w-full h-full" />

        <!-- 로딩 -->
        <div v-if="!isMapLoaded" class="absolute inset-0 bg-bs-card flex items-center justify-center">
          <div class="text-center">
            <div class="w-8 h-8 border-2 border-bs-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p class="text-bs-text-secondary text-sm">지도 불러오는 중...</p>
          </div>
        </div>

        <!-- 선택된 매장 정보 -->
        <Transition name="slide-up">
          <div
            v-if="selectedStore"
            class="absolute bottom-4 left-4 right-4 bg-bs-card/95 backdrop-blur border border-bs-gold/30 rounded-xl p-4"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-white text-sm">{{ selectedStore.name }}</p>
                <p class="text-xs text-bs-text-secondary mt-0.5 truncate">{{ selectedStore.address }}</p>
              </div>
              <div class="flex gap-2 shrink-0">
                <a
                  :href="`https://map.kakao.com/link/search/${encodeURIComponent(selectedStore.name)}`"
                  target="_blank"
                  class="text-xs bg-[#FEE500] text-[#191919] font-semibold px-3 py-1.5 rounded-lg hover:bg-[#fdd900] transition-colors"
                >
                  길찾기
                </a>
                <NuxtLink
                  to="/report"
                  class="text-xs bg-bs-gold text-bs-black font-semibold px-3 py-1.5 rounded-lg hover:bg-bs-gold-light transition-colors"
                >
                  제보
                </NuxtLink>
                <button
                  class="text-bs-text-tertiary hover:text-bs-text-secondary"
                  @click="selectedStore = null; infowindow?.close()"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </main>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active { transition: all 0.25s ease; }
.slide-up-enter-from,
.slide-up-leave-to { transform: translateY(20px); opacity: 0; }
</style>
