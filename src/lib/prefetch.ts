export const prefetchAuth = () => {
  // Prefetch auth route chunk
  void import("@/pages/Auth");
};

export const prefetchDashboard = () => {
  // Prefetch dashboard route chunk
  void import("@/pages/Dashboard");
};

export const prefetchWorkspacePage = () => {
  // Prefetch workspace route chunk
  void import("@/pages/WorkspacePage");
};
