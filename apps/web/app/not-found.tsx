import { ErrorScreen } from "@components/error-screen";
import { presentNotFound } from "@/lib/error-presentation";

export const metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return <ErrorScreen presentation={presentNotFound()} fullPage />;
}
