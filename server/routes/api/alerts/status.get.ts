// 특정 위스키 알림 구독 여부 확인
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { userId, whiskyId } = getQuery(event)

  if (!userId || !whiskyId) return { subscribed: false }

  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceRoleKey
  )

  const { data } = await supabase
    .from('whisky_alerts')
    .select('id')
    .eq('user_id', userId)
    .eq('whisky_id', whiskyId)
    .single()

  return { subscribed: !!data }
})
