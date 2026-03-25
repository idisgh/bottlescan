// Supabase 연동 composable

export interface Whisky {
  id: string
  name: string
  name_en: string
  category: string
  abv: number
  volume_ml: number
  image_url?: string
  created_at: string
}

export interface Store {
  id: string
  name: string
  address: string
  region: string
  sub_region: string
}

export interface Report {
  id: string
  whiskey_id: string
  store_id: string
  user_id: string
  price: number
  photo_url?: string
  note?: string
  created_at: string
  whiskeys?: Whisky
  stores?: Store
  profiles?: { nickname: string }
}

export function useBottleScan() {
  const client = useSupabaseClient()

  // 최근 제보 (join)
  const fetchReports = async (limit = 20) => {
    const { data, error } = await client
      .from('reports')
      .select('*, whiskeys(*), stores(*)')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) console.error('fetchReports:', error)

    // profiles 별도 조회
    const userIds = [...new Set((data || []).map((r: any) => r.user_id))]
    let profileMap: Record<string, string> = {}
    if (userIds.length) {
      const { data: profiles } = await client
        .from('profiles')
        .select('id, nickname')
        .in('id', userIds)
      profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.id, p.nickname]))
    }
    return (data || []).map((r: any) => ({
      ...r,
      profiles: { nickname: profileMap[r.user_id] || 'User' },
    }))
  }

  // 위스키별 제보
  const fetchReportsByWhisky = async (whiskyId: string) => {
    const { data, error } = await client
      .from('reports')
      .select('*, whiskeys(*), stores(*)')
      .eq('whiskey_id', whiskyId)
      .order('price', { ascending: true })
    if (error) console.error('fetchReportsByWhisky:', error)

    const userIds = [...new Set((data || []).map((r: any) => r.user_id))]
    let profileMap: Record<string, string> = {}
    if (userIds.length) {
      const { data: profiles } = await client
        .from('profiles')
        .select('id, nickname')
        .in('id', userIds)
      profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.id, p.nickname]))
    }
    return (data || []).map((r: any) => ({
      ...r,
      profiles: { nickname: profileMap[r.user_id] || 'User' },
    }))
  }

  // 위스키 검색
  const searchWhiskeys = async (query: string) => {
    const { data, error } = await client
      .from('whiskeys')
      .select('*')
      .or(`name.ilike.%${query}%,name_en.ilike.%${query}%`)
      .limit(10)
    if (error) console.error('searchWhiskeys:', error)
    return data || []
  }

  // 매장 검색
  const searchStores = async (query: string) => {
    const { data, error } = await client
      .from('stores')
      .select('*')
      .or(`name.ilike.%${query}%,region.ilike.%${query}%,sub_region.ilike.%${query}%`)
      .limit(10)
    if (error) console.error('searchStores:', error)
    return data || []
  }

  // 위스키 상세
  const fetchWhisky = async (id: string) => {
    const { data, error } = await client
      .from('whiskeys')
      .select('*')
      .eq('id', id)
      .single()
    if (error) console.error('fetchWhisky:', error)
    return data
  }

  // 인기 위스키 (제보 많은 순)
  const fetchPopularWhiskeys = async (limit = 8) => {
    const { data, error } = await client
      .from('reports')
      .select('whiskey_id, whiskeys(*)')
    if (error) {
      console.error('fetchPopularWhiskeys:', error)
      return []
    }
    // 클라이언트에서 그룹핑
    const countMap = new Map<string, { whisky: Whisky; count: number; minPrice: number }>()
    for (const r of data || []) {
      const existing = countMap.get(r.whiskey_id)
      if (existing) {
        existing.count++
        existing.minPrice = Math.min(existing.minPrice, (r as any).price || Infinity)
      } else {
        countMap.set(r.whiskey_id, {
          whisky: r.whiskeys as unknown as Whisky,
          count: 1,
          minPrice: (r as any).price || 0,
        })
      }
    }
    return [...countMap.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }

  // 제보 등록
  const submitReport = async (report: {
    whiskey_id: string
    store_id: string
    price: number
    note?: string
  }) => {
    const { data: { user } } = await client.auth.getUser()
    if (!user) throw new Error('Login required')

    const { data, error } = await client
      .from('reports')
      .insert({
        whiskey_id: report.whiskey_id,
        store_id: report.store_id,
        price: report.price,
        note: report.note || null,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // 전체 위스키 목록 (제보 폼용)
  const fetchAllWhiskeys = async () => {
    const { data, error } = await client
      .from('whiskeys')
      .select('*')
      .order('name')
    if (error) console.error('fetchAllWhiskeys:', error)
    return data || []
  }

  // 전체 매장 목록
  const fetchAllStores = async () => {
    const { data, error } = await client
      .from('stores')
      .select('id, name, address, region, sub_region, lat, lng')
      .order('region')
    if (error) console.error('fetchAllStores:', error)
    return data || []
  }

  return {
    fetchReports,
    fetchReportsByWhisky,
    searchWhiskeys,
    searchStores,
    fetchWhisky,
    fetchPopularWhiskeys,
    submitReport,
    fetchAllWhiskeys,
    fetchAllStores,
  }
}
