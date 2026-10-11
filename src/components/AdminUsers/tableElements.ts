export const tableElementProps = (className: string, suffix?: string | number) => ({
  className,
  id: suffix === undefined ? className : `${className}-${suffix}`,
});

export const formatAccountJoined = (value?: string) => {
  const date = value ? new Date(value) : null;
  return date && Number.isFinite(date.getTime()) ? date.toLocaleDateString(undefined, { day: `numeric`, year: `numeric`, month: `short` }) : `—`;
};

export const getAccountRoleLabel = (role: string) => role === `Administrator` ? `Admin (Legacy)` : role || `Unknown Role`;
