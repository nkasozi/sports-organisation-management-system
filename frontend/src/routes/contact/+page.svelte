<svelte:head>
  <title>Contact Us - Sports Organisation Management</title>
  <meta name="description" content="Get in touch with the SportsOrg team" />
</svelte:head>

<div class="space-y-6">
  <div
    class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700 p-6"
  >
    <h1 class="text-3xl font-bold text-accent-900 dark:text-accent-100 mb-2">
      Contact Us
    </h1>
    <p class="text-accent-600 dark:text-accent-300">
      Have questions or feedback? We'd love to hear from you.
    </p>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div class="card p-6">
      <h2
        class="text-xl font-semibold text-accent-900 dark:text-accent-100 mb-4"
      >
        Get in Touch
      </h2>
      <form class="space-y-4">
        <div>
          <label
            for="name"
            class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
          >
            Name
          </label>
          <input id="name" type="text" class="input" placeholder="Your name" />
        </div>

        <div>
          <label
            for="email"
            class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            class="input"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label
            for="subject"
            class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
          >
            Subject
          </label>
          <input
            id="subject"
            type="text"
            class="input"
            placeholder="How can we help?"
          />
        </div>

        <div>
          <label
            for="message"
            class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
          >
            Message
          </label>
          <textarea
            id="message"
            class="input min-h-32"
            placeholder="Your message..."
          ></textarea>
        </div>

        <button type="submit" class="btn btn-primary w-full">
          Send Message
        </button>
      </form>
    </div>

    <div class="space-y-6">
      <div class="card p-6">
        <h2
          class="text-xl font-semibold text-accent-900 dark:text-accent-100 mb-4"
        >
          Contact Information
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="font-medium text-accent-900 dark:text-accent-100 mb-1">
              Email
            </h3>
            <a
              href="mailto:support@sportsorg.example"
              class="text-primary-600 dark:text-primary-400 hover:underline"
            >
              support@sportsorg.example
            </a>
          </div>

          <div>
            <h3 class="font-medium text-accent-900 dark:text-accent-100 mb-1">
              Support Hours
            </h3>
            <p class="text-accent-600 dark:text-accent-300">
              Monday - Friday: 9:00 AM - 6:00 PM<br />
              Saturday - Sunday: Closed
            </p>
          </div>

          <div>
            <h3 class="font-medium text-accent-900 dark:text-accent-100 mb-1">
              Response Time
            </h3>
            <p class="text-accent-600 dark:text-accent-300">
              We typically respond to inquiries within 24 business hours.
            </p>
          </div>
        </div>
      </div>

      <div class="card p-6">
        <h2
          class="text-xl font-semibold text-accent-900 dark:text-accent-100 mb-4"
        >
          Frequently Asked Questions
        </h2>
        <div class="space-y-3">
          <div>
            <h3 class="font-medium text-accent-900 dark:text-accent-100">
              How do I get started?
            </h3>
            <p class="text-sm text-accent-600 dark:text-accent-300 mt-1">
              Visit the dashboard to create your organization and start managing
              your sports events.
            </p>
          </div>

          <div>
            <h3 class="font-medium text-accent-900 dark:text-accent-100">
              Is there a mobile app?
            </h3>
            <p class="text-sm text-accent-600 dark:text-accent-300 mt-1">
              This application is fully responsive and works great on mobile
              devices.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
