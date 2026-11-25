<script lang="ts">
  import { goto } from "$app/navigation";
  import { session } from "$lib/session.svelte";

  // One course for now: go straight to its map.
  $effect(() => {
    if (session.user) goto("/specialist", { replaceState: true });
  });
</script>
