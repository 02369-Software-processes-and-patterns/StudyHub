import { redirect } from '@sveltejs/kit'
import type { PageServerLoad, Actions } from './$types'

export const load: PageServerLoad = async ({ locals: { safeGetSession } }) => {
  const { session } = await safeGetSession()
  
  // If user is authenticated, redirect to dashboard
  if (session) {
    throw redirect(303, '/dashboard')
  }
  
  return {}
}

export const actions: Actions = {
  signup: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData()
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const name = formData.get('name') as string
    const phone = formData.get('phone') as string
    const birthday = formData.get('birthday') as string

    // Sign up the user
    const { error, data } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          name,
          phone,
          birthday
        }
      }
    })
    
    if (error) {
      console.error(error)
      return { success: false, error: error.message }
    } else {
      throw redirect(303, '/dashboard')
    }
  },
}
