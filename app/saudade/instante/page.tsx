import type { Metadata } from "next";
import InstanteExperience from "@/components/saudade/InstanteExperience";

export const metadata: Metadata = {
  title: "instante",
  description: "ガラスが割れる一瞬を、見つめるほどに引き延ばすメディアアート。",
};

export default function InstantePage() {
  return <InstanteExperience />;
}
