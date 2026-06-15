import { ArchivedMePageContent } from "@/components/archived/ArchivedMePageContent";
import { SunPlaceholderPage } from "@/components/SunPlaceholderPage";
import { readPublicPageSettings } from "@/lib/public-page-settings";

export const metadata = {
  title: "About",
};

export default function MePage() {
  const settings = readPublicPageSettings();

  if (settings.me) {
    return <ArchivedMePageContent />;
  }

  return <SunPlaceholderPage />;
}
