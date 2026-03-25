// 위스키 알림 구독 토글
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { userId, whiskyId } = await readBody(event)

  if (!userId || !whiskyId) {
    throw createError({ statusCode: 400, message: 'Missing fields' })
  }

  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceRoleKey
  )

  // 기존 구독 확인
  const { data: existing } = await supabase
    .from('whisky_alerts')
    .select('id')
    .eq('user_id', userId)
    .eq('whisky_id', whiskyId)
    .single()

  if (existing) {
    // 이미 구독 중 → 취소
    await supabase.from('whisky_alerts').delete().eq('id', existing.id)
    return { subscribed: false }
  } else {
    // 신규 구독
    await supabase.from('whisky_alerts').insert({ user_id: userId, whisky_id: whiskyId })
    return { subscribed: true }
  }
})
