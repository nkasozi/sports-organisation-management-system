<script lang="ts">
  import { SignIn } from "svelte-clerk";
</script>

<div
  class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8"
>
  <div class="max-w-md w-full space-y-8">
    <div class="text-center">
      <h2 class="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
        Sign in to your account
      </h2>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Use the email address provided by your organization administrator
      </p>
    </div>
    <div class="mt-8 flex justify-center">
      <SignIn routing="path" path="/sign-in" afterSignInUrl="/" />
    </div>
  </div>
</div>
