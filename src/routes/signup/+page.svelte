<script lang="ts">
  import type { ActionData } from './$types'
  
  export let form: ActionData
</script>

<div class="flex justify-center items-center min-h-screen p-4">
  <div class="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
    <h1 class="text-2xl font-bold text-center mb-2">Create Your Account</h1>
    <p class="text-center text-gray-600 mb-6">Join StudyHub today</p>
    
    {#if form?.error}
      <div class="bg-red-50 text-red-800 p-3 rounded mb-4 text-sm">
        {form.error}
      </div>
    {/if}
    
    <form method="POST" action="?/signup" class="flex flex-col gap-4">
      <label class="flex flex-col gap-1 font-medium">
        Full name
        <input 
          name="name" 
          type="text" 
          required 
          class="p-2 border border-gray-300 rounded focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
        />
      </label>
      
      <label class="flex flex-col gap-1 font-medium">
        Email
        <input 
          name="email" 
          type="email" 
          required 
          class="p-2 border border-gray-300 rounded focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
        />
      </label>
      
      <label class="flex flex-col gap-1 font-medium">
        Password
        <input 
          name="password" 
          type="password" 
          required 
          minlength="6"
          class="p-2 border border-gray-300 rounded focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
        />
      </label>
      
      <label class="flex flex-col gap-1 font-medium">
        Phone
        <input 
          name="phone" 
          type="tel" 
          required 
          class="p-2 border border-gray-300 rounded focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
        />
      </label>
      
      <label class="flex flex-col gap-1 font-medium">
        Birthday
        <input 
          name="birthday" 
          type="date" 
          required 
          class="p-2 border border-gray-300 rounded focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
        />
      </label>
      
      <button 
        type="submit" 
        class="bg-indigo-600 text-white p-3 rounded font-medium hover:bg-indigo-700 transition-colors"
      >
        Sign Up
      </button>
    </form>
    
    <div class="mt-4 text-center text-sm text-gray-600">
      Already have an account?
      <a href="/" class="text-indigo-600 hover:text-indigo-800 font-medium">
        Sign in
      </a>
    </div>
  </div>
</div>
