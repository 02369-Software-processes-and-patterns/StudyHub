<script lang="ts">
    import { invalidateAll } from '$app/navigation';
    import AddCourseForm from '$lib/components/AddCourseForm.svelte'; // importerer komponent til at tilføje et nyt kursus
    import CourseList from '$lib/components/CourseList.svelte'; // importerer komponent til at vise listen af kurser
    import type { PageData } from './$types';
    import { onMount } from 'svelte';

    export let data: PageData; // data hentet fra load-funktionen i +page.ts

	//Definerer attributter:
	let showAddCourseModal = false; // boolean der styrer om modal til at tilføje kursus er åben
    let activeSemester = 'Fall'; // aktivt semester sæætes som standard til 'Fall'

    // Funktion der afgør hvilket semester vi er i baseret på nuværende måned:
    function getSemester(date: Date) {
        const m = date.getMonth(); // 0 = januar, 11 = december
        // Hvis måned er fra september til januar = "Fall" ellers "Winter" semester
        return (m >= 8 || m <= 0) ? 'Fall' : 'Winter';
    }

    // Når komponenten er monteret opdater "activeSemester" til det rigtige:
    onMount(() => {
        activeSemester = getSemester(new Date());
    });

    // Når et kursus er blevet tilføjet fra AddCourseForm, så genindlæses siden og modal (popup vindue) lukkes:
    async function handleCourseAdded() {
        await invalidateAll();
        showAddCourseModal = false;
    }

    // Sætter totalECTS ved at beregne sum af ECTS point fra alle kurser. Den kører automatisk når data.courses ændrer sig:
    $: totalECTS = data.courses?.reduce(
        (sum, course) => sum + (Number(course.ects_points) ?? 0), 
        0
    ) ?? 0;
</script>

<!-- Ydre container med baggrund og padding -->
<div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
    <div class="max-w-6xl mx-auto">
        <!-- Header-sektion med titel og "add course" knap -->
        <header class="flex items-center justify-between mb-8">
            <div>
                <h1 class="text-4xl font-bold leading-tight bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent mb-3">
                    My Courses
                </h1>
                <p class="text-gray-600">Manage and overview your courses.</p>
            </div>

            <!-- Knap til at åbne modal (pop up vindue) for at tilføje kursus -->
            <button
                on:click={() => (showAddCourseModal = true)}
                class="inline-flex items-center gap-3 px-5 py-2 rounded-lg font-semibold text-sm transition-shadow duration-200
                       bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-md hover:shadow-lg"
                aria-haspopup="dialog"
            >
                <span class="text-xl leading-none">+</span>
                <span>Add Course</span>
            </button>
        </header>

        <!-- Tre informationsbokse: -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <!-- 1. Viser aktivt semester -->
            <div class="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
                <p class="text-xs text-gray-500 uppercase tracking-wide">Active semester</p>
                <p class="mt-2 text-3xl font-bold bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">{activeSemester}</p>
            </div>

            <!-- 2. Viser samlet antal kurser: -->
            <div class="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
                <p class="text-xs text-gray-500 uppercase tracking-wide">Total courses</p>
                <p class="mt-2 text-3xl font-bold bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">{data.courses?.length ?? 0}</p>
            </div>

            <!-- 3. Viser samlet total ECTS: -->
            <div class="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
                <p class="text-xs text-gray-500 uppercase tracking-wide">Total ECTS</p>
                <p class="mt-2 text-3xl font-bold bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">{totalECTS}</p>
            </div>
        </div>

        <!-- Kursusliste: (Hvis bruger har nogle kurser) -->
        {#if data.courses && data.courses.length > 0}
            <div class="space-y-3">
                <CourseList courses={data.courses} />
            </div>
        {:else}
            <!-- Hvis ingen kurser så vises besked og knap til at tilføje: -->
            <div class="py-12 text-center">
                <p class="text-gray-500 mb-4">You don't have any courses yet.</p>
                <button
                    on:click={() => (showAddCourseModal = true)}
                    class="px-4 py-2 rounded-md bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold shadow"
                >
                    Add your first course
                </button>
            </div>
        {/if}
    </div>
</div>

<!-- Modal komponent (pop up vindue) til at tilføje kursus som er bindet til showAddCourseModal: -->
<AddCourseForm 
    bind:showModal={showAddCourseModal} 
    on:courseAdded={handleCourseAdded} 
/>
