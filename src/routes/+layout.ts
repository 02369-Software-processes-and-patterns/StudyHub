import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr'
import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public'
import type { LayoutLoad } from './$types'

export const load: LayoutLoad = async ({ data, depends, fetch }) => {
  /**
   * Declare a dependency so the layout can be invalidated, for example, on
   * session refresh.
   */
  depends('supabase:auth')

  const supabase = isBrowser()
    ? createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
        global: {
          fetch,
        },
      })
    : createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
        global: {
          fetch,
        },
        cookies: {
          getAll() {
            return data.cookies
          },
        },
      })

  if (isBrowser()) {
    // Client-side: validate with getUser() - this contacts Supabase Auth server
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { session: null, supabase, user: null }
    }

    // Create a minimal session object from the validated user
    // We avoid getSession() entirely to prevent security warnings
    const session = {
      user,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    }

    return { session, supabase, user }
  }

  // Server-side: use pre-validated data from +layout.server.ts
  return { 
    session: data.session, 
    supabase, 
    user: data.user 
  }
}
