import { Wine, Search, MapPin, ChevronLeft, Lock, CheckCircle, Check, Inbox } from 'lucide-vue-next'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('LWine', Wine)
  nuxtApp.vueApp.component('LSearch', Search)
  nuxtApp.vueApp.component('LMapPin', MapPin)
  nuxtApp.vueApp.component('LChevronLeft', ChevronLeft)
  nuxtApp.vueApp.component('LLock', Lock)
  nuxtApp.vueApp.component('LCheckCircle', CheckCircle)
  nuxtApp.vueApp.component('LCheck', Check)
  nuxtApp.vueApp.component('LInbox', Inbox)
})
