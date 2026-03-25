// Push 구독 등록/갱신
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  const { endpoint, p256dh, auth, userId } = body

  if (!endpoint || !p256dh || !auth || !userId) {
    throw createError({ statusCode: 400, message: 'Missing fields' })
  }

  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceRoleKey
  )

  // upsert (endpoint 기준)
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({ user_id: userId, endpoint, p256dh, auth }, { onConflict: 'endpoint' })

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { success: true }
})
