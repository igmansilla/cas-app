import { createFileRoute, redirect } from "@tanstack/react-router";
import { type RouterContext } from "./__root";

export const Route = createFileRoute("/")({
  beforeLoad: ({ context }: { context: RouterContext }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({
        to: "/dashboard",
      });
    }

    if (!context.auth.isLoading && !context.auth.isAuthenticated) {
      void context.auth.signinRedirect();
    }
  },
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Redirecting to login...</h2>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    </div>
  );
}
