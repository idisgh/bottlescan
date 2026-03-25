// 제보 등록 + 알림 전송
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { whiskyId, storeId, price, note, userId } = await readBody(event)

  if (!whiskyId || !storeId || !price || !userId) {
    throw createError({ statusCode: 400, message: 'Missing fields' })
  }

  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceRoleKey
  )

  // 제보 저장
  const { data: report, error } = await supabase
    .from('reports')
    .insert({ whiskey_id: whiskyId, store_id: storeId, price, note: note || null, user_id: userId })
    .select('*, whiskeys(*), stores(*)')
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  // 비동기로 푸시 전송 (실패해도 제보 저장은 OK)
  sendPushNotifications(supabase, config, report).catch(console.error)

  return report
})

async function sendPushNotifications(supabase: any, config: any, report: any) {
  const whiskyName = report.whiskeys?.name || '위스키'
  const storeName = report.stores?.name || '매장'
  const price = report.price?.toLocaleString()

  // 이 위스키 알림 구독자 조회
  const { data: alerts } = await supabase
    .from('whisky_alerts')
    .select('user_id')
    .eq('whisky_id', report.whiskey_id)

  if (!alerts?.length) return

  const userIds = alerts.map((a: any) => a.user_id).filter((id: string) => id !== report.user_id)
  if (!userIds.length) return

  // 구독자 push endpoint 조회
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .in('user_id', userIds)

  if (!subs?.length) return

  webpush.setVapidDetails(
    config.vapidEmail,
    config.vapidPublicKey,
    config.vapidPrivateKey
  )

  const payload = JSON.stringify({
    title: `🥃 ${whiskyName} 입고 제보!`,
    body: `${storeName} — ₩${price}`,
    url: `/whisky/${report.whiskey_id}`,
    icon: '/pwa-192x192.png',
  })

  await Promise.allSettled(
    subs.map((sub: any) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
    )
  )
}
