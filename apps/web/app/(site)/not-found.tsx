import { ErrorScreen } from "@components/error-screen";
import { presentNotFound } from "@/lib/error-presentation";

export default function SiteNotFound() {
  return <ErrorScreen presentation={presentNotFound()} />;
}
