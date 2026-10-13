const clerk_frontend_api_url = process.env.CLERK_FRONTEND_API_URL;

if (!clerk_frontend_api_url) {
  // eslint-disable-next-line no-restricted-syntax -- deploy-time config must fail loudly; it cannot return a Result
  throw new Error(
    "CLERK_FRONTEND_API_URL environment variable is required but not set. " +
      "Set it to your Clerk Frontend API URL (e.g., https://your-app.clerk.accounts.dev).",
  );
}

export default {
  providers: [
    {
      domain: clerk_frontend_api_url,
      applicationID: "convex",
    },
  ],
};
