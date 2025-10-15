export let locationAssign: (url: string) => void = (url: string) => {
  // Wrapped indirection for easier testing
  (window.location as Location).assign(url as any);
};

export function navigateTo(url: string): void {
  locationAssign(url);
}


