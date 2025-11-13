<script lang="ts">
    import WorkloadOverview from '$lib/components/WorkloadOverview.svelte';
    import type { PageData } from './$types';

    export let data: PageData;
</script>

<div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
        <div class="flex justify-between items-center mb-8">
            <h1 class="text-4xl font-bold text-gray-800">Dashboard</h1>
            <form method="POST" action="/logout">
                <button 
                    type="submit"
                    class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                >
                    Logout
                </button>
            </form>
        </div>
        
        <WorkloadOverview workload={data.workload} />

        <div class="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <a 
                href="/tasks"
                class="bg-white p-6 rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition transform hover:-translate-y-1"
            >
                <div class="flex items-center mb-3">
                    <span class="text-3xl mr-3">✓</span>
                    <h2 class="text-xl font-bold text-gray-800">Tasks</h2>
                </div>
                <p class="text-gray-600">View and manage your tasks</p>
                <div class="mt-4 text-blue-600 font-medium">Go to tasks →</div>
            </a>

            <a 
                href="/course"
                class="bg-white p-6 rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition transform hover:-translate-y-1"
            >
                <div class="flex items-center mb-3">
                    <span class="text-3xl mr-3">📚</span>
                    <h2 class="text-xl font-bold text-gray-800">Courses</h2>
                </div>
                <p class="text-gray-600">View and manage your courses</p>
                <div class="mt-4 text-blue-600 font-medium">Go to courses →</div>
            </a>
        </div>
    </div>
</div>