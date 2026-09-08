import { ErrorScreen } from "@components/error-screen";
import { presentNotFound } from "@/lib/error-presentation";

export default function PortalNotFound() {
  const presentation = {
    ...presentNotFound(),
    link: { href: "/portal", label: "Back to portal" },
  };

  return <ErrorScreen presentation={presentation} />;
}
