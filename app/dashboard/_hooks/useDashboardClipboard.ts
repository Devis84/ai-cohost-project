import { useCallback } from "react";

interface UseDashboardClipboardParams {
  wifiName: string;
  wifiPassword: string;
  guestPageUrl: string;
}

interface UseDashboardClipboardReturn {
  copyWifi: () => Promise<void>;
  copyGuestUrl: () => Promise<void>;
}

export function useDashboardClipboard(
  params: UseDashboardClipboardParams
): UseDashboardClipboardReturn {
  const { wifiName, wifiPassword, guestPageUrl } = params;

  const copyWifi = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(
        `Network: ${wifiName} | Password: ${wifiPassword}`
      );

      alert("WiFi copied");
    } catch (error) {
      console.error("COPY WIFI ERROR:", error);
      alert("Unable to copy WiFi");
    }
  }, [wifiName, wifiPassword]);

  const copyGuestUrl = useCallback(async () => {
    if (!guestPageUrl) {
      alert("Select a property first");
      return;
    }

    const absoluteUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${guestPageUrl}`
        : guestPageUrl;

    try {
      await navigator.clipboard.writeText(absoluteUrl);
      alert("Guest page URL copied");
    } catch (error) {
      console.error("COPY GUEST URL ERROR:", error);
      alert("Unable to copy guest page URL");
    }
  }, [guestPageUrl]);

  return {
    copyWifi,
    copyGuestUrl,
  };
}
