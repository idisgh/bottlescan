import { createClient } from '@supabase/supabase-js'

// GET /api/auth/naver/callback — 네이버 OAuth 콜백 처리
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const code = query.code as string

  if (!code) {
    return sendRedirect(event, '/login?error=naver_cancelled')
  }

  // 1. 네이버에서 access_token 받기
  const tokenRes = await $fetch<any>('https://nid.naver.com/oauth2.0/token', {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.naverClientId,
      client_secret: config.naverClientSecret,
      code,
      state: query.state as string,
    }),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  }).catch(() => null)

  if (!tokenRes?.access_token) {
    return sendRedirect(event, '/login?error=naver_token_failed')
  }

  // 2. 네이버 유저 정보 가져오기
  const profileRes = await $fetch<any>('https://openapi.naver.com/v1/nid/me', {
    headers: { Authorization: `Bearer ${tokenRes.access_token}` },
  }).catch(() => null)

  if (!profileRes?.response) {
    return sendRedirect(event, '/login?error=naver_profile_failed')
  }

  const naverUser = profileRes.response
  // 이메일 없으면 네이버 ID 기반으로 가상 이메일 생성
  const email = naverUser.email || `naver_${naverUser.id}@bottlescan.app`
  const name = naverUser.name || naverUser.nickname || '네이버 유저'

  // 3. Supabase에 유저 upsert (service role)
  const supabase = createClient(config.public.supabaseUrl, config.supabaseServiceRoleKey)

  // 이미 있는 유저인지 확인
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const existingUser = existingUsers?.users?.find((u: any) => u.email === email)

  let userId: string

  if (existingUser) {
    userId = existingUser.id
  } else {
    // 신규 유저 생성
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: name, provider: 'naver', avatar_url: naverUser.profile_image },
    })
    if (createError || !newUser?.user) {
      return sendRedirect(event, '/login?error=supabase_create_failed')
    }
    userId = newUser.user.id
  }

  // 4. magic link 방식으로 세션 생성
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })

  if (linkError || !linkData?.properties?.hashed_token) {
    return sendRedirect(event, '/login?error=session_failed')
  }

  // 5. 클라이언트가 세션 처리할 수 있도록 토큰과 함께 리다이렉트
  const token = linkData.properties.hashed_token
  return sendRedirect(event, `/auth/confirm?token_hash=${token}&type=magiclink&next=/`)
})
