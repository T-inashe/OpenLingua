export function navigateTo(url: string): void {
  // Wrapped for easier testing
  window.location.assign(url);
}


