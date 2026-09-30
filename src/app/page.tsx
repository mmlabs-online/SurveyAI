import { redirect } from "next/navigation";
import { DASHBOARD_PATH } from "@/lib/navigation";

export default function HomePage() {
  redirect(DASHBOARD_PATH);
}
