<script lang="ts">
  import { branding_store } from "$lib/presentation/stores/branding";
</script>

<svelte:head>
  <title>Terms of Service - {$branding_store.organization_name}</title>
  <meta
    name="description"
    content="Terms of service for {$branding_store.organization_name}"
  />
</svelte:head>

<div class="space-y-6">
  <div
    class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700 p-6"
  >
    <h1 class="text-3xl font-bold text-accent-900 dark:text-accent-100 mb-2">
      Terms of Service
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
        1. Acceptance of Terms
      </h2>
      <p class="text-accent-700 dark:text-accent-300 leading-relaxed">
        By accessing and using this {$branding_store.organization_name} application,
        you accept and agree to be bound by the terms and provision of this agreement.
        If you do not agree to abide by the above, please do not use this service.
      </p>
    </section>

    <section>
      <h2
        class="text-2xl font-semibold text-accent-900 dark:text-accent-100 mb-3"
      >
        2. Use License
      </h2>
      <p class="text-accent-700 dark:text-accent-300 leading-relaxed mb-3">
        Permission is granted to temporarily download one copy of the materials
        (information or software) on {$branding_store.organization_name} application
        for personal, non-commercial transitory viewing only. This is the grant of
        a license, not a transfer of title, and under this license you may not:
      </p>

      <ul
        class="list-disc list-inside space-y-2 text-accent-700 dark:text-accent-300"
      >
        <li>Modifying or copying the materials</li>
        <li>
          Using the materials for any commercial purpose or for any public
          display
        </li>
        <li>
          Attempting to reverse engineer any software contained on the
          application
        </li>
        <li>
          Removing any copyright or other proprietary notations from the
          materials
        </li>
        <li>
          Transferring the materials to another person or "mirroring" the
          materials on any other server
        </li>
      </ul>
    </section>

    <section>
      <h2
        class="text-2xl font-semibold text-accent-900 dark:text-accent-100 mb-3"
      >
        3. Disclaimer
      </h2>
      <p class="text-accent-700 dark:text-accent-300 leading-relaxed">
        The materials on {$branding_store.organization_name} application are provided
        on an "as is" basis.
        {$branding_store.organization_name} makes no warranties, expressed or implied,
        and hereby disclaims and negates all other warranties including, without limitation,
        implied warranties or conditions of merchantability, fitness for a particular
        purpose, or non-infringement of intellectual property or other violation of
        rights.
      </p>
    </section>

    <section>
      <h2
        class="text-2xl font-semibold text-accent-900 dark:text-accent-100 mb-3"
      >
        4. Limitations
      </h2>
      <p class="text-accent-700 dark:text-accent-300 leading-relaxed">
        In no event shall {$branding_store.organization_name} or its suppliers be
        liable for any damages (including, without limitation, damages for loss of
        data or profit, or due to business interruption) arising out of the use or
        inability to use the materials on the {$branding_store.organization_name}
        application, even if {$branding_store.organization_name} or an authorized
        representative has been notified orally or in writing of the possibility of
        such damage.
      </p>
    </section>

    <section>
      <h2
        class="text-2xl font-semibold text-accent-900 dark:text-accent-100 mb-3"
      >
        5. Accuracy of Materials
      </h2>
      <p class="text-accent-700 dark:text-accent-300 leading-relaxed">
        The materials appearing on the {$branding_store.organization_name} application
        could include technical, typographical, or photographic errors. {$branding_store.organization_name}
        does not warrant that any of the materials on the application are accurate,
        complete, or current. {$branding_store.organization_name} may make changes
        to the materials contained on the application at any time without notice.
      </p>
    </section>

    <section>
      <h2
        class="text-2xl font-semibold text-accent-900 dark:text-accent-100 mb-3"
      >
        6. Links
      </h2>
      <p class="text-accent-700 dark:text-accent-300 leading-relaxed">
        {$branding_store.organization_name} has not reviewed all of the sites linked
        to its application and is not responsible for the contents of any such linked
        site. The inclusion of any link does not imply endorsement by {$branding_store.organization_name}
        of the site. Use of any such linked website is at the user's own risk.
      </p>
    </section>

    <section>
      <h2
        class="text-2xl font-semibold text-accent-900 dark:text-accent-100 mb-3"
      >
        7. Modifications
      </h2>
      <p class="text-accent-700 dark:text-accent-300 leading-relaxed">
        {$branding_store.organization_name} may revise these terms of service for
        the application at any time without notice. By using this application, you
        are agreeing to be bound by the then current version of these terms of service.
      </p>
    </section>

    <section>
      <h2
        class="text-2xl font-semibold text-accent-900 dark:text-accent-100 mb-3"
      >
        8. Governing Law
      </h2>
      <p class="text-accent-700 dark:text-accent-300 leading-relaxed">
        These terms and conditions are governed by and construed in accordance
        with the laws of the jurisdiction in which {$branding_store.organization_name}
        operates, and you irrevocably submit to the exclusive jurisdiction of the
        courts in that location.
      </p>
    </section>

    <section>
      <h2
        class="text-2xl font-semibold text-accent-900 dark:text-accent-100 mb-3"
      >
        9. Contact Us
      </h2>
      <p class="text-accent-700 dark:text-accent-300 leading-relaxed">
        If you have any questions about these Terms of Service, please contact
        us at
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
