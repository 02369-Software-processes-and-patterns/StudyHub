<script lang="ts">
  import type { ActionData } from './$types'
  
  export let form: ActionData
</script>

<div class="flex justify-center items-center min-h-screen p-4">
  <div class="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
    <h1 class="text-2xl font-bold text-center mb-2">Welcome to StudyHub</h1>
    <p class="text-center text-gray-600 mb-6">Sign in to continue</p>
    
    {#if form?.error}
      <div class="bg-red-50 text-red-800 p-3 rounded mb-4 text-sm">
        {form.error}
      </div>
    {/if}
    
    <form method="POST" action="?/login" class="flex flex-col gap-4">
      <label class="flex flex-col gap-1 font-medium">
        Email
        <input 
          name="email" 
          type="email" 
          required 
          class="p-2 border border-gray-300 rounded focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
        />
      </label>
      <label class="flex flex-col gap-1 font-medium">
        Password
        <input 
          name="password" 
          type="password" 
          required 
          class="p-2 border border-gray-300 rounded focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
        />
      </label>
      <button 
        type="submit" 
        class="bg-green-600 text-white p-3 rounded font-medium hover:bg-green-700 transition-colors"
      >
        Login
      </button>
    </form>
    
    <a 
      href="/signup"
      class="bg-gray-100 text-gray-800 p-3 rounded font-medium hover:bg-gray-200 transition-colors text-center block mt-4"
    >
      Sign up
    </a>
  </div>
</div>