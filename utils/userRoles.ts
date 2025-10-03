// Admin user roles and permissions

export type UserRole = "admin" | "user";

export interface UserPermissions {
  canCreateEvents: boolean;
  canDeleteEvents: boolean;
  canPopulateEvents: boolean;
  canAccessMigration: boolean;
  canViewAnalytics: boolean;
}

// Admin users list
const ADMIN_EMAILS = ["youness.benhlal.pro@gmail.com"];

export const getUserRole = (email: string | null): UserRole => {
  if (!email) {
    return "user";
  }
  return ADMIN_EMAILS.includes(email.toLowerCase()) ? "admin" : "user";
};

export const getUserPermissions = (email: string | null): UserPermissions => {
  const role = getUserRole(email);

  if (role === "admin") {
    return {
      canCreateEvents: true,
      canDeleteEvents: true,
      canPopulateEvents: true,
      canAccessMigration: true,
      canViewAnalytics: true,
    };
  }

  return {
    canCreateEvents: false,
    canDeleteEvents: false,
    canPopulateEvents: false,
    canAccessMigration: false,
    canViewAnalytics: false,
  };
};

export const isAdmin = (email: string | null): boolean => {
  return getUserRole(email) === "admin";
};
