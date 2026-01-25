<script lang="ts">
  import { branding_store } from "$lib/presentation/stores/branding";
</script>

<svelte:head>
  <title>Privacy Policy - {$branding_store.organization_name}</title>
  <meta
    name="description"
    content="Privacy policy for {$branding_store.organization_name}"
  />
</svelte:head>

<div class="space-y-6">
  <div
    class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700 p-6"
  >
    <h1 class="text-3xl font-bold text-accent-900 dark:text-accent-100 mb-2">
      Privacy Policy
    </h1>
    <p class="text-accent-600 dark:text-accent-300">
      Last updated: January 2026
    </p>
  </div>

  <div class="card p-6 space-y-6">
    <section>
      <h2
        class="text-2xl font-semibold text-accent-900 dark:text-accent-100 mb-3"
      >
        Introduction
      </h2>
      <p class="text-accent-700 dark:text-accent-300 leading-relaxed">
        {$branding_store.organization_name} ("we" or "us" or "our") operates the application.
        This page informs you of our policies regarding the collection, use, and disclosure
        of personal data when you use our application and the choices you have associated
        with that data.
      </p>
    </section>

    <section>
      <h2
        class="text-2xl font-semibold text-accent-900 dark:text-accent-100 mb-3"
      >
        Information Collection and Use
      </h2>
      <p class="text-accent-700 dark:text-accent-300 leading-relaxed mb-3">
        We collect several different types of information for various purposes
        to provide and improve our application to you.
      </p>

      <h3 class="text-lg font-medium text-accent-900 dark:text-accent-100 mb-2">
        Types of Data Collected:
      </h3>
      <ul
        class="list-disc list-inside space-y-2 text-accent-700 dark:text-accent-300"
      >
        <li>Personal Data (name, email address, organization details)</li>
        <li>Usage Data (access logs, browser type, pages visited)</li>
        <li>Sports Organization Data (teams, players, competitions)</li>
      </ul>
    </section>

    <section>
      <h2
        class="text-2xl font-semibold text-accent-900 dark:text-accent-100 mb-3"
      >
        Use of Data
      </h2>
      <p class="text-accent-700 dark:text-accent-300 leading-relaxed mb-3">
        {$branding_store.organization_name} uses the collected data for various purposes:
      </p>

      <ul
        class="list-disc list-inside space-y-2 text-accent-700 dark:text-accent-300"
      >
        <li>To provide and maintain our application</li>
        <li>To notify you about changes to our application</li>
        <li>To allow you to participate in interactive features</li>
        <li>To provide customer support</li>
        <li>
          To gather analysis or valuable information to improve the application
        </li>
        <li>To monitor the usage of the application</li>
      </ul>
    </section>

    <section>
      <h2
        class="text-2xl font-semibold text-accent-900 dark:text-accent-100 mb-3"
      >
        Security of Data
      </h2>
      <p class="text-accent-700 dark:text-accent-300 leading-relaxed">
        The security of your data is important to us but remember that no method
        of transmission over the Internet or method of electronic storage is
        100% secure. While we strive to use commercially acceptable means to
        protect your personal data, we cannot guarantee its absolute security.
      </p>
    </section>

    <section>
      <h2
        class="text-2xl font-semibold text-accent-900 dark:text-accent-100 mb-3"
      >
        Contact Us
      </h2>
      <p class="text-accent-700 dark:text-accent-300 leading-relaxed">
        If you have any questions about this Privacy Policy, please contact us
        at
        <a
          href="mailto:{$branding_store.organization_email}"
          class="text-primary-600 dark:text-primary-400 hover:underline"
          >{$branding_store.organization_email}</a
        >
        or visit our
        <a
          href="/contact"
          class="text-primary-600 dark:text-primary-400 hover:underline"
          >contact page</a
        >.
      </p>
    </section>
  </div>
</div>
