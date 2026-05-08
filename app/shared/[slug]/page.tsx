import { redirect } from "next/navigation";

type SharedProjectRedirectProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function SharedProjectRedirectPage({ params }: SharedProjectRedirectProps) {
  const { slug } = await params;

  redirect(`/project/shared/${slug}`);
}
