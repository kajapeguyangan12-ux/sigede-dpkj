import { redirect } from "next/navigation";

export default function Home() {
  redirect("/masyarakat/login");
  return null;
}
