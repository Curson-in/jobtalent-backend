export const hasAccess = (user, feature) => {
  return Boolean(user?.entitlements?.[feature]);
};
