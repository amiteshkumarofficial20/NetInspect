// Tiny utility — avoids adding clsx as a dep for just this usage
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
