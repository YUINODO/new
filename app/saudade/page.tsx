import type { Metadata } from "next";
import SaudadeExperience from "@/components/saudade/SaudadeExperience";

export const metadata: Metadata = {
  title: "saudade",
  description: "触れようとすると消える光。もう二度と戻らないものへのメディアアート。",
};

export default function SaudadePage() {
  return <SaudadeExperience />;
}
