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

<div class="max-w-6xl mx-auto px-4 py-6 sm:py-8">
	<div class="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between sm:mb-8">
		<div>
			<h1 class="text-2xl font-bold text-gray-900 sm:text-3xl">My Courses</h1>
			<p class="text-sm text-gray-600 mt-1 sm:text-base">Manage your courses and track your workload</p>
		</div>
		<button 
			on:click={() => (showAddCourseModal = true)}
			class="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition shadow-md hover:shadow-lg sm:self-start"
		>
			<span class="text-xl">+</span>
			Add Course
		</button>
	</div>

	<CourseList courses={data.courses} />
</div>

<!-- Modal komponent (pop up vindue) til at tilføje kursus som er bindet til showAddCourseModal: -->
<AddCourseForm 
    bind:showModal={showAddCourseModal} 
    on:courseAdded={handleCourseAdded} 
/>
