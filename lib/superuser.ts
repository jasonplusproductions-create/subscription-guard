features and export const SUPERUSER_EMAILS = ["jaydhac@gmail.com"];

export function isSuperuser(email: string | null | undefined) {
  return Boolean(email && SUPERUSER_EMAILS.includes(email.toLowerCase()));
}