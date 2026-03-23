// GET /api/auth/naver — 네이버 OAuth 로그인 시작
export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.naverClientId,
    redirect_uri: config.naverRedirectUri,
    state: Math.random().toString(36).substring(2),
  })
  return sendRedirect(event, `https://nid.naver.com/oauth2.0/authorize?${params}`)
})
