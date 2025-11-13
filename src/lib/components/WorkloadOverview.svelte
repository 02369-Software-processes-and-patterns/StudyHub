<script lang="ts">
    import type { WorkloadData } from '$lib/utils/workload';

    export let workload: WorkloadData;

    function getWorkloadStatus(hours: number): { color: string; label: string } {
        if (hours === 0) return { color: 'bg-gray-100 text-gray-800', label: 'Clear' };
        if (hours < 10) return { color: 'bg-green-100 text-green-800', label: 'Light' };
        if (hours < 20) return { color: 'bg-yellow-100 text-yellow-800', label: 'Moderate' };
        if (hours < 30) return { color: 'bg-orange-100 text-orange-800', label: 'Heavy' };
        return { color: 'bg-red-100 text-red-800', label: 'Overloaded' };
    }

    $: status = getWorkloadStatus(workload.totalHours);
</script>

<div class="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
    <div class="flex items-center justify-between mb-4">
        <h2 class="text-2xl font-bold text-gray-800">Your Workload</h2>
        <span class="px-3 py-1 rounded-full text-sm font-semibold {status.color}">
            {status.label}
        </span>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Total Workload -->
        <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm text-gray-600 mb-1">Total Workload</p>
                    <p class="text-3xl font-bold text-blue-700">{workload.totalHours}h</p>
                    <p class="text-xs text-gray-500 mt-1">{workload.taskCount} tasks</p>
                </div>
                <div class="text-4xl">📚</div>
            </div>
        </div>

        <!-- Upcoming Week -->
        <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm text-gray-600 mb-1">Next 7 Days</p>
                    <p class="text-3xl font-bold text-green-700">{workload.upcomingWeekHours}h</p>
                    <p class="text-xs text-gray-500 mt-1">{workload.upcomingTaskCount} tasks</p>
                </div>
                <div class="text-4xl">📅</div>
            </div>
        </div>

        <!-- Overdue -->
        <div class="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm text-gray-600 mb-1">Overdue</p>
                    <p class="text-3xl font-bold text-red-700">{workload.overdueHours}h</p>
                    <p class="text-xs text-gray-500 mt-1">{workload.overdueTaskCount} tasks</p>
                </div>
                <div class="text-4xl">⚠️</div>
            </div>
        </div>
    </div>

    {#if workload.overdueTaskCount > 0}
        <div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-sm text-red-700">
                ⚠️ You have overdue tasks. Consider prioritizing them!
            </p>
        </div>
    {/if}
</div>