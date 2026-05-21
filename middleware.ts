import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const isLoginPage = request.nextUrl.pathname.startsWith('/login')

  // RULE 1: If they are NOT logged in, and they try to go anywhere except /login -> Kick to /login
  if (!user && !isLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // RULE 2: If they ARE logged in, verify their identity in the database
  if (user) {
    const { data: adminRecord, error } = await supabase
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .single()

    // If they aren't on the VIP list...
    if (error || !adminRecord) {
      console.log(`Security Block: Unauthorized user tried to access the stealth portal!`)
      // Destroy their session and kick them to login
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    // If they ARE on the VIP list, and they try to go to the login page -> send them to the dashboard homepage
    if (isLoginPage) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}