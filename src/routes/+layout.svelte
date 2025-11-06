<script>
  import { invalidate } from '$app/navigation'
  import { onMount } from 'svelte'
  import Topbar from '$lib/components/layout/topbar.svelte'
  import '../app.css'

  let { data, children } = $props()
  let { session, user, supabase } = $derived(data)

  onMount(() => {
    const { data } = supabase.auth.onAuthStateChange((_, newSession) => {
      if (newSession?.expires_at !== session?.expires_at) {
        invalidate('supabase:auth')
      }
    })

    return () => data.subscription.unsubscribe()
  })
  
  // Debug: log session and user
  $effect(() => {
    console.log('Session state:', session)
    console.log('User state:', user)
  })
</script>

<div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
  <Topbar session={session} user={user} />
  <main class="w-full">
    {@render children()}
  </main>
</div>